# CRONOFÁBULA — OPEN SOURCE GUIDE

## 1. Resumo Executivo

Este documento define as regras para transformar o **Cronofábula** em um projeto **open source** seguro, organizado e atrativo para contribuidores.

A decisão oficial é:

> O Cronofábula será um projeto open source, mas nenhuma chave, token, credencial, dado sensível, segredo de campanha ou configuração privada pode entrar no repositório.

O repositório público deve conter:

- código-fonte;
- documentação;
- migrations;
- exemplos seguros;
- templates de configuração;
- instruções de instalação;
- guia de contribuição;
- regras de segurança.

O repositório não deve conter:

- `.env`;
- chaves reais;
- tokens;
- service role;
- dados reais de campanha;
- dados pessoais;
- segredos de integrações;
- dumps de banco com dados privados;
- assets proprietários sem licença clara.

---

# 2. Objetivo do Open Source

O Cronofábula será aberto para:

- permitir colaboração pública;
- facilitar auditoria técnica;
- atrair desenvolvedores interessados em RPG + IA;
- tornar a plataforma extensível;
- documentar a arquitetura com transparência;
- permitir instalação própria por comunidades;
- criar reputação técnica para o projeto.

O open source não significa abrir dados de usuários, campanhas reais ou ambientes de produção.

---

# 3. Stack Oficial

```txt
Frontend: Next.js
Backend: Next.js Route Handlers / Server Actions
Banco: Supabase Postgres
Auth: Supabase Auth
Realtime: Supabase Realtime
Storage: Cloudflare R2
IA inicial: Groq
IA opcional: OpenAI
Deploy recomendado: Vercel
Estilo: Tailwind CSS
Repositório: GitHub
```

---

# 4. Estrutura Recomendada do Repositório

```txt
cronofabula/
  README.md
  LICENSE
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  SECURITY.md
  .env.example
  .gitignore
  package.json
  next.config.ts
  tailwind.config.ts

  src/
    app/
    components/
    lib/
    styles/
    hooks/
    types/

  supabase/
    migrations/
    seed/
    README.md

  docs/
    CRONOFABULA_PROJECT_BRIEF.md
    CRONOFABULA_PROGRAM_GUIDE.md
    CRONOFABULA_MVP_ROADMAP.md
    CRONOFABULA_DATABASE_SCHEMA.md
    CRONOFABULA_SQL_MIGRATIONS_PLAN.md
    CRONOFABULA_PERMISSION_SYSTEM.md
    CRONOFABULA_AI_CONTEXT_AND_PROMPTS.md
    CRONOFABULA_THEME_SYSTEM.md
    CRONOFABULA_DESIGN_TOKENS.md
    CRONOFABULA_VISUAL_DIRECTION.md
    CRONOFABULA_OPEN_SOURCE_GUIDE.md
```

---

# 5. Arquivos Obrigatórios

## 5.1 README.md

O README deve explicar:

- o que é o Cronofábula;
- problema que resolve;
- stack;
- como rodar localmente;
- como configurar Supabase;
- como configurar R2;
- como configurar IA;
- como rodar migrations;
- scripts disponíveis;
- status do MVP;
- links para documentação.

Estrutura sugerida:

```md
# Cronofábula

## O que é

## Funcionalidades

## Stack

## Instalação local

## Variáveis de ambiente

## Banco de dados

## Rodando migrations

## Desenvolvimento

## Segurança

## Como contribuir

## Licença
```

---

## 5.2 LICENSE

Definir uma licença antes de publicar.

Opções recomendadas:

### MIT

Mais permissiva.

Permite:

- uso comercial;
- modificação;
- distribuição;
- uso privado.

Boa se o objetivo for máxima adoção.

### Apache 2.0

Também permissiva, mas com proteção melhor relacionada a patentes.

Boa se o projeto puder crescer com empresas usando.

### AGPLv3

Mais protetiva.

Exige que modificações em serviços web também sejam abertas.

Boa se a intenção for impedir que alguém feche uma versão SaaS derivada sem devolver melhorias.

## Decisão recomendada

Para o Cronofábula, existem duas opções fortes:

