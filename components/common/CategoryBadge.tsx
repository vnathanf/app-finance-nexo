import { Badge } from '@/components/ui/badge';

export default function CategoryBadge({ category }: { category: string }) {
  return <Badge variant="secondary">{category}</Badge>;
}
