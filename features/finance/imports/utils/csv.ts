import { isNonTransactionDescription } from '@/features/finance/imports/constants';

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
 * O delimitador é decidido pela primeira linha não vazia — não pelo arquivo inteiro, porque
 * extratos brasileiros usam vírgula como separador decimal (ex: "7,00") dentro das
 * linhas, o que confundiria uma detecção baseada no texto todo. Devolve TODAS as linhas
 * cruas (array de arrays) — nenhuma é tratada como cabeçalho aqui, isso é escolhido
 * depois pelo usuário (ver rowsFromAOA).
 */
export function parseCsvToAOA(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

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

  return lines.map(parseLine);
}

function excelCellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    // UTC pra bater com o jeito que exceljs monta datas de célula formatada
    // como data — ler em horário local pode empurrar pro dia anterior
    // dependendo do fuso (ex: meia-noite UTC vira 21h do dia anterior no Brasil).
    const day = String(value.getUTCDate()).padStart(2, '0');
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${value.getUTCFullYear()}`;
  }
  if (typeof value === 'object') {
    const obj = value as { richText?: { text: string }[]; result?: unknown; text?: string };
    if (obj.richText) return obj.richText.map((r) => r.text).join('');
    if ('result' in obj) return String(obj.result ?? '');
    if (obj.text) return obj.text;
  }
  return String(value);
}

/** Lê a primeira planilha de um .xlsx como linhas cruas (array de arrays), mesmo shape do parser de CSV. */
export async function readXlsxRows(file: File): Promise<string[][]> {
  const ExcelJS = (await import('exceljs')).default;
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const cellCount = Math.max(row.cellCount, sheet.columnCount);
    const cells: string[] = [];
    for (let i = 1; i <= cellCount; i++) {
      cells.push(excelCellToString(row.getCell(i).value));
    }
    rows.push(cells);
  });
  return rows;
}

/** Lê um arquivo CSV ou Excel (.xlsx/.xls) como linhas cruas, decidindo o parser pelo nome/tipo do arquivo. */
export async function readWorkbookRows(file: File): Promise<string[][]> {
  const isExcel = /\.xlsx?$/i.test(file.name) || /spreadsheet|excel/i.test(file.type);
  if (isExcel) return readXlsxRows(file);
  const text = await readCsvFile(file);
  return parseCsvToAOA(text);
}

const DATE_LIKE = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;
const AMOUNT_LIKE = /-?\(?\s*(r\$)?\s*\d{1,3}(\.\d{3})*,\d{2}\)?/i;

/**
 * Chuta em qual linha crua fica o cabeçalho: a primeira linha com pelo menos
 * 2 células preenchidas cuja linha seguinte já parece dado real (tem data ou
 * valor monetário) — extratos reais têm metadado (conta, período) acima disso.
 * O usuário sempre confirma/ajusta antes de seguir, isso é só o ponto de partida.
 */
export function guessHeaderRowIndex(aoa: string[][]): number {
  const limit = Math.min(aoa.length, 15);
  for (let i = 0; i < limit - 1; i++) {
    const nonEmpty = aoa[i].filter((c) => c.trim().length > 0).length;
    if (nonEmpty < 2) continue;
    const nextRow = aoa[i + 1];
    const looksLikeData = nextRow.some((c) => DATE_LIKE.test(c.trim()) || AMOUNT_LIKE.test(c.trim()));
    if (looksLikeData) return i;
  }
  return 0;
}

/** Converte linhas cruas em {headers, rows} a partir da linha de cabeçalho escolhida — o que estava acima é descartado. */
export function rowsFromAOA(aoa: string[][], headerRowIndex: number): { headers: string[]; rows: ParsedCsvRow[] } {
  if (aoa.length === 0 || headerRowIndex < 0 || headerRowIndex >= aoa.length) {
    return { headers: [], rows: [] };
  }
  const headers = aoa[headerRowIndex].map((h) => h.trim());
  const rows = aoa.slice(headerRowIndex + 1).map((cells) => {
    const row: ParsedCsvRow = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim();
    });
    return row;
  });
  return { headers, rows };
}

export interface ColumnMapping {
  date: string;
  title: string;
  amount: string;
  /** Uma ou mais colunas — os valores são concatenados com " | ", nessa ordem. */
  notes: string[];
  /** Opcional — usado na categorização automática por padrão e no dedup. */
  cpfCnpj?: string;
  /** Opcional — não vira transação, só ajuda a reconhecer linhas de saldo pra ignorar. */
  saldo?: string;
}

/** Sugestão inicial de mapeamento por nome de coluna — o usuário confirma ou ajusta. */
export function guessColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const find = (re: RegExp) => headers.find((h) => re.test(h));
  const notesGuess = find(/obs|nota|coment/i);
  return {
    date: find(/data|date/i),
    title: find(/descri|hist|title|memo/i),
    amount: find(/valor|amount|value/i),
    cpfCnpj: find(/cpf|cnpj|documento/i),
    saldo: find(/saldo/i),
    notes: notesGuess ? [notesGuess] : [],
  };
}

export interface ImportedTransactionRow {
  title: string;
  amount: number;
  date: string;
  type: 'Receita' | 'Despesa';
  notes?: string;
  cpfCnpj?: string;
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
 * Converte um valor de extrato bancário (ex: "R$ 1.160,84", "-R$ 50,00", "(50,00)")
 * em número, descartando símbolo de moeda e espaços e preservando o sinal —
 * inclusive o formato contábil entre parênteses para negativo.
 */
function parseAmount(raw: string): number {
  const isParenNegative = /\(.*\)/.test(raw);
  const cleaned = raw
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const value = parseFloat(cleaned) || 0;
  return isParenNegative ? -Math.abs(value) : value;
}

export interface IgnoredRow {
  title: string;
  date: string;
}

export interface BuildTransactionRowsResult {
  rows: ImportedTransactionRow[];
  /** Linhas descartadas por parecerem saldo/rendimento automático, não uma transação real — nunca some sem avisar. */
  ignored: IgnoredRow[];
}

/**
 * Converte linhas cruas em transações candidatas, usando o mapeamento de colunas
 * escolhido pelo usuário. Linhas sem data válida (ex: metadado solto) são
 * descartadas silenciosamente; linhas de saldo/rendimento (ver NON_TRANSACTION_PATTERNS)
 * e repetidas (mesmo título+data+valor) também são descartadas, mas as de
 * saldo/rendimento voltam em `ignored` pra ficarem visíveis na tela de import.
 */
export function buildTransactionRows(rows: ParsedCsvRow[], mapping: ColumnMapping): BuildTransactionRowsResult {
  const seen = new Set<string>();
  const ignored: IgnoredRow[] = [];
  const result: ImportedTransactionRow[] = [];

  for (const row of rows) {
    const rawTitle = row[mapping.title] || 'Transação importada';
    const date = parseDateToISO(row[mapping.date] ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    if (isNonTransactionDescription(rawTitle)) {
      ignored.push({ title: rawTitle, date });
      continue;
    }

    const amount = parseAmount(row[mapping.amount] ?? '0');
    const notes =
      (mapping.notes ?? [])
        .map((col) => row[col]?.trim())
        .filter((v): v is string => !!v)
        .join(' | ') || undefined;
    const cpfCnpj = mapping.cpfCnpj ? row[mapping.cpfCnpj]?.trim() || undefined : undefined;

    const tx: ImportedTransactionRow = {
      title: rawTitle,
      date,
      amount: Math.abs(amount),
      type: amount < 0 ? 'Despesa' : 'Receita',
      notes,
      cpfCnpj,
    };

    const dedupeKey = `${tx.title}__${tx.date}__${tx.amount}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    result.push(tx);
  }

  return { rows: result, ignored };
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
      cpfCnpj: row.cpfCnpj,
      installment: { current: k, total },
    });
  }
  return series;
}
