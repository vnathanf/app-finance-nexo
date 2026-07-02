import type { Category } from '@/types/category';

export function resolveCategoryName(categories: Category[], categoryId: string): string {
  return categories.find((c) => c.id === categoryId)?.name ?? categoryId;
}
