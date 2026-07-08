'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import {
  listTransactions,
  saveTransaction,
  duplicateTransactions,
  removeTransaction,
  removeTransactions,
  updateTransactionsCategory,
  subscribeToTransactions,
} from '@/features/finance/transactions/services/transaction.service';
import type { Transaction } from '@/features/finance/transactions/types/transaction';

const key = (ownerId?: string) => ['transactions', ownerId] as const;

export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ownerId = user?.id;

  const query = useQuery({
    queryKey: key(ownerId),
    queryFn: () => listTransactions(),
    enabled: !!ownerId,
  });

  useEffect(() => {
    if (!ownerId) return;
    const unsubscribe = subscribeToTransactions(() => {
      queryClient.invalidateQueries({ queryKey: key(ownerId) });
    });
    return unsubscribe;
  }, [ownerId, queryClient]);

  const upsert = useMutation({
    mutationFn: (tx: Transaction) => saveTransaction(tx, ownerId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeTransaction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const removeMany = useMutation({
    mutationFn: (ids: string[]) => removeTransactions(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const updateCategoryMany = useMutation({
    mutationFn: ({ ids, categoryId }: { ids: string[]; categoryId: string }) =>
      updateTransactionsCategory(ids, categoryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const duplicateMany = useMutation({
    mutationFn: (txs: Transaction[]) => duplicateTransactions(txs, ownerId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    saveTransaction: upsert.mutateAsync,
    isSavingTransaction: upsert.isPending,
    deleteTransaction: remove.mutateAsync,
    isDeletingTransaction: remove.isPending,
    deleteTransactions: removeMany.mutateAsync,
    isDeletingTransactions: removeMany.isPending,
    updateTransactionsCategory: (ids: string[], categoryId: string) =>
      updateCategoryMany.mutateAsync({ ids, categoryId }),
    isUpdatingTransactionsCategory: updateCategoryMany.isPending,
    duplicateTransactions: duplicateMany.mutateAsync,
    isDuplicatingTransactions: duplicateMany.isPending,
  };
}
