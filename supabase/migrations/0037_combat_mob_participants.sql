-- 0037_combat_mob_participants.sql
-- Permite ao mestre adicionar um mob/boss/criatura do Bestiário (npcs com
-- npc_type in ('mob','boss','creature')) diretamente ao combate, copiando
-- PV/CA/deslocamento e os metadados de IA/combate para
-- combat_participants.metadata. Aditiva — não altera registros existentes.

create or replace function add_combat_mob_participant(
  p_combat_id uuid,
  p_npc_id uuid,
  p_initiative integer default null,
  p_grid_x integer default null,
  p_grid_y integer default null
)
returns combat_participants as $$
declare
  v_combat combats;
  v_npc record;
  v_participant combat_participants;
  v_next_order integer;
  v_participant_type text;
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

  select n.id, n.name, n.npc_type, n.combat_role, n.ai_control_enabled,
         n.challenge_level, n.armor_class, n.max_hp, n.current_hp,
         n.attacks, n.combat_behavior
    into v_npc
    from npcs n
    where n.id = p_npc_id
      and n.campaign_id = v_combat.campaign_id
      and n.npc_type in ('mob', 'boss', 'creature');

  if not found then
    raise exception 'Criatura do Bestiário não encontrada nesta campanha';
  end if;

  if exists (
    select 1 from combat_participants
    where combat_id = p_combat_id and npc_id = p_npc_id
  ) then
    raise exception 'Esta criatura já está no combate';
  end if;

  v_participant_type := case
    when v_npc.combat_role in ('enemy', 'ally') then v_npc.combat_role
    else 'enemy'
  end;

  select coalesce(max(turn_order), -1) + 1 into v_next_order
    from combat_participants where combat_id = p_combat_id;

  insert into combat_participants (
    combat_id, campaign_id, npc_id, name, participant_type,
    initiative, armor_class, current_hp, max_hp, turn_order, status,
    grid_x, grid_y, metadata
  ) values (
    p_combat_id, v_combat.campaign_id, p_npc_id, v_npc.name, v_participant_type,
    p_initiative, v_npc.armor_class, coalesce(v_npc.current_hp, v_npc.max_hp), v_npc.max_hp, v_next_order, 'active',
    p_grid_x, p_grid_y,
    jsonb_build_object(
      'ai_control_enabled', coalesce(v_npc.ai_control_enabled, false),
      'npc_type', v_npc.npc_type,
      'combat_behavior', v_npc.combat_behavior,
      'attacks', coalesce(v_npc.attacks, '[]'::jsonb),
      'challenge_level', v_npc.challenge_level,
      'source_npc_id', v_npc.id
    )
  )
  returning * into v_participant;

  if v_combat.session_id is not null and v_combat.scene_id is not null then
    insert into scene_events (campaign_id, session_id, scene_id, event_type, content, metadata, created_by)
    values (
      v_combat.campaign_id, v_combat.session_id, v_combat.scene_id, 'participant_added',
      v_npc.name || ' entrou no combate.',
      jsonb_build_object('participant_id', v_participant.id, 'participant_type', v_participant_type, 'initiative', p_initiative, 'source_npc_id', v_npc.id),
      auth.uid()
    );
  end if;

  return v_participant;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function add_combat_mob_participant(uuid, uuid, integer, integer, integer) to authenticated;
