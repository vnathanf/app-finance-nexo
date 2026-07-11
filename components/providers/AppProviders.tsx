'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/features/auth/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ValuesVisibilityProvider } from '@/contexts/ValuesVisibilityContext';

/**
 * Ponto único que agrega todos os providers globais do app.
 * Usado uma vez em app/layout.tsx.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <ValuesVisibilityProvider>{children}</ValuesVisibilityProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
