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

## Erro 403 no PUT (checksum automático do AWS SDK v3)

Mesmo com CORS correto, o `PUT` assinado pode retornar **403 Forbidden** (sem
header `Access-Control-Allow-Origin` na resposta de erro). Se a `uploadUrl`
contiver parâmetros como `x-amz-checksum-crc32` e
`x-amz-sdk-checksum-algorithm=CRC32`, a causa é o cálculo automático de
checksum do `@aws-sdk/client-s3` recente: o SDK assina a URL incluindo esses
parâmetros, mas o R2 não implementa esse esquema de checksum e rejeita a
assinatura.

A correção está em `getR2Client()` (`src/lib/server/r2.ts`), que cria o
`S3Client` com:

```ts
requestChecksumCalculation: 'WHEN_REQUIRED',
responseChecksumValidation: 'WHEN_REQUIRED',
```

Isso faz o SDK só calcular/validar checksum quando explicitamente solicitado
via `ChecksumAlgorithm` (o que não é usado em `createPresignedUploadUrl`), e a
URL assinada deixa de incluir `x-amz-checksum-*`/`x-amz-sdk-checksum-*`.

## Fallback: upload direto pelo servidor

Como rede corporativa, extensões de navegador ou bloqueadores podem continuar
interferindo no PUT cross-origin para `r2.cloudflarestorage.com`, existe um
caminho alternativo que não depende de URL assinada nem de CORS no bucket:

- `POST /api/uploads/direct` recebe o arquivo via `multipart/form-data`,
  valida permissões (mesmas regras do presign) e faz o upload ao R2
  **a partir do servidor**, usando `uploadObjectToR2` em `src/lib/server/r2.ts`.
- O componente `R2ImageUpload` (`src/components/uploads/r2-image-upload.tsx`)
  aceita uma prop `mode`:
  - `"presigned"` (padrão para a maioria dos usos): só tenta o PUT assinado.
  - `"direct"`: sempre envia pelo servidor (usado hoje em
    `/campaign/[id]/npcs` para token/imagem de NPC).
  - `"auto"`: tenta o PUT assinado e, se falhar na etapa de PUT, exibe o botão
    "Tentar envio seguro pelo servidor" para repetir via `/api/uploads/direct`.

## Variáveis de ambiente necessárias

Confirme estas variáveis no ambiente da Vercel (Production e Preview):

- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_PUBLIC_URL` (domínio público/CDN do bucket, sem barra final)

Veja também `docs/cronofabula/VERCEL_ENV_SETUP.md` para o checklist completo de
variáveis de ambiente do projeto.
