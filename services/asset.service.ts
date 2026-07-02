import { supabase, type DBAsset } from '@/lib/supabase';
import type { Asset } from '@/types/asset';

function fromDB(row: DBAsset): Asset {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category || '',
    value: row.value,
    description: row.description || '',
    city: row.city ?? undefined,
    customFields: row.custom_fields || [],
    documents: row.documents || [],
    imageUrl: row.image_url ?? undefined,
    // Todo bem novo exige projeto; um `project_id` nulo só pode vir de um
    // registro de teste anterior à obrigatoriedade — cai pra string vazia
    // em vez de quebrar o mapeamento (esse bem simplesmente não aparece em
    // nenhuma aba, já que toda listagem hoje é por projectId).
    projectId: row.project_id ?? '',
  };
}

function toDB(asset: Asset, ownerId: string): DBAsset {
  return {
    id: asset.id,
    owner_id: ownerId,
    project_id: asset.projectId,
    name: asset.name || '',
    category: asset.category || 'Outros',
    sub_category: asset.subCategory || '',
    value: asset.value || 0,
    description: asset.description || '',
    city: asset.city ?? null,
    image_url: asset.imageUrl ?? null,
    custom_fields: asset.customFields || [],
    documents: asset.documents || [],
  };
}

/**
 * Lista bens visíveis ao usuário logado — próprios ou de projetos
 * compartilhados. Sem filtro de owner_id: a RLS já faz esse recorte
 * (ver supabase/migrations/0001_project_collaboration.sql).
 */
export async function listAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as DBAsset[]).map(fromDB);
}

export async function saveAsset(asset: Asset, ownerId: string): Promise<void> {
  const { error } = await supabase
    .from('assets')
    .upsert(toDB(asset, ownerId), { onConflict: 'id' });
  if (error) throw error;
}

export async function removeAsset(id: string): Promise<void> {
  const { error } = await supabase.from('assets').delete().eq('id', id);
  if (error) throw error;
}

/** Sem filtro de owner_id: precisa notificar sobre mudanças em projetos compartilhados também. */
export function subscribeToAssets(onChange: () => void) {
  // Nome de canal único por chamada: evita reusar um canal já inscrito quando
  // múltiplos componentes chamam o hook ao mesmo tempo (ver project.service.ts).
  const channel = supabase
    .channel(`own-assets-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, onChange)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
