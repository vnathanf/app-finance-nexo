'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NexoButton from '@/components/nexo/NexoButton';
import { useCategories } from '@/features/finance/categories/hooks/useCategories';
import { DEFAULT_CATEGORIES } from '@/features/finance/categories/constants';

export default function CategoryManager() {
  const { categories, addCategory, removeCategory } = useCategories();
  const [newCategory, setNewCategory] = useState('');

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
      <p className="text-sm font-semibold">Categorias</p>

      <div className="flex gap-2">
        <Input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Ex: Marketing, Investimentos..."
        />
        <NexoButton
          type="button"
          onClick={() => {
            addCategory(newCategory);
            setNewCategory('');
          }}
        >
          Criar
        </NexoButton>
      </div>

      <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pt-1">
        {categories.map((cat) => (
          <span
            key={cat.id}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium"
          >
            {cat.name}
            {!(DEFAULT_CATEGORIES as readonly string[]).includes(cat.name) && (
              <button onClick={() => removeCategory(cat.id)} className="text-muted-foreground hover:text-destructive">
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
