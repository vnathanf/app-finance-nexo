'use client';

import { useEffect, useState } from 'react';
import { safeJsonParse, generatePureId } from '@/lib/utils';
import { RULES_STORAGE_KEY } from '@/features/finance/categories/constants';
import type { Rule } from '@/features/finance/categories/types/rule';

/** Regras de categorização automática por palavra-chave. Persistidas em localStorage. */
export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(RULES_STORAGE_KEY);
    if (stored) setRules(safeJsonParse<Rule[]>(stored, []));
  }, []);

  const persist = (updated: Rule[]) => {
    setRules(updated);
    window.localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(updated));
  };

  const addRule = (keyword: string, categoryId: string) => {
    const rule: Rule = {
      id: generatePureId('rule'),
      keyword,
      categoryId,
      confidence: '99% confiança',
      frequency: 'Automático',
    };
    persist([...rules, rule]);
  };

  const updateRule = (id: string, keyword: string, categoryId: string) => {
    persist(rules.map((r) => (r.id === id ? { ...r, keyword, categoryId } : r)));
  };

  const removeRule = (id: string) => {
    persist(rules.filter((r) => r.id !== id));
  };

  return { rules, addRule, updateRule, removeRule };
}
