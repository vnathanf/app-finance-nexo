import { TrendingDown, TrendingUp, Copy, Edit2, Trash2, MessageSquareText } from 'lucide-react';
import Currency from '@/components/common/Currency';
import { cn } from '@/lib/utils';
import { formatDateBR } from '@/utils/date';
import type { Transaction } from '@/features/finance/transactions/types/transaction';

interface TransactionCardProps {
  transaction: Transaction;
  categoryName: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export default function TransactionCard({
  transaction,
  categoryName,
  onEdit,
  onDuplicate,
  onDelete,
  selectionMode,
  selected,
  onToggleSelect,
}: TransactionCardProps) {
  const isReceita = transaction.type === 'Receita';

  return (
    <div
      onClick={selectionMode ? onToggleSelect : undefined}
      className={cn(
        'flex items-center justify-between rounded-xl border border-border bg-card p-3',
        selectionMode && 'cursor-pointer'
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {selectionMode && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            aria-label="Selecionar transação"
            className="size-4 shrink-0"
          />
        )}
        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', isReceita ? 'bg-emerald-50' : 'bg-red-50')}>
          {isReceita ? (
            <TrendingUp className="size-4 text-emerald-600" />
          ) : (
            <TrendingDown className="size-4 text-red-600" />
          )}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-semibold">
            <span className="truncate">{transaction.title}</span>
            {transaction.notes && (
              <span title={transaction.notes} className="shrink-0">
                <MessageSquareText className="size-3 text-muted-foreground" aria-label="Tem observação" />
              </span>
            )}
          </p>
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

        {!selectionMode && (
          <div className="flex flex-col gap-1">
            <button
              onClick={onEdit}
              aria-label="Editar transação"
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Edit2 className="size-3.5" />
            </button>
            <button
              onClick={onDuplicate}
              aria-label="Duplicar transação"
              title="Duplicar"
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Copy className="size-3.5" />
            </button>
            <button
              onClick={onDelete}
              aria-label="Remover transação"
              className="rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
