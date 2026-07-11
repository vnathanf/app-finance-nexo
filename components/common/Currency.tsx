'use client';

import { formatCurrency, formatSignedCurrency } from '@/utils/currency';
import { cn } from '@/lib/utils';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';

interface CurrencyProps {
  value: number;
  signed?: boolean;
  className?: string;
}

export default function Currency({ value, signed = false, className }: CurrencyProps) {
  const { hidden } = useValuesVisibility();
  const text = hidden ? (signed ? `${value >= 0 ? '+' : '-'} R$ ••••••` : 'R$ ••••••') : signed ? formatSignedCurrency(value) : formatCurrency(value);
  return (
    <span className={cn('font-mono', signed && (value >= 0 ? 'text-emerald-700' : 'text-red-700'), className)}>
      {text}
    </span>
  );
}
