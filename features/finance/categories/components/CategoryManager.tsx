'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NexoButton from '@/components/nexo/NexoButton';
import { useCategories } from '@/features/finance/categories/hooks/useCategories';

export default function CategoryManager() {
  const { categories, addCategory, isAddingCategory, removeCategory, isRemovingCategory } = useCategories();
  const [newCategory, setNewCategory] = useState('');

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
      <p className="text-sm font-semibold">Categorias</p>

      <div className="flex gap-2">
        <Input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Ex: Marketing, Investimentos..."
          disabled={isAddingCategory}
        />
        <NexoButton
          type="button"
          loading={isAddingCategory}
          onClick={() => {
            addCategory(newCategory);
            setNewCategory('');
          }}
        >
          Criar
        </NexoButton>
      </div>

      <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pt-1">
        {categories.map((cat) => {
          const removing = isRemovingCategory(cat.id);
          return (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium"
            >
              {cat.name}
              <button
                onClick={() => removeCategory(cat.id)}
                disabled={removing}
                className="text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                {removing ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
