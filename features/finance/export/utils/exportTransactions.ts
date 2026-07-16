import type { Transaction } from '@/features/finance/transactions/types/transaction';
import type { Category } from '@/features/finance/categories/types/category';
import { resolveCategoryName } from '@/features/finance/categories/utils/category';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gera e baixa um .xlsx com as transações do projeto no período informado —
 * pra mandar pro contador. Débito e crédito ficam em colunas separadas (não
 * valor único com sinal) e a categoria sai como nome legível, nunca id interno.
 */
export async function exportTransactionsToXlsx(
  transactions: Transaction[],
  categories: Category[],
  startDate: string,
  endDate: string
): Promise<void> {
  const filtered = transactions
    .filter((tx) => tx.date >= startDate && tx.date <= endDate)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transações');
  sheet.columns = [
    { header: 'Data', key: 'date', width: 12 },
    { header: 'Descrição/Razão Social', key: 'title', width: 34 },
    { header: 'CPF/CNPJ', key: 'cpfCnpj', width: 18 },
    { header: 'Categoria', key: 'category', width: 20 },
    { header: 'Débito', key: 'debit', width: 14 },
    { header: 'Crédito', key: 'credit', width: 14 },
    { header: 'Observação', key: 'notes', width: 34 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const tx of filtered) {
    sheet.addRow({
      date: tx.date,
      title: tx.title,
      cpfCnpj: tx.cpfCnpj ?? '',
      category: resolveCategoryName(categories, tx.categoryId),
      debit: tx.type === 'Despesa' ? tx.amount : '',
      credit: tx.type === 'Receita' ? tx.amount : '',
      notes: tx.notes ?? '',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `extrato_${startDate}_a_${endDate}.xlsx`);
}
