export type ProjectType = 'Pessoal' | 'Imóvel' | 'Negócios' | 'Viagem' | 'Outro';

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  type: ProjectType;
  sub: string;
  /** Para o projeto detalhado: valor atual; para os demais: saldo líquido */
  value: number;
  isExpense: boolean;
  monthlyProfit: number;
  trend: number;
  receitas: number;
  despesas: number;
  imageUrl?: string;
}
