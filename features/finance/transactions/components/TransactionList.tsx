'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TransactionCard from './TransactionCard';
import TransactionForm from './TransactionForm';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import NexoEmpty from '@/components/nexo/NexoEmpty';
import { useTransactions } from '@/features/finance/transactions/hooks/useTransactions';
import { getMonthName, todayISO } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import { resolveCategoryName } from '@/features/finance/categories/utils/category';
import { getErrorMessage } from '@/utils/errors';
import { generatePureId } from '@/lib/utils';
import type { Transaction } from '@/features/finance/transactions/types/transaction';
import type { Category } from '@/features/finance/categories/types/category';

interface TransactionListProps {
  transactions: Transaction[];
  projectId: string;
  categories: Category[];
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

function groupLabel(dateISO: string) {
  const [, month, day] = dateISO.split('-');
  if (!month || !day) return dateISO;
  return `${day} de ${getMonthName(month)}`;
}

export default function TransactionList({
  transactions,
  projectId,
  categories,
  selectionMode,
  selectedIds,
  onToggleSelect,
}: TransactionListProps) {
  const { saveTransaction, isSavingTransaction, deleteTransaction } = useTransactions();
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [duplicatingTx, setDuplicatingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <NexoEmpty
        title="Nenhuma transação encontrada"
        description="Ajuste os filtros ou registre um novo lançamento."
      />
    );
  }

  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const label = groupLabel(tx.date);
    const list = groups.get(label) ?? [];
    list.push(tx);
    groups.set(label, list);
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([label, txs]) => (
        <div key={label} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className="space-y-2">
            {txs.map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                categoryName={resolveCategoryName(categories, tx.categoryId)}
                onEdit={() => setEditingTx(tx)}
                onDuplicate={() => setDuplicatingTx(tx)}
                onDelete={() => setDeletingTx(tx)}
                selectionMode={selectionMode}
                selected={selectedIds?.has(tx.id)}
                onToggleSelect={() => onToggleSelect?.(tx.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

      <Dialog
        open={!!editingTx}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTx(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar transação</DialogTitle>
          </DialogHeader>
          {editingTx && (
            <TransactionForm
              projectId={projectId}
              categories={categories}
              initialValues={editingTx}
              submitLabel="Salvar alterações"
              isSubmitting={isSavingTransaction}
              onSubmit={async (values) => {
                try {
                  await saveTransaction({ ...editingTx, ...values });
                  setFormError(null);
                  setEditingTx(null);
                } catch (e) {
                  setFormError(getErrorMessage(e, 'Não foi possível salvar a transação.'));
                }
              }}
            />
          )}
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!duplicatingTx}
        onOpenChange={(open) => {
          if (!open) {
            setDuplicatingTx(null);
            setDuplicateError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar transação</DialogTitle>
          </DialogHeader>
          {duplicatingTx && (
            <TransactionForm
              projectId={projectId}
              categories={categories}
              initialValues={{ ...duplicatingTx, date: todayISO() }}
              submitLabel="Salvar cópia"
              isSubmitting={isSavingTransaction}
              onSubmit={async (values) => {
                try {
                  await saveTransaction({ id: generatePureId('t'), ...values });
                  setDuplicateError(null);
                  setDuplicatingTx(null);
                } catch (e) {
                  setDuplicateError(getErrorMessage(e, 'Não foi possível salvar a cópia.'));
                }
              }}
            />
          )}
          {duplicateError && <p className="text-sm text-destructive">{duplicateError}</p>}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingTx}
        onOpenChange={(open) => !open && setDeletingTx(null)}
        title="Remover transação"
        description={
          deletingTx
            ? `Deseja excluir permanentemente "${deletingTx.title}" no valor de ${formatCurrency(deletingTx.amount)}?`
            : undefined
        }
        confirmLabel="Sim, deletar"
        variant="destructive"
        onConfirm={async () => {
          if (!deletingTx) return;
          try {
            await deleteTransaction(deletingTx.id);
            setDeleteError(null);
          } catch (e) {
            setDeleteError(getErrorMessage(e, 'Não foi possível excluir a transação.'));
          }
        }}
      />
    </div>
  );
}
