# Cronofábula

Plataforma open source de RPG com IA para campanhas persistentes.

> O sistema controla o estado do mundo. A IA interpreta o mundo. O mestre aprova o que vira canônico. O jogador só acessa o que o personagem pode acessar.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 + React 19 + Tailwind |
| Auth + Banco | Supabase (Auth + Postgres + Realtime) |
| Storage | Cloudflare R2 |
| IA | Groq / OpenAI |
| Deploy | Vercel |

> **Status atual:** migração de protótipo Firebase → Supabase + R2 em andamento.

## Como rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/cronofabularpg-svg/CronoF-bula.git
cd CronoF-bula

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves Supabase e Groq

# 4. Inicie o servidor de desenvolvimento
npm run dev
# Abre em http://localhost:9002
```

## Variáveis de ambiente obrigatórias

Veja `.env.example` para a lista completa. As mínimas para rodar:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GROQ_API_KEY=
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 9002) |
| `npm run build` | Build de produção |
| `npm run lint` | Lint |
| `npm run typecheck` | Verificação de tipos TypeScript |

## Estrutura do projeto

```
src/
  app/               # Páginas (Next.js App Router)
  components/ui/     # Componentes shadcn/ui
  lib/               # Supabase, IA, R2, utilitários
  hooks/             # Hooks React
docs/
  cronofabula/       # Documentação técnica completa
supabase/
  migrations/        # Migrations SQL (a criar)
```

## Documentação técnica

Toda a documentação do produto está em `docs/cronofabula/`:

- `CRONOFABULA_PROGRAM_GUIDE.md` — visão geral e regras do sistema
- `CRONOFABULA_MVP_ROADMAP.md` — roadmap do MVP
- `CRONOFABULA_DATABASE_SCHEMA.md` — schema do banco
- `CRONOFABULA_SQL_MIGRATIONS_PLAN.md` — plano de migrations
- `CRONOFABULA_PERMISSION_SYSTEM.md` — sistema de permissões
- `CRONOFABULA_AI_CONTEXT_AND_PROMPTS.md` — contexto e prompts da IA
- `CRONOFABULA_FIREBASE_TO_SUPABASE_R2_GITHUB.md` — guia de migração

## Regras de segurança

- `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o frontend
- `GROQ_API_KEY` nunca vai para o frontend
- `R2_SECRET_ACCESS_KEY` nunca vai para o frontend
- RLS ativo em todas as tabelas sensíveis
- Permissões críticas validadas no servidor
- A IA nunca recebe contexto sem filtro de visibilidade

## Como contribuir

Leia `docs/cronofabula/CRONOFABULA_OPEN_SOURCE_GUIDE.md`.

## Licença

MIT
