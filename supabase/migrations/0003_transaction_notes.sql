-- Observação/comentário livre por transação.
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

alter table public.transactions add column notes text;
