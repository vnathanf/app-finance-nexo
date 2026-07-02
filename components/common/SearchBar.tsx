import NexoSearch from '@/components/nexo/NexoSearch';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar(props: SearchBarProps) {
  return <NexoSearch {...props} />;
}
