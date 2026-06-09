
'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

// Usuário fictício para testes
const MOCK_USER = {
  uid: 'demo-user-id-123',
  displayName: 'Mestre Arcano (Teste)',
  email: 'mestre@cronofabula.com',
  photoURL: 'https://picsum.photos/seed/mestre/100/100',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
} as unknown as User;

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se o modo demo está ativo no localStorage
    const checkDemoMode = () => {
      const isDemo = typeof window !== 'undefined' && localStorage.getItem('cronofabula_demo_mode') === 'true';
      if (isDemo) {
        setUser(MOCK_USER);
        setLoading(false);
        return true;
      }
      return false;
    };

    if (checkDemoMode()) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Se não houver usuário real, tenta o modo demo novamente (caso tenha sido ativado recentemente)
      if (!user) {
        if (checkDemoMode()) return;
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
