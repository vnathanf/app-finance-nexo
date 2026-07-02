'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Plus, Sparkles, X } from 'lucide-react';
import NexoPage from '@/components/nexo/NexoPage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import NexoButton from '@/components/nexo/NexoButton';
import CategoryManager from './CategoryManager';
import { useRules } from '@/features/finance/categories/hooks/useRules';
import { useCategories } from '@/features/finance/categories/hooks/useCategories';
import { resolveCategoryName } from '@/features/finance/categories/utils/category';
import type { Rule } from '@/features/finance/categories/types/rule';

export default function RulesScreen() {
  const { rules, addRule, updateRule, removeRule } = useRules();
  const { categories } = useCategories();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(categories[0]?.id ?? '');
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [editKeyword, setEditKeyword] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');

  return (
    <NexoPage>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/transacoes"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-semibold">Regras inteligentes</h1>
        </div>
        <NexoButton size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-3.5" /> Nova regra
        </NexoButton>
      </div>

      <div className="space-y-4">
        <div className="space-y-1 rounded-2xl bg-slate-900 p-3.5 text-white">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Sparkles className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Categorização automática</span>
          </div>
          <p className="text-xs text-slate-300">
            Quando uma transação contém a palavra-chave, a categoria é sugerida automaticamente ao importar ou lançar.
          </p>
        </div>

        <CategoryManager />

        <div className="space-y-2">
          <p className="text-sm font-semibold">Minhas regras ({rules.length})</p>

          {rules.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
              Nenhuma regra cadastrada.
            </p>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">Se contém &quot;{rule.keyword}&quot;</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Categoriza em{' '}
                        <span className="font-semibold text-foreground">
                          {resolveCategoryName(categories, rule.categoryId)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingRule(rule);
                        setEditKeyword(rule.keyword);
                        setEditCategoryId(rule.categoryId);
                      }}
                      className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova regra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Palavra-chave na descrição</label>
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Ex: Netflix, Shell..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <NexoButton type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </NexoButton>
              <NexoButton
                type="button"
                onClick={() => {
                  if (!newKeyword.trim()) return;
                  addRule(newKeyword.trim(), newCategoryId);
                  setNewKeyword('');
                  setIsCreateOpen(false);
                }}
              >
                Criar regra
              </NexoButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar regra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Palavra-chave na descrição</label>
              <Input value={editKeyword} onChange={(e) => setEditKeyword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <NexoButton
                type="button"
                onClick={() => {
                  if (!editingRule || !editKeyword.trim()) return;
                  updateRule(editingRule.id, editKeyword.trim(), editCategoryId);
                  setEditingRule(null);
                }}
              >
                Salvar
              </NexoButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </NexoPage>
  );
}
