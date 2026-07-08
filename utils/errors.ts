/** Extrai uma mensagem legível de um erro — cobre `Error` e objetos de erro do Supabase (`{ message }`). */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}
