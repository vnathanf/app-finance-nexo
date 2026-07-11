'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface ValuesVisibilityContextValue {
  hidden: boolean;
  toggleHidden: () => void;
}

const ValuesVisibilityContext = createContext<ValuesVisibilityContextValue | undefined>(undefined);

/**
 * Estado só em memória, de propósito: cada entrada no app começa com os
 * valores visíveis — não persiste em localStorage — quem quiser ocultar
 * precisa apertar o botão de novo.
 */
export function ValuesVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const toggleHidden = () => setHidden((prev) => !prev);

  return <ValuesVisibilityContext.Provider value={{ hidden, toggleHidden }}>{children}</ValuesVisibilityContext.Provider>;
}

export function useValuesVisibility() {
  const ctx = useContext(ValuesVisibilityContext);
  if (!ctx) throw new Error('useValuesVisibility deve ser usado dentro de <ValuesVisibilityProvider>');
  return ctx;
}
