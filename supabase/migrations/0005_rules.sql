-- Regras de categorização automática (antes: localStorage). Agora por
-- projeto e compartilhadas com colaboradores (mesmo padrão de RLS de
-- transactions/assets, usando has_project_access/has_project_edit_access
-- definidas em 0001_project_collaboration.sql).
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

create table public.rules (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  keyword text not null,
  category_id text not null references public.categories(id) on delete cascade,
  confidence text not null default '99% confiança',
  frequency text not null default 'Automático',
  created_at timestamptz not null default now()
);

alter table public.rules enable row level security;

create policy "rules: ver do projeto" on public.rules
  for select using (auth.uid() = owner_id or has_project_access(project_id));

create policy "rules: criar" on public.rules
  for insert with check (auth.uid() = owner_id and has_project_edit_access(project_id));

create policy "rules: editar" on public.rules
  for update using (auth.uid() = owner_id or has_project_edit_access(project_id))
  with check (auth.uid() = owner_id or has_project_edit_access(project_id));

create policy "rules: deletar" on public.rules
  for delete using (auth.uid() = owner_id or has_project_edit_access(project_id));

-- ── Marca de "já semeei os exemplos deste projeto" ──────────────────────────
-- Tabela separada (não uma coluna em projects) pra não mexer no schema de
-- projects; só precisa existir a linha, não importa o conteúdo.

create table public.rule_seeds (
  project_id text primary key references public.projects(id) on delete cascade,
  seeded_at timestamptz not null default now()
);

alter table public.rule_seeds enable row level security;

create policy "rule_seeds: ver do projeto" on public.rule_seeds
  for select using (has_project_access(project_id));

create policy "rule_seeds: marcar" on public.rule_seeds
  for insert with check (has_project_edit_access(project_id));
