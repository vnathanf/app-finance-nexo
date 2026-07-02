import type { Category } from '@/features/finance/categories/types/category';

export function resolveCategoryName(categories: Category[], categoryId: string): string {
  return categories.find((c) => c.id === categoryId)?.name ?? categoryId;
}
