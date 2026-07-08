'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, X } from 'lucide-react';
import NexoPage from '@/components/nexo/NexoPage';
import NexoLoading from '@/components/nexo/NexoLoading';
import NexoEmpty from '@/components/nexo/NexoEmpty';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import Currency from '@/components/common/Currency';
import AssetForm from './AssetForm';
import AssetDocuments from './AssetDocuments';
import { useAssets } from '@/features/assets/hooks/useAssets';
import { cn } from '@/lib/utils';

export default function AssetDetailScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetId = searchParams.get('id') ?? '';
  const { assets, saveAsset, isSavingAsset, deleteAsset, isLoading: isLoadingAssets } = useAssets();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const asset = assets.find((a) => a.id === assetId) ?? null;

  if (isLoadingAssets) {
    return (
      <NexoPage>
        <NexoLoading />
      </NexoPage>
    );
  }

  if (!asset) {
    return (
      <NexoPage>
        <NexoEmpty title="Patrimônio não encontrado" description="Ele pode ter sido removido." />
        <Link href="/dashboard/projetos" className="mt-4 block text-center text-sm font-medium text-primary">
          Voltar para projetos
        </Link>
      </NexoPage>
    );
  }

  return (
    <NexoPage>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/dashboard/projetos/detalhe?id=${asset.projectId}&tab=patrimonio`}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="truncate text-lg font-semibold">{asset.name}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setIsEditing((prev) => !prev)}
            className={cn(
              'rounded-md p-1.5 transition',
              isEditing ? 'bg-primary text-primary-foreground' : 'text-primary hover:bg-primary/10'
            )}
            title={isEditing ? 'Cancelar edição' : 'Editar patrimônio'}
          >
            {isEditing ? <X className="size-4" /> : <Edit2 className="size-4" />}
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="rounded-md p-1.5 text-destructive transition hover:bg-destructive/10"
              title="Remover patrimônio"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <AssetForm
          projectId={asset.projectId}
          initialValues={{
            name: asset.name,
            category: asset.category,
            subCategory: asset.subCategory,
            value: asset.value,
            description: asset.description,
            imageUrl: asset.imageUrl ?? '',
            projectId: asset.projectId,
            customFields: asset.customFields,
          }}
          submitLabel="Salvar alterações"
          isSubmitting={isSavingAsset}
          onCancel={() => setIsEditing(false)}
          onSubmit={async (values) => {
            await saveAsset({
              ...asset,
              name: values.name,
              category: values.category,
              subCategory: values.subCategory,
              value: values.value,
              description: values.description,
              imageUrl: values.imageUrl || undefined,
              projectId: values.projectId,
              customFields: values.customFields,
            });
            setIsEditing(false);
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
            {asset.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.imageUrl} alt={asset.name} className="absolute inset-0 size-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                Sem imagem
              </div>
            )}
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-3.5">
              <Currency value={asset.value} className="text-lg font-bold text-white" />
            </div>
          </div>

          <div className="flex gap-1.5">
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {asset.category}
            </span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {asset.subCategory}
            </span>
          </div>

          {asset.description && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</p>
              <p className="text-sm text-foreground">{asset.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Especificações</p>
            {asset.customFields.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">Nenhum campo personalizado cadastrado.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {asset.customFields.map((field, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-card p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {field.label}
                    </p>
                    <p className="truncate text-sm font-semibold">{field.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AssetDocuments
            projectId={asset.projectId}
            documents={asset.documents}
            disabled={isSavingAsset}
            onAdd={(doc) => saveAsset({ ...asset, documents: [...asset.documents, doc] })}
            onRemove={(index) => saveAsset({ ...asset, documents: asset.documents.filter((_, i) => i !== index) })}
          />
        </div>
      )}

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Remover patrimônio"
        description={`Tem certeza que deseja excluir "${asset.name}"?`}
        confirmLabel="Sim, remover"
        variant="destructive"
        onConfirm={async () => {
          await deleteAsset(asset.id);
          router.push(`/dashboard/projetos/detalhe?id=${asset.projectId}&tab=patrimonio`);
        }}
      />
    </NexoPage>
  );
}
