'use client';

import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listMembers,
  listInvites,
  inviteMember,
  cancelInvite,
  updateMemberRole,
  removeMember,
} from '@/features/projects/collaboration/services/collaboration.service';
import type { CollabRole } from '@/features/projects/collaboration/types/collaboration';

const membersKey = (projectId: string) => ['project-members', projectId] as const;
const invitesKey = (projectId: string) => ['project-invites', projectId] as const;

/** Gestão de membros/convites de UM projeto — usado pelo dono no `ShareDialog`. */
export function useCollaboration(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: membersKey(projectId),
    queryFn: () => listMembers(projectId),
    enabled: !!projectId,
  });

  const invitesQuery = useQuery({
    queryKey: invitesKey(projectId),
    queryFn: () => listInvites(projectId),
    enabled: !!projectId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: membersKey(projectId) });
    queryClient.invalidateQueries({ queryKey: invitesKey(projectId) });
  };

  const invite = useMutation({
    mutationFn: ({ email, role }: { email: string; role: CollabRole }) =>
      inviteMember(projectId, email, role, user!.id),
    onSuccess: invalidate,
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (inviteId: string) => cancelInvite(inviteId),
    onSuccess: invalidate,
  });

  const updateRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: CollabRole }) => updateMemberRole(memberId, role),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: invalidate,
  });

  return {
    members: membersQuery.data ?? [],
    invites: invitesQuery.data ?? [],
    isLoading: membersQuery.isLoading || invitesQuery.isLoading,
    inviteMember: invite.mutateAsync,
    cancelInvite: cancelInviteMutation.mutateAsync,
    updateMemberRole: updateRole.mutateAsync,
    removeMember: remove.mutateAsync,
  };
}
