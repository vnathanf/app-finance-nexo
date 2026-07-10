-- accept_project_invite comparava e-mails com `<>` (case-sensitive) entre o
-- e-mail do convite (salvo em minúsculas na criação, ver
-- collaboration.service.ts inviteMember) e o e-mail do JWT (como veio do
-- provedor de login, sem normalizar). Se a conta do convidado tiver e-mail
-- com maiúsculas, a comparação vira NULL em vez de TRUE — em Postgres,
-- `if NULL then` não dispara — e a checagem de segurança que deveria
-- impedir aceitar convite alheio fica sem efeito. Corrige comparando os
-- dois lados em minúsculas.
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

create or replace function public.accept_project_invite(p_invite_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.project_invites%rowtype;
  v_user_email text := lower(auth.jwt() ->> 'email');
begin
  select * into v_invite from public.project_invites where id = p_invite_id;

  if v_invite is null then
    raise exception 'Convite não encontrado.';
  end if;

  if lower(v_invite.email) <> v_user_email then
    raise exception 'Este convite não pertence ao usuário autenticado.';
  end if;

  insert into public.project_members (project_id, user_id, role, invited_by)
  values (v_invite.project_id, auth.uid(), v_invite.role, v_invite.invited_by)
  on conflict (project_id, user_id) do update set role = excluded.role;

  delete from public.project_invites where id = p_invite_id;

  return v_invite.project_id;
end;
$$;
