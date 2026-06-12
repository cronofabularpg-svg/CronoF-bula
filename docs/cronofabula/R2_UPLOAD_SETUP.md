# Configuração do Cloudflare R2 para upload de mídia

Este documento descreve a configuração necessária no bucket Cloudflare R2 para
que o fluxo de upload de imagens (avatares de personagem, tokens/imagens de
NPC, mapas de batalha, capas de campanha etc.) funcione em produção.

## Como o upload funciona

1. O frontend chama `POST /api/uploads/presign` (server-side, com as
   credenciais R2 — nunca expostas ao client) e recebe uma `uploadUrl`
   assinada (PUT) com expiração de 5 minutos.
2. O browser faz `PUT` **diretamente para o bucket R2** usando essa
   `uploadUrl` — esta etapa é uma requisição cross-origin do domínio da
   aplicação (`https://...vercel.app` ou `http://localhost:3000`) para
   `https://<account_id>.r2.cloudflarestorage.com`.
3. O frontend chama `POST /api/uploads/complete` para registrar o
   `media_asset` no Supabase.

A etapa 2 é a única que sai do domínio da aplicação e, por isso, **exige CORS
configurado no bucket R2**. Sem isso, o navegador bloqueia a resposta do PUT e
o `fetch` falha com `TypeError: Failed to fetch` — que é exatamente o erro
"Erro no upload — Failed to fetch" relatado na tela de NPCs.

## CORS recomendado

No painel da Cloudflare: **R2 → (seu bucket) → Settings → CORS Policy**, use:

```json
[
  {
    "AllowedOrigins": [
      "https://crono-fbula.vercel.app",
      "https://*.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Ajuste `AllowedOrigins` para incluir todos os domínios reais da aplicação
(produção, preview da Vercel e ambiente local de desenvolvimento).

## "Failed to fetch": causas mais comuns

Se o upload falhar na etapa de `PUT` para o R2 com "Failed to fetch", a causa
quase sempre é uma das duas abaixo:

1. **CORS do bucket não permite o domínio/método/headers usados** — aplique a
   política acima. Sem `AllowedMethods` incluindo `PUT` (e sem `OPTIONS`
   implícito coberto pela política), o navegador bloqueia a requisição antes
   mesmo de ela chegar ao R2.
2. **URL assinada inválida ou expirada** — a `uploadUrl` expira em 5 minutos
   (`expiresInSeconds: 300` em `src/lib/server/r2.ts`). Se o usuário demorar
   para selecionar o arquivo após abrir o modal, ou se as credenciais
   (`CLOUDFLARE_R2_ACCESS_KEY_ID` / `CLOUDFLARE_R2_SECRET_ACCESS_KEY`) ou o
   `CLOUDFLARE_R2_ACCOUNT_ID` estiverem incorretos, a assinatura não casa com o
   que o R2 espera e o PUT é rejeitado.

## Variáveis de ambiente necessárias

Confirme estas variáveis no ambiente da Vercel (Production e Preview):

- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_PUBLIC_URL` (domínio público/CDN do bucket, sem barra final)

Veja também `docs/cronofabula/VERCEL_ENV_SETUP.md` para o checklist completo de
variáveis de ambiente do projeto.
