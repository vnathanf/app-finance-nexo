export const MONTH_NAMES: Record<string, string> = {
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Março',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro',
};

/** Recebe uma data YYYY-MM-DD e devolve o nome do mês em português. */
export function getMonthName(dateOrMonth: string): string {
  const mm = dateOrMonth.includes('-') ? dateOrMonth.split('-')[1] : dateOrMonth;
  return MONTH_NAMES[mm] ?? mm;
}

/** Retorna a data de hoje no formato YYYY-MM-DD (usado como default em formulários). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Formata YYYY-MM-DD para DD/MM/AAAA. */
export function formatDateBR(dateISO: string): string {
  const [y, m, d] = dateISO.split('-');
  if (!y || !m || !d) return dateISO;
  return `${d}/${m}/${y}`;
}

/** Retorna a chave "YYYY-MM" de uma data ISO, usada para agrupar por mês. */
export function toMonthKey(dateISO: string): string {
  return dateISO.slice(0, 7);
}
