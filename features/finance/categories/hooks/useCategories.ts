'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import {
  listCategories,
  saveCategory,
  removeCategory as removeCategoryRequest,
  subscribeToCategories,
} from '@/features/finance/categories/services/category.service';
import { generatePureId } from '@/lib/utils';
import { getErrorMessage } from '@/utils/errors';
import { DEFAULT_CATEGORIES } from '@/features/finance/categories/constants';

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
    void Promise.all(DEFAULT_CATEGORIES.map((name) => saveCategory({ id: generatePureId('cat'), name }, ownerId)))
      .then(() => queryClient.invalidateQueries({ queryKey: key(ownerId) }))
      .catch((e) => console.warn('Falha ao semear categorias padrão:', getErrorMessage(e, 'erro desconhecido'), e));
  }, [ownerId, query.isLoading, query.data, queryClient]);

  const categories = query.data ?? [];

  const upsert = useMutation({
    mutationFn: (category: { id: string; name: string }) => saveCategory(category, ownerId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeCategoryRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  /** Cria a categoria (ou reaproveita uma já existente com o mesmo nome) e devolve o id — útil pra já selecioná-la em seguida. */
  const addCategory = (name: string): Promise<string | undefined> => {
    const trimmed = name.trim();
    if (!trimmed || !ownerId) return Promise.resolve(undefined);
    const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return Promise.resolve(existing.id);
    const id = generatePureId('cat');
    return upsert.mutateAsync({ id, name: trimmed }).then(() => id);
  };

  return {
    categories,
    isLoading: query.isLoading,
    addCategory,
    isAddingCategory: upsert.isPending,
    removeCategory: (id: string) => remove.mutate(id),
    isRemovingCategory: (id: string) => remove.isPending && remove.variables === id,
  };
}
