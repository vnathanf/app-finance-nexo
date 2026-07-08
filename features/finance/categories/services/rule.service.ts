import { supabase, type DBRule } from '@/lib/supabase';
import { subscribeToTableChanges } from '@/lib/realtimeChannel';
import type { Rule } from '@/features/finance/categories/types/rule';

function fromDB(row: DBRule): Rule {
  return {
    id: row.id,
    projectId: row.project_id,
    keyword: row.keyword,
    categoryId: row.category_id,
    confidence: row.confidence,
    frequency: row.frequency,
  };
}

function toDB(rule: Rule, ownerId: string): DBRule {
  return {
    id: rule.id,
    owner_id: ownerId,
    project_id: rule.projectId,
    keyword: rule.keyword,
    category_id: rule.categoryId,
    confidence: rule.confidence,
    frequency: rule.frequency,
  };
}

/** Sem filtro de owner_id: a RLS já devolve só regras de projetos próprios ou compartilhados. */
export async function listRules(): Promise<Rule[]> {
  const { data, error } = await supabase.from('rules').select('*').order('keyword', { ascending: true });
  if (error) throw error;
  return (data as DBRule[]).map(fromDB);
}

export async function saveRule(rule: Rule, ownerId: string): Promise<void> {
  const { error } = await supabase.from('rules').upsert(toDB(rule, ownerId), { onConflict: 'id' });
  if (error) throw error;
}

export async function removeRule(id: string): Promise<void> {
  const { error } = await supabase.from('rules').delete().eq('id', id);
  if (error) throw error;
}

export function subscribeToRules(onChange: () => void) {
  return subscribeToTableChanges('rules', onChange);
}

export async function hasSeededRules(projectId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('rule_seeds')
    .select('project_id')
    .eq('project_id', projectId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function markRulesSeeded(projectId: string): Promise<void> {
  const { error } = await supabase.from('rule_seeds').upsert({ project_id: projectId }, { onConflict: 'project_id' });
  if (error) throw error;
}
