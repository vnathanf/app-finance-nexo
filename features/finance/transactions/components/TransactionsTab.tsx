'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileSpreadsheet, Plus, Sparkles, ListChecks, X, Trash2, Tag, Copy } from 'lucide-react';
import NexoLoading from '@/components/nexo/NexoLoading';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import NexoButton from '@/components/nexo/NexoButton';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { cn } from '@/lib/utils';
import TransactionSearch from './TransactionSearch';
import TransactionFilters, { type TransactionTab as TransactionTypeTab } from './TransactionFilters';
import TransactionList from './TransactionList';
import TransactionForm from './TransactionForm';
import ImportCsvDialog from '@/features/finance/imports/components/ImportCsvDialog';
import { useTransactions } from '@/features/finance/transactions/hooks/useTransactions';
import { useCategories } from '@/features/finance/categories/hooks/useCategories';
import { generatePureId } from '@/lib/utils';
import { getMonthName, toMonthKey, todayISO } from '@/utils/date';
import { resolveCategoryName } from '@/features/finance/categories/utils/category';
import { getErrorMessage } from '@/utils/errors';

interface TransactionsTabProps {
  projectId: string;
  /** Filtro inicial (ex: vindo de um clique em "Receita"/"Despesa" na Visão geral). */
  initialTypeFilter?: TransactionTypeTab;
}

export default function TransactionsTab({ projectId, initialTypeFilter }: TransactionsTabProps) {
  const {
    transactions,
    saveTransaction,
    isSavingTransaction,
    deleteTransactions,
    updateTransactionsCategory,
    isUpdatingTransactionsCategory,
    duplicateTransactions,
    isLoading: isLoadingTx,
  } = useTransactions();
  const { categories } = useCategories();

  const [activeTab, setActiveTab] = useState<TransactionTypeTab>(initialTypeFilter ?? 'Todas');
  const [month, setMonth] = useState(() => toMonthKey(todayISO()));
  const [categoryId, setCategoryId] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDuplicateOpen, setIsBulkDuplicateOpen] = useState(false);
  const [isBulkCategoryOpen, setIsBulkCategoryOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');

  const projectTransactions = useMemo(
    () => transactions.filter((tx) => tx.projectId === projectId),
    [transactions, projectId]
  );

  const months = useMemo(() => {
    const seen = new Set<string>();
    const options = [{ label: 'Todos', value: 'Todas' }];
    const currentMonthKey = toMonthKey(todayISO());
    const monthKeys = [currentMonthKey, ...projectTransactions.map((tx) => tx.date.slice(0, 7))];
    for (const key of monthKeys) {
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

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected =
    filteredTransactions.length > 0 && filteredTransactions.every((tx) => selectedIds.has(tx.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const tx of filteredTransactions) next.delete(tx.id);
      } else {
        for (const tx of filteredTransactions) next.add(tx.id);
      }
      return next;
    });
  };

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
          onClick={() => (isSelectionMode ? exitSelectionMode() : setIsSelectionMode(true))}
          aria-label={isSelectionMode ? 'Cancelar seleção' : 'Selecionar transações'}
          title={isSelectionMode ? 'Cancelar seleção' : 'Selecionar transações'}
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg border transition',
            isSelectionMode
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-muted'
          )}
        >
          {isSelectionMode ? <X className="size-4" /> : <ListChecks className="size-4" />}
        </button>
        <button
          onClick={() => setIsImportOpen(true)}
          aria-label="Importar extrato CSV"
          title="Importar extrato CSV"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
        >
          <FileSpreadsheet className="size-4" />
        </button>
        <Link
          href={`/dashboard/transacoes/categorias?projectId=${projectId}`}
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

      {isSelectionMode && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} className="size-4" />
            {selectedIds.size > 0
              ? `${selectedIds.size} selecionada${selectedIds.size > 1 ? 's' : ''}`
              : 'Selecionar todas'}
          </label>
          <div className="flex items-center gap-1">
            <button
              disabled={selectedIds.size === 0}
              onClick={() => setIsBulkDuplicateOpen(true)}
              aria-label="Duplicar selecionadas"
              title="Duplicar selecionadas"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              <Copy className="size-4" />
            </button>
            <button
              disabled={selectedIds.size === 0}
              onClick={() => setIsBulkCategoryOpen(true)}
              aria-label="Trocar categoria das selecionadas"
              title="Trocar categoria"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              <Tag className="size-4" />
            </button>
            <button
              disabled={selectedIds.size === 0}
              onClick={() => setIsBulkDeleteOpen(true)}
              aria-label="Excluir selecionadas"
              title="Excluir selecionadas"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      )}

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

      <TransactionList
        transactions={filteredTransactions}
        projectId={projectId}
        categories={categories}
        selectionMode={isSelectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setCreateError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova transação</DialogTitle>
          </DialogHeader>
          <TransactionForm
            projectId={projectId}
            categories={categories}
            isSubmitting={isSavingTransaction}
            onSubmit={async (values) => {
              try {
                await saveTransaction({ id: generatePureId('t'), ...values });
                setCreateError(null);
                setIsCreateOpen(false);
              } catch (e) {
                setCreateError(getErrorMessage(e, 'Não foi possível salvar a transação.'));
              }
            }}
          />
          {createError && <p className="text-sm text-destructive">{createError}</p>}
        </DialogContent>
      </Dialog>

      <ImportCsvDialog open={isImportOpen} onOpenChange={setIsImportOpen} projectId={projectId} />

      <ConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title="Remover transações"
        description={`Deseja excluir permanentemente ${selectedIds.size} transação${selectedIds.size > 1 ? 'ões' : ''}?`}
        confirmLabel="Sim, deletar"
        variant="destructive"
        onConfirm={async () => {
          await deleteTransactions(Array.from(selectedIds));
          exitSelectionMode();
        }}
      />

      <ConfirmDialog
        open={isBulkDuplicateOpen}
        onOpenChange={setIsBulkDuplicateOpen}
        title="Duplicar transações"
        description={`Vai criar ${selectedIds.size} cópia${selectedIds.size > 1 ? 's' : ''} com a data de hoje. Depois é só abrir cada uma e ajustar o que precisar.`}
        confirmLabel="Sim, duplicar"
        onConfirm={async () => {
          const today = todayISO();
          const copies = projectTransactions
            .filter((tx) => selectedIds.has(tx.id))
            .map((tx) => ({ ...tx, id: generatePureId('t'), date: today }));
          await duplicateTransactions(copies);
          exitSelectionMode();
        }}
      />

      <Dialog open={isBulkCategoryOpen} onOpenChange={setIsBulkCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Nova categoria para {selectedIds.size} transação{selectedIds.size > 1 ? 'ões' : ''}
              </label>
              <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <NexoButton
                type="button"
                variant="outline"
                disabled={isUpdatingTransactionsCategory}
                onClick={() => setIsBulkCategoryOpen(false)}
              >
                Cancelar
              </NexoButton>
              <NexoButton
                type="button"
                disabled={!bulkCategoryId}
                loading={isUpdatingTransactionsCategory}
                onClick={async () => {
                  await updateTransactionsCategory(Array.from(selectedIds), bulkCategoryId);
                  setIsBulkCategoryOpen(false);
                  exitSelectionMode();
                }}
              >
                Aplicar
              </NexoButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
