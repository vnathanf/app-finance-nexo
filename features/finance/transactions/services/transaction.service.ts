import { supabase, type DBTransaction } from '@/lib/supabase';
import { subscribeToTableChanges } from '@/lib/realtimeChannel';
import type { Transaction } from '@/features/finance/transactions/types/transaction';

function fromDB(row: DBTransaction): Transaction {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    projectId: row.project_id,
    categoryId: row.category_id,
    amount: row.amount,
    date: row.date,
    notes: row.notes ?? undefined,
    cpfCnpj: row.cpf_cnpj ?? undefined,
  };
}

function toDB(tx: Transaction, ownerId: string): DBTransaction {
  return {
    id: tx.id,
    owner_id: ownerId,
    project_id: tx.projectId || '',
    title: tx.title || '',
    type: tx.type || 'Despesa',
    category_id: tx.categoryId || '',
    amount: tx.amount || 0,
    date: tx.date || '',
    notes: tx.notes || null,
    cpf_cnpj: tx.cpfCnpj || null,
  };
}

/**
 * Lista transações visíveis ao usuário logado — do próprio projeto ou de
 * projetos compartilhados. Sem filtro de owner_id: a RLS já faz esse recorte
 * (ver supabase/migrations/0001_project_collaboration.sql).
 */
export async function listTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data as DBTransaction[]).map(fromDB);
}

export async function saveTransaction(tx: Transaction, ownerId: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .upsert(toDB(tx, ownerId), { onConflict: 'id' });
  if (error) throw error;
}

/** Insere cópias novas (ids/datas já definidos pelo chamador) — usado pelo "duplicar selecionadas". */
export async function duplicateTransactions(transactions: Transaction[], ownerId: string): Promise<void> {
  const { error } = await supabase.from('transactions').insert(transactions.map((tx) => toDB(tx, ownerId)));
  if (error) throw error;
}

export async function removeTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

export async function removeTransactions(ids: string[]): Promise<void> {
  const { error } = await supabase.from('transactions').delete().in('id', ids);
  if (error) throw error;
}

export async function updateTransactionsCategory(ids: string[], categoryId: string): Promise<void> {
  const { error } = await supabase.from('transactions').update({ category_id: categoryId }).in('id', ids);
  if (error) throw error;
}

/** Sem filtro de owner_id: precisa notificar sobre mudanças em projetos compartilhados também. */
export function subscribeToTransactions(onChange: () => void) {
  return subscribeToTableChanges('transactions', onChange);
}
