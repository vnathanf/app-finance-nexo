import { Badge } from '@/components/ui/badge';

interface StatusChipProps {
  type: 'Receita' | 'Despesa';
}

export default function StatusChip({ type }: StatusChipProps) {
  return <Badge variant={type === 'Receita' ? 'success' : 'destructive'}>{type}</Badge>;
}
