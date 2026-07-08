'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import {
  listProjects,
  saveProject,
  removeProject,
  subscribeToProjects,
} from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/types/project';

const key = (ownerId?: string) => ['projects', ownerId] as const;

export function useProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ownerId = user?.id;

  const query = useQuery({
    queryKey: key(ownerId),
    queryFn: () => listProjects(),
    enabled: !!ownerId,
  });

  // Mantém a lista sincronizada com mudanças em tempo real vindas do Supabase.
  useEffect(() => {
    if (!ownerId) return;
    const unsubscribe = subscribeToProjects(() => {
      queryClient.invalidateQueries({ queryKey: key(ownerId) });
    });
    return unsubscribe;
  }, [ownerId, queryClient]);

  const upsert = useMutation({
    mutationFn: (project: Project) => saveProject(project, ownerId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    saveProject: upsert.mutateAsync,
    isSavingProject: upsert.isPending,
    deleteProject: remove.mutateAsync,
    isDeletingProject: remove.isPending,
  };
}
