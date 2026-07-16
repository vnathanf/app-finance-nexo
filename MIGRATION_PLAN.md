# Roteiro de Migração — Nexo v2

> Cole este arquivo inteiro como instrução inicial no Claude Code, dentro da raiz
> do projeto `app-finance-nexo`. Ele descreve exatamente o que já foi feito,
> o que falta, e o passo a passo pra terminar sem quebrar o app.
>
> Regra de ouro: **depois de cada extração, rode `npm run dev` (ou
> `npx tsc --noEmit`) e confira que compila antes de seguir pro próximo passo.**
> Não faça duas telas de uma vez.

> **Atualização (2026-07-02):** a extração do monólito `app/page.tsx` descrita
> abaixo (seções 0 e 3–5) já foi concluída — fica como registro histórico do
> porquê de decisões como "mutation individual em vez de diff manual de
> coleção". A estrutura de pastas "flat por tipo" que a seção 1 descrevia foi
> **substituída** por uma organização por feature de domínio
> (`features/finance/{transactions,categories,imports,reports}`,
> `features/projects`, `features/assets`, `features/auth`) — a seção 1 abaixo
> já reflete essa estrutura atual. Os caminhos de arquivo citados na seção 2
> (ex: `types/transaction.ts`, `services/project.service.ts`) são de antes
> dessa reorganização; use a árvore da seção 1 como fonte de verdade pra onde
> cada coisa mora hoje.

---

## 0. Contexto

O projeto nasceu de um export do AI Studio: quase todas as pastas
(`components/`, `hooks/`, `services/`, `types/`, `contexts/`) já existem com
os nomes certos, mas **toda a lógica real do app estava (e em parte ainda
está) dentro de um único arquivo `app/page.tsx` com ~7700 linhas**, um
componente `App()` só, com 126 `useState`, 14 "telas" controladas por uma
variável de estado `currentScreen` (não é roteamento real do Next.js).

Já extraí a parte "segura" (tipos, utils, services, contexts, providers,
componentes de UI, layout, rotas vazias). **O que falta é fatiar o JSX das
14 telas de dentro de `app/page.tsx` para os componentes de tela corretos.**

## 1. Arquitetura atual (por feature de domínio)

```
app/                  → só rotas (page.tsx fino, delega pra um componente de feature)
features/
  finance/
    transactions/     → components/, hooks/ (useTransactions), services/ (transaction.service),
                         types/ (transaction.ts, transaction.schema.ts)
    categories/        → components/ (CategoryManager, RulesScreen), hooks/ (useCategories, useRules),
                         services/ (category.service), utils/ (resolveCategoryName),
                         types/ (category.ts, rule.ts), constants.ts
    imports/           → components/ (ImportCsvDialog), hooks/ (useCsvImport), utils/ (csv.ts)
    reports/           → components/ (gráficos, ReportsTab), hooks/ (useReports), types/ (report.ts)
  projects/            → components/, hooks/ (useProjects), services/ (project.service),
                         types/ (project.ts, project.schema.ts)
    collaboration/     → components/ (ShareDialog, PendingInvitesBanner), hooks/, services/, types/
  assets/              → components/, hooks/ (useAssets), services/ (asset.service),
                         types/ (asset.ts, asset.schema.ts)
  auth/                → components/ (LoginScreen), contexts/ (AuthContext), services/ (auth.service),
                         types/ (user.ts), schema.ts (loginSchema)
components/
  layout/       → AppShell, Header, BottomNavigation, FloatingActionButton, PageContainer
  ui/           → primitivos shadcn puros (nunca editar à mão, nunca lógica de negócio)
  nexo/         → design system genérico (NexoButton, NexoCard, NexoPage, ...) + ProfileScreen/SettingsScreen
                   (ainda não migradas pra uma feature — não são claramente "auth")
  dialogs/, common/, charts/, forms/, providers/
contexts/       → só o que é de fato global e não pertence a uma feature (Theme). Auth mora em features/auth/contexts/
hooks/          → só hooks genéricos, sem domínio (use-mobile, useDebounce, useLocalStorage, useProfile)
services/       → só serviços genéricos usados por mais de uma feature (upload.service)
lib/            → client do Supabase, cn()
utils/          → funções puras sem domínio (moeda, data, cálculos)
```

Cada feature é dona dos próprios `components/hooks/services/types` — nada de domínio acessa Supabase
direto fora do `services/` da própria feature. `@/*` no `tsconfig.json` aponta pra raiz, então imports
de feature usam caminho absoluto: `@/features/finance/transactions/hooks/useTransactions`.

