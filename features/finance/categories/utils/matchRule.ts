import type { Rule } from '@/features/finance/categories/types/rule';

/** Encontra a primeira regra cuja palavra-chave aparece no título (case-insensitive) e devolve a categoria sugerida. */
export function matchRuleForTitle(rules: Rule[], title: string): string | undefined {
  const normalized = title.toLowerCase();
  return rules.find((r) => r.keyword.trim() && normalized.includes(r.keyword.trim().toLowerCase()))?.categoryId;
}
