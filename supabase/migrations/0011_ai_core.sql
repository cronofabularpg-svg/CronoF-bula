-- 0011_ai_core.sql
-- Núcleo de IA (Groq): registro de tarefas, snapshots de contexto, mensagens
-- e sugestões geradas pela IA. A IA nunca altera estado oficial diretamente:
-- apenas responde, sugere e registra logs para auditoria do mestre.

create table ai_tasks (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  mode text not null,
  provider text default 'groq',
  model text default 'llama-3.3-70b-versatile',
  enabled boolean default true,
  created_at timestamptz default now()
);

alter table ai_tasks
  add constraint ai_tasks_mode_check
  check (mode in ('narrator', 'npc_dialogue', 'rules_helper', 'session_summary'));

create table ai_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  scene_id uuid references scenes(id) on delete set null,
  character_id uuid references characters(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  mode text not null,
  context jsonb not null,
  visibility_scope text default 'filtered',
  created_at timestamptz default now()
);

alter table ai_context_snapshots
  add constraint ai_context_snapshots_mode_check
  check (mode in ('narrator', 'npc_dialogue', 'rules_helper', 'session_summary'));

alter table ai_context_snapshots
  add constraint ai_context_snapshots_visibility_scope_check
  check (visibility_scope in ('filtered', 'master'));

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  scene_id uuid references scenes(id) on delete set null,
  character_id uuid references characters(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  task_key text,
  mode text not null,
  provider text default 'groq',
  model text,
  input_summary text,
  output text,
  context_snapshot_id uuid references ai_context_snapshots(id) on delete set null,
  status text default 'completed',
  error_message text,
  created_at timestamptz default now()
);

alter table ai_messages
  add constraint ai_messages_mode_check
  check (mode in ('narrator', 'npc_dialogue', 'rules_helper', 'session_summary'));

alter table ai_messages
  add constraint ai_messages_status_check
  check (status in ('completed', 'failed'));

create table ai_generated_suggestions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  scene_id uuid references scenes(id) on delete set null,
  source_message_id uuid references ai_messages(id) on delete set null,
  suggestion_type text not null,
  title text,
  content text,
  payload jsonb default '{}'::jsonb,
  approval_status text default 'pending',
  created_by_ai boolean default true,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

alter table ai_generated_suggestions
  add constraint ai_generated_suggestions_type_check
  check (suggestion_type in ('narration', 'npc_dialogue', 'session_summary'));

alter table ai_generated_suggestions
  add constraint ai_generated_suggestions_approval_status_check
  check (approval_status in ('pending', 'approved', 'rejected'));

create index ai_context_snapshots_campaign_id_idx on ai_context_snapshots (campaign_id);
create index ai_context_snapshots_session_id_idx on ai_context_snapshots (session_id);
create index ai_messages_campaign_id_idx on ai_messages (campaign_id);
create index ai_messages_session_id_idx on ai_messages (session_id);
create index ai_messages_user_id_idx on ai_messages (user_id);
create index ai_generated_suggestions_campaign_id_idx on ai_generated_suggestions (campaign_id);
create index ai_generated_suggestions_status_idx on ai_generated_suggestions (campaign_id, approval_status);

-- Seed das tarefas mínimas de IA (Groq).

insert into ai_tasks (key, name, description, mode, provider, model) values
  ('narrator', 'Narrador de Cena', 'Descreve o que acontece na cena com base no contexto autorizado.', 'narrator', 'groq', 'llama-3.3-70b-versatile'),
  ('npc_dialogue', 'Diálogo de NPC', 'Interpreta um NPC presente na cena, sem revelar segredos.', 'npc_dialogue', 'groq', 'llama-3.3-70b-versatile'),
  ('rules_helper', 'Auxiliar de Regras', 'Explica regras e sugere testes/CDs para a mesa.', 'rules_helper', 'groq', 'llama-3.3-70b-versatile'),
  ('session_summary', 'Resumo de Sessão', 'Gera um rascunho de crônica a partir do log da sessão.', 'session_summary', 'groq', 'llama-3.3-70b-versatile')
on conflict (key) do nothing;

-- RLS

alter table ai_tasks enable row level security;
alter table ai_context_snapshots enable row level security;
alter table ai_messages enable row level security;
alter table ai_generated_suggestions enable row level security;

-- ai_tasks: apenas leitura, para qualquer usuário autenticado (define o que está disponível na UI).

create policy "Authenticated users can read ai tasks"
on ai_tasks for select
to authenticated
using (true);

-- ai_context_snapshots: contexto bruto enviado à IA. Apenas mestres da campanha
-- podem auditar. Jogadores nunca leem snapshots brutos (sem policy de select).

create policy "Masters can read campaign ai context snapshots"
on ai_context_snapshots for select
using (campaign_id is not null and is_campaign_master(campaign_id));

-- ai_messages: mestres leem todo o histórico da campanha. Jogadores só
-- enxergam as próprias chamadas (o que o sistema retornou para eles).

create policy "Masters can read campaign ai messages"
on ai_messages for select
using (campaign_id is not null and is_campaign_master(campaign_id));

create policy "Players can read own ai messages"
on ai_messages for select
using (user_id = auth.uid());

-- ai_generated_suggestions: apenas o mestre lê e aprova/rejeita sugestões da IA.

create policy "Masters can read campaign ai suggestions"
on ai_generated_suggestions for select
using (campaign_id is not null and is_campaign_master(campaign_id));

create policy "Masters can update campaign ai suggestions"
on ai_generated_suggestions for update
using (campaign_id is not null and is_campaign_master(campaign_id))
with check (campaign_id is not null and is_campaign_master(campaign_id));

-- Inserts em ai_context_snapshots, ai_messages e ai_generated_suggestions são
-- feitos exclusivamente pelo backend (service role) via buildAIContext e
-- pelos endpoints /api/ai/*, que já validam membership e papel do usuário.
