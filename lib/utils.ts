import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Faz JSON.parse com segurança, devolvendo um fallback tipado em caso de erro
 * ou de valor ausente/corrompido (ex: vindo do localStorage).
 */
export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value || value === 'undefined' || value === 'null') return fallback
  try {
    const parsed = JSON.parse(value)
    if (parsed === null || parsed === undefined) return fallback
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback
    }
    return parsed as T
  } catch (e) {
    console.error('Failed to parse JSON:', e)
    return fallback
  }
}

/** Remove recursivamente chaves com valor `undefined` (Supabase/Postgres não aceita undefined). */
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanUndefined(item)) as unknown as T
  }
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key]
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val)
      }
    }
    return cleaned as T
  }
  return obj
}

/** Gera um ID local (usado para otimistic updates antes da confirmação do Supabase). */
export function generatePureId(prefix: string): string {
  try {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
  } catch (_) {
    return `${prefix}_${Math.floor(Math.random() * 10000000)}`
  }
}
