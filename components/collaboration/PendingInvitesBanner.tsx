'use client';

import { Bell, Check, X } from 'lucide-react';
import { useMyInvites } from '@/hooks/useMyInvites';

export default function PendingInvitesBanner() {
  const { invites, acceptInvite, declineInvite } = useMyInvites();

  if (invites.length === 0) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-emerald-700" />
        <p className="text-sm font-semibold text-emerald-900">
          Convites de colaboração recebidos ({invites.length})
        </p>
      </div>

      <div className="space-y-2">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {invite.projectName ?? 'Projeto compartilhado'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Convidado por {invite.ownerName ?? 'outro colaborador'} · papel {invite.role}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => acceptInvite(invite.id)}
                className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
              >
                <Check className="size-3.5" /> Aceitar
              </button>
              <button
                onClick={() => declineInvite(invite.id)}
                className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              >
                <X className="size-3.5" /> Recusar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
