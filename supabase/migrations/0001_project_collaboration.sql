-- Colaboração em projetos: membros, convites por e-mail e papéis Editor/Leitor.
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).
-- Idempotente o suficiente para rodar uma vez; não rode duas vezes sem revisar
-- (os `create table` vão falhar na segunda vez, o que é o comportamento esperado).

-- ── 1. Tabelas novas ─────────────────────────────────────────────────────────

-- projects.id é `text` (o app gera ids client-side, ex: "p_1782421427632_123"),
-- não uuid — por isso project_id abaixo é `text`, pra bater com a FK.
create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('Editor', 'Leitor')),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  email text not null,
  role text not null check (role in ('Editor', 'Leitor')),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.project_members enable row level security;
alter table public.project_invites enable row level security;

-- ── 2. Funções auxiliares (SECURITY DEFINER pra evitar recursão de RLS) ─────

create or replace function public.has_project_access(p_project_id text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members m
          where m.project_id = p.id and m.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.has_project_edit_access(p_project_id text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members m
          where m.project_id = p.id and m.user_id = auth.uid() and m.role = 'Editor'
        )
      )
  );
$$;

-- ── 3. Estende as policies existentes (mesmo nome, nova expressão) ──────────

alter policy "projects: ver próprios" on public.projects
  using (auth.uid() = owner_id or has_project_access(id));
-- INSERT/UPDATE/DELETE de projects ficam owner-only, sem alteração.

alter policy "transactions: ver próprias" on public.transactions
  using (auth.uid() = owner_id or has_project_access(project_id));

alter policy "transactions: criar" on public.transactions
  with check (auth.uid() = owner_id and has_project_edit_access(project_id));

alter policy "transactions: editar próprias" on public.transactions
  using (auth.uid() = owner_id or has_project_edit_access(project_id))
  with check (auth.uid() = owner_id or has_project_edit_access(project_id));

alter policy "transactions: deletar próprias" on public.transactions
  using (auth.uid() = owner_id or has_project_edit_access(project_id));

alter policy "assets: ver próprios" on public.assets
  using (auth.uid() = owner_id or has_project_access(project_id));

alter policy "assets: criar" on public.assets
  with check (
    auth.uid() = owner_id
    and (project_id is null or has_project_edit_access(project_id))
  );

alter policy "assets: editar próprios" on public.assets
  using (auth.uid() = owner_id or has_project_edit_access(project_id))
  with check (auth.uid() = owner_id or has_project_edit_access(project_id));

alter policy "assets: deletar próprios" on public.assets
  using (auth.uid() = owner_id or has_project_edit_access(project_id));

-- Nota: `has_project_edit_access(NULL)` sempre retorna false (comparação
-- `p.id = NULL` nunca é verdadeira), então o INSERT de "assets: criar" guarda
-- explicitamente o caso `project_id is null` — senão nem o próprio dono
-- conseguiria cadastrar um bem sem vínculo a projeto.

-- ── 4. Policies das tabelas novas ────────────────────────────────────────────

create policy "project_members: ver do projeto" on public.project_members
  for select using (has_project_access(project_id));

create policy "project_members: dono gerencia" on public.project_members
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "project_invites: ver convite" on public.project_invites
  for select using (
    email = (auth.jwt() ->> 'email')
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "project_invites: dono convida" on public.project_invites
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "project_invites: cancelar ou recusar" on public.project_invites
  for delete using (
    email = (auth.jwt() ->> 'email')
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- ── 5. RPC de aceite de convite (bypassa RLS de propósito) ──────────────────

create or replace function public.accept_project_invite(p_invite_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.project_invites%rowtype;
  v_user_email text := auth.jwt() ->> 'email';
begin
  select * into v_invite from public.project_invites where id = p_invite_id;

  if v_invite is null then
    raise exception 'Convite não encontrado.';
  end if;

  if v_invite.email <> v_user_email then
    raise exception 'Este convite não pertence ao usuário autenticado.';
  end if;

  insert into public.project_members (project_id, user_id, role, invited_by)
  values (v_invite.project_id, auth.uid(), v_invite.role, v_invite.invited_by)
  on conflict (project_id, user_id) do update set role = excluded.role;

  delete from public.project_invites where id = p_invite_id;

  return v_invite.project_id;
end;
$$;
