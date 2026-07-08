export interface ParsedCsvRow {
  [column: string]: string;
}

/**
 * Lê o arquivo como texto tentando UTF-8 primeiro; muitos extratos de banco
 * brasileiro exportam em Windows-1252/Latin-1, que sob UTF-8 estrito vira
 * caractere de substituição (ex: "Lançamento" → "Lan�amento").
 */
export async function readCsvFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

/**
 * Parser de CSV simples (vírgula ou ponto-e-vírgula), com suporte a campos entre aspas.
 * O delimitador é decidido pela linha de cabeçalho — não pelo arquivo inteiro, porque
 * extratos brasileiros usam vírgula como separador decimal (ex: "7,00") dentro das
 * linhas, o que confundiria uma detecção baseada no texto todo.
 */
export function parseCsv(text: string): { headers: string[]; rows: ParsedCsvRow[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const semicolons = (lines[0].match(/;/g) || []).length;
  const commas = (lines[0].match(/,/g) || []).length;
  const delimiter = semicolons > commas ? ';' : ',';

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

export interface ColumnMapping {
  date: string;
  title: string;
  amount: string;
  notes?: string;
}

/** Sugestão inicial de mapeamento por nome de coluna — o usuário confirma ou ajusta. */
export function guessColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const find = (re: RegExp) => headers.find((h) => re.test(h));
  return {
    date: find(/data|date/i),
    title: find(/descri|hist|title|memo/i),
    amount: find(/valor|amount|value/i),
    notes: find(/obs|nota|coment/i),
  };
}

export interface ImportedTransactionRow {
  title: string;
  amount: number;
  date: string;
  type: 'Receita' | 'Despesa';
  notes?: string;
  /** Presente quando a linha é uma parcela de uma série marcada manualmente pelo usuário. */
  installment?: { current: number; total: number };
}

/** Normaliza datas de extrato bancário (DD/MM/AAAA, DD-MM-AAAA, DD/MM/AA) para AAAA-MM-DD. */
function parseDateToISO(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) return trimmed;
  const [, day, month, year] = match;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/** Soma (ou subtrai) meses de uma data AAAA-MM-DD. */
export function addMonthsToISO(dateISO: string, months: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().slice(0, 10);
}

/**
 * Converte linhas cruas em transações candidatas, usando o mapeamento de colunas
 * escolhido pelo usuário. Linhas sem data válida (ex: "SALDO ANTERIOR" de extrato)
 * ou repetidas (mesmo título+data+valor) são descartadas.
 */
export function buildTransactionRows(rows: ParsedCsvRow[], mapping: ColumnMapping): ImportedTransactionRow[] {
  const seen = new Set<string>();
  return rows
    .map((row) => {
      const rawAmount = (row[mapping.amount] ?? '0').replace(/\./g, '').replace(',', '.');
      const amount = parseFloat(rawAmount) || 0;
      const date = parseDateToISO(row[mapping.date] ?? '');
      const notes = mapping.notes ? row[mapping.notes]?.trim() || undefined : undefined;

      return {
        title: row[mapping.title] || 'Transação importada',
        date,
        amount: Math.abs(amount),
        type: amount < 0 ? 'Despesa' : 'Receita',
        notes,
      } as ImportedTransactionRow;
    })
    .filter((tx) => /^\d{4}-\d{2}-\d{2}$/.test(tx.date))
    .filter((tx) => {
      const dedupeKey = `${tx.title}__${tx.date}__${tx.amount}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
}

/**
 * Expande uma linha marcada pelo usuário como parcela numa série completa
 * (1..total), com a data deslocada em meses a partir da parcela informada —
 * parcelas anteriores ficam no passado, as seguintes no futuro. A tela de
 * importação decide quais dessas já existem no projeto e pré-desmarca elas.
 */
export function expandInstallmentSeries(
  row: ImportedTransactionRow,
  current: number,
  total: number
): ImportedTransactionRow[] {
  const baseTitle = row.title.trim();
  const series: ImportedTransactionRow[] = [];
  for (let k = 1; k <= total; k++) {
    series.push({
      title: `${baseTitle} (${k}/${total})`,
      amount: row.amount,
      date: addMonthsToISO(row.date, k - current),
      type: row.type,
      notes: row.notes,
      installment: { current: k, total },
    });
  }
  return series;
}
