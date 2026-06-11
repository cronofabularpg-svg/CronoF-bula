# Configuração de Variáveis de Ambiente — Vercel

Este documento descreve como configurar as variáveis de ambiente do
Cronofábula no projeto Vercel, com base em `.env.example`.

> Nunca cole valores reais neste repositório. Todas as chaves abaixo devem
> ser cadastradas em **Vercel → Project → Settings → Environment Variables**.

## 1. Variáveis obrigatórias

| Variável | Visibilidade | Onde é usada |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública (client + server) | `src/lib/env.ts`, todos os clients Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública (client + server) | `src/lib/env.ts`, clients Supabase (browser/server/middleware) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secreta — apenas server** | `src/lib/server/env.ts` → `src/lib/supabase/admin.ts` |
| `GROQ_API_KEY` | **Secreta — apenas server** | `src/lib/server/env.ts` → `src/lib/ai/groq.ts`, rotas `/api/ai/*` |
| `NEXT_PUBLIC_SITE_URL` | Pública (client + server) | `src/lib/env.ts` (URL pública do deploy) |

## 2. Variáveis opcionais (Cloudflare R2 — futura integração de mídia)

R2 ainda **não está implementado**. Estas variáveis podem ficar em branco
sem quebrar o build ou o app — `isR2Configured()` em
`src/lib/server/env.ts` retorna `false` enquanto não forem preenchidas.

| Variável | Visibilidade | Observação |
|---|---|---|
| `CLOUDFLARE_R2_ACCOUNT_ID` | Secreta — apenas server | Account ID da Cloudflare |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Secreta — apenas server | Token de API R2 |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Secreta — apenas server | Token de API R2 |
| `CLOUDFLARE_R2_BUCKET` | Secreta — apenas server | Nome do bucket |
| `CLOUDFLARE_R2_PUBLIC_URL` | Pública (quando configurada) | Domínio público/CDN do bucket |

## 3. Onde pegar cada valor

- **Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`):
  Supabase Dashboard → seu projeto → **Project Settings → API**.
  - "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
  - "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - "service_role" key → `SUPABASE_SERVICE_ROLE_KEY` (botão "Reveal")

- **Groq** (`GROQ_API_KEY`):
  [console.groq.com/keys](https://console.groq.com/keys) → "Create API Key".

- **Site URL** (`NEXT_PUBLIC_SITE_URL`):
  - Produção: domínio final do projeto na Vercel (ex.: `https://cronofabula.vercel.app`
    ou domínio customizado).
  - Preview: pode usar a URL de preview gerada automaticamente pela Vercel
    (`https://$VERCEL_URL`) ou deixar o domínio de produção — não é uma
    chave secreta, então não há risco em compartilhar entre ambientes.

- **Cloudflare R2** (`CLOUDFLARE_R2_*`):
  Cloudflare Dashboard → **R2 → Manage R2 API Tokens** para as chaves de
  acesso; **R2 → seu bucket → Settings** para nome do bucket e domínio
  público/custom domain.

## 4. O que marcar em Production vs Preview

| Variável | Production | Preview | Development |
|---|:---:|:---:|:---:|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅* | opcional |
| `GROQ_API_KEY` | ✅ | ✅* | opcional |
| `NEXT_PUBLIC_SITE_URL` | ✅ (domínio de produção) | ✅ (pode repetir o de produção) | `http://localhost:9002` |
| `CLOUDFLARE_R2_*` | quando implementado | quando implementado | opcional |

\* Se Preview deployments usarem o **mesmo projeto Supabase** de produção,
considere usar um projeto Supabase separado (staging) para Preview, para
não misturar dados de teste com dados reais de campanha. Se isso não for
viável agora, ao menos esteja ciente de que qualquer Preview deploy terá
acesso de service role ao banco de produção.

## 5. O que nunca pode ser público

Nunca adicione o prefixo `NEXT_PUBLIC_` a estas variáveis, e nunca as
referencie em arquivos `"use client"`:

- `SUPABASE_SERVICE_ROLE_KEY` — ignora RLS, acesso administrativo total ao banco.
- `GROQ_API_KEY` — chave de billing da Groq.
- `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET` — credenciais de acesso ao storage.

`CLOUDFLARE_R2_PUBLIC_URL` é a única variável R2 que pode eventualmente ser
pública (é apenas um domínio de CDN), mas por padrão também fica server-side
até a integração R2 existir.

## 6. Passo a passo de redeploy

1. Acesse o projeto na Vercel → **Settings → Environment Variables**.
2. Adicione/atualize as variáveis da seção 1 (e da seção 2, se aplicável),
   marcando os ambientes (Production/Preview/Development) conforme a tabela
   acima.
3. Vá em **Deployments**, abra o deployment mais recente da branch `main`.
4. Clique no menu (⋯) → **Redeploy**.
   - Não é necessário "Redeploy with existing Build Cache" desmarcado, a
     menos que esteja depurando um problema de cache — variáveis de
     ambiente são lidas em runtime/build novo de qualquer forma.
5. Aguarde o build finalizar e abra a URL do deployment.

## 7. Checklist de teste pós-deploy

- [ ] A página inicial e `/login` carregam sem erro de console relacionado
      a Supabase (`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` corretos).
- [ ] Login funciona e `/dashboard` carrega campanhas do usuário (RLS +
      anon key OK).
- [ ] Em uma campanha com `ai_enabled = true`, Mesa Viva consegue chamar
      `/api/ai/narrator` sem erro 502 (`GROQ_API_KEY` válida no servidor).
- [ ] Resposta da IA aparece como sugestão "não registrada" (jogador) ou,
      como mestre com publish, vira `scene_message` com
      `metadata.source = 'groq'`.
- [ ] Portal do Mestre → "Resumo com IA" cria uma crônica `status: draft`
      (confirma `SUPABASE_SERVICE_ROLE_KEY` + `GROQ_API_KEY` no servidor).
- [ ] No DevTools → Network/Sources, nenhuma resposta ou bundle JS contém
      `SUPABASE_SERVICE_ROLE_KEY` ou `GROQ_API_KEY` em texto plano.
- [ ] Usuário sem papel de mestre não consegue ler `ai_context_snapshots`
      nem ver crônicas com `status = 'draft'`.
