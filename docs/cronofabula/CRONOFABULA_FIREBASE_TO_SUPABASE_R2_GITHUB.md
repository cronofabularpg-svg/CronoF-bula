# CRONOFÁBULA — FIREBASE LAYOUT TO SUPABASE + CLOUDFLARE MIGRATION PROMPT

## 1. Resumo Executivo

Este documento orienta a IA/desenvolvedor a pegar a base visual/layout já gerada no Firebase e transformar o projeto em uma aplicação oficial do **Cronofábula** usando:

```txt
Frontend: Next.js
Backend: Next.js Route Handlers / Server Actions
Banco/Auth: Supabase
Storage: Cloudflare R2
Deploy: Vercel
IA: Groq inicialmente
Repositório: GitHub
```

A regra central é:

> Aproveitar ao máximo o layout gerado no Firebase, mas substituir toda dependência funcional de Firebase por Supabase, Cloudflare R2 e arquitetura oficial do Cronofábula.

Este documento deve ser lido junto com:

```txt
CRONOFABULA_PROGRAM_GUIDE.md
CRONOFABULA_MVP_ROADMAP.md
CRONOFABULA_DATABASE_SCHEMA.md
CRONOFABULA_SQL_MIGRATIONS_PLAN.md
CRONOFABULA_PERMISSION_SYSTEM.md
CRONOFABULA_AI_CONTEXT_AND_PROMPTS.md
CRONOFABULA_THEME_SYSTEM.md
CRONOFABULA_DESIGN_TOKENS.md
CRONOFABULA_LANDING_PAGE_AND_ONBOARDING.md
```

---

# 2. Missão da IA

Você é a IA responsável por converter a base criada no Firebase para a arquitetura oficial do Cronofábula.

Sua missão é:

1. preservar o máximo possível do layout, componentes e experiência visual;
2. remover dependências funcionais do Firebase;
3. migrar autenticação, banco e permissões para Supabase;
4. migrar uploads e arquivos para Cloudflare R2;
5. organizar o projeto para GitHub;
6. garantir que nada use dados mock em módulos reais;
7. preparar o projeto para deploy futuro na Vercel.

---

# 3. Regras Obrigatórias

## 3.1 Nunca fazer

```txt
Não manter Firebase Auth como autenticação principal.
Não usar Firestore como banco oficial.
Não usar Firebase Storage como storage oficial.
Não criar dados mock em tabelas reais.
Não substituir funcionalidades reais por demonstrações.
Não expor tokens no frontend.
Não usar service role no frontend.
Não ignorar RLS do Supabase.
Não criar banco inteiro sem migrations organizadas.
Não colocar regras críticas apenas no frontend.
Não enviar campanha inteira para IA.
Não permitir IA revelar segredos.
Não quebrar o layout já aprovado sem motivo.
Não recomeçar o projeto do zero se a base visual puder ser aproveitada.
```

## 3.2 Sempre fazer

```txt
Preservar componentes visuais úteis.
Preservar páginas já bem estruturadas.
Substituir Firebase por Supabase/R2 camada por camada.
Criar .env.example sem chaves reais.
Usar migrations SQL.
Ativar RLS nas tabelas sensíveis.
Validar permissões no servidor.
Separar layout de lógica de dados.
Criar commits claros.
Atualizar documentação.
Rodar lint/build quando possível.
```

---

# 4. Estratégia Geral de Migração

A migração deve seguir esta ordem:

```txt
1. Auditoria da base Firebase
2. Backup lógico do estado atual
3. Limpeza de dependências não usadas
4. Criação da estrutura oficial do projeto
5. Configuração de variáveis de ambiente
6. Substituição de Auth Firebase por Supabase Auth
7. Substituição de Firestore por Supabase Postgres
8. Substituição de Firebase Storage por Cloudflare R2
9. Ajuste de permissões/RLS
10. Integração mínima com IA Groq
11. Testes
12. Commit e push para GitHub
```

