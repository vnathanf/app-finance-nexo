'use client';

import { useMemo, useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import NexoLoading from '@/components/nexo/NexoLoading';
import NexoEmpty from '@/components/nexo/NexoEmpty';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NexoButton from '@/components/nexo/NexoButton';
import Currency from '@/components/common/Currency';
import AssetCard from './AssetCard';
import AssetForm from './AssetForm';
import { useAssets } from '@/features/assets/hooks/useAssets';
import { cn, generatePureId } from '@/lib/utils';
import type { Asset, AssetCategory } from '@/features/assets/types/asset';

type CategoryFilter = 'Todos' | 'Imóveis' | 'Investimentos' | 'Veículos' | 'Outros';

const CATEGORY_GROUPS: {
  key: CategoryFilter;
  label: string;
  match: (category: AssetCategory) => boolean;
  color: string;
}[] = [
  { key: 'Imóveis', label: 'Imóveis', match: (c) => c === 'Imóvel', color: '#2a78d6' },
  { key: 'Investimentos', label: 'Investimentos', match: (c) => c === 'Investimentos', color: '#1baf7a' },
  { key: 'Veículos', label: 'Veículos', match: (c) => c === 'Veículos', color: '#eda100' },
  { key: 'Outros', label: 'Outros / Contas', match: (c) => c === 'Outros' || c === 'Contas', color: '#008300' },
];

const FILTER_PILLS: CategoryFilter[] = ['Todos', 'Imóveis', 'Investimentos', 'Veículos', 'Outros'];

function matchesFilter(asset: Asset, filter: CategoryFilter) {
  if (filter === 'Todos') return true;
  const group = CATEGORY_GROUPS.find((g) => g.key === filter);
  return group ? group.match(asset.category) : true;
}

interface AssetsTabProps {
  projectId: string;
}

export default function AssetsTab({ projectId }: AssetsTabProps) {
  const { assets, saveAsset, isLoading: isLoadingAssets } = useAssets();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Todos');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const scopedAssets = useMemo(() => assets.filter((a) => a.projectId === projectId), [assets, projectId]);

  const totalValue = scopedAssets.reduce((sum, a) => sum + a.value, 0);

  const composition = useMemo(() => {
    return CATEGORY_GROUPS.map((group) => {
      const sum = scopedAssets.filter((a) => group.match(a.category)).reduce((s, a) => s + a.value, 0);
      const pct = totalValue > 0 ? (sum / totalValue) * 100 : 0;
      return { ...group, sum, pct };
    });
  }, [scopedAssets, totalValue]);

  const filteredAssets = scopedAssets.filter((a) => matchesFilter(a, categoryFilter));

  if (isLoadingAssets) {
    return <NexoLoading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Card className="flex-1 gap-1 bg-[#101625] p-3 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Patrimônio consolidado</p>
          <div className="flex items-center justify-between">
            <Currency value={totalValue} className="block text-lg font-bold text-white" />
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
              <Wallet className="size-4 text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <NexoButton size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-3.5" /> Cadastrar
        </NexoButton>
      </div>

      {scopedAssets.length === 0 ? (
        <NexoEmpty
          title="Sem bens patrimoniais"
          description="Não existem bens cadastrados neste projeto no momento."
        />
      ) : (
        <>
          <Card className="gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Composição do patrimônio
            </p>

            <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
              {composition
                .filter((group) => group.pct > 0)
                .map((group) => (
                  <div
                    key={group.key}
                    style={{ width: `${group.pct}%`, backgroundColor: group.color }}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    title={`${group.label}: ${group.pct.toFixed(1)}%`}
                  />
                ))}
            </div>

            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1 text-xs font-medium">
              {composition.map((group) => (
                <li key={group.key} className="flex items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
                  <span className="text-foreground">{group.label}</span>
                  <span className="text-muted-foreground">({group.pct.toFixed(1)}%)</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill}
                onClick={() => setCategoryFilter(pill)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition',
                  categoryFilter === pill
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {pill}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredAssets.length === 0 ? (
              <NexoEmpty title="Nenhum bem encontrado para este filtro" />
            ) : (
              filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  percentOfTotal={totalValue > 0 ? (asset.value / totalValue) * 100 : 0}
                />
              ))
            )}
          </div>
        </>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo patrimônio</DialogTitle>
          </DialogHeader>
          <AssetForm
            projectId={projectId}
            submitLabel="Cadastrar"
            onSubmit={async (values) => {
              await saveAsset({
                id: generatePureId('ast'),
                name: values.name,
                category: values.category,
                subCategory: values.subCategory || 'Ativo',
                value: values.value,
                description: values.description || 'Sem descrição cadastrada.',
                customFields: values.customFields,
                documents: [],
                imageUrl: values.imageUrl || undefined,
                projectId: values.projectId,
              });
              setIsCreateOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
