'use client';

import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import NexoSearch from '@/components/nexo/NexoSearch';
import { cn } from '@/lib/utils';

interface ProjectHeaderProps {
  showSearch: boolean;
  onToggleSearch: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

export default function ProjectHeader({
  showSearch,
  onToggleSearch,
  searchQuery,
  onSearchQueryChange,
}: ProjectHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Seus projetos</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSearch}
            aria-label="Buscar projetos"
            className={cn(
              'rounded-md p-1.5 transition',
              showSearch ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Search className="size-4" />
          </button>
          <Link
            href="/dashboard/projetos/novo"
            aria-label="Criar novo projeto"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-4" />
          </Link>
        </div>
      </div>

      {showSearch && (
        <NexoSearch value={searchQuery} onChange={onSearchQueryChange} placeholder="Pesquisar projetos..." />
      )}
    </div>
  );
}