---

# 5. Auditoria Inicial Obrigatória

Antes de alterar qualquer arquivo, mapear:

## 5.1 Estrutura atual

Listar:

```txt
framework usado
pasta de páginas
pasta de componentes
pasta de estilos
pasta de hooks
pasta de libs
dependências Firebase
dependências de UI
rotas existentes
componentes úteis
componentes duplicados
dados mock existentes
```

## 5.2 Procurar Firebase

Buscar no projeto por:

```txt
firebase
Firestore
getFirestore
collection(
doc(
getDocs
addDoc
setDoc
updateDoc
deleteDoc
getAuth
signInWithEmailAndPassword
createUserWithEmailAndPassword
onAuthStateChanged
getStorage
uploadBytes
getDownloadURL
```

## 5.3 Procurar dados mock

Buscar por:

```txt
mock
demo
fake
sample
example
hardcoded
placeholder
seed
testData
dummy
```

Regra:

```txt
Dados mock podem existir apenas em tour estático, templates ou Storybook.
Nunca inserir mock em tabela real do Supabase.
```

---

# 6. Arquitetura Oficial Desejada

## 6.1 Estrutura de pastas recomendada

```txt
/app
  /login
  /signup
  /forgot-password
  /onboarding
  /dashboard
  /campaigns
  /characters
  /settings

/app/campaigns/[id]
  /overview
  /mesa-viva
  /mapa-vivo
  /characters
  /npcs
  /locations
  /inventory
  /journal
  /media
  /chronicles
  /dice
  /ai-master
  /approvals
  /settings

/components
  /ui
  /layout
  /landing
  /auth
  /onboarding
  /campaign
  /session
  /scene
  /map
  /combat
  /character
  /npc
  /inventory
  /journal
  /ai
  /dice
  /media
  /theme

/lib
  /supabase
  /permissions
  /ai
  /r2
  /dice
  /rules
  /map
  /combat
  /campaign
  /journal
  /inventory
  /chronicles
  /onboarding

/styles
  tokens.css
  /themes

/supabase
  /migrations

/docs
  CRONOFABULA_*.md
```

## 6.2 Regra de preservação do layout

Componentes visuais vindos do Firebase podem ser mantidos se:

```txt
não dependem diretamente de Firebase;
não têm dados hardcoded como fonte real;
podem receber props;
respeitam tokens visuais;
funcionam em mobile;
não quebram permissões.
```

Se um componente mistura UI com Firestore/Auth, separar:

```txt
Componente visual → preservar
Hook/serviço Firebase → substituir
```

---

# 7. Variáveis de Ambiente

Criar `.env.example`:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=

# IA
GROQ_API_KEY=
OPENAI_API_KEY=

# Segurança
APP_ENCRYPTION_KEY=
```

## Regra crítica

```txt
SUPABASE_SERVICE_ROLE_KEY nunca pode ser usada no frontend.
GROQ_API_KEY nunca pode ser exposta no frontend.
R2_SECRET_ACCESS_KEY nunca pode ser exposta no frontend.
```

---

# 8. Supabase — Configuração

## 8.1 Cliente browser

Criar:

```txt
/lib/supabase/client.ts
```

Função:

```txt
Cliente público com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
Usado apenas para ações permitidas pelo usuário autenticado.
```

## 8.2 Cliente server

Criar:

```txt
/lib/supabase/server.ts
```

Função:

```txt
Cliente usado em Server Components, Route Handlers e Server Actions.
Deve respeitar cookies/sessão do usuário.
```

## 8.3 Cliente admin

Criar:

```txt
/lib/supabase/admin.ts
```

Função:

```txt
Cliente com service role apenas no servidor.
Nunca importar em componentes client.
Usar somente quando realmente necessário.
```

Adicionar comentário no arquivo:

```txt
ATENÇÃO: este arquivo não pode ser importado por componentes client.
```

---

# 9. Substituição de Firebase Auth

## 9.1 Remover fluxo Firebase

Substituir:

```txt
getAuth()
onAuthStateChanged()
signInWithEmailAndPassword()
createUserWithEmailAndPassword()
signOut()
```

Por Supabase Auth:

```txt
supabase.auth.signInWithPassword()
supabase.auth.signUp()
supabase.auth.signOut()
supabase.auth.getUser()
supabase.auth.getSession()
```

## 9.2 Rotas/telas obrigatórias

```txt
/login
/signup
/forgot-password
/dashboard
```

## 9.3 Profile obrigatório

Após cadastro, garantir criação de `profiles`.

Tabela:

```sql
profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  favorite_race text,
  favorite_class text,
  default_theme_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

