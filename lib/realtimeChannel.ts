import { supabase } from '@/lib/supabase';

type Listener = () => void;

interface SharedChannel {
  channel: ReturnType<typeof supabase.channel>;
  listeners: Set<Listener>;
}

const sharedChannels = new Map<string, SharedChannel>();

/**
 * Compartilha UM canal Realtime por tabela entre todos os componentes que
 * assinam a mesma tabela ao mesmo tempo (ex: um projeto com várias telas
 * chamando `useTransactions()` simultaneamente). Sem isso, cada chamada do
 * hook abria sua própria conexão WebSocket — o mesmo dado sendo escutado
 * várias vezes em paralelo. O primeiro assinante abre o canal; o último a
 * sair (todos os `listeners` removidos) fecha.
 */
export function subscribeToTableChanges(table: string, onChange: Listener): () => void {
  let entry = sharedChannels.get(table);
  if (!entry) {
    const listeners = new Set<Listener>();
    const channel = supabase
      .channel(`shared-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        listeners.forEach((listener) => listener());
      })
      .subscribe();
    entry = { channel, listeners };
    sharedChannels.set(table, entry);
  }

  entry.listeners.add(onChange);

  return () => {
    const current = sharedChannels.get(table);
    if (!current) return;
    current.listeners.delete(onChange);
    if (current.listeners.size === 0) {
      void supabase.removeChannel(current.channel);
      sharedChannels.delete(table);
    }
  };
}
