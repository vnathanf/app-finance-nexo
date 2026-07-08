'use client';

import { useMemo } from 'react';
import { useTransactions } from '@/features/finance/transactions/hooks/useTransactions';
import { toMonthKey } from '@/utils/date';
import type { CategoryBreakdown, MonthlySummary, ReportFilters } from '@/features/finance/reports/types/report';

/** Deriva os dados de relatório a partir das transações já carregadas via TanStack Query. */
export function useReports(filters?: ReportFilters) {
  const { transactions, isLoading } = useTransactions();

  const scoped = useMemo(() => {
    return transactions.filter((t) => {
      if (filters?.projectId && t.projectId !== filters.projectId) return false;
      if (filters?.month && !t.date.startsWith(filters.month)) return false;
      if (filters?.categoryId && t.categoryId !== filters.categoryId) return false;
      return true;
    });
  }, [transactions, filters?.projectId, filters?.month, filters?.categoryId]);

  const monthlySummary = useMemo<MonthlySummary[]>(() => {
    const map = new Map<string, MonthlySummary>();
    for (const t of scoped) {
      const month = toMonthKey(t.date);
      const entry = map.get(month) ?? { month, receitas: 0, despesas: 0, saldo: 0 };
      if (t.type === 'Receita') entry.receitas += t.amount;
      else entry.despesas += t.amount;
      entry.saldo = entry.receitas - entry.despesas;
      map.set(month, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [scoped]);

  const categoryBreakdown = useMemo<CategoryBreakdown[]>(() => {
    const total = scoped.filter((t) => t.type === 'Despesa').reduce((s, t) => s + t.amount, 0);
    const map = new Map<string, number>();
    for (const t of scoped) {
      if (t.type !== 'Despesa') continue;
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([categoryId, catTotal]) => ({
        categoryId,
        total: catTotal,
        percentage: total > 0 ? (catTotal / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [scoped]);

  const totals = useMemo(() => {
    const receitas = scoped.filter((t) => t.type === 'Receita').reduce((s, t) => s + t.amount, 0);
    const despesas = scoped.filter((t) => t.type === 'Despesa').reduce((s, t) => s + t.amount, 0);
    return { receitas, despesas, saldo: receitas - despesas };
  }, [scoped]);

  return { monthlySummary, categoryBreakdown, totals, transactions: scoped, isLoading };
}