Fluxo: `Page → Componente de feature → Hooks da feature → Services da feature → Supabase`.

## 2. O que já está pronto (não mexer, só usar)

- `types/{project,transaction,asset,user,report}.ts` — interfaces extraídas do monólito
- `utils/{currency,date,csv,calculations,validators}.ts`
- `lib/utils.ts` — `cn`, `safeJsonParse`, `cleanUndefined`, `generatePureId`
- `lib/supabase.ts` — client + tipos `DBProject`/`DBTransaction`/`DBAsset`/`DBUser` (schema snake_case)
- `lib/validators.ts` — schemas zod (`projectSchema`, `transactionSchema`, `assetSchema`, `loginSchema`)
- `services/{project,transaction,asset,auth,upload}.service.ts` — CRUD + realtime subscribe, convertendo DB (snake_case) ↔ domínio (camelCase)
- `hooks/{useProjects,useTransactions,useAssets,useReports,useCategories,useCsvImport}.ts` — TanStack Query já ligado aos services
- `contexts/{AuthContext,ThemeContext}.tsx` — únicos contexts que sobraram; `ProjectContext`/`TransactionContext`/`AssetContext` foram **removidos** (dados agora vêm dos hooks acima)
- `components/providers/{QueryProvider,AppProviders}.tsx` — já plugados em `app/layout.tsx`
- `components/ui/*` — renomeado pro padrão shadcn (`button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `avatar.tsx`, `tabs.tsx`, `tooltip.tsx`, `select.tsx`, `dialog.tsx`, `sheet.tsx`, `skeleton.tsx`)
- `components/nexo/*` — NexoButton, NexoCard, NexoPage, NexoSection, NexoSearch, NexoLoading, NexoEmpty
- `components/common/*` — Currency, DateLabel, MoneyInput, CategoryBadge, StatusChip, SearchBar, ProjectSelector, DataTable, PWARegister
- `components/dialogs/ConfirmDialog.tsx`
- `components/layout/*` — AppShell, Header, UserMenu, BottomNavigation, FloatingActionButton, PageContainer
- Rotas criadas (ainda apontando pra `*Screen.tsx` vazios): `app/dashboard/{projetos,transacoes,patrimonio,relatorios}/page.tsx`, `app/configuracoes/page.tsx`, `app/perfil/page.tsx`, `app/login/page.tsx`
- `app/components/PWARegister.tsx` foi movido pra `components/common/` (app/ só pode ter rotas)
- `npx tsc --noEmit` passa limpo em tudo isso (rodei antes de parar)

**Ainda vazios / stubs**: `components/{projects,transactions,assets,reports}/*.tsx` (exceto os que citei acima), `components/charts/*`, `components/forms/*`, `hooks/use-mobile.ts` e `hooks/useLocalStorage.ts`/`useDebounce.ts` (triviais, resolver por último).

## 3. O que falta: fatiar `app/page.tsx`

Mapa das 14 telas dentro do monólito (linhas aproximadas, vão mudar conforme
você for cortando — sempre confira com `grep -n "currentScreen === '" app/page.tsx`
antes de cada corte):

| Tela (`currentScreen`)   | Linhas aprox. | Destino sugerido |
|---|---|---|
| `welcome`                | 2052–2222 | `components/nexo/HomeScreen.tsx` (landing pública) |
| `register`                | 2223–2406 | fluxo de cadastro dentro de `components/nexo/LoginScreen.tsx` (usar `signUpWithEmail` de `services/auth.service.ts`) |
| `new-project`             | 2407–2712 | `components/projects/ProjectForm.tsx` + `ProjectDialog.tsx` |
| `dashboard`               | 2713–3045 | `components/nexo/DashboardScreen.tsx` (usar `useProjects`, `useTransactions`, `utils/calculations.ts`) |
| `project-detail`          | 3046–3549 | novo: `components/projects/ProjectDetailScreen.tsx` (+ rota `app/dashboard/projetos/[id]/page.tsx`) |
| `transactions`            | 3550–3861 | `components/transactions/TransactionsScreen.tsx` |
| `importar-extrato`        | 3862–4420 | `components/transactions/ImportCsvDialog.tsx` (já existe `hooks/useCsvImport.ts` pronto pra ligar aqui) |
| `regras-inteligentes`     | 4421–4827 | `components/transactions/CategoryManager.tsx` (ou um novo `RulesScreen.tsx` dentro de `transactions/`) |
| `patrimonio`               | 4828–5094 | `components/assets/AssetsScreen.tsx` |
| `novo-patrimonio`          | 5095–5458 | `components/assets/AssetForm.tsx` |
| `detalhe-patrimonio`       | 5459–6120 | novo: `components/assets/AssetDetailScreen.tsx` (+ rota `app/dashboard/patrimonio/[id]/page.tsx`) |
| `relatorios`               | 6121–6435 | `components/reports/ReportsScreen.tsx` (usar `hooks/useReports.ts`) |
| `colaboracao`              | 6436–6815 | fora do escopo do spec atual — perguntar ao dono do projeto se entra nessa migração ou fica pra depois |
| `edit-profile`             | 6816–7704 | `components/nexo/ProfileScreen.tsx` |

### Passo a passo recomendado (uma tela por vez)

1. `grep -n "currentScreen === '<nome>'" app/page.tsx` pra confirmar o range atual.
2. Ler só aquele bloco JSX (`sed -n 'INICIO,FIMp' app/page.tsx` ou abrir no editor).
3. Identificar: quais `useState` locais aquela tela usa, quais handlers, quais chamadas ao Supabase.
4. Reescrever a tela no componente de destino:
   - Estado de dados (projects/transactions/assets) → trocar pelos hooks (`useProjects()`, etc.), **não** recriar `useState` local pra isso.
   - Estado puramente de UI (form aberto, aba ativa, campo de busca) → pode continuar como `useState` local do componente novo.
   - Chamada direta a `supabase.from(...)` → trocar pela função equivalente do `services/*.service.ts` (já existem `saveProject`, `saveTransaction`, `saveAsset`, `removeProject`, etc.)
   - Formatação de moeda/data inline (`toLocaleString('pt-BR', ...)`) → trocar por `formatCurrency`/`formatDateBR` de `utils/`.
5. Ligar a rota (`app/dashboard/.../page.tsx`) no componente novo, se ainda não estiver.
6. Rodar `npx tsc --noEmit` (ou `npm run dev` e abrir a tela no navegador).
7. Só depois de compilar/testar, apagar aquele bloco de `app/page.tsx`.
8. Repetir pra próxima tela.

Ordem sugerida (da mais simples pra mais arriscada): `dashboard` → `transactions`
→ `patrimonio` → `relatorios` → `new-project`/`project-detail` →
`novo-patrimonio`/`detalhe-patrimonio` → `importar-extrato` →
`regras-inteligentes` → `welcome`/`register`/`edit-profile` (autenticação por
último, é a parte mais sensível).

## 4. Quando `app/page.tsx` estiver vazio

- Trocar `app/page.tsx` (rota `/`) pra redirecionar: se usuário logado → `/dashboard`, senão → `/login` (usar `useAuth()` de `contexts/AuthContext.tsx`).
- Rodar `npm run build` completo (não só `tsc --noEmit`) pra pegar qualquer coisa que só aparece em build de produção.

## 5. Observações importantes

- O app original faz um **diff manual de coleção inteira** pra sincronizar
  com o Supabase (compara array novo com array antigo, upsert um por um,
  deleta o que sumiu) mais um fallback pra `localStorage` quando offline.
  A arquitetura v2 com TanStack Query **simplifica isso**: cada
  criar/editar/deletar vira uma mutation individual (`saveProject`,
  `removeProject`, etc.) que já invalida a query e resincroniza. Não precisa
  reproduzir o diff manual — é intencionalmente mais simples.
- O fallback offline (localStorage) do app antigo pode ficar de fora por
  enquanto; se for importante, isso vira uma decisão separada de produto (dá
  pra usar o `persistQueryClient` do TanStack Query depois).
- Rotas de detalhe (`project-detail`, `detalhe-patrimonio`) hoje são só
  estado (`selectedProjectId`/`selectedAssetId`); no v2 valem virar rotas
  dinâmicas de verdade: `app/dashboard/projetos/[id]/page.tsx` e
  `app/dashboard/patrimonio/[id]/page.tsx`.
- `.env.local` já tem `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` configurados — não precisa mexer.
- `npx next build` pode falhar no ambiente do Claude.ai por causa do
  `next/font` (tenta buscar fontes do Google e a rede sandbox bloqueia) — mas
  isso **não acontece no VS Code com internet normal**. Use `npm run dev` ou
  `npm run build` normalmente aí.
