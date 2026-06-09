# CRONOFÁBULA — DATABASE SCHEMA

## 1. Resumo Executivo

Este documento define a arquitetura inicial de banco de dados do **Cronofábula**, usando **Supabase/Postgres** como banco principal.

O objetivo do banco é sustentar:

- campanhas persistentes;
- personagens;
- sessões;
- cenas;
- mapa vivo;
- mesa de combate;
- NPCs;
- locais;
- inventário narrativo;
- diário como item físico;
- mapa como item físico;
- conhecimento limitado por personagem;
- crônicas;
- dados físicos e virtuais;
- aprovações;
- IA com contexto filtrado;
- permissões por papel.

A regra central é:

> O banco guarda o estado real do mundo.  
> O sistema aplica regras e permissões.  
> A IA recebe apenas o contexto filtrado necessário.

---

## 2. Stack Recomendada

### Banco

```txt
Supabase Postgres
```

### Auth

```txt
Supabase Auth
```

### Storage de mídia

```txt
Cloudflare R2
```

### Metadados de mídia

```txt
Supabase Postgres
```

### Realtime

```txt
Supabase Realtime
```

Uso recomendado:

- mensagens da Mesa Viva;
- atualizações de cena;
- movimento no Mapa Vivo;
- turnos de combate;
- rolagens;
- notificações;
- aprovações.

---

## 3. Princípios do Banco

## 3.1 Tudo importante deve ter campaign_id

Sempre que uma tabela pertencer a uma campanha, ela deve ter:

```sql
campaign_id uuid not null references campaigns(id)
```

Isso facilita:

- segurança;
- RLS;
- filtros;
- isolamento;
- exportação futura;
- backups por campanha.

---

## 3.2 Separar estado real de conhecimento do jogador

O sistema pode saber que existe uma passagem secreta.

O jogador não deve saber até descobrir.

Por isso, o banco separa:

- estado real do mundo;
- visibilidade para jogadores;
- conhecimento por personagem;
- anotações em diário/mapa;
- fatos canônicos.

---

## 3.3 IA não deve ser fonte primária de verdade

A IA pode sugerir:

- NPCs;
- locais;
- cenas;
- consequências;
- resumos;
- mapas.

Mas a verdade oficial deve entrar no banco apenas após:

- ação do sistema;
- aprovação do mestre;
- evento validado;
- regra definida.

---

## 3.4 Eventos importantes devem ser auditáveis

Tudo que altera a campanha deve poder ser rastreado:

- quem criou;
- quando criou;
- qual sessão originou;
- se foi IA, mestre ou jogador;
- se foi aprovado;
- se virou canônico.

---

# 4. Visão Geral das Tabelas

## Núcleo

```txt
profiles
campaigns
campaign_members
campaign_settings
player_preferences
```

## Personagens

```txt
characters
character_stats
character_resources
character_conditions
character_knowledge
character_relationships
```

## Sessão e Mesa Viva

```txt
sessions
scenes
scene_participants
scene_messages
scene_events
```

## Mapa Vivo

```txt
maps
map_nodes
map_edges
character_positions
npc_positions
player_map_items
map_annotations
```

## NPCs e Mundo

```txt
npcs
locations
factions
quests
quest_objectives
quest_rewards
```

## Inventário, Diário e Itens

```txt
items
character_items
item_lore
journals
journal_entries
documents
```

## Mídias

```txt
media_assets
media_links
```

## Dados

```txt
dice_rolls
```

## Combate

```txt
combats
combat_participants
combat_turns
combat_actions
combat_conditions
combat_rewards
```

## Crônicas e Memória

```txt
chronicles
canon_events
campaign_memory
ai_context_snapshots
```

## Aprovações

```txt
approval_requests
approval_comments
```

## IA

```txt
ai_tasks
ai_messages
ai_generated_suggestions
```

## Auditoria

```txt
activity_log
```

---

# 5. Núcleo

## 5.1 profiles

