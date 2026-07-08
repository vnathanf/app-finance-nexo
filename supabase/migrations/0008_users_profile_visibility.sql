-- Restringe quem pode ler a tabela `users` (nome/e-mail/telefone/avatar de
-- todo mundo). Essa tabela existe desde antes das migrations versionadas,
-- então não sabemos o texto exato da policy de SELECT atual — pode estar
-- liberada geral pra qualquer autenticado. Em vez de reescrevê-la (arriscado
-- sem saber o texto original), empilhamos uma policy RESTRICTIVE por cima:
-- ela sempre é combinada com AND à(s) policy(ies) permissiva(s) existente(s),
-- então só estreita o acesso, nunca amplia.
--
-- Regra: um usuário só enxerga o próprio perfil, o de quem divide um
-- projeto com ele (dono ou colaborador do mesmo projeto), ou o de quem o
-- convidou (pra "Convidado por Fulano" aparecer antes de aceitar o convite).
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

create or replace function public.can_view_user_profile(target_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    target_id = auth.uid()
    or exists (
      select 1
      from public.projects p
      where (
        p.owner_id = auth.uid()
        or exists (select 1 from public.project_members m where m.project_id = p.id and m.user_id = auth.uid())
      )
      and (
        p.owner_id = target_id
        or exists (select 1 from public.project_members m2 where m2.project_id = p.id and m2.user_id = target_id)
      )
    )
    or exists (
      select 1 from public.project_invites i
      where i.invited_by = target_id and i.email = (auth.jwt() ->> 'email')
    );
$$;

create policy "users: restringe leitura a relação de projeto" on public.users
  as restrictive for select to authenticated
  using (public.can_view_user_profile(id));
