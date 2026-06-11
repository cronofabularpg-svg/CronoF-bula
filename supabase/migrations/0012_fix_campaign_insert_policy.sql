-- 0012_fix_campaign_insert_policy.sql
-- Corrige criação de campanha por usuário autenticado.

alter table public.campaigns enable row level security;

drop policy if exists "Users can create own campaigns" on public.campaigns;
drop policy if exists "Owners can create campaigns" on public.campaigns;

create policy "Users can create own campaigns"
on public.campaigns
for insert
to authenticated
with check (
  owner_id = auth.uid()
);

drop policy if exists "Owners can read own campaigns" on public.campaigns;

create policy "Owners can read own campaigns"
on public.campaigns
for select
to authenticated
using (
  owner_id = auth.uid()
  or is_campaign_member(id)
);

drop policy if exists "Owners can update own campaigns" on public.campaigns;

create policy "Owners can update own campaigns"
on public.campaigns
for update
to authenticated
using (
  owner_id = auth.uid()
)
with check (
  owner_id = auth.uid()
);

drop policy if exists "Owners can delete own campaigns" on public.campaigns;

create policy "Owners can delete own campaigns"
on public.campaigns
for delete
to authenticated
using (
  owner_id = auth.uid()
);