## 9.4 Middleware

Criar middleware para proteger rotas:

```txt
/dashboard
/campaigns
/characters
/settings
```

Usuário sem sessão deve ir para:

```txt
/login
```

---

# 10. Substituição de Firestore por Supabase Postgres

## 10.1 Não fazer tradução direta coleção → tabela sem revisar

Firestore permite estruturas flexíveis. Supabase exige modelagem relacional.

Antes de migrar qualquer dado, mapear:

```txt
coleção Firebase
documentos
campos
subcoleções
equivalente no schema Cronofábula
tabela destino
relacionamentos
permissões
```

## 10.2 Tabelas iniciais do MVP

Começar pelas fases:

```txt
profiles
player_preferences
campaigns
campaign_members
campaign_settings
characters
character_stats
sessions
scenes
scene_participants
scene_messages
dice_rolls
npcs
ai_tasks
ai_messages
ai_context_snapshots
maps
map_nodes
map_edges
character_positions
items
character_items
journals
journal_entries
chronicles
approval_requests
```

## 10.3 Regras obrigatórias

```txt
Toda tabela de campanha deve ter campaign_id.
Toda tabela sensível deve ter RLS.
Toda API deve validar membership.
Toda ação crítica deve validar papel.
```

---

# 11. Migrations SQL

Criar pasta:

```txt
/supabase/migrations
```

Seguir ordem:

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

## 11.1 Helpers mínimos

Criar:

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

Criar funções:

```sql
is_campaign_member(campaign uuid)
is_campaign_master(campaign uuid)
is_campaign_owner(campaign uuid)
owns_character(character uuid)
```

---

# 12. RLS e Permissões

## 12.1 Políticas base

Campanhas:

```sql
create policy "Members can read campaigns"
on campaigns for select
using (is_campaign_member(id));

create policy "Owners can update campaigns"
on campaigns for update
using (is_campaign_owner(id));
```

Membros:

```sql
create policy "Members can read campaign members"
on campaign_members for select
using (is_campaign_member(campaign_id));

create policy "Masters can manage campaign members"
on campaign_members for all
using (is_campaign_master(campaign_id));
```

## 12.2 Regras críticas server-side

Validar no servidor:

```txt
abrir cena
enviar mensagem
mover personagem
acessar diário
anotar mapa
chamar IA
revelar local secreto
iniciar combate
aplicar dano
aprovar item
aprovar crônica
compartilhar conhecimento
```

---

# 13. Cloudflare R2 — Substituir Firebase Storage

## 13.1 Remover

Substituir:

```txt
getStorage()
ref()
uploadBytes()
getDownloadURL()
deleteObject()
```

## 13.2 Criar lib R2

Arquivo:

```txt
/lib/r2/client.ts
```

Responsabilidades:

```txt
gerar chave segura de arquivo
upload server-side
delete server-side
gerar public_url quando permitido
validar tipo e tamanho
```

## 13.3 Tabelas de mídia

Usar:

```txt
media_assets
media_links
```

`media_assets` deve guardar:

