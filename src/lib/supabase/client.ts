import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para uso em componentes client ('use client').
 * Usa apenas a anon key — respeita RLS e a sessão do usuário autenticado.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
