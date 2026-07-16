-- CPF/CNPJ por transação (usado no dedup e na categorização por padrão) e
-- templates de import salvos por projeto (layout de banco reutilizável entre
-- importações, sem detecção automática).
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

alter table public.transactions add column cpf_cnpj text;

create table public.import_templates (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  name text not null,
  header_row_index int not null default 0,
  column_mapping jsonb not null,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

alter table public.import_templates enable row level security;

create policy "import_templates: ver do projeto" on public.import_templates
  for select using (auth.uid() = owner_id or has_project_access(project_id));

create policy "import_templates: criar" on public.import_templates
  for insert with check (auth.uid() = owner_id and has_project_edit_access(project_id));

create policy "import_templates: editar" on public.import_templates
  for update using (auth.uid() = owner_id or has_project_edit_access(project_id))
  with check (auth.uid() = owner_id or has_project_edit_access(project_id));

create policy "import_templates: deletar" on public.import_templates
  for delete using (auth.uid() = owner_id or has_project_edit_access(project_id));