```txt
id
campaign_id
uploaded_by
name
media_type
r2_key
public_url
mime_type
size_bytes
description
visibility
created_at
```

## 13.4 Regra de segurança

Upload deve passar por Route Handler ou Server Action.

Nunca enviar chaves R2 para o cliente.

---

# 14. IA Groq

## 14.1 Criar lib

```txt
/lib/ai/groq.ts
/lib/ai/build-ai-context.ts
/lib/ai/prompts.ts
```

## 14.2 Modos MVP

```txt
narrator
npc_dialogue
rules_helper
session_summary
```

## 14.3 Regra obrigatória

Toda chamada IA deve passar por:

```ts
buildAIContext({
  campaignId,
  sessionId,
  sceneId,
  activeCharacterId,
  mode
})
```

A função deve:

```txt
validar usuário
validar campanha
validar cena
validar personagem
buscar presentes
buscar NPCs presentes
buscar conhecimento permitido
remover segredos indevidos
montar contexto mínimo
salvar snapshot
```

## 14.4 Nunca enviar

```txt
campanha inteira
todos os NPCs
todos os locais
todos os segredos
todos os diários
todas as sessões
tokens
chaves de API
```

---

# 15. GitHub — Preparação do Repositório

## 15.1 Antes do primeiro commit

Verificar:

```txt
.env está no .gitignore
.env.local está no .gitignore
node_modules está no .gitignore
.next está no .gitignore
dist está no .gitignore
tokens reais não aparecem no código
```

## 15.2 .gitignore recomendado

```gitignore
# dependencies
node_modules

# next
.next
out
dist

# env
.env
.env.local
.env.*.local

# logs
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# system
.DS_Store

# misc
.vercel
```

## 15.3 README inicial

Criar `README.md` com:

```txt
nome do projeto
stack
como rodar local
variáveis de ambiente
scripts
estrutura
regras de segurança
ordem do MVP
```

## 15.4 Commits recomendados

```txt
chore: initialize cronofabula project
docs: add cronofabula technical documentation
feat: configure supabase clients
feat: replace firebase auth with supabase auth
feat: add campaign core schema
feat: migrate layout to cronofabula design tokens
feat: configure cloudflare r2 media layer
```

---

# 16. Prompt Mestre para a IA de Código

Use este prompt no Cursor/Claude/Codex:

```txt
Você é a IA técnica responsável por converter uma base visual criada no Firebase para a arquitetura oficial do Cronofábula.

Antes de alterar qualquer arquivo, leia obrigatoriamente:

- CRONOFABULA_PROGRAM_GUIDE.md
- CRONOFABULA_MVP_ROADMAP.md
- CRONOFABULA_DATABASE_SCHEMA.md
- CRONOFABULA_SQL_MIGRATIONS_PLAN.md
- CRONOFABULA_PERMISSION_SYSTEM.md
- CRONOFABULA_AI_CONTEXT_AND_PROMPTS.md
- CRONOFABULA_THEME_SYSTEM.md
- CRONOFABULA_DESIGN_TOKENS.md
- CRONOFABULA_LANDING_PAGE_AND_ONBOARDING.md

Missão:
Aproveitar ao máximo o layout criado no Firebase, mas substituir toda lógica funcional de Firebase por Supabase, Cloudflare R2 e arquitetura oficial do Cronofábula.

Regras obrigatórias:
- Não use Firebase Auth como autenticação final.
- Não use Firestore como banco oficial.
- Não use Firebase Storage como storage oficial.
- Não crie dados mock em tabelas reais.
- Não exponha tokens no frontend.
- Não use service role no frontend.
- Ative RLS em tabelas sensíveis.
- Valide permissões no servidor.
- Toda tabela de campanha deve ter campaign_id.
- A IA nunca pode receber contexto sem filtro.
- O mestre mantém autoridade final.
- Preserve o layout útil sempre que possível.

Primeira tarefa:
1. Audite o projeto atual.
2. Liste todos os pontos onde Firebase é usado.
3. Liste componentes visuais que podem ser preservados.
4. Liste dados mock encontrados.
5. Proponha plano de migração por etapas.
6. Só depois aplique mudanças mínimas.

Ordem de implementação:
1. Configurar .env.example e .gitignore.
2. Criar libs do Supabase.
3. Substituir Auth Firebase por Supabase Auth.
4. Criar migrations iniciais: profiles, campaigns, members.
5. Ajustar dashboard e onboarding para Supabase.
6. Criar camada R2 para mídia.
7. Remover dependências Firebase não usadas.
8. Rodar lint/build.
9. Atualizar README e documentação.
10. Criar commit claro.

Formato da resposta:
## Resumo Executivo
## Auditoria
## Impacto Técnico
## Riscos
## Plano de Ação
## Arquivos Alterados
## Validação
## Próximo Commit
```

