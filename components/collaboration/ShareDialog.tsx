'use client';

import { useState, type FormEvent } from 'react';
import { Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NexoButton from '@/components/nexo/NexoButton';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { useCollaboration } from '@/hooks/useCollaboration';
import type { CollabRole } from '@/types/collaboration';

interface ShareDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Convidar, mudar papel e remover membros é restrito ao dono do projeto (mesma regra da RLS). */
  canManage: boolean;
}

export default function ShareDialog({ projectId, open, onOpenChange, canManage }: ShareDialogProps) {
  const { members, invites, isLoading, inviteMember, cancelInvite, updateMemberRole, removeMember } =
    useCollaboration(projectId);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollabRole>('Leitor');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await inviteMember({ email: email.trim(), role });
      setEmail('');
      setRole('Leitor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o convite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar projeto</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {canManage && (
            <form onSubmit={handleInvite} className="space-y-2">
              <label className="text-sm font-medium">Convidar por e-mail</label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pessoa@email.com"
                  className="flex-1"
                />
                <Select value={role} onValueChange={(v) => setRole(v as CollabRole)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Leitor">Leitor</SelectItem>
                  </SelectContent>
                </Select>
                <NexoButton type="submit" disabled={isSubmitting}>
                  Convidar
                </NexoButton>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </form>
          )}

          {!isLoading && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Membros ({members.length})</p>
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum colaborador ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarImage src={member.avatarUrl} alt={member.name ?? member.email} />
                            <AvatarFallback>{(member.name ?? member.email ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{member.name ?? member.email ?? 'Usuário'}</p>
                            {member.email && <p className="truncate text-xs text-muted-foreground">{member.email}</p>}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {canManage ? (
                            <>
                              <Select
                                value={member.role}
                                onValueChange={(v) => updateMemberRole({ memberId: member.id, role: v as CollabRole })}
                              >
                                <SelectTrigger className="h-8 w-24 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Editor">Editor</SelectItem>
                                  <SelectItem value="Leitor">Leitor</SelectItem>
                                </SelectContent>
                              </Select>
                              <button
                                onClick={() => setMemberToRemove(member.id)}
                                aria-label="Remover colaborador"
                                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">{member.role}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {canManage && invites.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Convites pendentes ({invites.length})</p>
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{invite.email}</p>
                          <p className="text-xs text-muted-foreground">{invite.role}</p>
                        </div>
                        <button
                          onClick={() => cancelInvite(invite.id)}
                          aria-label="Cancelar convite"
                          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>

      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(o) => !o && setMemberToRemove(null)}
        title="Remover colaborador"
        description="Essa pessoa perde o acesso ao projeto imediatamente."
        confirmLabel="Sim, remover"
        variant="destructive"
        onConfirm={() => memberToRemove && removeMember(memberToRemove)}
      />
    </Dialog>
  );
}
