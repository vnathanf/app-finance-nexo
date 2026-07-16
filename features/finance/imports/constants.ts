/**
 * Linhas de extrato que não são transações reais — saldo (inicial, do dia,
 * total, anterior) e rendimento/aplicação automática intercalados entre
 * lançamentos. Comparado contra a coluna mapeada como Descrição.
 */
export const NON_TRANSACTION_PATTERNS: RegExp[] = [
  /^SALDO\b/i,
  /SALDO\s+(ANTERIOR|ATUAL|TOTAL|DO\s+DIA|DISPON[ÍI]VEL|BLOQUEADO|EM\s+C\/?C)/i,
  /RENDIMENTO/i,
  /APLICA[ÇC][ÃA]O\s+AUTOM[ÁA]TICA/i,
  /RESGATE\s+AUTOM[ÁA]TICO/i,
];

export function isNonTransactionDescription(title: string): boolean {
  return NON_TRANSACTION_PATTERNS.some((pattern) => pattern.test(title));
}
