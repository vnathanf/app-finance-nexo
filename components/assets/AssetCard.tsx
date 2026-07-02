'use client';

import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import Currency from '@/components/common/Currency';
import type { Asset } from '@/types/asset';

interface AssetCardProps {
  asset: Asset;
  percentOfTotal: number;
}

export default function AssetCard({ asset, percentOfTotal }: AssetCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/dashboard/patrimonio/detalhe?id=${asset.id}`)}
      className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {asset.imageUrl ? (
          <div className="size-10 shrink-0 overflow-hidden rounded-xl bg-muted">
            <img src={asset.imageUrl} alt={asset.name} className="size-full object-cover" />
          </div>
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Building2 className="size-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{asset.name}</p>
          <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
            {asset.category} • <span className="text-primary">{asset.subCategory}</span>
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <Currency value={asset.value} className="block text-sm font-semibold" />
        <span className="text-xs text-muted-foreground">{percentOfTotal.toFixed(1)}% do total</span>
      </div>
    </div>
  );
}
