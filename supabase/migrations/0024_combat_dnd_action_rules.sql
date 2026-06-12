-- 0024_combat_dnd_action_rules.sql
-- Fase 11 (refinamento): aproxima o combate real das regras básicas de D&D 5e
-- sem automatizar o sistema por completo. Mestre continua sendo a autoridade
-- final para aplicar dano, condições, mortes e concentração.

-- Condições oficiais agora são objetos estruturados (key/label/source/duration/
-- save/notes) em combat_participants.conditions. Converte entradas antigas
-- (strings simples salvas pela versão anterior de apply_combat_condition).
update combat_participants
set conditions = (
  select coalesce(jsonb_agg(
    case jsonb_typeof(elem)
      when 'string' then jsonb_build_object('key', lower(elem #>> '{}'), 'label', elem #>> '{}')
      else elem
    end
  ), '[]'::jsonb)
  from jsonb_array_elements(conditions) elem
)
where jsonb_typeof(conditions) = 'array' and conditions != '[]'::jsonb;

-- Remove a versão anterior (texto livre); a partir de agora a condição é um
-- objeto estruturado escolhido a partir da lista oficial no frontend.
drop function if exists apply_combat_condition(uuid, text);

-- Mestre aplica uma condição oficial (objeto estruturado) a um participante.
-- Se já existir uma condição com a mesma "key", ela é substituída.
create or replace function apply_combat_condition(target_participant_id uuid, condition jsonb)
returns combat_participants as $$
declare
  v_participant combat_participants;
  v_combat combats;
  v_key text;
  v_label text;
begin
  select * into v_participant from combat_participants where id = target_participant_id;
  if not found then
    raise exception 'Participante não encontrado';
  end if;

  select * into v_combat from combats where id = v_participant.combat_id;

  if not is_campaign_master(v_participant.campaign_id) then
    raise exception 'Apenas o mestre pode aplicar condições';
  end if;

  v_key := condition->>'key';
  v_label := coalesce(condition->>'label', v_key);

  if v_key is null or btrim(v_key) = '' then
    raise exception 'Informe uma condição válida';
  end if;

  update combat_participants
  set conditions = coalesce((
    select jsonb_agg(elem) from jsonb_array_elements(conditions) elem
    where elem->>'key' is distinct from v_key
  ), '[]'::jsonb) || jsonb_build_array(condition)
  where id = target_participant_id
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_participant.campaign_id, v_combat.session_id, v_combat.scene_id, 'condition_applied',
      v_participant.name || ' recebeu a condição: ' || v_label || '.',
      condition, auth.uid()
    );
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function apply_combat_condition(uuid, jsonb) to authenticated;

-- Mestre remove uma condição (pela chave oficial) de um participante.
create or replace function remove_combat_condition(target_participant_id uuid, condition_key text)
returns combat_participants as $$
declare
  v_participant combat_participants;
  v_combat combats;
  v_label text;
begin
  select * into v_participant from combat_participants where id = target_participant_id;
  if not found then
    raise exception 'Participante não encontrado';
  end if;

  select * into v_combat from combats where id = v_participant.combat_id;

  if not is_campaign_master(v_participant.campaign_id) then
    raise exception 'Apenas o mestre pode remover condições';
  end if;

  select elem->>'label' into v_label
  from jsonb_array_elements(v_participant.conditions) elem
  where elem->>'key' = condition_key
  limit 1;

  update combat_participants
  set conditions = coalesce((
    select jsonb_agg(elem) from jsonb_array_elements(conditions) elem
    where elem->>'key' is distinct from condition_key
  ), '[]'::jsonb)
  where id = target_participant_id
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_participant.campaign_id, v_combat.session_id, v_combat.scene_id, 'condition_removed',
      v_participant.name || ' não está mais ' || coalesce(v_label, condition_key) || '.',
      jsonb_build_object('key', condition_key), auth.uid()
    );
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function remove_combat_condition(uuid, text) to authenticated;

-- Mestre ajusta os testes de resistência contra a morte (0 a 3) de um
-- participante. Não mata automaticamente; é apenas o registro do contador.
create or replace function update_combat_death_saves(target_participant_id uuid, successes integer, failures integer)
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
    raise exception 'Apenas o mestre pode ajustar testes contra a morte';
  end if;

  if successes is null or failures is null
     or successes < 0 or successes > 3 or failures < 0 or failures > 3 then
    raise exception 'Sucessos e falhas devem estar entre 0 e 3';
  end if;

  update combat_participants
  set metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{death_saves}',
    jsonb_build_object('successes', successes, 'failures', failures),
    true
  )
  where id = target_participant_id
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_participant.campaign_id, v_combat.session_id, v_combat.scene_id, 'death_save_updated',
      v_participant.name || ': sucessos ' || successes || '/3, falhas ' || failures || '/3.',
      jsonb_build_object('successes', successes, 'failures', failures), auth.uid()
    );
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function update_combat_death_saves(uuid, integer, integer) to authenticated;

-- Mestre ativa/remove a concentração de um participante em uma magia.
create or replace function set_combat_concentration(target_participant_id uuid, active boolean, spell text default null)
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
    raise exception 'Apenas o mestre pode gerenciar concentração';
  end if;

  update combat_participants
  set metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{concentration}',
    jsonb_build_object('active', active, 'spell', coalesce(spell, '')),
    true
  )
  where id = target_participant_id
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_participant.campaign_id, v_combat.session_id, v_combat.scene_id,
      case when active then 'concentration_started' else 'concentration_ended' end,
      case when active then v_participant.name || ' está concentrando em ' || coalesce(nullif(btrim(spell), ''), 'uma magia') || '.'
           else v_participant.name || ' perdeu a concentração.' end,
      jsonb_build_object('spell', spell), auth.uid()
    );
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function set_combat_concentration(uuid, boolean, text) to authenticated;

-- Registra eventos de combate na cena (declaração de ação, rolagem de ataque,
-- teste de resistência etc.). Mestre pode registrar qualquer tipo de evento;
-- jogadores só registram ações/rolagens do próprio personagem.
create or replace function log_combat_event(
  target_combat_id uuid,
  event_type text,
  content text,
  event_metadata jsonb default '{}'::jsonb
)
returns scene_events as $$
declare
  v_combat combats;
  v_event scene_events;
  v_character_id uuid;
  v_player_event_types text[] := array['combat_action_declared', 'attack_roll', 'saving_throw'];
begin
  select * into v_combat from combats where id = target_combat_id;
  if not found then
    raise exception 'Combate não encontrado';
  end if;

  if is_campaign_master(v_combat.campaign_id) then
    null;
  elsif is_campaign_member(v_combat.campaign_id) then
    if not (event_type = any(v_player_event_types)) then
      raise exception 'Jogadores só podem registrar ações, ataques e testes de resistência';
    end if;

    v_character_id := (event_metadata->>'character_id')::uuid;
    if v_character_id is null or not owns_character(v_character_id) then
      raise exception 'Você só pode registrar ações do seu próprio personagem';
    end if;
  else
    raise exception 'Sem permissão para registrar eventos neste combate';
  end if;

  if v_combat.session_id is null or v_combat.scene_id is null then
    return null;
  end if;

  insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
  values (v_combat.campaign_id, v_combat.session_id, v_combat.scene_id, event_type, content, coalesce(event_metadata, '{}'::jsonb), auth.uid())
  returning * into v_event;

  return v_event;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function log_combat_event(uuid, text, text, jsonb) to authenticated;
