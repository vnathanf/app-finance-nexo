'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import NexoButton from '@/components/nexo/NexoButton';
import { matchRuleForTitle } from '@/features/finance/categories/utils/matchRule';
import { resolveCategoryName } from '@/features/finance/categories/utils/category';
import { getMonthName, todayISO } from '@/utils/date';
import type { Transaction } from '@/features/finance/transactions/types/transaction';
import type { Category } from '@/features/finance/categories/types/category';
import type { Rule } from '@/features/finance/categories/types/rule';

interface ExecuteRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Transações já filtradas pelo projeto ativo. */
  transactions: Transaction[];
  categories: Category[];
  rules: Rule[];
  onApply: (ids: string[], categoryId: string) => Promise<void>;
  isApplying: boolean;
}

const ALL_MONTHS = 'Todas';

export default function ExecuteRulesDialog({
  open,
  onOpenChange,
  transactions,
  categories,
  rules,
  onApply,
  isApplying,
}: ExecuteRulesDialogProps) {
  const outrosId = useMemo(() => categories.find((c) => c.name === 'Outros')?.id, [categories]);

  const months = useMemo(() => {
    const seen = new Set<string>();
    const options = [{ label: 'Todos os meses', value: ALL_MONTHS }];
    for (const tx of transactions) {
      const key = tx.date.slice(0, 7);
      if (!seen.has(key) && key.length === 7) {
        seen.add(key);
        options.push({ label: getMonthName(key), value: key });
      }
    }
    return options;
  }, [transactions]);

  const [month, setMonth] = useState(ALL_MONTHS);
  const [checkedRuleIds, setCheckedRuleIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCheckedRuleIds(new Set(rules.map((r) => r.id)));
    setResult(null);
    const currentMonth = todayISO().slice(0, 7);
    setMonth(months.some((m) => m.value === currentMonth) ? currentMonth : ALL_MONTHS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleRule = (id: string) => {
    setCheckedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExecute = async () => {
    if (!outrosId) return;
    const activeRules = rules.filter((r) => checkedRuleIds.has(r.id));
    const eligible = transactions.filter(
      (tx) => tx.categoryId === outrosId && (month === ALL_MONTHS || tx.date.startsWith(month))
    );

    const idsByCategory = new Map<string, string[]>();
    for (const tx of eligible) {
      const categoryId = matchRuleForTitle(activeRules, tx.title);
      if (!categoryId) continue;
      const ids = idsByCategory.get(categoryId) ?? [];
      ids.push(tx.id);
      idsByCategory.set(categoryId, ids);
    }

    let updated = 0;
    for (const [categoryId, ids] of idsByCategory) {
      await onApply(ids, categoryId);
      updated += ids.length;
    }
    setResult(updated > 0 ? `${updated} transação${updated > 1 ? 'ões' : ''} atualizada${updated > 1 ? 's' : ''}.` : 'Nenhuma transação elegível nesse mês.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Executar regras</DialogTitle>
        </DialogHeader>

        {!outrosId ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Categoria &quot;Outros&quot; não encontrada neste projeto — crie-a pra usar esse recurso.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Recategoriza transações que ainda estão em &quot;Outros&quot; — nunca sobrescreve uma categoria já escolhida manualmente.
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mês</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">Regras a executar</p>
              {rules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma regra cadastrada.</p>
              ) : (
                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                  {rules.map((rule) => (
                    <label key={rule.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checkedRuleIds.has(rule.id)}
                        onChange={() => toggleRule(rule.id)}
                        className="size-4"
                      />
                      <span className="min-w-0 truncate">
                        Se contém &quot;{rule.keyword}&quot; → {resolveCategoryName(categories, rule.categoryId)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {result && <p className="text-sm font-medium text-primary">{result}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <NexoButton type="button" variant="outline" disabled={isApplying} onClick={() => onOpenChange(false)}>
                Fechar
              </NexoButton>
              <NexoButton
                type="button"
                disabled={checkedRuleIds.size === 0}
                loading={isApplying}
                onClick={handleExecute}
              >
                Executar
              </NexoButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
