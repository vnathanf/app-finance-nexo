'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NexoLoading from '@/components/nexo/NexoLoading';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? '/dashboard/projetos' : '/login');
  }, [isLoading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <NexoLoading />
    </div>
  );
}
