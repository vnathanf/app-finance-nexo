'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NexoLoading from '@/components/nexo/NexoLoading';
import { useAuth } from '@/features/auth/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading, status } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (status === null) return; // ainda carregando o status de aprovação
    router.replace(status === 'approved' ? '/dashboard/projetos' : '/pendente');
  }, [isLoading, user, status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <NexoLoading />
    </div>
  );
}
