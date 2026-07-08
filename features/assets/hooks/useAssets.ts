'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import {
  listAssets,
  saveAsset,
  removeAsset,
  subscribeToAssets,
} from '@/features/assets/services/asset.service';
import type { Asset } from '@/features/assets/types/asset';

const key = (ownerId?: string) => ['assets', ownerId] as const;

export function useAssets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ownerId = user?.id;

  const query = useQuery({
    queryKey: key(ownerId),
    queryFn: () => listAssets(),
    enabled: !!ownerId,
  });

  useEffect(() => {
    if (!ownerId) return;
    const unsubscribe = subscribeToAssets(() => {
      queryClient.invalidateQueries({ queryKey: key(ownerId) });
    });
    return unsubscribe;
  }, [ownerId, queryClient]);

  const upsert = useMutation({
    mutationFn: (asset: Asset) => saveAsset(asset, ownerId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeAsset(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  return {
    assets: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    saveAsset: upsert.mutateAsync,
    isSavingAsset: upsert.isPending,
    deleteAsset: remove.mutateAsync,
    isDeletingAsset: remove.isPending,
  };
}
