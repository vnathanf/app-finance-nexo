import NexoSearch from '@/components/nexo/NexoSearch';

interface TransactionSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TransactionSearch({ value, onChange }: TransactionSearchProps) {
  return <NexoSearch value={value} onChange={onChange} placeholder="Buscar transação..." />;
}
