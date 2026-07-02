'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        Entrar
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/perfil" className="text-sm font-medium hover:text-foreground">
        Perfil
      </Link>
      <button onClick={() => signOut()} className="text-sm text-muted-foreground hover:text-foreground">
        Sair
      </button>
    </div>
  );
}
