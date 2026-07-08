'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import NexoButton from '@/components/nexo/NexoButton';
import { transactionSchema } from '@/features/finance/transactions/types/transaction.schema';
import { cn } from '@/lib/utils';
import { todayISO } from '@/utils/date';
import { useRules } from '@/features/finance/categories/hooks/useRules';
import { matchRuleForTitle } from '@/features/finance/categories/utils/matchRule';
import type { TransactionType } from '@/features/finance/transactions/types/transaction';
import type { Category } from '@/features/finance/categories/types/category';

export interface TransactionFormValues {
  title: string;
  type: TransactionType;
  projectId: string;
  categoryId: string;
  amount: number;
  date: string;
  notes?: string;
}

interface TransactionFormProps {
  /** Toda transação pertence ao projeto ativo — não é mais uma escolha do usuário. */
  projectId: string;
  categories: Category[];
  initialValues?: Partial<TransactionFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel?: () => void;
}

export default function TransactionForm({
  projectId,
  categories,
  initialValues,
  submitLabel = 'Salvar',
  isSubmitting = false,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const { rules } = useRules(projectId);
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [type, setType] = useState<TransactionType>(initialValues?.type ?? 'Receita');
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? categories[0]?.id ?? '');
  const [categoryTouched, setCategoryTouched] = useState(!!initialValues?.categoryId);
  const [amount, setAmount] = useState(initialValues?.amount?.toString() ?? '');
  const [date, setDate] = useState(initialValues?.date ?? todayISO());
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  // Ao criar (não editar) uma transação, sugere a categoria pela regra que
  // bater com a descrição digitada — só enquanto o usuário não escolher uma
  // categoria manualmente.
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (categoryTouched) return;
    const suggested = matchRuleForTitle(rules, value);
    if (suggested) setCategoryId(suggested);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setCategoryTouched(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = transactionSchema.safeParse({
      title: title.trim(),
      type,
      projectId,
      categoryId,
      amount: parseFloat(amount),
      date,
      notes: notes.trim() || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }
    setError(null);
    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('Receita')}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-medium transition',
              type === 'Receita'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-border text-muted-foreground hover:bg-muted'
            )}
          >
            Receita (+)
          </button>
          <button
            type="button"
            onClick={() => setType('Despesa')}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-medium transition',
              type === 'Despesa'
                ? 'border-red-600 bg-red-50 text-red-700'
                : 'border-border text-muted-foreground hover:bg-muted'
            )}
          >
            Despesa (-)
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Descrição</label>
        <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Ex: Aluguel, Jantar..." required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Categoria</label>
          <Select value={categoryId} onValueChange={handleCategoryChange}>
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Valor (R$)</label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Data</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Observação</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotação opcional sobre essa transação..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <NexoButton type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
            Cancelar
          </NexoButton>
        )}
        <NexoButton type="submit" loading={isSubmitting}>
          {submitLabel}
        </NexoButton>
      </div>
    </form>
  );
}