```txt
MIT: se o objetivo for adoção ampla e colaboração simples.
AGPLv3: se o objetivo for proteger o projeto contra exploração comercial fechada.
```

A decisão precisa ser explícita antes do primeiro release público.

---

## 5.3 CONTRIBUTING.md

Deve explicar:

- como abrir issue;
- como abrir pull request;
- padrão de branch;
- padrão de commit;
- como rodar build;
- como rodar lint;
- como criar migrations;
- como atualizar documentação;
- regra de não expor secrets.

Estrutura sugerida:

```md
# Contribuindo com o Cronofábula

## Antes de começar

## Ambiente local

## Branches

## Commits

## Pull Requests

## Banco e migrations

## Segurança

## Checklist antes de enviar
```

---

## 5.4 SECURITY.md

Deve explicar:

- como reportar vulnerabilidade;
- o que é considerado falha crítica;
- como lidar com secrets vazados;
- política de disclosure;
- contato de segurança.

Conteúdo mínimo:

```md
# Security Policy

## Supported Versions

## Reporting a Vulnerability

## Critical Issues

## Secrets and Credentials

## Responsible Disclosure
```

---

## 5.5 CODE_OF_CONDUCT.md

Recomendado para projeto público.

Pode usar o Contributor Covenant como base.

---

## 5.6 .env.example

Nunca subir `.env` real.

Exemplo oficial:

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

Regra crítica:

```txt
SUPABASE_SERVICE_ROLE_KEY nunca pode aparecer em componente client.
GROQ_API_KEY nunca pode aparecer no frontend.
R2_SECRET_ACCESS_KEY nunca pode aparecer no frontend.
```

---

# 6. .gitignore Obrigatório

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

# vercel
.vercel

# logs
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# system
.DS_Store
Thumbs.db

# local db / temp
*.sqlite
*.db
tmp
temp

# coverage
coverage

