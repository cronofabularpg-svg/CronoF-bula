-- 0027_media_assets_and_r2.sql
-- Infraestrutura de mídia (Cloudflare R2): registra metadados de arquivos
-- enviados para o bucket R2 (mapas, grids, tokens, locais, handouts).
-- O upload em si é feito via URL assinada gerada no servidor
-- (src/lib/server/r2.ts + /api/uploads/*); esta tabela nunca recebe o
-- arquivo, apenas seus metadados.

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  owner_user_id uuid references profiles(id),
  bucket text not null,
  storage_key text not null,
  public_url text,
  file_name text,
  file_type text,
  mime_type text,
  size_bytes integer,
  width integer,
  height integer,
  usage_type text not null default 'other',
  visibility text not null default 'party',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table media_assets
  add constraint media_assets_visibility_check
  check (visibility in ('private', 'party', 'public', 'master_only'));

alter table media_assets
  add constraint media_assets_usage_type_check
  check (usage_type in (
    'campaign_cover',
    'location_image',
    'battlefield_map',
    'character_avatar',
    'npc_token',
    'item_image',
    'handout',
    'other'
  ));

alter table media_assets
  add constraint media_assets_storage_key_unique unique (storage_key);

create index media_assets_campaign_id_idx on media_assets (campaign_id);
create index media_assets_owner_user_id_idx on media_assets (owner_user_id);
create index media_assets_usage_type_idx on media_assets (usage_type);

create trigger set_media_assets_updated_at
before update on media_assets
for each row execute function set_updated_at();

-- RLS -------------------------------------------------------------------

alter table media_assets enable row level security;

-- Mestre/owner da campanha lê todos os assets da campanha.
create policy "Masters read all campaign media"
on media_assets for select
using (campaign_id is not null and is_campaign_master(campaign_id));

-- Qualquer usuário lê os próprios uploads (ex.: avatar antes de aprovado).
create policy "Owners read own media"
on media_assets for select
using (owner_user_id = auth.uid());

-- Membros da campanha leem mídia visível ao grupo (party/public).
create policy "Members read party-visible media"
on media_assets for select
using (
  campaign_id is not null
  and is_campaign_member(campaign_id)
  and visibility in ('party', 'public')
);

-- Mestre/owner registra mídia oficial da campanha (mapas, grids, locais, NPCs).
create policy "Masters insert campaign media"
on media_assets for insert
with check (
  campaign_id is not null
  and is_campaign_master(campaign_id)
  and owner_user_id = auth.uid()
);

-- Jogador registra apenas mídia própria de avatar de personagem ou handout.
create policy "Players insert own avatar or handout media"
on media_assets for insert
with check (
  campaign_id is not null
  and is_campaign_member(campaign_id)
  and owner_user_id = auth.uid()
  and usage_type in ('character_avatar', 'handout')
);

-- Mestre/owner gerencia (atualiza/remove) qualquer mídia da campanha.
create policy "Masters manage campaign media"
on media_assets for all
using (campaign_id is not null and is_campaign_master(campaign_id))
with check (campaign_id is not null and is_campaign_master(campaign_id));

-- Usuário gerencia (atualiza/remove) os próprios uploads.
create policy "Owners manage own media"
on media_assets for all
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());
