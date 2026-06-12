-- 0025_combat_battlefield_zones.sql
-- Fase 11.1: Mapa de Combate Visual com zonas narrativas (não é um VTT com
-- grid). Cada combate pode ter zonas conectadas entre si; participantes
-- ocupam uma zona por vez. Distância é narrativa: mesma zona = corpo a corpo,
-- zona conectada = perto; 2/3+ saltos = médio/distante (calculado no frontend).

create table combat_zones (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references combats(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  description text,
  zone_type text not null default 'normal',
  cover_level text not null default 'none',
  difficult_terrain boolean not null default false,
  position_x numeric not null default 0,
  position_y numeric not null default 0,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index combat_zones_combat_id_idx on combat_zones (combat_id);
create index combat_zones_campaign_id_idx on combat_zones (campaign_id);

create table combat_zone_links (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references combats(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  from_zone_id uuid not null references combat_zones(id) on delete cascade,
  to_zone_id uuid not null references combat_zones(id) on delete cascade,
  distance_label text not null default 'near',
  movement_cost integer not null default 1,
  description text,
  created_at timestamptz default now()
);

alter table combat_zone_links
  add constraint combat_zone_links_distance_check
  check (distance_label in ('near', 'medium', 'far'));

create index combat_zone_links_combat_id_idx on combat_zone_links (combat_id);

-- Zona atual de cada participante no campo de batalha (nulo = posição não definida).
alter table combat_participants
  add column current_zone_id uuid references combat_zones(id) on delete set null;

-- Espaço para metadados do combate (ex.: combats.metadata.battlefield_image_url,
-- usado em fase futura para imagem de fundo do campo de batalha).
alter table combats
  add column metadata jsonb not null default '{}'::jsonb;

-- RLS -------------------------------------------------------------------

alter table combat_zones enable row level security;
alter table combat_zone_links enable row level security;

create policy "Members read combat zones"
on combat_zones for select
using (is_campaign_member(campaign_id));

-- Apenas mestre/owner cria, edita e remove zonas oficiais do campo de batalha.
create policy "Masters manage combat zones"
on combat_zones for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Members read combat zone links"
on combat_zone_links for select
using (is_campaign_member(campaign_id));

create policy "Masters manage combat zone links"
on combat_zone_links for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create trigger set_combat_zones_updated_at
before update on combat_zones
for each row execute function set_updated_at();

-- RPCs --------------------------------------------------------------------

-- Mestre cria uma zona narrativa no campo de batalha do combate.
create or replace function create_combat_zone(
  target_combat_id uuid,
  zone_name text,
  zone_description text default null,
  pos_x numeric default 0,
  pos_y numeric default 0
)
returns combat_zones as $$
declare
  v_combat combats;
  v_zone combat_zones;
  v_next_order integer;
begin
  select * into v_combat from combats where id = target_combat_id;
  if not found then
    raise exception 'Combate não encontrado';
  end if;

  if not is_campaign_master(v_combat.campaign_id) then
    raise exception 'Apenas o mestre pode criar zonas de combate';
  end if;

  if zone_name is null or btrim(zone_name) = '' then
    raise exception 'Informe um nome para a zona';
  end if;

  select coalesce(max(sort_order), -1) + 1 into v_next_order from combat_zones where combat_id = target_combat_id;

  insert into combat_zones (combat_id, campaign_id, name, description, position_x, position_y, sort_order)
  values (target_combat_id, v_combat.campaign_id, btrim(zone_name), zone_description, coalesce(pos_x, 0), coalesce(pos_y, 0), v_next_order)
  returning * into v_zone;

  return v_zone;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function create_combat_zone(uuid, text, text, numeric, numeric) to authenticated;

-- Mestre conecta duas zonas, definindo a distância narrativa entre elas.
create or replace function link_combat_zones(
  target_combat_id uuid,
  from_zone uuid,
  to_zone uuid,
  distance_label text default 'near',
  movement_cost integer default 1
)
returns combat_zone_links as $$
declare
  v_combat combats;
  v_link combat_zone_links;
begin
  select * into v_combat from combats where id = target_combat_id;
  if not found then
    raise exception 'Combate não encontrado';
  end if;

  if not is_campaign_master(v_combat.campaign_id) then
    raise exception 'Apenas o mestre pode conectar zonas de combate';
  end if;

  if not exists (select 1 from combat_zones where id = from_zone and combat_id = target_combat_id)
     or not exists (select 1 from combat_zones where id = to_zone and combat_id = target_combat_id) then
    raise exception 'Zonas inválidas para este combate';
  end if;

  insert into combat_zone_links (combat_id, campaign_id, from_zone_id, to_zone_id, distance_label, movement_cost)
  values (target_combat_id, v_combat.campaign_id, from_zone, to_zone, coalesce(distance_label, 'near'), coalesce(movement_cost, 1))
  returning * into v_link;

  return v_link;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function link_combat_zones(uuid, uuid, uuid, text, integer) to authenticated;

-- Mestre move um participante para outra zona (ou remove do campo, se nulo).
create or replace function move_combat_participant(
  target_participant_id uuid,
  target_zone_id uuid
)
returns combat_participants as $$
declare
  v_participant combat_participants;
  v_combat combats;
  v_zone combat_zones;
begin
  select * into v_participant from combat_participants where id = target_participant_id;
  if not found then
    raise exception 'Participante não encontrado';
  end if;

  select * into v_combat from combats where id = v_participant.combat_id;

  if not is_campaign_master(v_participant.campaign_id) then
    raise exception 'Apenas o mestre pode mover participantes no campo de batalha';
  end if;

  if target_zone_id is not null then
    select * into v_zone from combat_zones where id = target_zone_id and combat_id = v_participant.combat_id;
    if not found then
      raise exception 'Zona inválida para este combate';
    end if;
  end if;

  update combat_participants
  set current_zone_id = target_zone_id
  where id = target_participant_id
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_participant.campaign_id, v_combat.session_id, v_combat.scene_id, 'participant_moved',
      case when v_zone.name is not null then v_participant.name || ' moveu-se para ' || v_zone.name || '.'
           else v_participant.name || ' saiu do campo de batalha.' end,
      jsonb_build_object('participant_id', v_participant.id, 'zone_id', target_zone_id),
      auth.uid()
    );
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function move_combat_participant(uuid, uuid) to authenticated;
