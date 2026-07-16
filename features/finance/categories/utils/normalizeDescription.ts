/**
 * Normaliza a descrição de uma transação pra virar uma chave de matching
 * estável entre lançamentos do mesmo comerciante — remove acento, caixa e
 * tokens que parecem código/autorização aleatória (ex: "UBER *TRIP 8x2j3" →
 * "UBER TRIP"). Não altera o título exibido ao usuário, só a chave interna
 * usada pra aprender/sugerir categoria.
 */
export function normalizeDescription(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((token) => token.length >= 3 && !/\d{2,}/.test(token))
    .join(' ')
    .trim();
}
