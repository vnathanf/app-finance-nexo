import { supabase, type DBProject } from '@/lib/supabase';
import { subscribeToTableChanges } from '@/lib/realtimeChannel';
import type { Project } from '@/features/projects/types/project';

function fromDB(row: DBProject): Project {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    type: row.type,
    sub: row.sub || '',
    value: row.value || 0,
    isExpense: row.is_expense ?? false,
    monthlyProfit: row.monthly_profit || 0,
    trend: row.trend || 0,
    receitas: row.receitas || 0,
    despesas: row.despesas || 0,
    imageUrl: row.image_url ?? undefined,
    goalAmount: row.goal_amount ?? undefined,
    customFields: row.custom_fields ?? [],
  };
}

function toDB(project: Project, ownerId: string): DBProject {
  return {
    id: project.id,
    owner_id: ownerId,
    name: project.name || '',
    type: project.type || 'Pessoal',
    sub: project.sub || '',
    value: project.value || 0,
    is_expense: project.isExpense ?? false,
    monthly_profit: project.monthlyProfit || 0,
    trend: project.trend || 0,
    receitas: project.receitas || 0,
    despesas: project.despesas || 0,
    image_url: project.imageUrl ?? null,
    goal_amount: project.goalAmount ?? null,
    custom_fields: project.customFields ?? [],
  };
}

/**
 * Lista projetos visíveis ao usuário logado — donos e colaboradores.
 * Sem filtro de owner_id: a RLS já garante que só voltam projetos próprios
 * ou onde o usuário é membro (ver supabase/migrations/0001_project_collaboration.sql).
 */
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as DBProject[]).map(fromDB);
}

export async function saveProject(project: Project, ownerId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .upsert(toDB(project, ownerId), { onConflict: 'id' });
  if (error) throw error;
}

export async function removeProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Assina mudanças em tempo real na tabela de projetos.
 * Sem filtro de owner_id: um colaborador precisa ser notificado de mudanças
 * em projetos que não são dele. O refetch subsequente já vem filtrado pela RLS.
 */
export function subscribeToProjects(onChange: () => void) {
  return subscribeToTableChanges('projects', onChange);
}
