// Variáveis de ambiente públicas (NEXT_PUBLIC_*).
// Seguro para importar em componentes client ('use client') e no servidor.
// Nunca adicione aqui valores que não devam ir para o bundle do browser.

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:9002',
} as const

// Lança erro se variáveis públicas obrigatórias estiverem ausentes.
// Útil para chamar cedo em pontos de entrada (ex.: layout raiz).
export function assertPublicEnv(): void {
  const missing = Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: publicEnv.supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publicEnv.supabaseAnonKey,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente públicas ausentes: ${missing.join(', ')}`)
  }
}
