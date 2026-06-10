import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ATENÇÃO: este arquivo não pode ser importado por componentes client.
// Usa a service role key, que ignora RLS. Uso restrito a Route Handlers,
// Server Actions e scripts server-side que realmente precisem de acesso
// administrativo (ex.: tarefas de IA, jobs internos, manutenção).

export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient não pode ser usado no cliente.');
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
