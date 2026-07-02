import type { Transaction } from '@/features/finance/transactions/types/transaction';

export interface MonthlySummary {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  total: number;
  percentage: number;
}

export interface CashFlowPoint {
  date: string;
  saldo: number;
}

export interface ReportFilters {
  month?: string;
  projectId?: string;
  categoryId?: string;
}

export type TransactionsForReport = Transaction[];
