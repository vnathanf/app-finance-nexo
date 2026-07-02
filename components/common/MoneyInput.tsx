'use client';

import { Input } from '@/components/ui/input';
import { parseCurrencyInput } from '@/utils/currency';

interface MoneyInputProps {
  value: string;
  onChange: (raw: string, numeric: number) => void;
  placeholder?: string;
}

export default function MoneyInput({ value, onChange, placeholder = '0,00' }: MoneyInputProps) {
  return (
    <Input
      inputMode="decimal"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value, parseCurrencyInput(e.target.value))}
    />
  );
}