---

# 17. Checklist de Validação Pós-Migração

## 17.1 Auth

```txt
[ ] Login Supabase funciona
[ ] Cadastro Supabase funciona
[ ] Logout funciona
[ ] Profile é criado
[ ] Rotas protegidas funcionam
[ ] Firebase Auth removido
```

## 17.2 Banco

```txt
[ ] Migrations existem
[ ] RLS ativado
[ ] campaign_id presente onde necessário
[ ] Usuário não vê campanha de outro
[ ] Mestre edita campanha
[ ] Jogador não edita campanha
```

## 17.3 Storage

```txt
[ ] Firebase Storage removido
[ ] R2 configurado server-side
[ ] Upload não expõe chaves
[ ] media_assets salva metadados
```

## 17.4 Layout

```txt
[ ] Layout Firebase útil foi preservado
[ ] Tokens visuais aplicados
[ ] Mobile não quebrou
[ ] Landing page continua boa
[ ] Dashboard usa dados reais ou empty states
```

## 17.5 GitHub

```txt
[ ] .env não foi commitado
[ ] .env.example existe
[ ] README existe
[ ] Docs estão no repositório
[ ] Commit claro criado
[ ] Push feito para branch correta
```

---

# 18. Ordem Recomendada de Branches

```txt
main
develop
feature/firebase-to-supabase
feature/auth-supabase
feature/r2-media
feature/campaign-core
feature/layout-polish
```

Para início simples, usar:

```txt
main
feature/firebase-to-supabase
```

Mergear somente após:

```txt
build passar
lint passar
login funcionar
sem tokens expostos
sem Firebase funcional restante
```

---

# 19. Plano de Commit Inicial

## Commit 1

```txt
chore: prepare cronofabula repository
```

Inclui:

```txt
.gitignore
.env.example
README inicial
docs
estrutura de pastas
```

## Commit 2

```txt
feat: configure supabase foundation
```

Inclui:

```txt
supabase client
supabase server
supabase admin server-only
migrations 0001-0004
```

## Commit 3

```txt
feat: replace firebase auth with supabase auth
```

Inclui:

```txt
login
signup
logout
protected routes
profile creation
```

## Commit 4

```txt
feat: migrate firebase layout to cronofabula shell
```

Inclui:

```txt
layout preservado
tokens visuais
dashboard
landing
onboarding shell
```

## Commit 5

```txt
feat: add cloudflare r2 media foundation
```

Inclui:

```txt
r2 client server-side
media_assets schema
upload route inicial
```

---

# 20. Decisão Oficial

```txt
A base gerada no Firebase será tratada como protótipo visual e estrutural.

O produto final do Cronofábula usará Supabase para Auth/Banco, Cloudflare R2 para arquivos, Next.js/Vercel para aplicação e Groq para IA inicial.

A migração deve preservar o layout útil, mas remover dependências funcionais de Firebase.

O projeto só deve subir para GitHub sem tokens, com .env.example, documentação, migrations e README.
```
