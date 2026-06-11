-- 0023_real_combat_flow.sql
-- Fase 11: Combate Real Integrado.
-- Cria combates e participantes persistidos, com RPCs seguras para o mestre
-- controlar turnos, dano, cura, condições e encerramento. Jogadores apenas
-- leem o estado do combate e registram rolagens (dice_rolls já existente).

create table combats (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  scene_id uuid references scenes(id) on delete set null,
  title text not null,
  status text not null default 'active',
  round_number integer not null default 1,
  current_turn_index integer not null default 0,
  created_by uuid references profiles(id),
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table combats
  add constraint combats_status_check
  check (status in ('active', 'paused', 'ended'));

create index combats_campaign_id_status_idx on combats (campaign_id, status);

create table combat_participants (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references combats(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid references characters(id) on delete set null,
  npc_id uuid references npcs(id) on delete set null,
  name text not null,
  participant_type text not null,
  initiative integer,
  armor_class integer,
  current_hp integer,
  max_hp integer,
  turn_order integer,
  status text not null default 'active',
  conditions jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table combat_participants
  add constraint combat_participants_type_check
  check (participant_type in ('character', 'npc', 'enemy', 'ally', 'custom'));

alter table combat_participants
  add constraint combat_participants_status_check
  check (status in ('active', 'defeated', 'dead', 'fled', 'inactive'));

create index combat_participants_combat_id_turn_order_idx on combat_participants (combat_id, turn_order);
create index combat_participants_campaign_id_idx on combat_participants (campaign_id);

-- RLS -------------------------------------------------------------------

alter table combats enable row level security;
alter table combat_participants enable row level security;

create policy "Members read campaign combats"
on combats for select
using (is_campaign_member(campaign_id));

-- Apenas mestre/owner cria, atualiza e encerra combates oficiais.
create policy "Masters manage campaign combats"
on combats for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Members read combat participants"
on combat_participants for select
using (is_campaign_member(campaign_id));

-- Jogador não altera HP/status/turn_order de participantes; isso fica
-- restrito ao mestre. Rolagens dos jogadores vão para dice_rolls.
create policy "Masters manage combat participants"
on combat_participants for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create trigger set_combats_updated_at
before update on combats
for each row execute function set_updated_at();

create trigger set_combat_participants_updated_at
before update on combat_participants
for each row execute function set_updated_at();

-- RPCs --------------------------------------------------------------------

-- Mestre inicia um combate, criando participantes a partir de personagens,
-- NPCs e/ou inimigos manuais. A ordem de turno é definida pela iniciativa
-- (maior primeiro).
create or replace function start_combat(
  target_campaign_id uuid,
  target_session_id uuid,
  target_scene_id uuid,
  combat_title text,
  participants jsonb
)
returns combats as $$
declare
  v_combat combats;
  v_participant jsonb;
  v_character record;
  v_npc record;
  v_name text;
  v_ac integer;
  v_current_hp integer;
  v_max_hp integer;
begin
  if not is_campaign_master(target_campaign_id) then
    raise exception 'Apenas o mestre pode iniciar um combate';
  end if;

  insert into combats (campaign_id, session_id, scene_id, title, status, created_by)
  values (target_campaign_id, target_session_id, target_scene_id, combat_title, 'active', auth.uid())
  returning * into v_combat;

  if jsonb_typeof(participants) = 'array' then
    for v_participant in select * from jsonb_array_elements(participants)
    loop
      v_name := v_participant->>'name';
      v_ac := (v_participant->>'armor_class')::int;
      v_current_hp := (v_participant->>'current_hp')::int;
      v_max_hp := (v_participant->>'max_hp')::int;

      if (v_participant->>'character_id') is not null then
        select c.name, c.current_hp, c.max_hp, c.armor_class
          into v_character
          from characters c
          where c.id = (v_participant->>'character_id')::uuid
            and c.campaign_id = target_campaign_id;

        if found then
          v_name := coalesce(v_name, v_character.name);
          v_current_hp := coalesce(v_character.current_hp, v_current_hp);
          v_max_hp := coalesce(v_character.max_hp, v_max_hp);
          v_ac := coalesce(v_character.armor_class, v_ac);
        end if;
      elsif (v_participant->>'npc_id') is not null then
        select n.name into v_npc
          from npcs n
          where n.id = (v_participant->>'npc_id')::uuid
            and n.campaign_id = target_campaign_id;

        if found then
          v_name := coalesce(v_name, v_npc.name);
        end if;
      end if;

      insert into combat_participants (
        combat_id, campaign_id, character_id, npc_id, name, participant_type,
        initiative, armor_class, current_hp, max_hp, status, conditions, metadata
      ) values (
        v_combat.id,
        target_campaign_id,
        (v_participant->>'character_id')::uuid,
        (v_participant->>'npc_id')::uuid,
        coalesce(v_name, 'Participante'),
        coalesce(v_participant->>'participant_type', 'custom'),
        (v_participant->>'initiative')::int,
        v_ac,
        v_current_hp,
        v_max_hp,
        'active',
        coalesce(v_participant->'conditions', '[]'::jsonb),
        coalesce(v_participant->'metadata', '{}'::jsonb)
      );
    end loop;
  end if;

  -- Ordena a linha de iniciativa (maior primeiro); empates mantêm a ordem de criação.
  with ranked as (
    select id, row_number() over (order by coalesce(initiative, -999999) desc, created_at asc) - 1 as rn
    from combat_participants
    where combat_id = v_combat.id
  )
  update combat_participants cp
  set turn_order = ranked.rn
  from ranked
  where cp.id = ranked.id;

  if target_session_id is not null and target_scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, created_by)
    values (target_campaign_id, target_session_id, target_scene_id, 'combat_started', 'Combate iniciado: ' || combat_title, auth.uid());
  end if;

  return v_combat;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function start_combat(uuid, uuid, uuid, text, jsonb) to authenticated;

-- Mestre avança para o próximo participante; ao passar do último, avança a rodada.
create or replace function advance_combat_turn(target_combat_id uuid)
returns combats as $$
declare
  v_combat combats;
  v_total integer;
begin
  select * into v_combat from combats where id = target_combat_id;
  if not found then
    raise exception 'Combate não encontrado';
  end if;

  if not is_campaign_master(v_combat.campaign_id) then
    raise exception 'Apenas o mestre pode avançar o turno';
  end if;

  if v_combat.status != 'active' then
    raise exception 'Este combate não está ativo';
  end if;

  select count(*) into v_total from combat_participants where combat_id = target_combat_id;

  if v_total = 0 then
    raise exception 'Não há participantes neste combate';
  end if;

  if v_combat.current_turn_index + 1 >= v_total then
    update combats
    set current_turn_index = 0, round_number = round_number + 1
    where id = target_combat_id
    returning * into v_combat;
  else
    update combats
    set current_turn_index = current_turn_index + 1
    where id = target_combat_id
    returning * into v_combat;
  end if;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, created_by)
    values (v_combat.campaign_id, v_combat.session_id, v_combat.scene_id, 'turn_advanced', 'Turno avançado.', auth.uid());
  end if;

  return v_combat;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function advance_combat_turn(uuid) to authenticated;

-- Mestre aplica dano a um participante (HP minimo 0; marca derrotado em 0).
create or replace function apply_combat_damage(target_participant_id uuid, amount integer, damage_type text default null)
returns combat_participants as $$
declare
  v_participant combat_participants;
  v_combat combats;
  v_new_hp integer;
begin
  select * into v_participant from combat_participants where id = target_participant_id;
  if not found then
    raise exception 'Participante não encontrado';
  end if;

  select * into v_combat from combats where id = v_participant.combat_id;

  if not is_campaign_master(v_participant.campaign_id) then
    raise exception 'Apenas o mestre pode aplicar dano';
  end if;

  if amount is null or amount < 0 then
    raise exception 'A quantidade de dano deve ser positiva';
  end if;

  v_new_hp := greatest(coalesce(v_participant.current_hp, 0) - amount, 0);

  update combat_participants
  set current_hp = v_new_hp,
      status = case when v_new_hp = 0 and status = 'active' then 'defeated' else status end
  where id = target_participant_id
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, created_by)
    values (
      v_participant.campaign_id, v_combat.session_id, v_combat.scene_id, 'damage_applied',
      v_participant.name || ' recebeu ' || amount || ' de dano' ||
        (case when damage_type is not null and damage_type != '' then ' (' || damage_type || ')' else '' end) || '.',
      auth.uid()
    );

    if v_new_hp = 0 then
      insert into scene_events (campaign_id, session_id, scene_id, event_type, content, created_by)
      values (v_participant.campaign_id, v_combat.session_id, v_combat.scene_id, 'participant_defeated', v_participant.name || ' foi derrotado(a).', auth.uid());
    end if;
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function apply_combat_damage(uuid, integer, text) to authenticated;

