export type ProjectType = 'Pessoal' | 'Negócios' | 'Planejamento';

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
  /** Valor-alvo pra projetos de planejamento (viagem, compra de um bem etc). Editado na tela de Relatórios. */
  goalAmount?: number;
}
