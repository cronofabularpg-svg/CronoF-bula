-- 0035_campaign_archive_delete_flow.sql
-- Arquivamento e exclusão (soft delete) de campanhas, restritos ao owner.
-- Não apaga dados filhos nem arquivos do R2 — apenas marca a campanha.

alter table campaigns
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id),
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id);

create or replace function archive_campaign(p_campaign_id uuid)
returns table (
  campaign_id uuid,
  archived_at timestamptz
) as $$
begin
  if not is_campaign_owner(p_campaign_id) then
    raise exception 'Apenas o dono da campanha pode arquivá-la.';
  end if;

  update public.campaigns c
  set archived_at = now(),
      archived_by = auth.uid()
  where c.id = p_campaign_id
    and c.deleted_at is null
  returning c.id, c.archived_at
  into campaign_id, archived_at;

  if campaign_id is null then
    raise exception 'Campanha não encontrada ou já excluída.';
  end if;

  return next;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function restore_campaign(p_campaign_id uuid)
returns table (
  campaign_id uuid
) as $$
begin
  if not is_campaign_owner(p_campaign_id) then
    raise exception 'Apenas o dono da campanha pode restaurá-la.';
  end if;

  update public.campaigns c
  set archived_at = null,
      archived_by = null
  where c.id = p_campaign_id
    and c.deleted_at is null
  returning c.id
  into campaign_id;

  if campaign_id is null then
    raise exception 'Campanha não encontrada ou está excluída.';
  end if;

  return next;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function delete_campaign_soft(p_campaign_id uuid, p_confirmation_name text)
returns table (
  campaign_id uuid,
  deleted_at timestamptz
) as $$
declare
  v_name text;
begin
  if not is_campaign_owner(p_campaign_id) then
    raise exception 'Apenas o dono da campanha pode excluí-la.';
  end if;

  select c.name into v_name
  from public.campaigns c
  where c.id = p_campaign_id
    and c.deleted_at is null;

  if v_name is null then
    raise exception 'Campanha não encontrada ou já excluída.';
  end if;

  if p_confirmation_name is null or trim(p_confirmation_name) <> v_name then
    raise exception 'Nome de confirmação não corresponde ao nome da campanha.';
  end if;

  update public.campaigns c
  set deleted_at = now(),
      deleted_by = auth.uid()
  where c.id = p_campaign_id
  returning c.id, c.deleted_at
  into campaign_id, deleted_at;

  return next;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function archive_campaign(uuid) to authenticated;
grant execute on function restore_campaign(uuid) to authenticated;
grant execute on function delete_campaign_soft(uuid, text) to authenticated;