-- Mestre aplica cura a um participante (HP máximo respeitado quando definido).
create or replace function apply_combat_healing(target_participant_id uuid, amount integer)
returns combat_participants as $$
declare
  v_participant combat_participants;
  v_combat combats;
  v_new_hp integer;
begin
  select * into v_participant from combat_participants where id = target_participant_id;
  if not found then
    raise exception 'Participante não encontrado';
  end if;

  select * into v_combat from combats where id = v_participant.combat_id;

  if not is_campaign_master(v_participant.campaign_id) then
    raise exception 'Apenas o mestre pode aplicar cura';
  end if;

  if amount is null or amount < 0 then
    raise exception 'A quantidade de cura deve ser positiva';
  end if;

  v_new_hp := coalesce(v_participant.current_hp, 0) + amount;
  if v_participant.max_hp is not null then
    v_new_hp := least(v_new_hp, v_participant.max_hp);
  end if;

  update combat_participants
  set current_hp = v_new_hp
  where id = target_participant_id
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, created_by)
    values (v_participant.campaign_id, v_combat.session_id, v_combat.scene_id, 'healing_applied', v_participant.name || ' recuperou ' || amount || ' pontos de vida.', auth.uid());
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function apply_combat_healing(uuid, integer) to authenticated;

-- Mestre aplica uma condição (ex: Envenenado) a um participante.
create or replace function apply_combat_condition(target_participant_id uuid, condition_label text)
returns combat_participants as $$
declare
  v_participant combat_participants;
  v_combat combats;
