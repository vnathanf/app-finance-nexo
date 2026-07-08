-- Meta (valor-alvo) de um projeto de planejamento (viagem, compra de um bem etc).
-- Opcional — projetos de investimento/negócio ou controle de gastos simplesmente
-- não preenchem esse campo. Editado direto na tela de Relatórios do projeto.
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

alter table public.projects
  add column goal_amount numeric null;
