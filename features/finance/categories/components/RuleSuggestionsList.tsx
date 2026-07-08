'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { RuleSuggestion } from '@/features/finance/categories/utils/suggestRules';
import type { Category } from '@/features/finance/categories/types/category';

interface RuleSuggestionsListProps {
  suggestions: RuleSuggestion[];
  categories: Category[];
  onAccept: (keyword: string, categoryId: string) => Promise<void>;
  isSaving: boolean;
}

export default function RuleSuggestionsList({ suggestions, categories, onAccept, isSaving }: RuleSuggestionsListProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [acceptingKeyword, setAcceptingKeyword] = useState<string | null>(null);

  const visible = suggestions.filter((s) => !dismissed.has(s.keyword));

  if (visible.length === 0) {
    return <p className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">Nenhuma sugestão no momento.</p>;
  }

  return (
    <div className="space-y-2">
      {visible.map((suggestion) => {
        const categoryId = picked[suggestion.keyword] ?? suggestion.categoryId ?? '';
        return (
          <div
            key={suggestion.keyword}
            className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Se contém &quot;{suggestion.keyword}&quot;</p>
              <p className="text-xs text-muted-foreground">
                {suggestion.occurrences} transaç{suggestion.occurrences > 1 ? 'ões' : 'ão'}
              </p>
            </div>
            <Select value={categoryId} onValueChange={(v) => setPicked((prev) => ({ ...prev, [suggestion.keyword]: v }))}>
              <SelectTrigger className="h-8 w-36 shrink-0 text-xs">
                <SelectValue placeholder="Escolher categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex shrink-0 items-center gap-1">
              <button
                disabled={!categoryId || isSaving}
                onClick={async () => {
                  setAcceptingKeyword(suggestion.keyword);
                  try {
                    await onAccept(suggestion.keyword, categoryId);
                    setDismissed((prev) => new Set(prev).add(suggestion.keyword));
                  } finally {
                    setAcceptingKeyword(null);
                  }
                }}
                aria-label="Adicionar regra"
                title="Adicionar regra"
                className="rounded-md p-1 text-muted-foreground transition hover:bg-primary/10 hover:text-primary disabled:opacity-40"
              >
                <Check className="size-4" />
              </button>
              <button
                disabled={isSaving && acceptingKeyword === suggestion.keyword}
                onClick={() => setDismissed((prev) => new Set(prev).add(suggestion.keyword))}
                aria-label="Descartar sugestão"
                title="Descartar"
                className="rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
