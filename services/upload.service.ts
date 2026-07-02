import { supabase } from '@/lib/supabase';

const DEFAULT_BUCKET = 'attachments';

/**
 * Faz upload de um arquivo para o Supabase Storage e devolve a URL pública.
 * Requer que o bucket `attachments` (ou o passado em `bucket`) exista e tenha
 * política de leitura pública configurada no painel do Supabase.
 */
export async function uploadFile(
  file: File,
  path: string,
  bucket: string = DEFAULT_BUCKET
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(path: string, bucket: string = DEFAULT_BUCKET): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
