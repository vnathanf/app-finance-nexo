import { cn } from '@/lib/utils';
import { formatDateBR } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import type { Transaction } from '@/features/finance/transactions/types/transaction';

interface SpendingAnalysisProps {
  custoMedioMensal: number | null;
  despesasVariation: number | null;
  isPeriodTodos: boolean;
  biggestExpense: Transaction | null;
}

export default function SpendingAnalysis({
  custoMedioMensal,
  despesasVariation,
  isPeriodTodos,
  biggestExpense,
}: SpendingAnalysisProps) {
  return (
    <div className="space-y-3.5 rounded-2xl bg-slate-900 p-4 text-white shadow-sm">
      <div className="space-y-0.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Controle de gastos</p>
        <p className="text-[10px] font-semibold text-emerald-400/70">Como seus gastos estão se comportando:</p>
      </div>

      <div className="space-y-3 text-xs font-semibold">
        <div className="space-y-1 border-b border-slate-700/60 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Custo médio mensal</span>
            <span className="font-mono text-amber-400">
              {custoMedioMensal !== null ? formatCurrency(custoMedioMensal) : '—'}
            </span>
          </div>
          <p className="text-[10px] font-medium leading-normal text-slate-400">
            Média de despesas por mês, considerando os meses com movimentação no período selecionado.
          </p>
        </div>

        <div className="space-y-1 border-b border-slate-700/60 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Variação de despesas vs. período anterior</span>
            {despesasVariation !== null ? (
              <span className={cn('font-mono', despesasVariation <= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {despesasVariation >= 0 ? '+' : ''}
                {despesasVariation}%
              </span>
            ) : (
              <span className="font-mono text-[10px] text-slate-500">
                {isPeriodTodos ? 'Escolha um mês ou ano' : 'Sem dados anteriores'}
              </span>
            )}
          </div>
          <p className="text-[10px] font-medium leading-normal text-slate-400">
            Quanto as despesas mudaram em relação ao período anterior equivalente (mês vs mês, ano vs ano).
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Maior gasto do período</span>
            <span className="font-mono text-red-400">
              {biggestExpense ? formatCurrency(biggestExpense.amount) : '—'}
            </span>
          </div>
          <p className="text-[10px] font-medium leading-normal text-slate-400">
            {biggestExpense
              ? `"${biggestExpense.title}", em ${formatDateBR(biggestExpense.date)}.`
              : 'Nenhuma despesa neste período.'}
          </p>
        </div>
      </div>
    </div>
  );
}
