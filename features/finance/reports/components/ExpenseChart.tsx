import { formatCurrencyCompact } from '@/utils/currency';
import { resolveCategoryName } from '@/features/finance/categories/utils/category';
import type { CategoryBreakdown } from '@/features/finance/reports/types/report';
import type { Category } from '@/features/finance/categories/types/category';

const CATEGORY_COLORS = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];

interface ExpenseChartProps {
  data: CategoryBreakdown[];
  categories: Category[];
}

export default function ExpenseChart({ data, categories }: ExpenseChartProps) {
  return (
    <div className="space-y-2.5 rounded-2xl border border-border bg-card p-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destinação por categorias</p>

      {data.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma despesa no período.</p>
      ) : (
        <div className="space-y-2.5">
          {data.map((item, idx) => {
            const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
            return (
              <div key={item.categoryId} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    {resolveCategoryName(categories, item.categoryId)}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {formatCurrencyCompact(item.total)} ({item.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.percentage}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
