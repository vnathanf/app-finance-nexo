import { cn } from '@/lib/utils';

interface InvestmentAnalysisProps {
  profitMargin: number;
  expenseCommitment: number;
  despesasVariation: number | null;
  isPeriodTodos: boolean;
  rentabilidadeBruta: number | null;
  rentabilidadeLiquida: number | null;
}

function formatPercent1(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

export default function InvestmentAnalysis({
  profitMargin,
  expenseCommitment,
  despesasVariation,
  isPeriodTodos,
  rentabilidadeBruta,
  rentabilidadeLiquida,
}: InvestmentAnalysisProps) {
  return (
    <div className="space-y-3.5 rounded-2xl bg-slate-900 p-4 text-white shadow-sm">
      <div className="space-y-0.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Análises de investimento</p>
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
            <span className="text-slate-200">Rentabilidade do patrimônio</span>
            {rentabilidadeBruta !== null && rentabilidadeLiquida !== null ? (
              <span className="font-mono text-emerald-400">
                {formatPercent1(rentabilidadeBruta)}% bruta · {formatPercent1(rentabilidadeLiquida)}% líquida
              </span>
            ) : (
              <span className="font-mono text-[10px] text-slate-500">Sem patrimônio vinculado</span>
            )}
          </div>
          <p className="text-[10px] font-medium leading-normal text-slate-400">
            Bruta: receitas do período / patrimônio vinculado. Líquida: saldo do período / patrimônio vinculado.
          </p>
        </div>
      </div>
    </div>
  );
}
