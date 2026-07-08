'use client';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Category } from '@/features/finance/categories/types/category';

export type TransactionTab = 'Todas' | 'Receitas' | 'Despesas';

interface MonthOption {
  label: string;
  value: string;
}

interface TransactionFiltersProps {
  activeTab: TransactionTab;
  onTabChange: (tab: TransactionTab) => void;
  months: MonthOption[];
  month: string;
  onMonthChange: (value: string) => void;
  categories: Category[];
  categoryId: string;
  onCategoryChange: (value: string) => void;
}

const TABS: TransactionTab[] = ['Todas', 'Receitas', 'Despesas'];

export default function TransactionFilters({
  activeTab,
  onTabChange,
  months,
  month,
  onMonthChange,
  categories,
  categoryId,
  onCategoryChange,
}: TransactionFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 rounded-lg border border-border text-center text-sm font-medium">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              'border-b-2 py-2 transition',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Mês</label>
          <Select value={month} onValueChange={onMonthChange}>
            <SelectTrigger>
              <SelectValue placeholder="Mês" />
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

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Categoria</label>
          <Select value={categoryId} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
