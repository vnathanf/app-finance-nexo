'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import {
  listRules,
  saveRule,
  removeRule as removeRuleRequest,
  subscribeToRules,
  hasSeededRules,
  markRulesSeeded,
} from '@/features/finance/categories/services/rule.service';
import { useCategories } from '@/features/finance/categories/hooks/useCategories';
import { generatePureId } from '@/lib/utils';
import { getErrorMessage } from '@/utils/errors';
import { EXAMPLE_RULES } from '@/features/finance/categories/constants';
import type { Rule } from '@/features/finance/categories/types/rule';

const key = (ownerId?: string) => ['rules', ownerId] as const;

/**
 * Regras de categorização automática por palavra-chave. Por projeto — cada
 * projeto vê e edita só as próprias regras (compartilhadas com colaboradores).
 */
export function useRules(projectId: string) {
  const { user } = useAuth();
  const { categories } = useCategories();
  const queryClient = useQueryClient();
  const ownerId = user?.id;
  const seededProjectRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: key(ownerId),
    queryFn: () => listRules(),
    enabled: !!ownerId,
  });

  useEffect(() => {
    if (!ownerId) return;
    const unsubscribe = subscribeToRules(() => {
      queryClient.invalidateQueries({ queryKey: key(ownerId) });
    });
    return unsubscribe;
  }, [ownerId, queryClient]);

  const allRules = query.data ?? [];
  const rules = useMemo(() => allRules.filter((r) => r.projectId === projectId), [allRules, projectId]);

  // Primeira vez que o projeto abre a tela de regras: semeia 2-3 exemplos
  // usando as categorias padrão. Marca em `rule_seeds` pra não recriar os
  // exemplos depois que o usuário apagar todos.
  useEffect(() => {
    if (!ownerId || !projectId || seededProjectRef.current === projectId || categories.length === 0) return;
    seededProjectRef.current = projectId;

    (async () => {
      try {
        if (await hasSeededRules(projectId)) return;
        await markRulesSeeded(projectId);

        const seeds = EXAMPLE_RULES.map((example) => {
          const category = categories.find((c) => c.name === example.categoryName);
          if (!category) return null;
          return {
            id: generatePureId('rule'),
            projectId,
            keyword: example.keyword,
            categoryId: category.id,
            confidence: '99% confiança',
            frequency: 'Automático',
          } satisfies Rule;
        }).filter((r): r is Rule => r !== null);

        if (seeds.length === 0) return;
        await Promise.all(seeds.map((r) => saveRule(r, ownerId)));
        queryClient.invalidateQueries({ queryKey: key(ownerId) });
      } catch (e) {
        // Semeadura é um "nice to have" — se a tabela rules/rule_seeds ainda não
        // existir (migration 0005 não rodada) ou falhar por outro motivo, não
        // deve quebrar a tela; só avisa pra investigar (console.warn não aciona
        // o overlay de erro do Next em dev).
        console.warn('Falha ao semear regras de exemplo:', getErrorMessage(e, 'erro desconhecido'), e);
      }
    })();
  }, [ownerId, projectId, categories, queryClient]);

  const upsert = useMutation({
    mutationFn: (rule: Rule) => saveRule(rule, ownerId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeRuleRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const addRule = (keyword: string, categoryId: string) => {
    if (!ownerId) return Promise.resolve();
    return upsert.mutateAsync({
      id: generatePureId('rule'),
      projectId,
      keyword,
      categoryId,
      confidence: '99% confiança',
      frequency: 'Automático',
    });
  };

  const updateRule = (id: string, keyword: string, categoryId: string) => {
    const existing = allRules.find((r) => r.id === id);
    if (!existing || !ownerId) return Promise.resolve();
    return upsert.mutateAsync({ ...existing, keyword, categoryId });
  };

  return {
    rules,
    isLoading: query.isLoading,
    addRule,
    updateRule,
    isSavingRule: upsert.isPending,
    removeRule: (id: string) => remove.mutate(id),
    isRemovingRule: (id: string) => remove.isPending && remove.variables === id,
  };
}
