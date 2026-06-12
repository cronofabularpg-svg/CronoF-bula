-- 0032_combat_actions_and_participants.sql
-- Fase 11.2: combate tático passa a usar ações reais da ficha (ataques,
-- magias/habilidades e iniciativa) e permite ao mestre adicionar
-- personagens, NPCs e inimigos surpresa ao combate em andamento.
-- Tudo é aditivo: nenhuma coluna existente é removida ou renomeada, e os
-- novos campos de character_stats nascem vazios (sem dados fictícios) até
-- que o jogador ou o mestre os preencham na Ficha.

alter table character_stats add column if not exists attacks jsonb not null default '[]'::jsonb;
alter table character_stats add column if not exists spells jsonb not null default '[]'::jsonb;
alter table character_stats add column if not exists initiative_bonus integer;

-- RPCs ------------------------------------------------------------------

-- Mestre adiciona um personagem da campanha ao combate em andamento.
-- PV/CA/iniciativa seguem a ficha do personagem; iniciativa pode ser
-- informada manualmente (p_initiative) ou rolada automaticamente
-- (1d20 + initiative_bonus, com fallback para o modificador de Destreza).
create or replace function add_combat_character_participant(
  p_combat_id uuid,
  p_character_id uuid,
  p_initiative integer default null,
  p_grid_x integer default null,
  p_grid_y integer default null
)
returns combat_participants as $$
declare
  v_combat combats;
  v_character record;
  v_stats record;
  v_participant combat_participants;
  v_initiative integer;
  v_next_order integer;
  v_dex_mod integer;
begin
  select * into v_combat from combats where id = p_combat_id;
  if not found then
    raise exception 'Combate não encontrado';
  end if;

  if not is_campaign_master(v_combat.campaign_id) then
    raise exception 'Apenas o mestre pode adicionar participantes ao combate';
  end if;

  if v_combat.status != 'active' then
    raise exception 'Este combate não está ativo';
  end if;

  select c.id, c.name, c.current_hp, c.max_hp, c.armor_class
    into v_character
    from characters c
    where c.id = p_character_id and c.campaign_id = v_combat.campaign_id;

  if not found then
    raise exception 'Personagem não encontrado nesta campanha';
  end if;

  if exists (
    select 1 from combat_participants
    where combat_id = p_combat_id and character_id = p_character_id
  ) then
    raise exception 'Este personagem já está no combate';
  end if;

  select cs.dexterity, cs.initiative_bonus into v_stats
    from character_stats cs
    where cs.character_id = p_character_id;

  v_dex_mod := floor((coalesce(v_stats.dexterity, 10) - 10) / 2.0);

  if p_initiative is not null then
    v_initiative := p_initiative;
  else
    v_initiative := floor(random() * 20)::int + 1 + coalesce(v_stats.initiative_bonus, v_dex_mod);
  end if;

  select coalesce(max(turn_order), -1) + 1 into v_next_order
    from combat_participants where combat_id = p_combat_id;

  insert into combat_participants (
    combat_id, campaign_id, character_id, name, participant_type,
    initiative, armor_class, current_hp, max_hp, turn_order, status,
    grid_x, grid_y
  ) values (
    p_combat_id, v_combat.campaign_id, p_character_id, v_character.name, 'character',
    v_initiative, v_character.armor_class, v_character.current_hp, v_character.max_hp, v_next_order, 'active',
    p_grid_x, p_grid_y
  )
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_combat.campaign_id, v_combat.session_id, v_combat.scene_id, 'participant_added',
      v_character.name || ' entrou no combate (iniciativa ' || v_initiative || ').',
      jsonb_build_object('participant_id', v_participant.id, 'participant_type', 'character', 'initiative', v_initiative),
      auth.uid()
    );
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function add_combat_character_participant(uuid, uuid, integer, integer, integer) to authenticated;

-- Mestre adiciona um NPC da campanha ao combate (como NPC, aliado ou
-- inimigo). PV/CA/iniciativa podem ser informados manualmente, já que NPCs
-- ainda não têm bloco de atributos estruturado.
create or replace function add_combat_npc_participant(
  p_combat_id uuid,
  p_npc_id uuid,
  p_participant_type text default 'npc',
  p_initiative integer default null,
  p_current_hp integer default null,
  p_max_hp integer default null,
  p_armor_class integer default null,
  p_grid_x integer default null,
  p_grid_y integer default null
)
returns combat_participants as $$
declare
  v_combat combats;
  v_npc record;
  v_participant combat_participants;
  v_next_order integer;
