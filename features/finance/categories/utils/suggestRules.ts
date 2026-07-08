import type { Transaction } from '@/features/finance/transactions/types/transaction';
import type { Category } from '@/features/finance/categories/types/category';
import type { Rule } from '@/features/finance/categories/types/rule';

export interface RuleSuggestion {
  keyword: string;
  /** null = sem sinal confiável de categoria, usuário escolhe. */
  categoryId: string | null;
  occurrences: number;
}

interface KeywordCategorySignal {
  categoryId: string;
  occurrences: number;
}

const MIN_OCCURRENCES = 2;
const MIN_DOMINANCE = 0.7;

function tokenize(title: string): string[] {
  return Array.from(
    new Set(
      title
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length >= 3 && Number.isNaN(Number(word)))
    )
  );
}

function isCoveredByExistingRule(word: string, existingKeywords: string[]): boolean {
  return existingKeywords.some((keyword) => word.includes(keyword) || keyword.includes(word));
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Mapa palavra → categoria dominante, construído a partir de transações já
 * categorizadas (categoria diferente de "Outros"). Só inclui palavras com
 * sinal forte (≥ 2 ocorrências, ≥ 70% na mesma categoria) — seguro pra
 * pré-preencher automaticamente em qualquer lugar (form, import).
 */
export function buildKeywordSignal(
  transactions: Transaction[],
  categories: Category[],
  existingRules: Rule[]
): Map<string, KeywordCategorySignal> {
  const outrosId = categories.find((c) => c.name === 'Outros')?.id;
  const existingKeywords = existingRules.map((r) => r.keyword.trim().toLowerCase()).filter(Boolean);

  const byCategoryPerWord = new Map<string, Map<string, number>>();

  for (const tx of transactions) {
    if (!tx.categoryId || tx.categoryId === outrosId) continue;
    for (const word of tokenize(tx.title)) {
      if (isCoveredByExistingRule(word, existingKeywords)) continue;
      const counts = byCategoryPerWord.get(word) ?? new Map<string, number>();
      counts.set(tx.categoryId, (counts.get(tx.categoryId) ?? 0) + 1);
      byCategoryPerWord.set(word, counts);
    }
  }

  const signal = new Map<string, KeywordCategorySignal>();
  for (const [word, counts] of byCategoryPerWord) {
    let total = 0;
    let dominantCategoryId: string | null = null;
    let dominantCount = 0;
    for (const [categoryId, count] of counts) {
      total += count;
      if (count > dominantCount) {
        dominantCount = count;
        dominantCategoryId = categoryId;
      }
    }
    if (dominantCategoryId && dominantCount >= MIN_OCCURRENCES && dominantCount / total >= MIN_DOMINANCE) {
      signal.set(word, { categoryId: dominantCategoryId, occurrences: dominantCount });
    }
  }
  return signal;
}

/** Sugere a categoria de um título avulso a partir do sinal do histórico — usado linha a linha no import. */
export function suggestCategoryForTitle(
  title: string,
  keywordSignal: Map<string, KeywordCategorySignal>
): { keyword: string; categoryId: string } | null {
  for (const word of tokenize(title)) {
    const match = keywordSignal.get(word);
    if (match) return { keyword: word, categoryId: match.categoryId };
  }
  return null;
}

/**
 * Gera candidatos de regra a partir do histórico do projeto. `extraTitles`
 * (opcional) são títulos crus sem categoria ainda — usado pelo import de CSV
 * pra contar repetições dentro do próprio arquivo, mesmo sem histórico prévio.
 */
export function suggestRules(
  transactions: Transaction[],
  categories: Category[],
  existingRules: Rule[],
  extraTitles: string[] = []
): RuleSuggestion[] {
  const outrosId = categories.find((c) => c.name === 'Outros')?.id;
  const existingKeywords = existingRules.map((r) => r.keyword.trim().toLowerCase()).filter(Boolean);
  const keywordSignal = buildKeywordSignal(transactions, categories, existingRules);

  const uncategorizedCounts = new Map<string, number>();
  const countUncategorizedTitle = (title: string) => {
    for (const word of tokenize(title)) {
      if (isCoveredByExistingRule(word, existingKeywords) || keywordSignal.has(word)) continue;
      uncategorizedCounts.set(word, (uncategorizedCounts.get(word) ?? 0) + 1);
    }
  };

  for (const tx of transactions) {
    if (tx.categoryId === outrosId) countUncategorizedTitle(tx.title);
  }
  for (const title of extraTitles) {
    countUncategorizedTitle(title);
  }

  const suggestions: RuleSuggestion[] = [];
  for (const [word, signal] of keywordSignal) {
    suggestions.push({ keyword: capitalize(word), categoryId: signal.categoryId, occurrences: signal.occurrences });
  }
  for (const [word, occurrences] of uncategorizedCounts) {
    if (occurrences >= MIN_OCCURRENCES) {
      suggestions.push({ keyword: capitalize(word), categoryId: null, occurrences });
    }
  }

  return suggestions.sort((a, b) => b.occurrences - a.occurrences).slice(0, 15);
}
