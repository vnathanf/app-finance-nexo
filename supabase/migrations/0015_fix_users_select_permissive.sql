-- 0008_users_profile_visibility.sql empilhou uma policy RESTRICTIVE
-- (can_view_user_profile) sobre a policy PERMISSIVE de SELECT existente,
-- assumindo que essa permissive já liberava leitura ampla. Na prática, a
-- única PERMISSIVE de SELECT em `users` é "users: ver próprio perfil", com
-- `auth.uid() = id` — ou seja, cada um só via a própria linha. Uma
-- RESTRICTIVE só estreita o que já é permitido, nunca amplia: como a base
-- permissiva já era "só eu mesmo", a RESTRICTIVE nunca teve efeito prático,
-- e ninguém enxergava o perfil de quem compartilha um projeto (nome/e-mail
-- do colaborador ficava sempre em branco, mostrando "Usuário" na tela de
-- compartilhamento — mesmo depois do convite aceito).
--
-- Corrige adicionando uma PERMISSIVE de SELECT com a mesma condição de
-- `can_view_user_profile` (que já inclui o caso `target_id = auth.uid()`).
-- Múltiplas PERMISSIVE são combinadas com OR entre si, e o resultado final
-- ainda passa pela RESTRICTIVE existente (AND) — como as duas usam a mesma
-- função, o efeito líquido é exatamente `can_view_user_profile(id)`.
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

create policy "users: ver perfil compartilhado" on public.users
  for select using (public.can_view_user_profile(id));
