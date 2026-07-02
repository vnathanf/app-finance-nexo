export interface ParsedCsvRow {
  [column: string]: string;
}

/** Parser de CSV simples (vírgula ou ponto-e-vírgula), com suporte a campos entre aspas. */
export function parseCsv(text: string): { headers: string[]; rows: ParsedCsvRow[] } {
  const delimiter = text.includes(';') && !text.includes(',') ? ';' : ',';
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row: ParsedCsvRow = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return row;
  });

  return { headers, rows };
}

export interface ImportedTransactionRow {
  title: string;
  amount: number;
  date: string;
  type: 'Receita' | 'Despesa';
  selected: boolean;
}

/**
 * Converte linhas de CSV de extrato bancário em transações candidatas à importação.
 * Assume colunas comuns de extrato: data, descrição/título e valor.
 * Valores negativos viram Despesa; positivos, Receita.
 */
export function mapCsvRowsToTransactions(rows: ParsedCsvRow[]): ImportedTransactionRow[] {
  return rows
    .map((row) => {
      const dateKey = Object.keys(row).find((k) => /data|date/i.test(k));
      const titleKey = Object.keys(row).find((k) => /descri|hist|title|memo/i.test(k));
      const amountKey = Object.keys(row).find((k) => /valor|amount|value/i.test(k));

      const rawAmount = (amountKey ? row[amountKey] : '0').replace(/\./g, '').replace(',', '.');
      const amount = parseFloat(rawAmount) || 0;

      return {
        title: titleKey ? row[titleKey] : 'Transação importada',
        date: dateKey ? row[dateKey] : '',
        amount: Math.abs(amount),
        type: amount < 0 ? 'Despesa' : 'Receita',
        selected: true,
      } as ImportedTransactionRow;
    })
    .filter((tx) => tx.date);
}
