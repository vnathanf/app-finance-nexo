'use client';

import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listMyInvites, acceptInvite, declineInvite } from '@/features/projects/collaboration/services/collaboration.service';

const key = (email?: string) => ['my-invites', email] as const;

/** Convites pendentes recebidos pelo usuário logado — usado no banner do dashboard. */
export function useMyInvites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const email = user?.email;

  const query = useQuery({
    queryKey: key(email),
    queryFn: () => listMyInvites(email!),
    enabled: !!email,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key(email) });

  const accept = useMutation({
    mutationFn: (inviteId: string) => acceptInvite(inviteId),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const decline = useMutation({
    mutationFn: (inviteId: string) => declineInvite(inviteId),
    onSuccess: invalidate,
  });

  return {
    invites: query.data ?? [],
    isLoading: query.isLoading,
    acceptInvite: accept.mutateAsync,
    isAcceptingInvite: (inviteId: string) => accept.isPending && accept.variables === inviteId,
    declineInvite: decline.mutateAsync,
    isDecliningInvite: (inviteId: string) => decline.isPending && decline.variables === inviteId,
  };
}
