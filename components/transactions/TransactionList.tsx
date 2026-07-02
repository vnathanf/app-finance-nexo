'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TransactionCard from './TransactionCard';
import TransactionForm from './TransactionForm';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import NexoEmpty from '@/components/nexo/NexoEmpty';
import { useTransactions } from '@/hooks/useTransactions';
import { getMonthName } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import { resolveCategoryName } from '@/utils/category';
import type { Transaction } from '@/types/transaction';
import type { Category } from '@/types/category';

interface TransactionListProps {
  transactions: Transaction[];
  projectId: string;
  categories: Category[];
}

function groupLabel(dateISO: string) {
  const [, month, day] = dateISO.split('-');
  if (!month || !day) return dateISO;
  return `${day} de ${getMonthName(month)}`;
}

export default function TransactionList({ transactions, projectId, categories }: TransactionListProps) {
  const { saveTransaction, deleteTransaction } = useTransactions();
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

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
                onDelete={() => setDeletingTx(tx)}
              />
            ))}
          </div>
        </div>
      ))}

      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
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
              onSubmit={(values) => {
                saveTransaction({ ...editingTx, ...values });
                setEditingTx(null);
              }}
            />
          )}
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
        onConfirm={() => deletingTx && deleteTransaction(deletingTx.id)}
      />
    </div>
  );
}