begin
  select * into v_combat from combats where id = p_combat_id;
  if not found then
    raise exception 'Combate não encontrado';
  end if;

  if not is_campaign_master(v_combat.campaign_id) then
    raise exception 'Apenas o mestre pode adicionar participantes ao combate';
  end if;

  if v_combat.status != 'active' then
    raise exception 'Este combate não está ativo';
  end if;

  if p_participant_type not in ('npc', 'enemy', 'ally') then
    raise exception 'Tipo de participante inválido';
  end if;

  select n.id, n.name into v_npc
    from npcs n
    where n.id = p_npc_id and n.campaign_id = v_combat.campaign_id;

  if not found then
    raise exception 'NPC não encontrado nesta campanha';
  end if;

  if exists (
    select 1 from combat_participants
    where combat_id = p_combat_id and npc_id = p_npc_id
  ) then
    raise exception 'Este NPC já está no combate';
  end if;

  select coalesce(max(turn_order), -1) + 1 into v_next_order
    from combat_participants where combat_id = p_combat_id;

  insert into combat_participants (
    combat_id, campaign_id, npc_id, name, participant_type,
    initiative, armor_class, current_hp, max_hp, turn_order, status,
    grid_x, grid_y
  ) values (
    p_combat_id, v_combat.campaign_id, p_npc_id, v_npc.name, p_participant_type,
    p_initiative, p_armor_class, p_current_hp, p_max_hp, v_next_order, 'active',
    p_grid_x, p_grid_y
  )
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_combat.campaign_id, v_combat.session_id, v_combat.scene_id, 'participant_added',
      v_npc.name || ' entrou no combate.',
      jsonb_build_object('participant_id', v_participant.id, 'participant_type', p_participant_type, 'initiative', p_initiative),
      auth.uid()
    );
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function add_combat_npc_participant(uuid, uuid, text, integer, integer, integer, integer, integer, integer) to authenticated;

-- Mestre cria um inimigo surpresa direto no combate (sem registro de NPC
-- prévio). Registra um evento de cena específico para dar destaque
-- narrativo à entrada do inimigo.
create or replace function add_combat_surprise_enemy(
  p_combat_id uuid,
  p_name text,
  p_current_hp integer,
  p_max_hp integer,
  p_armor_class integer,
  p_initiative integer,
  p_grid_x integer default null,
  p_grid_y integer default null
)
returns combat_participants as $$
declare
  v_combat combats;
  v_participant combat_participants;
  v_next_order integer;
begin
  select * into v_combat from combats where id = p_combat_id;
  if not found then
    raise exception 'Combate não encontrado';
  end if;

  if not is_campaign_master(v_combat.campaign_id) then
    raise exception 'Apenas o mestre pode adicionar inimigos surpresa';
  end if;

  if v_combat.status != 'active' then
    raise exception 'Este combate não está ativo';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'Informe o nome do inimigo surpresa';
  end if;

  select coalesce(max(turn_order), -1) + 1 into v_next_order
    from combat_participants where combat_id = p_combat_id;

  insert into combat_participants (
    combat_id, campaign_id, name, participant_type,
    initiative, armor_class, current_hp, max_hp, turn_order, status,
    grid_x, grid_y, metadata
  ) values (
    p_combat_id, v_combat.campaign_id, btrim(p_name), 'enemy',
    p_initiative, p_armor_class, p_current_hp, p_max_hp, v_next_order, 'active',
    p_grid_x, p_grid_y, jsonb_build_object('surprise', true)
  )
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_combat.campaign_id, v_combat.session_id, v_combat.scene_id, 'participant_added',
      'Um inimigo surpresa entrou no combate: ' || btrim(p_name) || '.',
      jsonb_build_object('participant_id', v_participant.id, 'participant_type', 'enemy', 'surprise', true, 'initiative', p_initiative),
      auth.uid()
    );
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function add_combat_surprise_enemy(uuid, text, integer, integer, integer, integer, integer, integer) to authenticated;

-- Mestre força o turno atual para um participante específico (ex.: ao
-- adicionar um inimigo surpresa ou reorganizar a iniciativa). A ordem dos
-- participantes é por turn_order; current_turn_index é a posição (0-based)
-- do participante nessa ordem.
create or replace function set_combat_current_turn(
  target_combat_id uuid,
  target_participant_id uuid
)
returns combats as $$
declare
  v_combat combats;
  v_participant combat_participants;
  v_index integer;
begin
  select * into v_combat from combats where id = target_combat_id;
  if not found then
    raise exception 'Combate não encontrado';
  end if;

  if not is_campaign_master(v_combat.campaign_id) then
    raise exception 'Apenas o mestre pode definir o turno atual';
  end if;

  if v_combat.status != 'active' then
    raise exception 'Este combate não está ativo';
  end if;

  select * into v_participant
    from combat_participants
    where id = target_participant_id and combat_id = target_combat_id;

  if not found then
    raise exception 'Participante não encontrado neste combate';
  end if;

  select count(*) into v_index
    from combat_participants
    where combat_id = target_combat_id
      and (turn_order < v_participant.turn_order
        or (turn_order = v_participant.turn_order and id < v_participant.id));

  update combats
  set current_turn_index = v_index
  where id = target_combat_id
  returning * into v_combat;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_combat.campaign_id, v_combat.session_id, v_combat.scene_id, 'turn_advanced',
      'Turno definido manualmente: ' || v_participant.name || '.',
      jsonb_build_object('participant_id', v_participant.id),
      auth.uid()
    );
  end if;

  return v_combat;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function set_combat_current_turn(uuid, uuid) to authenticated;
