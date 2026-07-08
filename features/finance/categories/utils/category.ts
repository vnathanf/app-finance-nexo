import type { Category } from '@/features/finance/categories/types/category';

export function resolveCategoryName(categories: Category[], categoryId: string): string {
  return categories.find((c) => c.id === categoryId)?.name ?? categoryId;
}

/** "Outros" é o balde genérico usado quando nenhuma regra reconhece o título. */
export function resolveDefaultCategoryId(categories: Category[]): string | undefined {
  return categories.find((c) => c.name === 'Outros')?.id ?? categories[0]?.id;
}
