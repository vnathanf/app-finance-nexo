'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  listCategories,
  saveCategory,
  removeCategory as removeCategoryRequest,
  subscribeToCategories,
} from '@/services/category.service';
import { generatePureId } from '@/lib/utils';
import { DEFAULT_CATEGORIES } from '@/config/constants';

const key = (ownerId?: string) => ['categories', ownerId] as const;

export function useCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ownerId = user?.id;
  const hasSeeded = useRef(false);

  const query = useQuery({
    queryKey: key(ownerId),
    queryFn: () => listCategories(),
    enabled: !!ownerId,
  });

  useEffect(() => {
    if (!ownerId) return;
    const unsubscribe = subscribeToCategories(() => {
      queryClient.invalidateQueries({ queryKey: key(ownerId) });
    });
    return unsubscribe;
  }, [ownerId, queryClient]);

  // Primeiro acesso do usuário: sem categorias no banco ainda, então semeia a
  // lista padrão (mesmo papel que o fallback de localStorage tinha antes).
  useEffect(() => {
    if (!ownerId || hasSeeded.current || query.isLoading || !query.data || query.data.length > 0) return;
    hasSeeded.current = true;
    void Promise.all(
      DEFAULT_CATEGORIES.map((name) => saveCategory({ id: generatePureId('cat'), name }, ownerId))
    ).then(() => queryClient.invalidateQueries({ queryKey: key(ownerId) }));
  }, [ownerId, query.isLoading, query.data, queryClient]);

  const categories = query.data ?? [];

  const upsert = useMutation({
    mutationFn: (name: string) => saveCategory({ id: generatePureId('cat'), name }, ownerId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeCategoryRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !ownerId) return;
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return;
    upsert.mutate(trimmed);
  };

  return {
    categories,
    isLoading: query.isLoading,
    addCategory,
    removeCategory: (id: string) => remove.mutate(id),
  };
}
