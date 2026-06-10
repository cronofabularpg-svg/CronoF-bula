-- 0003_campaigns_and_members.sql
-- Campanhas e membros, com helpers de permissão usados pelas políticas de RLS.

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  name text not null,
  slug text,
  description text,
  system_key text default 'dnd_srd',
  tone text,
  cover_media_id uuid,
  status text default 'active',
  solo_enabled boolean default false,
  ai_enabled boolean default true,
  invite_code text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table campaign_members (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'player',
  status text default 'active',
  joined_at timestamptz default now(),
  unique (campaign_id, user_id)
);

-- Helpers de permissão

create or replace function is_campaign_member(campaign uuid)
returns boolean as $$
  select exists (
    select 1
    from campaign_members
    where campaign_id = campaign
      and user_id = auth.uid()
      and status = 'active'
  );
$$ language sql security definer;

create or replace function is_campaign_master(campaign uuid)
returns boolean as $$
  select exists (
    select 1
    from campaign_members
    where campaign_id = campaign
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'master', 'assistant_master')
  );
$$ language sql security definer;

create or replace function is_campaign_owner(campaign uuid)
returns boolean as $$
  select exists (
    select 1
    from campaigns
    where id = campaign
      and owner_id = auth.uid()
  );
$$ language sql security definer;

-- RLS

alter table campaigns enable row level security;
alter table campaign_members enable row level security;

create policy "Members can read campaigns"
on campaigns for select
using (is_campaign_member(id));

create policy "Owners can update campaigns"
on campaigns for update
using (is_campaign_owner(id));

create policy "Owners can insert campaigns"
on campaigns for insert
with check (owner_id = auth.uid());

create policy "Members can read campaign members"
on campaign_members for select
using (is_campaign_member(campaign_id));

create policy "Masters can manage campaign members"
on campaign_members for all
using (is_campaign_master(campaign_id));

-- Trigger de updated_at

create trigger set_campaigns_updated_at
before update on campaigns
for each row execute function set_updated_at();

-- Ao criar uma campanha, o owner vira automaticamente membro com role 'owner'.

create or replace function handle_new_campaign()
returns trigger as $$
begin
  insert into public.campaign_members (campaign_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active');

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_campaign_created
after insert on campaigns
for each row execute function handle_new_campaign();
