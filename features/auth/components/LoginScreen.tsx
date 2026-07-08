'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import NexoButton from '@/components/nexo/NexoButton';
import { signInWithEmail, signUpWithEmail } from '@/features/auth/services/auth.service';
import { upsertProfile } from '@/features/auth/services/auth.service';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: signInError } = await signInWithEmail(email.trim().toLowerCase(), password);
      if (signInError) throw signInError;
      router.push('/dashboard/projetos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error: signUpError } = await signUpWithEmail(email.trim().toLowerCase(), password);
      if (signUpError) throw signUpError;
      if (data.user) {
        await upsertProfile({ id: data.user.id, name: name.trim(), email: email.trim() });
      }
      router.push('/pendente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-base font-bold">Bem-vindo ao Nexo Finance</h1>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Patrimônio & finanças conectadas</p>
      </div>

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="w-full space-y-3 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">E-mail</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Senha</label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2 pt-2">
            <NexoButton type="submit" className="w-full" loading={isSubmitting}>
              Entrar
            </NexoButton>
            <NexoButton
              type="button"
              variant="ghost"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => switchMode('register')}
            >
              Criar novo usuário
            </NexoButton>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="w-full space-y-3 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Nome completo</label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">E-mail</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Senha</label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Confirmar senha</label>
            <Input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="pt-2">
            <NexoButton type="submit" className="w-full" loading={isSubmitting}>
              Cadastrar usuário
            </NexoButton>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Já possui uma conta?{' '}
            <button type="button" onClick={() => switchMode('login')} className="font-medium text-primary hover:underline">
              Ir para o login
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
