# CRONOFÁBULA — SQL MIGRATIONS PLAN

## 1. Resumo Executivo

Este documento define o plano de migrations SQL do **Cronofábula** para Supabase/Postgres.

O objetivo é transformar o schema conceitual em uma sequência segura de migrations, evitando criar o banco inteiro de uma vez e reduzindo risco de quebra.

A regra central é:

> Criar o banco por fases, sempre validando segurança, RLS, relações e uso real antes de avançar para o próximo módulo.

Este plano segue a ordem do MVP:

```txt
Auth/Profile
Campanhas
Personagens
Mesa Viva
Dados
NPCs
IA
Mapa Vivo
Inventário/Diário
Crônicas
Aprovações
Combate
Mídias
Auditoria
```

---

## 2. Princípios das Migrations

## 2.1 Migrations pequenas

Cada migration deve fazer uma coisa clara.

Evitar migrations gigantes.

---

## 2.2 RLS desde o início

Toda tabela sensível deve ter:

```sql
alter table table_name enable row level security;
```

---

## 2.3 campaign_id em tudo que pertence à campanha

Tabelas de campanha devem ter:

```sql
campaign_id uuid not null references campaigns(id) on delete cascade
```

---

## 2.4 Soft delete quando houver valor narrativo

Evitar apagar registros importantes.

Preferir:

```txt
status = archived
status = deleted
```

---

## 2.5 Triggers de updated_at

Tabelas editáveis devem usar trigger de atualização automática.

---

# 3. Ordem Geral de Migrations

```txt
0001_extensions_and_helpers.sql
0002_profiles_and_preferences.sql
0003_campaigns_and_members.sql
0004_campaign_settings_and_rls.sql
0005_characters_core.sql
0006_sessions_and_scenes.sql
0007_scene_messages_and_events.sql
0008_dice_rolls.sql
0009_npcs_and_locations.sql
0010_ai_core.sql
0011_live_map.sql
0012_inventory_and_journals.sql
0013_chronicles_and_memory.sql
0014_approvals.sql
0015_combat_core.sql
0016_media_assets.sql
0017_activity_log.sql
0018_indexes_and_constraints.sql
0019_seed_ai_tasks.sql
0020_mvp_validation_views.sql
```

---

# 4. Migration 0001 — Extensions and Helpers

Arquivo:

```txt
0001_extensions_and_helpers.sql
```

## Objetivo

Criar extensões, funções utilitárias e trigger de updated_at.

## Conteúdo

```sql
create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

## Observação

Supabase normalmente já possui `gen_random_uuid()`, mas manter `pgcrypto` garante compatibilidade.

---

# 5. Migration 0002 — Profiles and Preferences

Arquivo:

```txt
0002_profiles_and_preferences.sql
```

## Objetivo

Criar perfis de usuário e preferências.

## Tabelas

- profiles;
- player_preferences.

## SQL base

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  favorite_race text,
  favorite_class text,
  default_theme_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table player_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  preferred_dice_mode text default 'ask',
  default_ui_theme text,
  reduce_motion boolean default false,
  font_size text default 'normal',
  notification_settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## RLS

```sql
alter table profiles enable row level security;
alter table player_preferences enable row level security;

create policy "Users can read profiles"
on profiles for select
using (true);

create policy "Users can update own profile"
on profiles for update
using (id = auth.uid());

create policy "Users can read own preferences"
on player_preferences for select
using (user_id = auth.uid());

create policy "Users can update own preferences"
on player_preferences for update
using (user_id = auth.uid());
```

## Trigger

```sql
create trigger set_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

create trigger set_player_preferences_updated_at
before update on player_preferences
for each row execute function set_updated_at();
```

---

# 6. Migration 0003 — Campaigns and Members

Arquivo:

```txt
0003_campaigns_and_members.sql
```

## Objetivo

Criar campanhas e membros.

## Tabelas

- campaigns;
- campaign_members.

## SQL base

```sql
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
```

## Status e roles esperados

```txt
campaigns.status:
active
paused
archived
finished
deleted

campaign_members.role:
owner
master
assistant_master
player
spectator

campaign_members.status:
active
invited
removed
left
blocked
```

## Helpers de permissão

```sql
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
```

## RLS

```sql
alter table campaigns enable row level security;
alter table campaign_members enable row level security;

create policy "Members can read campaigns"
on campaigns for select
using (is_campaign_member(id));

create policy "Owners can update campaigns"
on campaigns for update
using (is_campaign_owner(id));

create policy "Members can read campaign members"
on campaign_members for select
using (is_campaign_member(campaign_id));

