-- 0021_campaign_invites.sql
-- Convites seguros por campanha usando invite_code e RPCs.

alter table campaigns
  alter column invite_code set default replace(gen_random_uuid()::text, '-', '');

update campaigns
set invite_code = replace(gen_random_uuid()::text, '-', '')
where invite_code is null;

create or replace function get_campaign_invite_preview(target_invite_code text)
returns table (
  campaign_id uuid,
  campaign_name text,
  campaign_description text
) as $$
begin
  if target_invite_code is null or length(trim(target_invite_code)) = 0 then
    raise exception 'Convite inválido.';
  end if;

  return query
  select c.id, c.name, c.description
  from public.campaigns c
  where c.invite_code = target_invite_code
    and c.status = 'active'
  limit 1;

  if not found then
    raise exception 'Convite inválido ou expirado.';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function request_join_campaign(target_invite_code text)
returns table (
  campaign_id uuid,
  campaign_name text,
  membership_status text
) as $$
declare
  v_user_id uuid := auth.uid();
  v_campaign_id uuid;
  v_campaign_name text;
  v_existing_status text;
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado para solicitar entrada.';
  end if;

  select c.id, c.name
  into v_campaign_id, v_campaign_name
  from public.campaigns c
  where c.invite_code = target_invite_code
    and c.status = 'active'
  limit 1;

  if v_campaign_id is null then
    raise exception 'Convite inválido ou expirado.';
  end if;

  select cm.status
  into v_existing_status
  from public.campaign_members cm
  where cm.campaign_id = v_campaign_id
    and cm.user_id = v_user_id
  limit 1;

  if v_existing_status is not null then
    return query select v_campaign_id, v_campaign_name, v_existing_status;
    return;
  end if;

  insert into public.campaign_members (campaign_id, user_id, role, status)
  values (v_campaign_id, v_user_id, 'player', 'pending');

  return query select v_campaign_id, v_campaign_name, 'pending'::text;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function approve_campaign_member(target_member_id uuid)
returns table (
  member_id uuid,
  campaign_id uuid,
  membership_status text
) as $$
declare
  v_campaign_id uuid;
begin
  select cm.campaign_id
  into v_campaign_id
  from public.campaign_members cm
  where cm.id = target_member_id;

  if v_campaign_id is null then
    raise exception 'Solicitação não encontrada.';
  end if;

  if not is_campaign_master(v_campaign_id) then
    raise exception 'Apenas o mestre pode aprovar jogadores.';
  end if;

  update public.campaign_members
  set status = 'active'
  where id = target_member_id
    and role = 'player'
  returning id, campaign_id, status
  into member_id, campaign_id, membership_status;

  return next;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function reject_campaign_member(target_member_id uuid)
returns table (
  member_id uuid,
  campaign_id uuid,
  membership_status text
) as $$
declare
  v_campaign_id uuid;
begin
  select cm.campaign_id
  into v_campaign_id
  from public.campaign_members cm
  where cm.id = target_member_id;

  if v_campaign_id is null then
    raise exception 'Solicitação não encontrada.';
  end if;

  if not is_campaign_master(v_campaign_id) then
    raise exception 'Apenas o mestre pode rejeitar jogadores.';
  end if;

  update public.campaign_members
  set status = 'rejected'
  where id = target_member_id
    and role = 'player'
  returning id, campaign_id, status
  into member_id, campaign_id, membership_status;

  return next;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function regenerate_campaign_invite(target_campaign_id uuid)
returns text as $$
declare
  v_invite_code text;
begin
  if not is_campaign_master(target_campaign_id) then
    raise exception 'Apenas o mestre pode regenerar convite.';
  end if;

  v_invite_code := replace(gen_random_uuid()::text, '-', '');

  update public.campaigns
  set invite_code = v_invite_code
  where id = target_campaign_id;

  return v_invite_code;
end;
$$ language plpgsql security definer set search_path = public;

drop policy if exists "Users can read own campaign memberships" on campaign_members;
create policy "Users can read own campaign memberships"
on campaign_members for select
using (user_id = auth.uid());

drop policy if exists "Invited users can read requested campaigns" on campaigns;
create policy "Invited users can read requested campaigns"
on campaigns for select
using (
  exists (
    select 1
    from public.campaign_members cm
    where cm.campaign_id = campaigns.id
      and cm.user_id = auth.uid()
      and cm.status in ('pending', 'rejected', 'inactive')
  )
);

grant execute on function get_campaign_invite_preview(text) to anon, authenticated;
grant execute on function request_join_campaign(text) to authenticated;
grant execute on function approve_campaign_member(uuid) to authenticated;
grant execute on function reject_campaign_member(uuid) to authenticated;
grant execute on function regenerate_campaign_invite(uuid) to authenticated;
