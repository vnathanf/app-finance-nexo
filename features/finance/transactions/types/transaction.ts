export type TransactionType = 'Receita' | 'Despesa';

export interface Transaction {
  id: string;
  title: string;
  type: TransactionType;
  projectId: string;
  categoryId: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  notes?: string;
  cpfCnpj?: string;
}