create policy "Masters can manage campaign members"
on campaign_members for all
using (is_campaign_master(campaign_id));
```

---

# 7. Migration 0004 — Campaign Settings and RLS Base

Arquivo:

```txt
0004_campaign_settings_and_rls.sql
```

## Objetivo

Criar configurações da campanha.

## Tabela

- campaign_settings.

## SQL base

```sql
create table campaign_settings (
  campaign_id uuid primary key references campaigns(id) on delete cascade,

  rule_system text default 'dnd_srd',
  starting_level int default 1,
  progression_type text default 'milestone',

  allow_physical_dice boolean default true,
  allow_virtual_dice boolean default true,
  require_roll_reason boolean default true,

  ai_default_mode text default 'assistant',
  ai_can_narrate boolean default true,
  ai_can_create_npc boolean default false,
  ai_can_create_location boolean default false,
  ai_can_suggest_map boolean default true,
  ai_can_start_combat boolean default false,
  ai_can_reveal_secret boolean default false,

  solo_enabled boolean default false,
  solo_requires_approval boolean default true,
  solo_weekly_limit int default 3,

  diary_enabled boolean default true,
  diary_as_item boolean default true,
  diary_loss_blocks_access boolean default true,

  map_notes_enabled boolean default true,
  map_notes_require_item boolean default true,
  secret_locations_invisible boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## RLS

```sql
alter table campaign_settings enable row level security;

create policy "Members can read campaign settings"
on campaign_settings for select
using (is_campaign_member(campaign_id));

create policy "Masters can update campaign settings"
on campaign_settings for update
using (is_campaign_master(campaign_id));
```

---

# 8. Migration 0005 — Characters Core

Arquivo:

```txt
0005_characters_core.sql
```

## Objetivo

Criar estrutura básica de personagens.

## Tabelas

- characters;
- character_stats;
- character_resources;
- character_conditions;
- character_knowledge;
- character_relationships.

## Observação MVP

No MVP, implementar primeiro:

- characters;
- character_stats;
- character_conditions.

As demais podem ser criadas agora ou deixadas para fase 2.

## Helper

```sql
create or replace function owns_character(character uuid)
returns boolean as $$
  select exists (
    select 1
    from characters
    where id = character
      and owner_user_id = auth.uid()
  );
$$ language sql security definer;
```

## RLS Direção

- mestre vê todos;
- jogador vê seus personagens completos;
- jogador vê versão pública dos personagens da campanha via API/view;
- edição do jogador pode exigir aprovação.

---

# 9. Migration 0006 — Sessions and Scenes

Arquivo:

```txt
0006_sessions_and_scenes.sql
```

## Objetivo

Criar sessões e cenas.

## Tabelas

- sessions;
- scenes;
- scene_participants.

## Regras

- mestre cria sessão;
- mestre cria cena;
- jogador só vê cena onde seu personagem participa;
- mestre vê todas.

## RLS Direção

A RLS pode permitir leitura por membro da campanha, mas a API deve filtrar cenas privadas.

Para segurança máxima, usar policies refinadas depois.

---

# 10. Migration 0007 — Scene Messages and Events

Arquivo:

```txt
0007_scene_messages_and_events.sql
```

## Objetivo

Criar chat da Mesa Viva e eventos estruturados.

## Tabelas

- scene_messages;
- scene_events.

## Visibilidade de mensagens

```txt
scene
private
party
public
master_only
off
```

## Validação obrigatória server-side

Antes de inserir mensagem:

- usuário pertence à campanha;
- personagem pertence ao usuário ou usuário é mestre;
- cena existe;
- personagem está na cena, exceto mestre;
- visibilidade permitida.

---

# 11. Migration 0008 — Dice Rolls

Arquivo:

```txt
0008_dice_rolls.sql
```

## Objetivo

Criar histórico de dados físicos e virtuais.

## Tabela

- dice_rolls.

## Regras

- jogador pode registrar dado próprio;
- mestre pode registrar qualquer dado da campanha;
- rolagens devem ter motivo quando configuração exigir;
- rolagens físicas e virtuais ficam no mesmo histórico.

---

# 12. Migration 0009 — NPCs and Locations

Arquivo:

```txt
0009_npcs_and_locations.sql
```

## Objetivo

Criar NPCs e locais.

## Tabelas

- npcs;
- locations;
- factions;
- quests;
- quest_objectives;
- quest_rewards.

## MVP

Implementar primeiro:

- npcs;
- locations.

Factions e quests podem ficar para fase 2.

## Regras

- mestre cria/edita NPC oficial;
- IA sugere NPC;
- NPC sugerido vira oficial após aprovação;
- jogador vê apenas NPC conhecido/presente.

---

# 13. Migration 0010 — AI Core

Arquivo:

```txt
0010_ai_core.sql
```

## Objetivo

Criar base para IA.

## Tabelas

- ai_tasks;
- ai_messages;
- ai_generated_suggestions;
- ai_context_snapshots.

## Regras

- jogador não vê contexto bruto;
- mestre pode ver contexto;
- sugestões de IA não viram canônicas sem aprovação;
- toda chamada relevante deve ser auditável.

---

# 14. Migration 0011 — Live Map

Arquivo:

```txt
0011_live_map.sql
```

## Objetivo

Criar o Mapa Vivo.

## Tabelas

- maps;
- map_nodes;
- map_edges;
- character_positions;
- npc_positions;
- player_map_items;
- map_annotations.

## Regras

- mestre vê todos os pontos;
- jogador vê apenas pontos visíveis/conhecidos;
- locais secretos ficam invisíveis;
- anotação em mapa exige item mapa;
- movimento deve ser validado no servidor.

---

# 15. Migration 0012 — Inventory and Journals

Arquivo:

```txt
0012_inventory_and_journals.sql
```

## Objetivo

Criar inventário narrativo, itens, documentos e diário.

## Tabelas

- items;
- character_items;
- item_lore;
- journals;
- journal_entries;
- documents.

## Regras

- jogador vê apenas itens próprios ou compartilhados;
- propriedades ocultas só mestre;
- diário perdido bloqueia acesso;
- mapa e diário são itens do inventário.

---

# 16. Migration 0013 — Chronicles and Memory

Arquivo:

```txt
0013_chronicles_and_memory.sql
```

## Objetivo

Criar crônicas, eventos canônicos e memória da campanha.

## Tabelas

- chronicles;
- canon_events;
- campaign_memory.

## Regras

- crônica pode ser draft, pending, approved;
- jogador vê crônicas aprovadas;
- mestre edita/aprova;
- memória da IA nasce de fatos aprovados.

---

# 17. Migration 0014 — Approvals

Arquivo:

```txt
0014_approvals.sql
```

## Objetivo

Criar central de aprovações.

## Tabelas

- approval_requests;
- approval_comments.

## Tipos de aprovação

```txt
character_approval
sheet_change
item_reward
xp_reward
gold_reward
solo_event
combat_reward
chronicle_approval
npc_creation
location_creation
map_discovery
canon_event
```

## Regras

- jogador vê próprias solicitações;
- mestre vê todas;
- mestre aprova/rejeita/ajusta.

---

# 18. Migration 0015 — Combat Core

Arquivo:

```txt
0015_combat_core.sql
```

## Objetivo

Criar Mesa de Combate.

## Tabelas

- combats;
- combat_participants;
- combat_turns;
- combat_actions;
- combat_conditions;
- combat_rewards.

## Regras

- combate nasce de cena/local;
- mestre inicia/encerra;
- jogador age no próprio turno;
- IA narra, mas não altera resultado;
- recompensas ficam pendentes de aprovação.

---

# 19. Migration 0016 — Media Assets

Arquivo:

```txt
0016_media_assets.sql
```

## Objetivo

Criar metadados de mídia.

## Tabelas

- media_assets;
- media_links.

## Regras

- arquivo fica no Cloudflare R2;
- Postgres guarda metadados;
- visibilidade respeita campanha e entidade.

---

# 20. Migration 0017 — Activity Log

Arquivo:

```txt
0017_activity_log.sql
```

## Objetivo

Criar auditoria básica.

## Tabela

- activity_log.

## Eventos recomendados

```txt
created_campaign
created_character
moved_character
revealed_secret_location
approved_reward
corrected_ai_memory
started_combat
ended_combat
lost_diary
recovered_map
```

---

# 21. Migration 0018 — Indexes and Constraints

Arquivo:

```txt
0018_indexes_and_constraints.sql
```

## Objetivo

Criar índices principais.

## SQL recomendado

```sql
create index idx_campaign_members_user on campaign_members(user_id);
create index idx_characters_campaign on characters(campaign_id);
create index idx_sessions_campaign on sessions(campaign_id);
create index idx_scenes_session on scenes(session_id);
create index idx_scene_messages_scene on scene_messages(scene_id, created_at);
create index idx_maps_campaign on maps(campaign_id);
create index idx_map_nodes_map on map_nodes(map_id);
create index idx_map_edges_from on map_edges(from_node_id);
create index idx_character_positions_campaign on character_positions(campaign_id);
create index idx_npc_positions_campaign on npc_positions(campaign_id);
create index idx_items_campaign on items(campaign_id);
create index idx_character_items_character on character_items(character_id);
create index idx_dice_rolls_session on dice_rolls(session_id, created_at);
create index idx_combats_session on combats(session_id);
create index idx_chronicles_campaign on chronicles(campaign_id);
create index idx_approval_requests_campaign on approval_requests(campaign_id, status);
create index idx_campaign_memory_campaign on campaign_memory(campaign_id, memory_type);
```

---

# 22. Migration 0019 — Seed AI Tasks

Arquivo:

```txt
0019_seed_ai_tasks.sql
```

## Objetivo

Criar tasks iniciais da IA.

## Tasks

```txt
narrator
npc_dialogue
rules_helper
session_generator
session_summary
combat_narrator
map_generator
solo_adventure
memory_builder
```

## Observação

Prompts longos podem ficar no código ou banco.

Recomendação MVP:

- guardar `task_key`;
- provider;
- model;
- configuração;
- prompt curto/base;
- prompts completos em arquivos de código/docs.

---

# 23. Migration 0020 — MVP Validation Views

Arquivo:

```txt
0020_mvp_validation_views.sql
```

## Objetivo

Criar views úteis para debug/validação.

## Views sugeridas

```txt
campaign_member_summary
active_session_summary
character_current_location
scene_visible_participants
combat_current_turn
pending_approvals_summary
```

## Exemplo

```sql
create view campaign_member_summary as
select
  cm.campaign_id,
  cm.user_id,
  p.display_name,
  cm.role,
  cm.status,
  cm.joined_at
from campaign_members cm
join profiles p on p.id = cm.user_id;
```

---

# 24. Migrations que Podem ser Adiadas

Para acelerar o MVP, estas podem ficar para depois:

```txt
factions
quests
quest_objectives
quest_rewards
character_relationships
documents
item_lore avançado
ai_generated_suggestions avançado
activity_log completo
views avançadas
```

---

# 25. Ordem Mínima para Protótipo Jogável

Para um protótipo inicial, basta:

```txt
0001_extensions_and_helpers
0002_profiles_and_preferences
0003_campaigns_and_members
0004_campaign_settings_and_rls
0005_characters_core
0006_sessions_and_scenes
0007_scene_messages_and_events
0008_dice_rolls
0009_npcs_and_locations
0010_ai_core
```

Com isso, já dá para validar:

- login;
- campanha;
- personagem;
- sessão;
- chat;
- dados;
- NPC;
- IA básica.

---

# 26. Ordem Mínima para MVP Completo

Para MVP completo, adicionar:

```txt
0011_live_map
0012_inventory_and_journals
0013_chronicles_and_memory
0014_approvals
0015_combat_core
0016_media_assets
0018_indexes_and_constraints
0019_seed_ai_tasks
```

---

# 27. Regras de Rollback

Antes de aplicar migration:

```txt
1. Testar localmente.
2. Verificar dependências.
3. Aplicar em ambiente dev.
4. Validar RLS.
5. Só depois aplicar produção.
```

Em produção:

```txt
Evitar drop table.
Evitar alteração destrutiva.
Preferir adicionar coluna nullable.
Preencher dados.
Depois tornar obrigatória, se necessário.
```

---

# 28. Checklist por Migration

Antes de considerar migration pronta:

```txt
[ ] Tabela criada
[ ] FK criada
[ ] campaign_id presente quando necessário
[ ] RLS ativado
[ ] Policies básicas criadas
[ ] Índices necessários planejados
[ ] updated_at trigger quando necessário
[ ] Status definidos
[ ] Validação server-side documentada
[ ] Teste manual executado
```

---

# 29. Riscos e Mitigações

## Risco 1 — RLS quebrar acesso legítimo

Mitigação:

- começar com RLS simples;
- validar via APIs;
- criar testes de mestre/jogador.

## Risco 2 — RLS permissivo demais

Mitigação:

- nunca expor segredos via query direta;
- usar views/API para dados filtrados;
- testar jogador em cena privada.

## Risco 3 — FKs circulares

Mitigação:

- criar tabelas centrais primeiro;
- adicionar FKs opcionais depois;
- usar `references` quando a tabela já existir.

## Risco 4 — Banco grande demais

Mitigação:

- migrations por fase;
- adiar módulos não essenciais.

## Risco 5 — IA acessar dados indevidos

Mitigação:

- `buildAIContext` server-side;
- nunca consultar direto do frontend;
- snapshots auditáveis.

---

# 30. Decisão Oficial

```txt
As migrations do Cronofábula serão criadas por fase, seguindo o MVP Roadmap.
Supabase/Postgres será a fonte de verdade.
RLS será obrigatório.
Regras narrativas complexas serão validadas no servidor.
O banco deve priorizar segurança, persistência e contexto filtrado para IA.
```

---

# 31. Próximo Passo

Após este plano, o próximo passo técnico é criar os arquivos SQL reais:

```txt
/supabase/migrations/0001_extensions_and_helpers.sql
/supabase/migrations/0002_profiles_and_preferences.sql
...
```

Ou criar um arquivo inicial:

```txt
CRONOFABULA_SUPABASE_INITIAL_SQL.md
```

com as primeiras migrations prontas para copiar e aplicar no Supabase.