begin
  select * into v_participant from combat_participants where id = target_participant_id;
  if not found then
    raise exception 'Participante não encontrado';
  end if;

  select * into v_combat from combats where id = v_participant.combat_id;

  if not is_campaign_master(v_participant.campaign_id) then
    raise exception 'Apenas o mestre pode aplicar condições';
  end if;

  if condition_label is null or btrim(condition_label) = '' then
    raise exception 'Informe uma condição válida';
  end if;

  update combat_participants
  set conditions = conditions || to_jsonb(btrim(condition_label))
  where id = target_participant_id
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, created_by)
    values (v_participant.campaign_id, v_combat.session_id, v_combat.scene_id, 'condition_applied', v_participant.name || ' recebeu a condição: ' || btrim(condition_label) || '.', auth.uid());
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function apply_combat_condition(uuid, text) to authenticated;

-- Mestre encerra o combate.
create or replace function end_combat(target_combat_id uuid)
returns combats as $$
declare
  v_combat combats;
begin
  select * into v_combat from combats where id = target_combat_id;
  if not found then
    raise exception 'Combate não encontrado';
  end if;

  if not is_campaign_master(v_combat.campaign_id) then
    raise exception 'Apenas o mestre pode encerrar o combate';
  end if;

  update combats
  set status = 'ended', ended_at = now()
  where id = target_combat_id
  returning * into v_combat;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, created_by)
    values (v_combat.campaign_id, v_combat.session_id, v_combat.scene_id, 'combat_ended', 'Combate "' || v_combat.title || '" encerrado.', auth.uid());
  end if;

  return v_combat;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function end_combat(uuid) to authenticated;
