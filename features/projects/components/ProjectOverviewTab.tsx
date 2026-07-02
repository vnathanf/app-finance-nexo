'use client';

import { useMemo } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import NexoEmpty from '@/components/nexo/NexoEmpty';
import Currency from '@/components/common/Currency';
import { cn } from '@/lib/utils';
import { useCategories } from '@/features/finance/categories/hooks/useCategories';
import { resolveCategoryName } from '@/features/finance/categories/utils/category';
import type { Project } from '@/features/projects/types/project';
import type { Transaction } from '@/features/finance/transactions/types/transaction';

const COMMITMENT_STYLES = {
  good: {
    bar: 'bg-emerald-500',
    text: 'text-emerald-700 bg-emerald-50',
    label: 'Saudável',
    detail: 'Excelente nível de controle de gastos.',
  },
  warning: {
    bar: 'bg-amber-500',
    text: 'text-amber-700 bg-amber-50',
    label: 'Moderado',
    detail: 'Atenção aos gastos essenciais e variáveis.',
  },
  critical: {
    bar: 'bg-red-500',
    text: 'text-red-700 bg-red-50',
    label: 'Crítico',
    detail: 'Renda altamente comprometida! Risco de déficit.',
  },
} as const;

interface ProjectOverviewTabProps {
  project: Project;
  recentTransactions: Transaction[];
  onViewAllTransactions: () => void;
}

export default function ProjectOverviewTab({ project, recentTransactions, onViewAllTransactions }: ProjectOverviewTabProps) {
  const { categories } = useCategories();

  const commitment = useMemo(() => {
    let pct = 0;
    if (project.receitas > 0) pct = Math.round((project.despesas / project.receitas) * 100);
    else if (project.despesas > 0) pct = 100;
    const tone = pct <= 30 ? ('good' as const) : pct <= 70 ? ('warning' as const) : ('critical' as const);
    return { pct, tone };
  }, [project.receitas, project.despesas]);

  const commitmentStyle = COMMITMENT_STYLES[commitment.tone];

  return (
    <div className="space-y-4">
      {project.imageUrl && (
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.imageUrl} alt={project.name} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">Valor atual</p>
            <Currency value={project.value} className="text-xl font-bold text-white" />
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Comprometimento de renda</p>
          <span className={cn('rounded px-1.5 py-0.5 text-xs font-bold', commitmentStyle.text)}>
            {commitment.pct}%
          </span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          {project.receitas === 0 && project.despesas === 0 ? (
            <div className="flex size-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
              Sem movimentações no projeto
            </div>
          ) : (
            <div
              className={cn('h-full rounded-full transition-all', commitmentStyle.bar)}
              style={{ width: `${Math.min(commitment.pct, 100)}%` }}
            />
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">{commitmentStyle.label}:</span> {commitmentStyle.detail}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Receita</p>
            <Currency value={project.receitas} className="block font-semibold text-emerald-700" />
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Despesa</p>
            <Currency value={project.despesas} className="block font-semibold text-red-700" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Últimas transações</p>
          <button onClick={onViewAllTransactions} className="text-xs font-medium text-primary hover:underline">
            Ver todas
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <NexoEmpty title="Nenhuma transação registrada neste projeto" />
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'flex size-8 items-center justify-center rounded-lg',
                      tx.type === 'Receita' ? 'bg-emerald-50' : 'bg-red-50'
                    )}
                  >
                    {tx.type === 'Receita' ? (
                      <TrendingUp className="size-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="size-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{tx.title}</p>
                    <p className="text-xs text-muted-foreground">{resolveCategoryName(categories, tx.categoryId)}</p>
                  </div>
                </div>
                <Currency
                  value={tx.type === 'Receita' ? tx.amount : -tx.amount}
                  signed
                  className="text-sm font-semibold"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
