-- Bucket privado pra documentos de patrimônio (escrituras, contratos etc).
-- O bucket `attachments` (0004/0007) é público — serve bem avatar/capas, que
-- não são sensíveis, mas documentos financeiros não deveriam ser acessíveis
-- por qualquer pessoa com a URL. Buckets públicos no Supabase Storage servem
-- arquivo direto por URL sem passar pela RLS de storage.objects — por isso
-- documentos precisam de um bucket separado, privado, com signed URLs geradas
-- sob demanda (ver services/upload.service.ts: getSignedUrl).
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Path esperado: asset-documents/{projectId}/{arquivo}. `storage.foldername(name)`
-- devolve os segmentos de pasta (sem o nome do arquivo); [1] = "asset-documents",
-- [2] = projectId. Reaproveita has_project_access/has_project_edit_access de
-- 0001_project_collaboration.sql — mesmo critério de acesso usado em `assets`.

create policy "documents: ver do projeto" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and public.is_approved()
    and public.has_project_access((storage.foldername(name))[2])
  );

create policy "documents: editor envia" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and public.is_approved()
    and public.has_project_edit_access((storage.foldername(name))[2])
  );

create policy "documents: editor substitui" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'documents'
    and public.is_approved()
    and public.has_project_edit_access((storage.foldername(name))[2])
  )
  with check (
    bucket_id = 'documents'
    and public.is_approved()
    and public.has_project_edit_access((storage.foldername(name))[2])
  );

create policy "documents: editor remove" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and public.is_approved()
    and public.has_project_edit_access((storage.foldername(name))[2])
  );
