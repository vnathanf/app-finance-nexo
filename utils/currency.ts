/**
 * Formata um número como moeda brasileira.
 * Ex: formatCurrency(1234.5) -> "R$ 1.234,50"
 */
export function formatCurrency(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
  return `R$ ${formatted}`;
}

/** Formata sem casas decimais, útil para cards/resumos compactos. */
export function formatCurrencyCompact(value: number): string {
  return formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** Formata com o sinal (+ / -) explícito, útil para listas de transações. */
export function formatSignedCurrency(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign} ${formatCurrency(Math.abs(value))}`;
}

/** Converte uma string de input (ex: "1.234,56" ou "1234,56") em número. */
export function parseCurrencyInput(value: string): number {
  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3},)/g, '') // remove separador de milhar
    .replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}
