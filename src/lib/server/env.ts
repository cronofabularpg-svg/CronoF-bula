// Variáveis de ambiente apenas-servidor (sem prefixo NEXT_PUBLIC_).
//
// ATENÇÃO: este arquivo nunca pode ser importado por componentes client
// ('use client'). Se for importado e executado no browser, lança erro
// imediatamente para evitar vazamento acidental de segredos.

if (typeof window !== 'undefined') {
  throw new Error('src/lib/server/env.ts não pode ser importado no client.')
}

export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  groqApiKey: process.env.GROQ_API_KEY ?? '',
} as const

// Cloudflare R2 — opcional nesta fase. Recursos de mídia/upload ainda não
// usam R2, então a ausência destas variáveis não deve quebrar o build
// nem o runtime. Use isR2Configured() antes de qualquer integração futura.
export const r2Env = {
  accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? '',
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '',
  bucket: process.env.CLOUDFLARE_R2_BUCKET ?? '',
  publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '',
} as const

export function isR2Configured(): boolean {
  return Boolean(
    r2Env.accountId && r2Env.accessKeyId && r2Env.secretAccessKey && r2Env.bucket
  )
}

// Lança erro se variáveis de servidor obrigatórias estiverem ausentes.
// R2 não entra nesta checagem por ser opcional nesta fase.
export function assertServerEnv(): void {
  const missing = Object.entries({
    SUPABASE_SERVICE_ROLE_KEY: serverEnv.supabaseServiceRoleKey,
    GROQ_API_KEY: serverEnv.groqApiKey,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente de servidor ausentes: ${missing.join(', ')}`)
  }
}
