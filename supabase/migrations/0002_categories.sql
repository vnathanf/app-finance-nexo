-- Categoria vira entidade própria (antes: string livre em transactions.category).
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).
-- Idempotente o suficiente para rodar uma vez; não rode duas vezes sem revisar.

-- ── 1. Tabela nova ────────────────────────────────────────────────────────────

-- id é `text` (o app gera ids client-side, ex: "cat_1782421427632_123"), mesmo
-- padrão de projects/transactions/assets.
create table public.categories (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

alter table public.categories enable row level security;

-- ── 2. Policies (sem colaboração de projeto: categoria é por usuário) ───────

create policy "categories: ver próprias" on public.categories
  for select using (auth.uid() = owner_id);

create policy "categories: criar" on public.categories
  for insert with check (auth.uid() = owner_id);

create policy "categories: editar próprias" on public.categories
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "categories: deletar próprias" on public.categories
  for delete using (auth.uid() = owner_id);

-- ── 3. Migra transactions.category (texto) para transactions.category_id ────

alter table public.transactions add column category_id text;

-- Cria uma categoria por (owner_id, nome de categoria já usado) e liga a
-- transação a ela, preservando os dados existentes.
insert into public.categories (id, owner_id, name)
select distinct 'cat_' || substr(md5(t.owner_id::text || t.category), 1, 20), t.owner_id, t.category
from public.transactions t
where t.category is not null and t.category <> ''
on conflict (owner_id, name) do nothing;

update public.transactions t
set category_id = c.id
from public.categories c
where c.owner_id = t.owner_id and c.name = t.category;

alter table public.transactions drop column category;
alter table public.transactions alter column category_id set not null;
