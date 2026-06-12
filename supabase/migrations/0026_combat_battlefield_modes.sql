-- 0026_combat_battlefield_modes.sql
-- Fase 11.1 (extensão): o campo de batalha agora suporta dois modos —
-- "zones" (zonas narrativas, já existentes desde 0025) e "grid" (grid
-- tático de D&D, 1 célula = 5 ft / 1,5m). O mestre escolhe o modo por
-- combate; jogadores apenas visualizam posições. combat_zones e
-- combat_zone_links já existem desde 0025_combat_battlefield_zones.sql.

alter table combats
  add column if not exists battlefield_mode text not null default 'zones';

alter table combats
  add constraint combats_battlefield_mode_check
  check (battlefield_mode in ('zones', 'grid'));

alter table combats
  add column if not exists battlefield_config jsonb not null default '{}'::jsonb;

-- Posição no grid tático (nulo = participante ainda não posicionado).
alter table combat_participants
  add column if not exists grid_x integer;

alter table combat_participants
  add column if not exists grid_y integer;

-- Tamanho do token: 1 = Pequeno/Médio (1x1), 2 = Grande (2x2), 3 = Enorme (3x3),
-- 4 = Colossal (4x4).
alter table combat_participants
  add column if not exists token_size integer not null default 1;

alter table combat_participants
  add constraint combat_participants_token_size_check
  check (token_size between 1 and 4);

-- RPCs ----------------------------------------------------------------------

-- Mestre define o modo do campo de batalha (zonas ou grid) e sua configuração.
-- Para grid, battlefield_config deve trazer width/height/cellUnit/cellMeters/
-- physicalCellCm/backgroundImageUrl (ver TAREFA 2 da Fase 11.1).
create or replace function set_combat_battlefield(
  target_combat_id uuid,
  mode text,
  config jsonb default '{}'::jsonb
)
returns combats as $$
declare
  v_combat combats;
begin
  select * into v_combat from combats where id = target_combat_id;
  if not found then
    raise exception 'Combate não encontrado';
  end if;

  if not is_campaign_master(v_combat.campaign_id) then
    raise exception 'Apenas o mestre pode configurar o campo de batalha';
  end if;

  if mode not in ('zones', 'grid') then
    raise exception 'Modo de campo de batalha inválido';
  end if;

  update combats
  set battlefield_mode = mode,
      battlefield_config = coalesce(config, '{}'::jsonb)
  where id = target_combat_id
  returning * into v_combat;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_combat.campaign_id, v_combat.session_id, v_combat.scene_id, 'battlefield_configured',
      case when mode = 'grid' then 'O mestre configurou o campo de batalha em modo Grid Tático.'
           else 'O mestre configurou o campo de batalha em modo Zonas Narrativas.' end,
      jsonb_build_object('mode', mode), auth.uid()
    );
  end if;

  return v_combat;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function set_combat_battlefield(uuid, text, jsonb) to authenticated;

-- Mestre move um participante para uma célula do grid tático (target_x/target_y
-- em células, 0-indexado). Valida limites contra battlefield_config.width/height.
create or replace function move_combat_participant_grid(
  target_participant_id uuid,
  target_x integer,
  target_y integer
)
returns combat_participants as $$
declare
  v_participant combat_participants;
  v_combat combats;
  v_width integer;
  v_height integer;
begin
  select * into v_participant from combat_participants where id = target_participant_id;
  if not found then
    raise exception 'Participante não encontrado';
  end if;

  select * into v_combat from combats where id = v_participant.combat_id;

  if not is_campaign_master(v_participant.campaign_id) then
    raise exception 'Apenas o mestre pode mover tokens no grid tático';
  end if;

  if target_x is null or target_y is null or target_x < 0 or target_y < 0 then
    raise exception 'Posição inválida no grid';
  end if;

  v_width := coalesce((v_combat.battlefield_config->>'width')::integer, 24);
  v_height := coalesce((v_combat.battlefield_config->>'height')::integer, 18);

  if target_x >= v_width or target_y >= v_height then
    raise exception 'Posição fora dos limites do grid (%sx%s)', v_width, v_height;
  end if;

  update combat_participants
  set grid_x = target_x, grid_y = target_y
  where id = target_participant_id
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_participant.campaign_id, v_combat.session_id, v_combat.scene_id, 'participant_moved',
      v_participant.name || ' moveu-se para [' || target_x || ',' || target_y || '].',
      jsonb_build_object('participant_id', v_participant.id, 'grid_x', target_x, 'grid_y', target_y),
      auth.uid()
    );
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function move_combat_participant_grid(uuid, integer, integer) to authenticated;
