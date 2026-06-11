-- 0009_npcs_locations_approvals.sql
-- NPCs, locais e solicitações de aprovação oficiais no Supabase Postgres.

create table npcs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  role text,
  description text,
  personality text,
  goals text,
  secrets text,
  knowledge jsonb default '[]'::jsonb,
  relationship_status text,
  current_location_id uuid,
  current_scene_id uuid references scenes(id) on delete set null,
  visibility text default 'master_only',
  status text default 'alive',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  type text,
  description text,
  region text,
  image_url text,
  visibility text default 'hidden',
  discovery_condition text,
  status text default 'active',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table approval_requests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  scene_id uuid references scenes(id) on delete set null,
  requested_by uuid references profiles(id),
  assigned_to uuid references profiles(id),
  request_type text not null,
  status text default 'pending',
  title text not null,
  description text,
  payload jsonb default '{}'::jsonb,
  resolution_note text,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table npcs
  add constraint npcs_visibility_check
  check (visibility in ('public', 'visible', 'scene', 'hidden', 'secret', 'master_only'));

alter table locations
  add constraint locations_visibility_check
  check (visibility in ('public', 'visible', 'known', 'hidden', 'secret', 'master_only'));

alter table approval_requests
  add constraint approval_requests_status_check
  check (status in ('pending', 'approved', 'rejected'));

alter table npcs
  add constraint npcs_current_location_id_fkey
  foreign key (current_location_id) references locations(id) on delete set null;

create index npcs_campaign_id_idx on npcs (campaign_id);
create index npcs_current_scene_id_idx on npcs (current_scene_id);
create index npcs_current_location_id_idx on npcs (current_location_id);
create index npcs_campaign_visibility_idx on npcs (campaign_id, visibility);
create index locations_campaign_id_idx on locations (campaign_id);
create index locations_campaign_visibility_idx on locations (campaign_id, visibility);
create index approval_requests_campaign_status_idx on approval_requests (campaign_id, status);
create index approval_requests_requested_by_idx on approval_requests (requested_by);

alter table npcs enable row level security;
alter table locations enable row level security;
alter table approval_requests enable row level security;

create policy "Masters can read all campaign NPCs"
on npcs for select
using (is_campaign_master(campaign_id));

create policy "Members can read visible campaign NPCs"
on npcs for select
using (
  is_campaign_member(campaign_id)
  and visibility in ('public', 'visible')
);

create policy "Scene participants can read present campaign NPCs"
on npcs for select
using (
  is_campaign_member(campaign_id)
  and current_scene_id is not null
  and is_scene_participant(current_scene_id)
  and visibility in ('public', 'visible', 'scene')
);

create policy "Masters manage campaign NPCs"
on npcs for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Masters can read all campaign locations"
on locations for select
using (is_campaign_master(campaign_id));

create policy "Members can read visible campaign locations"
on locations for select
using (
  is_campaign_member(campaign_id)
  and visibility in ('public', 'visible', 'known')
);

create policy "Masters manage campaign locations"
on locations for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Members create own approval requests"
on approval_requests for insert
with check (
  is_campaign_member(campaign_id)
  and requested_by = auth.uid()
  and status = 'pending'
  and resolved_by is null
  and resolved_at is null
);

create policy "Players read own approval requests"
on approval_requests for select
using (
  is_campaign_member(campaign_id)
  and requested_by = auth.uid()
);

create policy "Masters read campaign approval requests"
on approval_requests for select
using (is_campaign_master(campaign_id));

create policy "Masters resolve campaign approval requests"
on approval_requests for update
using (is_campaign_master(campaign_id))
with check (
  is_campaign_master(campaign_id)
  and status in ('pending', 'approved', 'rejected')
);

create policy "Masters delete campaign approval requests"
on approval_requests for delete
using (is_campaign_master(campaign_id));

create trigger set_npcs_updated_at
before update on npcs
for each row execute function set_updated_at();

create trigger set_locations_updated_at
before update on locations
for each row execute function set_updated_at();

create trigger set_approval_requests_updated_at
before update on approval_requests
for each row execute function set_updated_at();

create or replace function set_approval_resolution_metadata()
returns trigger as $$
begin
  if new.status in ('approved', 'rejected') and old.status is distinct from new.status then
    if not is_campaign_master(old.campaign_id) then
      raise exception 'Only campaign masters can resolve approval requests';
    end if;

    new.resolved_by := auth.uid();
    new.resolved_at := coalesce(new.resolved_at, now());
  end if;

  if new.status = 'pending' then
    new.resolved_by := null;
    new.resolved_at := null;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger before_approval_request_resolution
before update on approval_requests
for each row execute function set_approval_resolution_metadata();

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

revoke select (secrets) on npcs from anon, authenticated;
