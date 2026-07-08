export const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Combustível',
  'Assinaturas',
  'Transporte',
  'Lazer',
  'Material',
  'Saúde',
  'Educação',
  'Reparos',
  'Mensalidades',
  'Aluguel',
  'Condomínio',
  'Energia',
  'Outros',
] as const;

/** Regras de exemplo semeadas uma vez por projeto (por nome de categoria padrão). */
export const EXAMPLE_RULES: { keyword: string; categoryName: string }[] = [
  { keyword: 'Netflix', categoryName: 'Assinaturas' },
  { keyword: 'Uber', categoryName: 'Transporte' },
  { keyword: 'Mercado', categoryName: 'Alimentação' },
];
