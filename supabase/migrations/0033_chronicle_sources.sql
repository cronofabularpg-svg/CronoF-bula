-- 0033_chronicle_sources.sql
-- Origem e metadados para diferenciar Mesa Viva, mesas externas e registros manuais.

alter table chronicles
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_label text,
  add column if not exists raw_notes text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table chronicles drop constraint if exists chronicles_source_type_check;
alter table chronicles
  add constraint chronicles_source_type_check
  check (source_type in ('manual', 'live_table_ai', 'in_person_table', 'online_table', 'combat', 'imported', 'other'));

create index if not exists chronicles_campaign_source_idx on chronicles (campaign_id, source_type);

drop function if exists get_campaign_chronicles(uuid);

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
  source_type text,
  source_label text,
  raw_notes text,
  metadata jsonb,
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
    c.source_type,
    c.source_label,
    case when is_campaign_master(c.campaign_id) then c.raw_notes else null end as raw_notes,
    case when is_campaign_master(c.campaign_id) then c.metadata else '{}'::jsonb end as metadata,
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
