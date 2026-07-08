import { supabase } from '@/lib/supabase';

const DEFAULT_BUCKET = 'attachments';
export const DOCUMENTS_BUCKET = 'documents';

/**
 * Chaves do Supabase Storage rejeitam espaço, acento e outros caracteres fora
 * de [A-Za-z0-9._-] (erro "Invalid key") — nomes de arquivo reais (ex: "Sem
 * título.png") vêm assim do sistema operacional, então sempre precisam passar
 * por aqui antes de virar path de upload.
 */
function sanitizeStorageKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._/-]/g, '-');
}

async function uploadToStorage(file: File, path: string, bucket: string): Promise<string> {
  const safePath = sanitizeStorageKey(path);
  const { error } = await supabase.storage.from(bucket).upload(safePath, file, {
    upsert: true,
  });
  if (error) throw error;
  return safePath;
}

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
  const safePath = await uploadToStorage(file, path, bucket);
  const { data } = supabase.storage.from(bucket).getPublicUrl(safePath);
  return data.publicUrl;
}

/**
 * Faz upload pra um bucket privado (ex: `documents`) e devolve o PATH do
 * objeto, não uma URL — buckets privados não têm URL pública fixa; quem quiser
 * exibir/baixar o arquivo precisa gerar uma signed URL sob demanda com
 * `getSignedUrl`.
 */
export async function uploadPrivateFile(file: File, path: string, bucket: string): Promise<string> {
  return uploadToStorage(file, path, bucket);
}

/** Gera uma URL temporária (expira em `expiresIn` segundos) pra baixar um objeto de bucket privado. */
export async function getSignedUrl(path: string, bucket: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFile(path: string, bucket: string = DEFAULT_BUCKET): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
