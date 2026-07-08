-- Especificações adicionais (pares rótulo/valor) de um projeto, editadas no
-- formulário de edição e exibidas na Visão geral — mesmo padrão já usado nos
-- bens (assets.custom_fields).
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

alter table public.projects
  add column custom_fields jsonb not null default '[]'::jsonb;
