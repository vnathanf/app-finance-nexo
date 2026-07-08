'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RuleSuggestionsList from './RuleSuggestionsList';
import { suggestRules } from '@/features/finance/categories/utils/suggestRules';
import type { Transaction } from '@/features/finance/transactions/types/transaction';
import type { Category } from '@/features/finance/categories/types/category';
import type { Rule } from '@/features/finance/categories/types/rule';

interface RuleSuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  categories: Category[];
  rules: Rule[];
  onAccept: (keyword: string, categoryId: string) => Promise<void>;
  isSaving: boolean;
}

export default function RuleSuggestionsDialog({
  open,
  onOpenChange,
  transactions,
  categories,
  rules,
  onAccept,
  isSaving,
}: RuleSuggestionsDialogProps) {
  const suggestions = useMemo(
    () => suggestRules(transactions, categories, rules),
    [transactions, categories, rules]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sugestões de regras</DialogTitle>
        </DialogHeader>
        <RuleSuggestionsList suggestions={suggestions} categories={categories} onAccept={onAccept} isSaving={isSaving} />
      </DialogContent>
    </Dialog>
  );
}
