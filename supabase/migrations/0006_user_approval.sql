-- Aprovação manual de novos cadastros. Todo novo usuário nasce com
-- status 'pending' e só ganha acesso ao app quando alguém muda o campo
-- pra 'approved' direto na tabela `users` (Painel → Table Editor, ou um
-- UPDATE no SQL Editor). Usuários que já existiam antes desta migration
-- são aprovados automaticamente (grandfather), ninguém é bloqueado
-- retroativamente.
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

-- ── 1. Coluna de status ──────────────────────────────────────────────────────

alter table public.users
  add column status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'));

update public.users set status = 'approved';

-- ── 2. Provisiona a linha em public.users no cadastro ───────────────────────
-- Hoje só o cadastro por e-mail cria a linha (via upsertProfile no client);
-- login por Google nunca criava. Esse trigger cobre os dois casos, direto no
-- auth.users, então nenhum usuário novo fica sem status.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ── 3. Ninguém se autoaprova ─────────────────────────────────────────────────
-- Mesmo que alguém edite a chamada de upsert no client pra incluir status,
-- o trigger reverte silenciosamente qualquer troca feita pela role
-- `authenticated` (usuário logado via anon/JWT). Trocas feitas pelo SQL
-- Editor/Table Editor do Studio (sem JWT, role null) passam batido.

create or replace function public.protect_user_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and auth.role() = 'authenticated' then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_user_status_trigger on public.users;
create trigger protect_user_status_trigger
  before update on public.users
  for each row execute function public.protect_user_status();

-- ── 4. Trava o uso do app pra quem não estiver aprovado ─────────────────────
-- Policies RESTRICTIVE são sempre combinadas com AND às policies permissivas
-- já existentes em cada tabela — por isso não precisamos conhecer (nem
-- repetir) o texto exato delas aqui, inclusive as que predatam as migrations
-- versionadas (ex.: insert/update/delete de `projects`).
--
-- `users` fica de fora de propósito: o usuário pendente precisa continuar
-- lendo/editando a própria linha (nome, telefone, avatar) e o app precisa
-- conseguir checar o status pra mostrar a tela de "aguardando aprovação".

create or replace function public.is_approved()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select status from public.users where id = auth.uid()) = 'approved', false);
$$;

create policy "projects: exige aprovação" on public.projects
  as restrictive for all to authenticated using (is_approved()) with check (is_approved());

create policy "transactions: exige aprovação" on public.transactions
  as restrictive for all to authenticated using (is_approved()) with check (is_approved());

create policy "assets: exige aprovação" on public.assets
  as restrictive for all to authenticated using (is_approved()) with check (is_approved());

create policy "categories: exige aprovação" on public.categories
  as restrictive for all to authenticated using (is_approved()) with check (is_approved());

create policy "rules: exige aprovação" on public.rules
  as restrictive for all to authenticated using (is_approved()) with check (is_approved());

create policy "rule_seeds: exige aprovação" on public.rule_seeds
  as restrictive for all to authenticated using (is_approved()) with check (is_approved());

create policy "project_members: exige aprovação" on public.project_members
  as restrictive for all to authenticated using (is_approved()) with check (is_approved());

create policy "project_invites: exige aprovação" on public.project_invites
  as restrictive for all to authenticated using (is_approved()) with check (is_approved());
