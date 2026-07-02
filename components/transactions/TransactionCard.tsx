import { TrendingDown, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import Currency from '@/components/common/Currency';
import { cn } from '@/lib/utils';
import { formatDateBR } from '@/utils/date';
import type { Transaction } from '@/types/transaction';

interface TransactionCardProps {
  transaction: Transaction;
  categoryName: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TransactionCard({ transaction, categoryName, onEdit, onDelete }: TransactionCardProps) {
  const isReceita = transaction.type === 'Receita';

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', isReceita ? 'bg-emerald-50' : 'bg-red-50')}>
          {isReceita ? (
            <TrendingUp className="size-4 text-emerald-600" />
          ) : (
            <TrendingDown className="size-4 text-red-600" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{transaction.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {transaction.type} • {categoryName}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <Currency
            value={isReceita ? transaction.amount : -transaction.amount}
            signed
            className="block text-sm font-semibold"
          />
          <span className="text-xs text-muted-foreground">{formatDateBR(transaction.date)}</span>
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={onEdit}
            aria-label="Editar transação"
            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Edit2 className="size-3.5" />
          </button>
          <button
            onClick={onDelete}
            aria-label="Remover transação"
            className="rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
