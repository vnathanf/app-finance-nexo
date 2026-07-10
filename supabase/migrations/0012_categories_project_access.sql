-- Categorias visíveis também para quem colabora no projeto do dono, não só
-- para o próprio dono. Sem isso, um colaborador (Editor/Leitor) não
-- conseguia resolver os nomes das categorias das transações do dono nem
-- escolher categoria ao lançar uma transação — via RLS, `categories` só
-- retornava linhas onde owner_id = auth.uid(), então o app caía no
-- fallback de mostrar o category_id cru (ex.: "cat_e95f5b59-...").
-- Rode este arquivo inteiro no SQL Editor do Supabase (Painel → SQL Editor → New query).

create or replace function public.has_category_access(p_owner_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select p_owner_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.owner_id = p_owner_id
        and public.has_project_access(p.id)
    );
$$;

alter policy "categories: ver próprias" on public.categories
  using (public.has_category_access(owner_id));

-- Criação/edição/exclusão continuam owner-only de propósito: a categoria
-- ainda pertence a quem a criou, só a visibilidade passou a acompanhar o
-- compartilhamento do projeto. Um colaborador que cria uma categoria nova
-- (tela "Categorias") ainda a cria sob o próprio owner_id — ela não vai
-- aparecer pros outros membros do projeto. Se no futuro vocês quiserem que
-- colaboradores também criem categorias visíveis a todo o projeto, isso
-- exige um desenho à parte (provavelmente categoria atrelada ao dono do
-- projeto, não a quem clicou em "Criar").
