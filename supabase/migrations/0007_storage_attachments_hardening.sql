-- Corrige duas falhas nas policies de storage do bucket `attachments`
-- (criadas em 0004_storage_attachments.sql):
--
--   1. A leitura era pública de verdade — a policy de select não tinha
--      `to authenticated`, então qualquer visitante anônimo conseguia
--      listar e baixar todo arquivo do bucket (avatares, capas e, o mais
--      grave, documentos de bens em `asset-documents/`).
--   2. update/delete só checavam `bucket_id`, sem exigir que o objeto
--      pertencesse a quem pede a alteração — qualquer usuário autenticado
--      conseguia apagar ou sobrescrever arquivo de outra pessoa.
--
-- Reaproveita `public.is_approved()` (de 0006_user_approval.sql) pra também
-- fechar a brecha de quem se cadastra mas ainda está pendente de aprovação.
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

drop policy if exists "attachments: leitura pública" on storage.objects;
drop policy if exists "attachments: usuários autenticados enviam" on storage.objects;
drop policy if exists "attachments: usuários autenticados atualizam" on storage.objects;
drop policy if exists "attachments: usuários autenticados removem" on storage.objects;

create policy "attachments: leitura para aprovados" on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments' and public.is_approved());

create policy "attachments: aprovados enviam" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and public.is_approved());

create policy "attachments: dono atualiza" on storage.objects
  for update to authenticated
  using (bucket_id = 'attachments' and owner = auth.uid() and public.is_approved())
  with check (bucket_id = 'attachments' and owner = auth.uid() and public.is_approved());

create policy "attachments: dono remove" on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments' and owner = auth.uid() and public.is_approved());
