'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

// Usuários fictícios para testes
const MOCK_MASTER = {
  uid: 'demo-master-id',
  displayName: 'Mestre Arcano (Teste)',
  email: 'mestre@cronofabula.com',
  photoURL: 'https://picsum.photos/seed/mestre/100/100',
} as unknown as User;

const MOCK_PLAYER = {
  uid: 'demo-player-id',
  displayName: 'Aventureiro Gob (Teste)',
  email: 'gob@cronofabula.com',
  photoURL: 'https://picsum.photos/seed/goblin/100/100',
} as unknown as User;

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDemoMode = () => {
      if (typeof window === 'undefined') return false;
      const demoMode = localStorage.getItem('cronofabula_demo_mode');
      const demoRole = localStorage.getItem('cronofabula_demo_role');

      if (demoMode === 'true') {
        setUser(demoRole === 'player' ? MOCK_PLAYER : MOCK_MASTER);
        setLoading(false);
        return true;
      }
      return false;
    };

    if (checkDemoMode()) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