Complementa o usuário do Supabase Auth.

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
```

### Observações

- `favorite_race` pode receber "Goblin".
- `default_theme_id` define tema visual padrão do usuário.

---

## 5.2 campaigns

Campanhas criadas.

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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### status

```txt
active
paused
archived
finished
deleted
```

---

## 5.3 campaign_members

Usuários dentro da campanha.

```sql
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

### role

```txt
owner
master
assistant_master
player
spectator
```

### status

```txt
active
invited
removed
left
blocked
```

---

## 5.4 campaign_settings

Configurações detalhadas da campanha.

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

---

## 5.5 player_preferences

Preferências do usuário.

```sql
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

### preferred_dice_mode

```txt
physical
virtual
ask
```

---

# 6. Personagens

## 6.1 characters

Ficha principal do personagem.

```sql
create table characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  owner_user_id uuid not null references profiles(id),
  name text not null,
  race text,
  class text,
  subclass text,
  level int default 1,
  background text,
  alignment text,
  portrait_media_id uuid,
  theme_class text,
  theme_race text,
  theme_variant text,
  status text default 'active',
  current_hp int,
  max_hp int,
  armor_class int,
  speed int,
  proficiency_bonus int,
  notes text,
  approved_by_master boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### status

```txt
draft
pending_approval
active
inactive
dead
archived
```

---

## 6.2 character_stats

Atributos do personagem.

