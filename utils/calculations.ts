import type { Project } from '@/features/projects/types/project';
import type { Transaction } from '@/features/finance/transactions/types/transaction';
import type { Asset } from '@/features/assets/types/asset';

/** Soma do valor (patrimônio) de todos os projetos. */
export function calculatePatrimonioLiquido(projects: Project[]): number {
  return projects.reduce((acc, p) => acc + (p?.value || 0), 0);
}

/** Soma das receitas de todos os projetos (campo agregado, atualizado no service). */
export function calculateTotalReceitas(projects: Project[]): number {
  return projects.reduce((acc, p) => acc + (p?.receitas || 0), 0);
}

/** Soma das despesas de todos os projetos (campo agregado, atualizado no service). */
export function calculateTotalDespesas(projects: Project[]): number {
  return projects.reduce((acc, p) => acc + (p?.despesas || 0), 0);
}

export function calculateLucro(receitas: number, despesas: number): number {
  return receitas - despesas;
}

/** Recalcula receitas/despesas/lucro de um projeto a partir das transações reais (mais preciso que os campos agregados). */
export function calculateProjectTotals(projectId: string, transactions: Transaction[]) {
  const projectTxs = transactions.filter((t) => t.projectId === projectId);
  const receitas = projectTxs.filter((t) => t.type === 'Receita').reduce((s, t) => s + t.amount, 0);
  const despesas = projectTxs.filter((t) => t.type === 'Despesa').reduce((s, t) => s + t.amount, 0);
  return { receitas, despesas, saldo: receitas - despesas };
}

/** Soma do valor de todos os patrimônios (assets). */
export function calculatePatrimonioTotal(assetValues: number[]): number {
  return assetValues.reduce((acc, v) => acc + (v || 0), 0);
}

/**
 * Recalcula value/receitas/despesas/monthlyProfit de cada projeto ao vivo, a partir
 * dos bens e transações atuais — os campos armazenados em `projects` não são
 * atualizados automaticamente quando uma transação/bem é criado, editado ou removido.
 */
export function deriveProjectsWithLiveTotals(
  projects: Project[],
  transactions: Transaction[],
  assets: Asset[]
): Project[] {
  return projects.map((project) => {
    const value = assets
      .filter((a) => a.projectId === project.id)
      .reduce((sum, a) => sum + (a.value || 0), 0);
    const { receitas, despesas } = calculateProjectTotals(project.id, transactions);
    return { ...project, value, receitas, despesas, monthlyProfit: receitas - despesas };
  });
}
