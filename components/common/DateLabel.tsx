import { formatDateBR } from '@/utils/date';

interface DateLabelProps {
  date: string;
  className?: string;
}

export default function DateLabel({ date, className }: DateLabelProps) {
  return <span className={className}>{formatDateBR(date)}</span>;
}
