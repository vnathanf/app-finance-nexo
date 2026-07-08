'use client';

import { useState } from 'react';
import NexoButton from '@/components/nexo/NexoButton';
import { useAuth } from '@/features/auth/contexts/AuthContext';

export default function PendingApprovalScreen() {
  const { status, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const message =
    status === 'rejected'
      ? 'Seu cadastro não foi aprovado. Fale com quem administra o Nexo se achar que isso é um engano.'
      : 'Seu cadastro foi recebido e está aguardando aprovação. Assim que for liberado, você já vai conseguir entrar normalmente.';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <span className="flex items-end gap-1">
          <span className="h-3.5 w-2 rounded-sm bg-primary" />
          <span className="h-5.5 w-2 rounded-sm bg-primary" />
          <span className="h-8 w-2 rounded-sm bg-primary" />
        </span>
        <span className="text-xl font-black tracking-tight">Nexo</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-base font-bold">
          {status === 'rejected' ? 'Cadastro não aprovado' : 'Aguardando aprovação'}
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      <NexoButton
        type="button"
        variant="outline"
        className="w-full"
        loading={isSigningOut}
        onClick={async () => {
          setIsSigningOut(true);
          await signOut();
        }}
      >
        Sair
      </NexoButton>
    </div>
  );
}
