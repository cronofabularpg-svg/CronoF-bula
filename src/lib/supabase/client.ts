import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';

/**
 * Cliente Supabase para uso em componentes client ('use client').
 * Usa apenas a anon key — respeita RLS e a sessão do usuário autenticado.
 */
export function createClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
