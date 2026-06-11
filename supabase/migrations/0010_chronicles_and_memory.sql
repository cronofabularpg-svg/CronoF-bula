-- 0010_chronicles_and_memory.sql
-- Crônicas, eventos canônicos e memória da campanha.

create table chronicles (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  title text not null,
  summary text,
  public_content text,
  master_notes text,
  status text default 'draft',
  visibility text default 'party',
  created_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table canon_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  scene_id uuid references scenes(id) on delete set null,
  chronicle_id uuid references chronicles(id) on delete set null,
  event_type text not null,
  title text not null,
  content text,
  visibility text default 'party',
  importance text default 'normal',
  created_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now()
);

create table campaign_memory (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  memory_type text not null,
  title text not null,
  content text not null,
  visibility text default 'party',
  importance text default 'normal',
  related_entity_type text,
  related_entity_id uuid,
  created_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table chronicles
  add constraint chronicles_status_check
  check (status in ('draft', 'pending', 'approved'));

alter table chronicles
  add constraint chronicles_visibility_check
  check (visibility in ('party', 'public', 'master_only'));

alter table canon_events
  add constraint canon_events_visibility_check
  check (visibility in ('party', 'public', 'master_only'));

alter table canon_events
  add constraint canon_events_importance_check
  check (importance in ('low', 'normal', 'high'));

alter table campaign_memory
  add constraint campaign_memory_visibility_check
  check (visibility in ('party', 'public', 'master_only'));

alter table campaign_memory
  add constraint campaign_memory_importance_check
  check (importance in ('low', 'normal', 'high'));

create index chronicles_campaign_id_idx on chronicles (campaign_id);
create index chronicles_session_id_idx on chronicles (session_id);
create index chronicles_campaign_status_idx on chronicles (campaign_id, status, visibility);
create index canon_events_campaign_id_idx on canon_events (campaign_id);
create index canon_events_chronicle_id_idx on canon_events (chronicle_id);
create index campaign_memory_campaign_id_idx on campaign_memory (campaign_id);
create index campaign_memory_source_idx on campaign_memory (source_type, source_id);

alter table chronicles enable row level security;
alter table canon_events enable row level security;
alter table campaign_memory enable row level security;

create policy "Masters can read all chronicles"
on chronicles for select
using (is_campaign_master(campaign_id));

create policy "Members can read published chronicles"
on chronicles for select
using (
  is_campaign_member(campaign_id)
  and status = 'approved'
  and visibility in ('party', 'public')
);

create policy "Masters manage chronicles"
on chronicles for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Masters can read all canon events"
on canon_events for select
using (is_campaign_master(campaign_id));

create policy "Members can read approved visible canon events"
on canon_events for select
using (
  is_campaign_member(campaign_id)
  and approved_at is not null
  and visibility in ('party', 'public')
);

create policy "Masters manage canon events"
on canon_events for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Masters can read all campaign memory"
on campaign_memory for select
using (is_campaign_master(campaign_id));

create policy "Members can read approved visible campaign memory"
on campaign_memory for select
using (
  is_campaign_member(campaign_id)
  and approved_at is not null
  and visibility in ('party', 'public')
);

create policy "Masters manage campaign memory"
on campaign_memory for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create trigger set_chronicles_updated_at
before update on chronicles
for each row execute function set_updated_at();

create trigger set_campaign_memory_updated_at
before update on campaign_memory
for each row execute function set_updated_at();

create or replace function sync_chronicle_approval_fields()
returns trigger as $$
begin
  if new.status = 'approved' and old.status is distinct from new.status then
    new.approved_by := auth.uid();
    new.approved_at := coalesce(new.approved_at, now());
  elsif new.status in ('draft', 'pending') then
    new.approved_by := null;
    new.approved_at := null;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger before_chronicle_update_sync
before update on chronicles
for each row execute function sync_chronicle_approval_fields();

create or replace function get_campaign_chronicles(target_campaign_id uuid)
returns table (
  id uuid,
  campaign_id uuid,
  session_id uuid,
  title text,
  summary text,
  public_content text,
  master_notes text,
  status text,
  visibility text,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
) as $$
  select
    c.id,
    c.campaign_id,
    c.session_id,
    c.title,
    c.summary,
    c.public_content,
    case when is_campaign_master(c.campaign_id) then c.master_notes else null end as master_notes,
    c.status,
    c.visibility,
    c.created_by,
    c.approved_by,
    c.approved_at,
    c.created_at,
    c.updated_at
  from chronicles c
  where c.campaign_id = target_campaign_id
    and (
      is_campaign_master(c.campaign_id)
      or (
        is_campaign_member(c.campaign_id)
        and c.status = 'approved'
        and c.visibility in ('party', 'public')
      )
    )
  order by c.created_at desc;
$$ language sql stable security definer set search_path = public;

grant execute on function get_campaign_chronicles(uuid) to authenticated;
