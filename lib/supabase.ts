import { createClient } from '@supabase/supabase-js';

// Painel Supabase → Project Settings → API
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Tipos espelhando as tabelas do banco (snake_case) ───────────────────────
// Ficam aqui porque descrevem o schema físico do Supabase, não o domínio do
// app (que usa camelCase e mora em types/*.ts). A tradução entre os dois
// acontece na camada services/.

export interface DBProject {
  id: string;
  owner_id: string;
  name: string;
  type: 'Pessoal' | 'Negócios' | 'Planejamento';
  sub: string;
  value: number;
  is_expense: boolean;
  monthly_profit: number;
  trend: number;
  receitas: number;
  despesas: number;
  image_url?: string | null;
  goal_amount?: number | null;
}

export interface DBTransaction {
  id: string;
  owner_id: string;
  project_id: string;
  title: string;
  type: 'Receita' | 'Despesa';
  category_id: string;
  amount: number;
  date: string;
  notes?: string | null;
}

export interface DBCategory {
  id: string;
  owner_id: string;
  name: string;
}

export interface DBRule {
  id: string;
  owner_id: string;
  project_id: string;
  keyword: string;
  category_id: string;
  confidence: string;
  frequency: string;
}

export interface DBAsset {
  id: string;
  owner_id: string;
  project_id?: string | null;
  name: string;
  category: 'Imóvel' | 'Investimentos' | 'Veículos' | 'Outros' | 'Contas';
  sub_category: string;
  value: number;
  description: string;
  city?: string | null;
  image_url?: string | null;
  custom_fields: { label: string; value: string }[];
  documents: { name: string; size: string; url?: string }[];
}

export interface DBUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
}

export interface DBProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'Editor' | 'Leitor';
  invited_by: string;
  created_at: string;
}

export interface DBProjectInvite {
  id: string;
  project_id: string;
  email: string;
  role: 'Editor' | 'Leitor';
  invited_by: string;
  created_at: string;
}
