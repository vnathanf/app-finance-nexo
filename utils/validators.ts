export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isPositiveAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
