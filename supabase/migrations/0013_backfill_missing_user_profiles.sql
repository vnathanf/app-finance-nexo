-- Contas que fizeram login via Google antes da migration 0006 nunca
-- ganharam linha em public.users (até então só o cadastro por e-mail criava
-- essa linha; a trigger que cobre os dois casos só vale pra contas novas,
-- criadas depois que 0006 rodou). Sem essa linha, o colaborador aparece na
-- tela de compartilhamento como "Usuário" — sem nome nem e-mail, parecendo
-- um acesso desconhecido/indevido quando na verdade é um membro legítimo
-- com perfil ausente.
--
-- Preenche retroativamente quem ficou de fora, com o mesmo critério da
-- trigger (handle_new_auth_user, em 0006), e já marca como 'approved' —
-- mesmo tratamento "grandfather" que 0006 deu às linhas existentes na época
-- (são contas que já estavam em uso, não cadastros novos passando por
-- aprovação).
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

insert into public.users (id, name, email, status)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
  u.email,
  'approved'
from auth.users u
where not exists (select 1 from public.users pu where pu.id = u.id);
