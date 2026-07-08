'use client';

import { useMemo, useState } from 'react';
import NexoLoading from '@/components/nexo/NexoLoading';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import KPICards from './KPICards';
import CashFlowChart from './CashFlowChart';
import ExpenseChart from './ExpenseChart';
import InvestmentAnalysis from './InvestmentAnalysis';
import SpendingAnalysis from './SpendingAnalysis';
import PlanningAnalysis from './PlanningAnalysis';
import { useReports } from '@/features/finance/reports/hooks/useReports';
import { useAssets } from '@/features/assets/hooks/useAssets';
import { useCategories } from '@/features/finance/categories/hooks/useCategories';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { getMonthName, toMonthKey, todayISO } from '@/utils/date';
import type { Project } from '@/features/projects/types/project';
import type { MonthlySummary } from '@/features/finance/reports/types/report';

interface ReportsTabProps {
  project: Project;
}

/**
 * Cada tipo de projeto tem uma finalidade diferente, então a análise
 * financeira que faz sentido também muda: um negócio quer saber
 * rentabilidade; um projeto de planejamento (viagem, compra de um bem etc)
 * quer saber quanto falta pra bater a meta; o resto é só controle de gastos.
 */
function getProfile(type: Project['type']): 'investimento' | 'planejamento' | 'gastos' {
  if (type === 'Negócios') return 'investimento';
  if (type === 'Planejamento') return 'planejamento';
  return 'gastos';
}

/** 'todos' → sem período anterior. 'YYYY' → ano anterior. 'YYYY-MM' → mês anterior. */
function getPreviousPeriodKey(period: string): string | null {
  if (period === 'todos') return null;
  if (period.length === 4) return String(Number(period) - 1);
  const [year, month] = period.split('-').map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
}

function sumDespesasForPeriod(monthlySummary: MonthlySummary[], periodKey: string): number {
  return monthlySummary.filter((m) => m.month.startsWith(periodKey)).reduce((sum, m) => sum + m.despesas, 0);
}

export default function ReportsTab({ project }: ReportsTabProps) {
  const projectId = project.id;
  const { assets, isLoading: isLoadingAssets } = useAssets();
  const { categories } = useCategories();
  const { saveProject, isSavingProject } = useProjects();
  const [selectedPeriod, setSelectedPeriod] = useState('todos');

  const trend = useReports({ projectId });

  const periodOptions = useMemo(() => {
    const monthKeys = new Set<string>([toMonthKey(todayISO()), ...trend.monthlySummary.map((m) => m.month)]);
    const years = Array.from(new Set(Array.from(monthKeys).map((key) => key.slice(0, 4)))).sort((a, b) =>
      b.localeCompare(a)
    );

    const options = [{ key: 'todos', label: 'Todo o período' }];
    for (const year of years) {
      options.push({ key: year, label: `${year} (ano todo)` });
      const monthsInYear = Array.from(monthKeys)
        .filter((key) => key.startsWith(year))
        .sort((a, b) => b.localeCompare(a));
      for (const key of monthsInYear) {
        options.push({ key, label: `${getMonthName(key)} ${year}` });
      }
    }
    return options;
  }, [trend.monthlySummary]);

  const monthFilter = selectedPeriod === 'todos' ? undefined : selectedPeriod;
  const scoped = useReports({ projectId, month: monthFilter });

  const patrimonio = useMemo(
    () => assets.filter((a) => a.projectId === projectId).reduce((sum, a) => sum + a.value, 0),
    [assets, projectId]
  );

  const profile = getProfile(project.type);

  const profitMargin =
    scoped.totals.receitas > 0 ? Math.round((scoped.totals.saldo / scoped.totals.receitas) * 100) : 0;
  const expenseCommitment =
    scoped.totals.receitas > 0 ? Math.round((scoped.totals.despesas / scoped.totals.receitas) * 100) : 0;

  const previousPeriodKey = getPreviousPeriodKey(selectedPeriod);
  const previousDespesas = previousPeriodKey ? sumDespesasForPeriod(trend.monthlySummary, previousPeriodKey) : null;
  const despesasVariation =
    previousPeriodKey !== null && previousDespesas && previousDespesas > 0
      ? Math.round(((scoped.totals.despesas - previousDespesas) / previousDespesas) * 100)
      : null;
  const isPeriodTodos = selectedPeriod === 'todos';

  const rentabilidadeBruta = patrimonio > 0 ? (scoped.totals.receitas / patrimonio) * 100 : null;
  const rentabilidadeLiquida = patrimonio > 0 ? (scoped.totals.saldo / patrimonio) * 100 : null;

  const custoMedioMensal =
    scoped.monthlySummary.length > 0 ? scoped.totals.despesas / scoped.monthlySummary.length : null;

  const biggestExpense = useMemo(() => {
    const expenses = scoped.transactions.filter((t) => t.type === 'Despesa');
    if (expenses.length === 0) return null;
    return expenses.reduce((max, t) => (t.amount > max.amount ? t : max), expenses[0]);
  }, [scoped.transactions]);

  const totalGuardado = trend.totals.saldo;
  const ritmoMensal = trend.monthlySummary.length > 0 ? trend.totals.saldo / trend.monthlySummary.length : null;

  if (scoped.isLoading || isLoadingAssets) {
    return <NexoLoading />;
  }

  return (
    <div className="space-y-4">
      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
        <SelectTrigger>
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((p) => (
            <SelectItem key={p.key} value={p.key}>
              {p.label}
            </SelectItem>
          ))}
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

      {profile === 'investimento' && (
        <InvestmentAnalysis
          profitMargin={profitMargin}
          expenseCommitment={expenseCommitment}
          despesasVariation={despesasVariation}
          isPeriodTodos={isPeriodTodos}
          rentabilidadeBruta={rentabilidadeBruta}
          rentabilidadeLiquida={rentabilidadeLiquida}
        />
      )}

      {profile === 'gastos' && (
        <SpendingAnalysis
          custoMedioMensal={custoMedioMensal}
          despesasVariation={despesasVariation}
          isPeriodTodos={isPeriodTodos}
          biggestExpense={biggestExpense}
        />
      )}

      {profile === 'planejamento' && (
        <PlanningAnalysis
          project={project}
          totalGuardado={totalGuardado}
          ritmoMensal={ritmoMensal}
          isSavingGoal={isSavingProject}
          onSaveGoal={async (goalAmount) => {
            await saveProject({ ...project, goalAmount });
          }}
        />
      )}
    </div>
  );
}
