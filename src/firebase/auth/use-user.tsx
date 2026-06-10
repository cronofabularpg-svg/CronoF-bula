'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadUser(authUser: { id: string; email?: string | null } | null) {
      if (!authUser) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!active) return;

      setUser({
        uid: authUser.id,
        email: authUser.email ?? null,
        displayName: profile?.display_name ?? null,
        photoURL: profile?.avatar_url ?? null,
      });
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data }) => loadUser(data.user));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
