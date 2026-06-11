import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';
import { serverEnv } from '@/lib/server/env';

// ATENÇÃO: este arquivo não pode ser importado por componentes client.
// Usa a service role key, que ignora RLS. Uso restrito a Route Handlers,
// Server Actions e scripts server-side que realmente precisem de acesso
// administrativo (ex.: tarefas de IA, jobs internos, manutenção).

export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient não pode ser usado no cliente.');
  }

  return createSupabaseClient(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
