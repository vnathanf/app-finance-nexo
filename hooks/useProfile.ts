'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { getProfile, upsertProfile } from '@/features/auth/services/auth.service';
import type { UserProfile } from '@/features/auth/types/user';

const key = (userId?: string) => ['profile', userId] as const;

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: key(userId),
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });

  const save = useMutation({
    mutationFn: (profile: UserProfile) => upsertProfile({ ...profile, id: userId! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(userId) }),
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    saveProfile: save.mutateAsync,
  };
}
