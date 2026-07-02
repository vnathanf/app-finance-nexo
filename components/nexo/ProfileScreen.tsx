'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import NexoPage from '@/components/nexo/NexoPage';
import NexoLoading from '@/components/nexo/NexoLoading';
import { Input } from '@/components/ui/input';
import NexoButton from '@/components/nexo/NexoButton';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { updatePassword } from '@/features/auth/services/auth.service';
import { uploadFile } from '@/services/upload.service';
import { generatePureId } from '@/lib/utils';
import { cn } from '@/lib/utils';

const AVATAR_PRESETS = [
  { name: 'Padrão', url: 'https://picsum.photos/seed/NathanF/150/150' },
  { name: 'Negócios', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { name: 'Tech', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { name: 'Minimalista', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, isLoading, saveProfile } = useProfile();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setPhone(profile.phone ?? '');
      setAvatarUrl(profile.avatarUrl ?? '');
    }
  }, [profile]);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadFile(file, `avatars/${generatePureId('avatar')}-${file.name}`);
      setAvatarUrl(url);
      setError(null);
    } catch {
      setError('Falha ao enviar a imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      setError('O nome de perfil é obrigatório.');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await saveProfile({ name: name.trim(), email: user.email, phone: phone.trim(), avatarUrl: avatarUrl || undefined });

      if (newPassword.trim()) {
        if (newPassword.trim().length < 6) {
          setError('A nova senha precisa ter pelo menos 6 caracteres.');
          return;
        }
        await updatePassword(newPassword.trim());
        setNewPassword('');
      }

      setMessage('Alterações salvas com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar as alterações.');
    }
  };

  if (isLoading) {
    return (
      <NexoPage title="Perfil">
        <NexoLoading />
      </NexoPage>
    );
  }

  return (
    <NexoPage title="Perfil">
      <div className="space-y-4">
        <div className="space-y-3.5 rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Foto de perfil</p>

          <div className="flex flex-col items-center gap-3">
            <div className="relative size-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl || AVATAR_PRESETS[0].url}
                alt={name}
                className="size-20 rounded-full border-2 border-primary/30 object-cover"
              />
              <label className="absolute bottom-0 right-0 flex size-6 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
                <Upload className="size-3" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              {isUploading ? 'Enviando imagem...' : 'Escolha um avatar abaixo ou envie uma foto'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {AVATAR_PRESETS.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => setAvatarUrl(preset.url)}
                className={cn(
                  'overflow-hidden rounded-xl border-2 p-0.5 transition',
                  avatarUrl === preset.url ? 'border-primary' : 'border-transparent hover:border-muted'
                )}
                title={preset.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preset.url} alt={preset.name} className="size-10 rounded-lg object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3.5 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Informações de acesso</p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Nome completo</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">E-mail</label>
            <Input value={user?.email ?? ''} disabled />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Telefone / WhatsApp</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Nova senha (opcional)</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Deixe em branco para manter a atual"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}

        <NexoButton className="w-full" onClick={handleSave}>
          Salvar alterações
        </NexoButton>

        <div className="space-y-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Central de segurança</p>
          <p className="text-xs text-muted-foreground">Deseja sair do aplicativo com segurança?</p>
          <NexoButton
            variant="outline"
            className="w-full"
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
          >
            Encerrar sessão
          </NexoButton>
        </div>
      </div>
    </NexoPage>
  );
}
