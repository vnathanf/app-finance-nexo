import { getMonthName } from '@/utils/date';
import { formatCurrencyCompact } from '@/utils/currency';
import type { MonthlySummary } from '@/features/finance/reports/types/report';

interface CashFlowChartProps {
  data: MonthlySummary[];
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
  const recent = data.slice(-6);
  const maxValue = Math.max(...recent.flatMap((d) => [d.receitas, d.despesas]), 1);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Entradas vs. saídas (fluxo mensal)
        </p>
        <div className="flex items-center gap-3 text-[10px] font-semibold">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-600" /> Entradas
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <span className="size-2 rounded-full bg-red-400" /> Saídas
          </span>
        </div>
      </div>

      {recent.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Sem movimentações no período.</p>
      ) : (
        <div className="flex h-28 items-end justify-between gap-2 px-1">
          {recent.map((point) => {
            const inHeight = point.receitas > 0 ? Math.max((point.receitas / maxValue) * 96, 4) : 0;
            const outHeight = point.despesas > 0 ? Math.max((point.despesas / maxValue) * 96, 4) : 0;
            const [, month] = point.month.split('-');
            return (
              <div key={point.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div className="flex h-24 items-end gap-1">
                  <div
                    className="w-3 rounded-t bg-emerald-600"
                    style={{ height: `${inHeight}px` }}
                    title={`Entradas em ${getMonthName(month)}: ${formatCurrencyCompact(point.receitas)}`}
                  />
                  <div
                    className="w-3 rounded-t bg-red-400"
                    style={{ height: `${outHeight}px` }}
                    title={`Saídas em ${getMonthName(month)}: ${formatCurrencyCompact(point.despesas)}`}
                  />
                </div>
                <span className="text-[9px] font-semibold text-muted-foreground">
                  {getMonthName(month).slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
