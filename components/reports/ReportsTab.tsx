'use client';

import { useMemo, useState } from 'react';
import NexoLoading from '@/components/nexo/NexoLoading';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import KPICards from './KPICards';
import CashFlowChart from './CashFlowChart';
import ExpenseChart from './ExpenseChart';
import { useReports } from '@/hooks/useReports';
import { useAssets } from '@/hooks/useAssets';
import { useCategories } from '@/hooks/useCategories';
import { toMonthKey, todayISO } from '@/utils/date';

type Period = 'Todos' | 'Este ano' | 'Este mês';

interface ReportsTabProps {
  projectId: string;
}

export default function ReportsTab({ projectId }: ReportsTabProps) {
  const { assets, isLoading: isLoadingAssets } = useAssets();
  const { categories } = useCategories();
  const [period, setPeriod] = useState<Period>('Todos');

  const today = todayISO();
  const currentMonthKey = toMonthKey(today);
  const currentYear = today.slice(0, 4);
  const monthFilter = period === 'Este mês' ? currentMonthKey : period === 'Este ano' ? currentYear : undefined;

  const scoped = useReports({ projectId, month: monthFilter });
  const global = useReports({ month: monthFilter });
  const trend = useReports({ projectId });

  const patrimonio = useMemo(
    () => assets.filter((a) => a.projectId === projectId).reduce((sum, a) => sum + a.value, 0),
    [assets, projectId]
  );

  const profitMargin = scoped.totals.receitas > 0 ? Math.round((scoped.totals.saldo / scoped.totals.receitas) * 100) : 0;
  const expenseCommitment =
    scoped.totals.receitas > 0 ? Math.round((scoped.totals.despesas / scoped.totals.receitas) * 100) : 0;
  const sharePct =
    global.totals.receitas > 0 ? Math.round((scoped.totals.receitas / global.totals.receitas) * 100) : 0;

  if (scoped.isLoading || isLoadingAssets) {
    return <NexoLoading />;
  }

  return (
    <div className="space-y-4">
      <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <SelectTrigger>
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todos">Todo o período</SelectItem>
          <SelectItem value="Este ano">Este ano</SelectItem>
          <SelectItem value="Este mês">Este mês</SelectItem>
        </SelectContent>
      </Select>

      <KPICards
        receitas={scoped.totals.receitas}
        despesas={scoped.totals.despesas}
        saldo={scoped.totals.saldo}
        patrimonio={patrimonio}
      />

      <CashFlowChart data={trend.monthlySummary} />

      <ExpenseChart data={scoped.categoryBreakdown} categories={categories} />

      <div className="space-y-3.5 rounded-2xl bg-slate-900 p-4 text-white shadow-sm">
        <div className="space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Análises de performance e margens
          </p>
          <p className="text-[10px] font-semibold text-emerald-400/70">
            Fórmulas e explicações dos indicadores financeiros:
          </p>
        </div>

        <div className="space-y-3 text-xs font-semibold">
          <div className="space-y-1 border-b border-slate-700/60 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-200">Margem de lucro líquido</span>
              <span className="font-mono text-emerald-400">
                {profitMargin >= 0 ? '+' : ''}
                {profitMargin}%
              </span>
            </div>
            <p className="text-[10px] font-medium leading-normal text-slate-400">
              Rentabilidade após subtrair as despesas das receitas (Saldo líquido / Receitas).
            </p>
          </div>

          <div className="space-y-1 border-b border-slate-700/60 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-200">Comprometimento de custos</span>
              <span className="font-mono text-amber-400">{expenseCommitment}%</span>
            </div>
            <p className="text-[10px] font-medium leading-normal text-slate-400">
              Quanto de cada R$ 1,00 que entra é consumido pelas despesas (Despesas / Receitas).
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-200">Share no lucro global</span>
              <span className="font-mono text-emerald-400">{sharePct}%</span>
            </div>
            <p className="text-[10px] font-medium leading-normal text-slate-400">
              Representatividade das receitas deste projeto frente ao total de todos os seus projetos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
