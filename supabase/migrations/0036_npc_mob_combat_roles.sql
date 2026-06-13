-- 0036_npc_mob_combat_roles.sql
-- Separa NPCs narrativos ("principais") de mobs/criaturas de combate, adicionando
-- estatísticas de combate opcionais aos NPCs. Não remove nem altera dados
-- existentes — NPCs antigos continuam com npc_type = 'main'.

alter table npcs
  add column if not exists npc_type text not null default 'main',
  add column if not exists combat_role text,
  add column if not exists ai_control_enabled boolean not null default false,
  add column if not exists challenge_level text,
  add column if not exists armor_class integer,
  add column if not exists max_hp integer,
  add column if not exists current_hp integer,
  add column if not exists movement_meters numeric,
  add column if not exists attacks jsonb not null default '[]'::jsonb,
  add column if not exists combat_behavior text,
  add column if not exists spawn_min integer,
  add column if not exists spawn_max integer,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table npcs
  drop constraint if exists npcs_npc_type_check,
  add constraint npcs_npc_type_check
    check (npc_type in ('main', 'mob', 'boss', 'ally', 'merchant', 'mentor', 'neutral', 'creature'));

alter table npcs
  drop constraint if exists npcs_combat_role_check,
  add constraint npcs_combat_role_check
    check (combat_role is null or combat_role in ('enemy', 'ally', 'neutral', 'summon', 'environmental'));

-- get_campaign_npcs ganha as novas colunas de combate/IA. O OUT signature muda,
-- então é preciso dropar a versão anterior antes de recriar.
drop function if exists get_campaign_npcs(uuid);

create or replace function get_campaign_npcs(target_campaign_id uuid)
returns table (
  id uuid,
  campaign_id uuid,
  name text,
  role text,
  description text,
  personality text,
  goals text,
  secrets text,
  knowledge jsonb,
  relationship_status text,
  current_location_id uuid,
  current_scene_id uuid,
  visibility text,
  status text,
  image_url text,
  npc_type text,
  combat_role text,
  ai_control_enabled boolean,
  challenge_level text,
  armor_class integer,
  max_hp integer,
  current_hp integer,
  movement_meters numeric,
  attacks jsonb,
  combat_behavior text,
  spawn_min integer,
  spawn_max integer,
  metadata jsonb,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
) as $$
  select
    n.id,
    n.campaign_id,
    n.name,
    n.role,
    n.description,
    n.personality,
    n.goals,
    case when is_campaign_master(n.campaign_id) then n.secrets else null end as secrets,
    n.knowledge,
    n.relationship_status,
    n.current_location_id,
    n.current_scene_id,
    n.visibility,
    n.status,
    n.image_url,
    n.npc_type,
    n.combat_role,
    n.ai_control_enabled,
    n.challenge_level,
    n.armor_class,
    n.max_hp,
    n.current_hp,
    n.movement_meters,
    n.attacks,
    n.combat_behavior,
    n.spawn_min,
    n.spawn_max,
    n.metadata,
    n.created_by,
    n.created_at,
    n.updated_at
  from npcs n
  where n.campaign_id = target_campaign_id
    and (
      is_campaign_master(n.campaign_id)
      or (
        is_campaign_member(n.campaign_id)
        and n.visibility in ('public', 'visible')
      )
      or (
        is_campaign_member(n.campaign_id)
        and n.current_scene_id is not null
        and is_scene_participant(n.current_scene_id)
        and n.visibility in ('public', 'visible', 'scene')
      )
    )
  order by n.name asc;
$$ language sql stable security definer set search_path = public;

grant execute on function get_campaign_npcs(uuid) to authenticated;
