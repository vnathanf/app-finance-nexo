import { supabase, type DBCategory } from '@/lib/supabase';
import { subscribeToTableChanges } from '@/lib/realtimeChannel';
import type { Category } from '@/features/finance/categories/types/category';

function fromDB(row: DBCategory): Category {
  return {
    id: row.id,
    name: row.name,
  };
}

function toDB(category: Category, ownerId: string): DBCategory {
  return {
    id: category.id,
    owner_id: ownerId,
    name: category.name,
  };
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
  if (error) throw error;
  return (data as DBCategory[]).map(fromDB);
}

export async function saveCategory(category: Category, ownerId: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .upsert(toDB(category, ownerId), { onConflict: 'id' });
  if (error) throw error;
}

export async function removeCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export function subscribeToCategories(onChange: () => void) {
  return subscribeToTableChanges('categories', onChange);
}
