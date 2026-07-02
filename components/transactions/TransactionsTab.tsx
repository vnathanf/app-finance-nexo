'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileSpreadsheet, Plus, Sparkles } from 'lucide-react';
import NexoLoading from '@/components/nexo/NexoLoading';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TransactionSearch from './TransactionSearch';
import TransactionFilters, { type TransactionTab as TransactionTypeTab } from './TransactionFilters';
import TransactionList from './TransactionList';
import TransactionForm from './TransactionForm';
import ImportCsvDialog from './ImportCsvDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { generatePureId } from '@/lib/utils';
import { getMonthName } from '@/utils/date';
import { resolveCategoryName } from '@/utils/category';

interface TransactionsTabProps {
  projectId: string;
}

export default function TransactionsTab({ projectId }: TransactionsTabProps) {
  const { transactions, saveTransaction, isLoading: isLoadingTx } = useTransactions();
  const { categories } = useCategories();

  const [activeTab, setActiveTab] = useState<TransactionTypeTab>('Todas');
  const [month, setMonth] = useState('Todas');
  const [categoryId, setCategoryId] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const projectTransactions = useMemo(
    () => transactions.filter((tx) => tx.projectId === projectId),
    [transactions, projectId]
  );

  const months = useMemo(() => {
    const seen = new Set<string>();
    const options = [{ label: 'Todos', value: 'Todas' }];
    for (const tx of projectTransactions) {
      const key = tx.date.slice(0, 7);
      const [year, monthNum] = key.split('-');
      if (!seen.has(key) && year && monthNum) {
        seen.add(key);
        options.push({ label: `${getMonthName(monthNum)}/${year}`, value: key });
      }
    }
    return options;
  }, [projectTransactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return projectTransactions
      .filter((tx) => {
        if (activeTab === 'Receitas' && tx.type !== 'Receita') return false;
        if (activeTab === 'Despesas' && tx.type !== 'Despesa') return false;
        if (month !== 'Todas' && !tx.date.startsWith(month)) return false;
        if (categoryId !== 'Todas' && tx.categoryId !== categoryId) return false;
        if (query) {
          const categoryName = resolveCategoryName(categories, tx.categoryId);
          return tx.title.toLowerCase().includes(query) || categoryName.toLowerCase().includes(query);
        }
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [projectTransactions, activeTab, month, categoryId, categories, searchQuery]);

  if (isLoadingTx) {
    return <NexoLoading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TransactionSearch value={searchQuery} onChange={setSearchQuery} />
        </div>
        <button
          onClick={() => setIsImportOpen(true)}
          aria-label="Importar extrato CSV"
          title="Importar extrato CSV"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
        >
          <FileSpreadsheet className="size-4" />
        </button>
        <Link
          href="/dashboard/transacoes/categorias"
          aria-label="Categorias e regras inteligentes"
          title="Categorias e regras inteligentes"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
        >
          <Sparkles className="size-4" />
        </Link>
        <button
          onClick={() => setIsCreateOpen(true)}
          aria-label="Nova transação"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <TransactionFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        months={months}
        month={month}
        onMonthChange={setMonth}
        categories={categories}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
      />

      <TransactionList transactions={filteredTransactions} projectId={projectId} categories={categories} />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova transação</DialogTitle>
          </DialogHeader>
          <TransactionForm
            projectId={projectId}
            categories={categories}
            onSubmit={(values) => {
              saveTransaction({ id: generatePureId('t'), ...values });
              setIsCreateOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <ImportCsvDialog open={isImportOpen} onOpenChange={setIsImportOpen} projectId={projectId} />
    </div>
  );
}
