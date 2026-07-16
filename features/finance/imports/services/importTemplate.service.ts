import { supabase, type DBImportTemplate } from '@/lib/supabase';
import { subscribeToTableChanges } from '@/lib/realtimeChannel';
import type { ImportTemplate } from '@/features/finance/imports/types/importTemplate';

function fromDB(row: DBImportTemplate): ImportTemplate {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    headerRowIndex: row.header_row_index,
    columnMapping: row.column_mapping,
  };
}

function toDB(template: ImportTemplate, ownerId: string): DBImportTemplate {
  return {
    id: template.id,
    owner_id: ownerId,
    project_id: template.projectId,
    name: template.name,
    header_row_index: template.headerRowIndex,
    column_mapping: template.columnMapping,
  };
}

/** Sem filtro de owner_id: a RLS já devolve só templates de projetos próprios ou compartilhados. */
export async function listImportTemplates(): Promise<ImportTemplate[]> {
  const { data, error } = await supabase.from('import_templates').select('*').order('name', { ascending: true });
  if (error) throw error;
  return (data as DBImportTemplate[]).map(fromDB);
}

/**
 * Upsert por (project_id, name), não por id — salvar de novo com o mesmo nome
 * atualiza o template existente em vez de criar um duplicado (é assim que o
 * usuário "sobrescreve" um template já salvo).
 */
export async function saveImportTemplate(template: ImportTemplate, ownerId: string): Promise<void> {
  const { error } = await supabase
    .from('import_templates')
    .upsert(toDB(template, ownerId), { onConflict: 'project_id,name' });
  if (error) throw error;
}

export async function removeImportTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('import_templates').delete().eq('id', id);
  if (error) throw error;
}

export function subscribeToImportTemplates(onChange: () => void) {
  return subscribeToTableChanges('import_templates', onChange);
}