```sql
create table character_stats (
  character_id uuid primary key references characters(id) on delete cascade,
  strength int default 10,
  dexterity int default 10,
  constitution int default 10,
  intelligence int default 10,
  wisdom int default 10,
  charisma int default 10,
  saving_throws jsonb default '{}'::jsonb,
  skills jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 6.3 character_resources

Recursos variáveis.

```sql
create table character_resources (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  resource_type text not null,
  name text not null,
  current_value int,
  max_value int,
  reset_on text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Exemplos

```txt
spell_slot
ki
rage
bardic_inspiration
hit_dice
custom
```

---

## 6.4 character_conditions

Condições ativas.

```sql
create table character_conditions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  condition_name text not null,
  description text,
  source text,
  started_at timestamptz default now(),
  ends_at timestamptz,
  status text default 'active',
  created_by uuid references profiles(id)
);
```

---

## 6.5 character_knowledge

Conhecimento individual do personagem.

```sql
create table character_knowledge (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  knowledge_type text not null,
  title text not null,
  content text not null,
  source_type text,
  source_id uuid,
  learned_at_session_id uuid,
  learned_from_npc_id uuid,
  confidence text default 'known',
  visibility text default 'private',
  is_shared boolean default false,
  created_at timestamptz default now()
);
```

### knowledge_type

```txt
dialogue
rumor
location
npc
item
quest
secret
observation
map_note
```

### confidence

```txt
known
suspected
rumor
false
unknown
```

### visibility

```txt
private
party
public
master_only
```

---

## 6.6 character_relationships

Relação entre personagem e NPC/personagem/facção.

```sql
create table character_relationships (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  relation_status text default 'neutral',
  trust_score int default 0,
  notes text,
  updated_at timestamptz default now()
);
```

### relation_status

```txt
ally
friendly
neutral
suspicious
rival
enemy
debt
unknown
```

---

# 7. Sessões e Mesa Viva

## 7.1 sessions

Sessões da campanha.

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  title text not null,
  status text default 'planned',
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  narrator_mode text default 'hybrid',
  recap_text text,
  recap_approved boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### status

```txt
planned
active
paused
completed
cancelled
```

### narrator_mode

```txt
master
ai
hybrid
```

---

## 7.2 scenes

Cenas dentro da sessão.

```sql
create table scenes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  map_id uuid,
  node_id uuid,
  title text not null,
  description text,
  visibility text default 'participants',
  narrator_mode text default 'hybrid',
  status text default 'active',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### visibility

```txt
participants
private
public
master_only
```

---

## 7.3 scene_participants

Participantes da cena.

```sql
create table scene_participants (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  scene_id uuid not null references scenes(id) on delete cascade,
  participant_type text not null,
  character_id uuid,
  npc_id uuid,
  user_id uuid references profiles(id),
  visibility_status text default 'visible',
  hearing_status text default 'normal',
  joined_at timestamptz default now(),
  left_at timestamptz
);
```

### participant_type

```txt
character
npc
master
observer
```

---

## 7.4 scene_messages

Mensagens da Mesa Viva.

```sql
create table scene_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  scene_id uuid references scenes(id) on delete cascade,
  sender_user_id uuid references profiles(id),
  sender_character_id uuid references characters(id),
  sender_npc_id uuid,
  sender_type text not null,
  message_type text not null,
  content text not null,
  visibility text default 'scene',
  target_character_id uuid,
  target_user_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

### sender_type

```txt
player
character
master
ai
npc
system
```

### message_type

```txt
speech
action
narration
whisper
off
dice
system
secret_action
npc_dialogue
```

### visibility

```txt
scene
private
party
public
master_only
off
```

---

## 7.5 scene_events

Eventos estruturados da cena.

```sql
create table scene_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  scene_id uuid references scenes(id),
  event_type text not null,
  title text,
  description text,
  actor_character_id uuid,
  actor_npc_id uuid,
  target_type text,
  target_id uuid,
  is_canonical boolean default false,
  approval_status text default 'none',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

---

# 8. Mapa Vivo

## 8.1 maps

Mapas narrativos.

```sql
create table maps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  parent_map_id uuid references maps(id),
  name text not null,
  type text not null,
  image_media_id uuid,
  description text,
  visibility text default 'known',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### type

```txt
world
region
city
building
dungeon
scene
combat
```

---

## 8.2 map_nodes

Pontos do mapa.

```sql
create table map_nodes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  map_id uuid not null references maps(id) on delete cascade,
  linked_map_id uuid references maps(id),
  name text not null,
  type text,
  description text,
  x numeric,
  y numeric,
  visibility_status text default 'visible',
  is_known boolean default true,
  is_secret boolean default false,
  discovery_condition jsonb default '{}'::jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### visibility_status

```txt
visible
hidden
secret
master_only
```

### linked_map_id

Usado quando o ponto é entrada para um mapa interno.

Exemplo:

```txt
Ponto: Taverna do Cervo Torto
linked_map_id: mapa interno da taverna
```

---

## 8.3 map_edges

Conexões entre pontos.

```sql
create table map_edges (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  map_id uuid not null references maps(id) on delete cascade,
  from_node_id uuid not null references map_nodes(id) on delete cascade,
  to_node_id uuid not null references map_nodes(id) on delete cascade,
  travel_type text default 'walk',
  is_locked boolean default false,
  is_secret boolean default false,
  requires_check boolean default false,
  check_type text,
  check_dc int,
  required_key_item_id uuid,
  description text,
  created_at timestamptz default now()
);
```

### travel_type

```txt
walk
door
secret_passage
road
stairs
portal
boat
tunnel
```

---

## 8.4 character_positions

Posição dos personagens.

```sql
create table character_positions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  character_id uuid not null references characters(id) on delete cascade,
  map_id uuid references maps(id),
  node_id uuid references map_nodes(id),
  scene_id uuid references scenes(id),
  status text default 'active',
  updated_at timestamptz default now(),
  unique (campaign_id, character_id)
);
```

### status

```txt
active
hidden
traveling
unconscious
captured
lost
unknown
```

---

## 8.5 npc_positions

Posição dos NPCs.

```sql
create table npc_positions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  npc_id uuid not null references npcs(id) on delete cascade,
  map_id uuid references maps(id),
  node_id uuid references map_nodes(id),
  scene_id uuid references scenes(id),
  visibility text default 'visible',
  status text default 'active',
  updated_at timestamptz default now(),
  unique (campaign_id, npc_id)
);
```

---

## 8.6 player_map_items

Relação entre personagem, item de mapa e mapa acessível.

```sql
create table player_map_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  map_id uuid not null references maps(id) on delete cascade,
  access_status text default 'available',
  created_at timestamptz default now()
);
```

### access_status

```txt
available
lost
stolen
destroyed
hidden
with_other
```

---

## 8.7 map_annotations

Anotações em mapa.

```sql
create table map_annotations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  map_id uuid not null references maps(id) on delete cascade,
  node_id uuid references map_nodes(id),
  character_id uuid references characters(id),
  created_by uuid references profiles(id),
  title text,
  content text not null,
  visibility text default 'private',
  requires_item_id uuid references items(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### visibility

```txt
private
party
public
master_only
```

---

# 9. NPCs e Mundo

## 9.1 npcs

Personagens não-jogadores.

```sql
create table npcs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  race text,
  role text,
  portrait_media_id uuid,
  personality text,
  voice_style text,
  goals text,
  fears text,
  public_description text,
  master_secret text,
  knowledge jsonb default '{}'::jsonb,
  status text default 'alive',
  importance text default 'normal',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### status

```txt
alive
dead
missing
captured
injured
transformed
unknown
```

### importance

```txt
minor
normal
important
critical
```

---

## 9.2 locations

Cadastro de locais.

```sql
create table locations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  map_id uuid references maps(id),
  node_id uuid references map_nodes(id),
  name text not null,
  type text,
  description text,
  climate text,
  dangers text,
  status text default 'active',
  visibility text default 'known',
  image_media_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 9.3 factions

Facções.

```sql
create table factions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  description text,
  goals text,
  public_reputation text,
  secret_agenda text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 9.4 quests

Missões.

```sql
create table quests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  title text not null,
  description text,
  status text default 'rumor',
  visibility text default 'party',
  giver_npc_id uuid references npcs(id),
  location_id uuid references locations(id),
  is_canonical boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### status

```txt
rumor
available
accepted
in_progress
completed
failed
abandoned
secret
```

---

## 9.5 quest_objectives

Objetivos de missão.

```sql
create table quest_objectives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  title text not null,
  description text,
  status text default 'open',
  sort_order int default 0,
  created_at timestamptz default now()
);
```

---

## 9.6 quest_rewards

Recompensas de missão.

```sql
create table quest_rewards (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  reward_type text not null,
  name text,
  description text,
  amount numeric,
  item_id uuid,
  approval_status text default 'pending',
  created_at timestamptz default now()
);
```

---

# 10. Inventário, Itens e Diário

## 10.1 items

Itens da campanha.

```sql
create table items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  item_type text not null,
  rarity text,
  image_media_id uuid,
  physical_description text,
  known_description text,
  hidden_description text,
  known_properties text,
  hidden_properties text,
  origin_session_id uuid references sessions(id),
  origin_location_id uuid references locations(id),
  origin_npc_id uuid references npcs(id),
  acquisition_story text,
  is_identified boolean default false,
  is_cursed_known boolean default false,
  status text default 'active',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### item_type

```txt
weapon
armor
consumable
magic_item
document
key
treasure
resource
narrative
diary
map
tool
```

---

## 10.2 character_items

Posse de itens.

```sql
create table character_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  quantity int default 1,
  equipped boolean default false,
  access_status text default 'available',
  acquired_at timestamptz default now(),
  notes text
);
```

### access_status

```txt
available
lost
stolen
destroyed
hidden
with_other
pending_approval
```

---

## 10.3 item_lore

Camadas de lore por personagem ou grupo.

```sql
create table item_lore (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  character_id uuid references characters(id),
  lore_level text default 'known',
  title text,
  content text not null,
  source_type text,
  source_id uuid,
  visibility text default 'private',
  created_at timestamptz default now()
);
```

### lore_level

```txt
appearance
known_history
known_property
identified
master_secret
```

---

## 10.4 journals

Diários como itens.

```sql
create table journals (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  title text not null,
  access_status text default 'available',
  last_known_location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### access_status

```txt
available
lost
stolen
destroyed
hidden
with_other
with_npc
```

---

## 10.5 journal_entries

Entradas do diário.

```sql
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  journal_id uuid not null references journals(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  session_id uuid references sessions(id),
  scene_id uuid references scenes(id),
  title text,
  entry_type text default 'note',
  content text not null,
  visibility text default 'private',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### entry_type

```txt
note
dialogue
clue
map
quest
dream
memory
```

---

## 10.6 documents

Documentos encontrados no mundo.

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  item_id uuid references items(id),
  title text not null,
  content text,
  encrypted_content text,
  language text,
  is_deciphered boolean default false,
  visibility text default 'private',
  created_at timestamptz default now()
);
```

---

# 11. Mídias

## 11.1 media_assets

Metadados de mídia. Arquivos ficam no Cloudflare R2.

```sql
create table media_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  uploaded_by uuid references profiles(id),
  name text not null,
  media_type text not null,
  r2_key text not null,
  public_url text,
  mime_type text,
  size_bytes bigint,
  description text,
  visibility text default 'campaign',
  created_at timestamptz default now()
);
```

### media_type

```txt
npc_portrait
location_image
map_image
item_image
symbol
document
audio
video
other
```

---

## 11.2 media_links

Liga mídia a entidades.

```sql
create table media_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  media_id uuid not null references media_assets(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  purpose text,
  created_at timestamptz default now()
);
```

---

# 12. Dados

## 12.1 dice_rolls

Histórico de rolagens.

```sql
create table dice_rolls (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  session_id uuid references sessions(id),
  scene_id uuid references scenes(id),
  combat_id uuid,
  user_id uuid references profiles(id),
  character_id uuid references characters(id),
  roll_type text default 'virtual',
  formula text,
  die_type text,
  raw_result int,
  modifier int default 0,
  total int,
  reason text,
  visibility text default 'scene',
  is_contested boolean default false,
  contested_reason text,
  created_at timestamptz default now()
);
```

### roll_type

```txt
physical
virtual
system
master
```

---

# 13. Mesa de Combate

## 13.1 combats

Combates.

```sql
create table combats (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  scene_id uuid references scenes(id),
  map_id uuid references maps(id),
  node_id uuid references map_nodes(id),
  title text not null,
  status text default 'active',
  round_number int default 1,
  current_turn_participant_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  ended_at timestamptz
);
```

### status

```txt
setup
active
paused
completed
cancelled
```

---

## 13.2 combat_participants

Participantes do combate.

```sql
create table combat_participants (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references combats(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  entity_type text not null,
  character_id uuid references characters(id),
  npc_id uuid references npcs(id),
  display_name text not null,
  initiative int,
  current_hp int,
  max_hp int,
  armor_class int,
  zone text,
  status text default 'active',
  is_player_controlled boolean default false,
  is_ai_controlled boolean default false,
  created_at timestamptz default now()
);
```

### entity_type

```txt
character
npc
enemy
summon
object
```

### zone

```txt
front
middle
back
near
far
elevated
hidden
down
```

---

## 13.3 combat_turns

Turnos.

```sql
create table combat_turns (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references combats(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  round_number int not null,
  participant_id uuid not null references combat_participants(id) on delete cascade,
  turn_order int not null,
  started_at timestamptz,
  ended_at timestamptz,
  status text default 'pending'
);
```

### status

```txt
pending
active
completed
skipped
held
```

---

## 13.4 combat_actions

Ações de combate.

```sql
create table combat_actions (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references combats(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  turn_id uuid references combat_turns(id),
  actor_participant_id uuid references combat_participants(id),
  action_type text not null,
  target_participant_id uuid references combat_participants(id),
  description text,
  roll_id uuid references dice_rolls(id),
  result text,
  damage int,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

### action_type

```txt
attack
spell
ability
item
move
defend
help
ready
interact
speak
custom
```

---

## 13.5 combat_conditions

Condições de combate.

```sql
create table combat_conditions (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references combats(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  participant_id uuid not null references combat_participants(id) on delete cascade,
  condition_name text not null,
  description text,
  duration_type text,
  remaining_rounds int,
  applied_by_participant_id uuid references combat_participants(id),
  created_at timestamptz default now()
);
```

---

## 13.6 combat_rewards

Recompensas pós-combate.

```sql
create table combat_rewards (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references combats(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  reward_type text not null,
  name text,
  description text,
  assigned_to_character_id uuid references characters(id),
  item_id uuid references items(id),
  amount numeric,
  approval_status text default 'pending',
  created_at timestamptz default now()
);
```

---

# 14. Crônicas e Memória

## 14.1 chronicles

Resumos oficiais.

```sql
create table chronicles (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id),
  title text not null,
  content text not null,
  summary_type text default 'session',
  status text default 'draft',
  created_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### summary_type

```txt
session
combat
solo
character
world
manual
```

### status

```txt
draft
pending_approval
approved
rejected
archived
```

---

## 14.2 canon_events

Eventos canônicos.

```sql
create table canon_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id),
  scene_id uuid references scenes(id),
  event_type text not null,
  title text not null,
  description text not null,
  importance text default 'normal',
  visibility text default 'party',
  created_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

### importance

```txt
minor
normal
important
critical
```

---

## 14.3 campaign_memory

Memória estruturada para IA.

```sql
create table campaign_memory (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  memory_type text not null,
  title text not null,
  content text not null,
  importance text default 'normal',
  entity_type text,
  entity_id uuid,
  visibility text default 'master',
  source_type text,
  source_id uuid,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### memory_type

```txt
fact
npc
location
quest
item
relationship
secret
rule
recap
```

---

## 14.4 ai_context_snapshots

Contextos enviados para IA para auditoria.

```sql
create table ai_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id),
  scene_id uuid references scenes(id),
  task_type text not null,
  context_json jsonb not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

---

# 15. Aprovações

## 15.1 approval_requests

Solicitações de aprovação.

```sql
create table approval_requests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  request_type text not null,
  entity_type text not null,
  entity_id uuid,
  title text not null,
  description text,
  payload jsonb default '{}'::jsonb,
  status text default 'pending',
  requested_by uuid references profiles(id),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);
```

### request_type

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

### status

```txt
pending
approved
rejected
adjusted
partial
cancelled
```

---

## 15.2 approval_comments

Comentários de aprovação.

```sql
create table approval_comments (
  id uuid primary key default gen_random_uuid(),
  approval_request_id uuid not null references approval_requests(id) on delete cascade,
  user_id uuid not null references profiles(id),
  content text not null,
  created_at timestamptz default now()
);
```

---

# 16. IA

## 16.1 ai_tasks

Tarefas de IA.

```sql
create table ai_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  task_key text not null,
  model_provider text default 'groq',
  model_name text,
  system_prompt text,
  temperature numeric default 0.7,
  max_tokens int,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### task_key

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

---

## 16.2 ai_messages

Histórico de chamadas IA.

```sql
create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  session_id uuid references sessions(id),
  scene_id uuid references scenes(id),
  user_id uuid references profiles(id),
  task_key text,
  input_summary text,
  output_text text,
  status text default 'completed',
  token_estimate int,
  created_at timestamptz default now()
);
```

---

## 16.3 ai_generated_suggestions

Sugestões de IA aguardando aprovação.

```sql
create table ai_generated_suggestions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  suggestion_type text not null,
  title text,
  content text,
  payload jsonb default '{}'::jsonb,
  status text default 'pending',
  created_by_task text,
  reviewed_by uuid references profiles(id),
  created_at timestamptz default now(),
  reviewed_at timestamptz
);
```

### suggestion_type

```txt
npc
location
map
quest
item
scene
consequence
recap
combat_event
```

---

# 17. Auditoria

## 17.1 activity_log

Registro de ações importantes.

```sql
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  user_id uuid references profiles(id),
  action_type text not null,
  entity_type text,
  entity_id uuid,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

Exemplos:

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

# 18. RLS e Permissões

## 18.1 Regra base

Usuário só pode acessar dados de campanha se estiver em `campaign_members`.

Função sugerida:

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
```

---

## 18.2 Regra para mestre

```sql
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
```

---

## 18.3 Diretrizes de RLS

### Jogador pode ver

- campanhas onde é membro;
- seu personagem;
- personagens da campanha com campos públicos;
- cenas onde seu personagem participa;
- mensagens visíveis para ele;
- mapa conhecido;
- NPCs visíveis;
- itens que possui ou foram compartilhados;
- seu diário se tem acesso ao item;
- suas anotações;
- crônicas aprovadas.

### Jogador não pode ver

- segredos do mestre;
- locais secretos não descobertos;
- cenas privadas de outros;
- diários perdidos;
- conhecimento de outros personagens não compartilhado;
- payload completo de IA;
- aprovações internas do mestre, salvo as próprias.

### Mestre pode ver

- tudo da campanha;
- segredos;
- cenas privadas;
- locais ocultos;
- diários;
- contexto da IA;
- aprovações;
- logs.

---

## 18.4 Atenção

Algumas restrições complexas podem ser mais fáceis de aplicar na API/server actions do que apenas em RLS.

Exemplos:

- verificar se personagem tem diário antes de abrir;
- verificar se personagem tem mapa antes de anotar;
- filtrar mensagens por cena;
- revelar local secreto após teste;
- compartilhar conhecimento entre personagens.

---

# 19. Índices Recomendados

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

# 20. MVP do Banco

Para o MVP, implementar primeiro:

## Núcleo

- profiles
- campaigns
- campaign_members
- campaign_settings

## Personagens

- characters
- character_stats
- character_conditions

## Sessão

- sessions
- scenes
- scene_participants
- scene_messages

## Mapa Vivo

- maps
- map_nodes
- map_edges
- character_positions
- npc_positions
- map_annotations

## NPCs e Locais

- npcs
- locations

## Inventário e Diário

- items
- character_items
- journals
- journal_entries

## Dados

- dice_rolls

## Combate

- combats
- combat_participants
- combat_turns
- combat_actions
- combat_conditions

## Crônicas e Aprovações

- chronicles
- canon_events
- approval_requests

## Mídias

- media_assets
- media_links

---

# 21. Fase 2 do Banco

Implementar depois:

- quests
- quest_objectives
- quest_rewards
- factions
- character_relationships
- character_knowledge avançado
- item_lore avançado
- documents
- combat_rewards
- campaign_memory avançada
- ai_context_snapshots
- ai_generated_suggestions
- activity_log completo
- regras finas de RLS por cena e conhecimento

---

# 22. Riscos e Limitações

## Riscos

- Banco ficar grande demais antes do MVP.
- Regras de visibilidade ficarem complexas.
- RLS difícil de manter se tentar resolver tudo direto no banco.
- IA receber contexto errado se queries forem mal filtradas.
- Diário/mapa como item exigir validações cuidadosas.
- Combate ficar pesado se tentar automatizar todas as regras de D&D cedo.

## Mitigações

- Implementar em fases.
- Usar `campaign_id` em tudo.
- Começar com visibilidade simples.
- Mestre vê tudo.
- Jogador vê apenas suas cenas e informações autorizadas.
- Regras complexas inicialmente na API/server.
- Logs para decisões importantes.
- Aprovação para tudo que muda a campanha.

---

# 23. Decisão Oficial

```txt
O Cronofábula usará Supabase/Postgres como banco principal.
Cloudflare R2 guardará mídias.
O banco será orientado a campanha, cena, mapa, personagem, item e conhecimento.
A IA não será fonte de verdade; ela apenas interpreta dados filtrados.
O mestre terá controle final.
Jogadores só verão o que seus personagens podem acessar.
Diário e mapa serão itens narrativos com controle de acesso.
O combate será salvo em estrutura própria, separada do Mapa Vivo.
```

---

# 24. Próximos Passos

Após este documento, os próximos arquivos recomendados são:

```txt
CRONOFABULA_PERMISSION_SYSTEM.md
CRONOFABULA_AI_CONTEXT_AND_PROMPTS.md
CRONOFABULA_MVP_ROADMAP.md
```

Sequência recomendada:

1. Fechar permissões/RLS.
2. Definir prompts internos e contexto da IA.
3. Criar roadmap técnico do MVP.
4. Criar SQL real das tabelas.
5. Criar protótipo das telas principais.
