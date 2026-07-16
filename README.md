# Nexo Finance

Gestão de patrimônio, projetos financeiros e transações de forma intuitiva, moderna e conectada.

## Rodando localmente

**Pré-requisitos:** Node.js

1. Instale as dependências:
   `npm install`
2. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local` (painel do Supabase → Project Settings → API)
3. Rode o app:
   `npm run dev`

## Banco de dados

As migrations SQL ficam em `supabase/migrations/`, em ordem — rode cada uma no SQL Editor do Supabase (Painel → SQL Editor → New query) na sequência.
