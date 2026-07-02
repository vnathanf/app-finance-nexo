'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import {
  listTransactions,
  saveTransaction,
  removeTransaction,
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

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    saveTransaction: upsert.mutateAsync,
    deleteTransaction: remove.mutateAsync,
  };
}
