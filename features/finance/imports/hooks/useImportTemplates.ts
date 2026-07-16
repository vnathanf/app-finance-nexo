'use client';

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import {
  listImportTemplates,
  saveImportTemplate,
  removeImportTemplate as removeImportTemplateRequest,
  subscribeToImportTemplates,
} from '@/features/finance/imports/services/importTemplate.service';
import { generatePureId } from '@/lib/utils';
import type { ImportTemplate } from '@/features/finance/imports/types/importTemplate';
import type { ColumnMapping } from '@/features/finance/imports/utils/csv';

const key = (ownerId?: string) => ['import_templates', ownerId] as const;

/** Templates de import (layout de banco salvo, com linha de cabeçalho e mapeamento de colunas) — por projeto. */
export function useImportTemplates(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ownerId = user?.id;

  const query = useQuery({
    queryKey: key(ownerId),
    queryFn: () => listImportTemplates(),
    enabled: !!ownerId,
  });

  useEffect(() => {
    if (!ownerId) return;
    const unsubscribe = subscribeToImportTemplates(() => {
      queryClient.invalidateQueries({ queryKey: key(ownerId) });
    });
    return unsubscribe;
  }, [ownerId, queryClient]);

  const allTemplates = query.data ?? [];
  const templates = useMemo(() => allTemplates.filter((t) => t.projectId === projectId), [allTemplates, projectId]);

  const upsert = useMutation({
    mutationFn: (template: ImportTemplate) => saveImportTemplate(template, ownerId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeImportTemplateRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  });

  const saveTemplate = (name: string, headerRowIndex: number, columnMapping: ColumnMapping) => {
    if (!ownerId) return Promise.resolve();
    const existing = templates.find((t) => t.name === name);
    return upsert.mutateAsync({
      id: existing?.id ?? generatePureId('tmpl'),
      projectId,
      name,
      headerRowIndex,
      columnMapping,
    });
  };

  return {
    templates,
    isLoading: query.isLoading,
    saveTemplate,
    isSavingTemplate: upsert.isPending,
    removeTemplate: (id: string) => remove.mutate(id),
    isRemovingTemplate: (id: string) => remove.isPending && remove.variables === id,
  };
}