# editor
.vscode/*
!.vscode/extensions.json
.idea
```

---

# 7. Regras de Segurança para Open Source

## 7.1 Nunca publicar

```txt
tokens
API keys
service role
credenciais OAuth
dados reais
dumps de banco
logs com dados privados
prompts com segredos de clientes
URLs privadas de storage
cookies
JWTs
```

## 7.2 Nunca deixar no frontend

```txt
SUPABASE_SERVICE_ROLE_KEY
R2_SECRET_ACCESS_KEY
GROQ_API_KEY
OPENAI_API_KEY
qualquer token privado
```

## 7.3 Validar antes do commit

Executar busca por:

```txt
sk-
SUPABASE_SERVICE_ROLE
eyJ
api_key
secret
password
token
BEGIN PRIVATE KEY
```

## 7.4 Usar secret scanning

Ativar no GitHub:

```txt
Secret scanning
Push protection
Dependabot alerts
Code scanning, se possível
```

---

# 8. Separação entre Código Aberto e Serviços Privados

O repositório pode ser open source, mas cada instalação deve usar suas próprias chaves.

## 8.1 Supabase

Cada pessoa/projeto deve criar:

- projeto Supabase próprio;
- URL própria;
- anon key própria;
- service role própria;
- migrations próprias aplicadas.

## 8.2 Cloudflare R2

Cada instalação deve configurar:

- bucket próprio;
- access key própria;
- secret própria;
- domínio público próprio, se quiser.

## 8.3 IA

Cada instalação deve configurar:

- Groq API key própria;
- OpenAI API key opcional;
- modelos permitidos.

---

# 9. Dados Demo no Open Source

O projeto pode ter dados demo, desde que sejam isolados.

Permitido:

```txt
arquivos JSON de exemplo
seed local opcional
modo demo sem banco real
templates somente leitura
Storybook ou fixtures
```

Proibido:

```txt
inserir mock automaticamente em tabelas reais
misturar campanha demo com usuário real
criar dados fictícios em produção
usar localStorage como permissão real
```

## Regra oficial

```txt
Demo é para explorar interface.
Produção usa Supabase, RLS e dados reais.
```

---

# 10. Branches Recomendadas

Modelo simples:

```txt
main
develop
feature/*
fix/*
docs/*
```

Modelo inicial recomendado:

```txt
main
feature/firebase-to-supabase
```

## Regras

```txt
main sempre estável.
feature/* para novas funcionalidades.
fix/* para correções.
docs/* para documentação.
```

---

# 11. Padrão de Commits

Usar Conventional Commits:

```txt
feat: add live map travel encounters
fix: prevent journal access without item possession
docs: add open source guide
chore: configure supabase env example
refactor: separate firebase prototype from production auth
security: prevent service role usage on client
```

Tipos aceitos:

```txt
feat
fix
docs
chore
refactor
test
security
style
perf
```

---

# 12. Pull Request Checklist

Todo PR deve responder:

```txt
[ ] Build passa
[ ] Lint passa
[ ] Não expõe secrets
[ ] Não adiciona mock em tabela real
[ ] Não quebra RLS
[ ] Não coloca regra crítica só no frontend
[ ] Não envia contexto indevido para IA
[ ] Atualiza documentação se necessário
[ ] Inclui migration, se alterou banco
[ ] Descreve como testar
```

---

# 13. Issues Recomendadas

Criar templates para:

```txt
Bug report
Feature request
Security report
Documentation improvement
UI/UX feedback
Database migration proposal
```

## Bug report deve pedir

```txt
Ambiente
Passos para reproduzir
Resultado esperado
Resultado atual
Screenshots
Logs sem secrets
```

## Feature request deve pedir

```txt
Problema
Solução desejada
Impacto nos módulos
Riscos
Alternativas
```

---

# 14. Open Source e IA

Como o projeto usa IA, o repositório deve deixar claro:

- provedores são configuráveis;
- prompts oficiais ficam versionados;
- chamadas sensíveis passam por `buildAIContext`;
- IA não recebe segredos indevidos;
- cada instalação usa sua própria API key;
- logs de IA não devem conter dados sensíveis em produção pública.

## Regra

```txt
A IA é substituível. A arquitetura de permissão não é.
```

---

# 15. Open Source e Supabase

RLS é obrigatório.

Qualquer PR que crie tabela sensível deve incluir:

```txt
migration
RLS enabled
policies
índices necessários
validação server-side quando aplicável
documentação
```

---

# 16. Open Source e Cloudflare R2

Arquivos não devem ir para Postgres.

O repositório deve implementar:

```txt
upload server-side
metadados no Supabase
chaves R2 no servidor
validação de MIME
limite de tamanho
visibilidade por campanha
```

---

# 17. Primeira Publicação no GitHub

Antes de publicar:

```txt
[ ] Remover Firebase funcional ou marcar como protótipo legado
[ ] Confirmar que .env não existe no commit
[ ] Criar .env.example
[ ] Criar README.md
[ ] Criar LICENSE
[ ] Criar CONTRIBUTING.md
[ ] Criar SECURITY.md
[ ] Criar docs oficiais
[ ] Rodar npm install
[ ] Rodar npm run lint
[ ] Rodar npm run build
[ ] Fazer busca por tokens
[ ] Fazer commit inicial limpo
```

---

# 18. README — Texto Base

```md
# Cronofábula

Cronofábula é uma plataforma open source de RPG com IA para campanhas persistentes.

A proposta é manter campanhas vivas mesmo quando o grupo não consegue se reunir com frequência. O sistema organiza personagens, sessões, cenas, mapas, NPCs, inventário, diário, rolagens, combate, crônicas e memória da campanha.

A IA não substitui o mestre. Ela auxilia com narração, diálogos, resumos e sugestões, sempre respeitando permissões e contexto filtrado.

## Stack

- Next.js
- Supabase
- Cloudflare R2
- Tailwind CSS
- Groq/OpenAI
- Vercel

## Regra central

O sistema controla o estado do mundo.
A IA interpreta o mundo.
O mestre aprova o que vira canônico.
O jogador só acessa o que o personagem pode acessar.
```

---

# 19. Decisão Oficial

```txt
O Cronofábula será preparado como projeto open source.

A base pública deve ser segura, documentada e sem secrets.

O Firebase Studio será tratado como protótipo visual, não como arquitetura final.

A arquitetura oficial será Next.js + Supabase + Cloudflare R2 + Vercel + Groq/OpenAI.

O repositório deve permitir contribuição externa sem comprometer segurança, permissões ou dados reais.
```
