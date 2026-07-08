-- Bucket de Storage para imagens de capa (projetos/bens), avatares e documentos.
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).
-- storage.objects já vem com RLS habilitada por padrão no Supabase.

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "attachments: leitura pública" on storage.objects
  for select using (bucket_id = 'attachments');

create policy "attachments: usuários autenticados enviam" on storage.objects
  for insert to authenticated with check (bucket_id = 'attachments');

create policy "attachments: usuários autenticados atualizam" on storage.objects
  for update to authenticated using (bucket_id = 'attachments');

create policy "attachments: usuários autenticados removem" on storage.objects
  for delete to authenticated using (bucket_id = 'attachments');
