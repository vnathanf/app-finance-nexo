import { formatCurrency, formatSignedCurrency } from '@/utils/currency';
import { cn } from '@/lib/utils';

interface CurrencyProps {
  value: number;
  signed?: boolean;
  className?: string;
}

export default function Currency({ value, signed = false, className }: CurrencyProps) {
  const text = signed ? formatSignedCurrency(value) : formatCurrency(value);
  return (
    <span className={cn('font-mono', signed && (value >= 0 ? 'text-emerald-700' : 'text-red-700'), className)}>
      {text}
    </span>
  );
}
