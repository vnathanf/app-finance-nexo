'use client';

import { useState, type DragEvent, type FormEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import NexoButton from '@/components/nexo/NexoButton';
import MoneyInput from '@/components/common/MoneyInput';
import { assetSchema } from '@/features/assets/types/asset.schema';
import { cn, generatePureId } from '@/lib/utils';
import { uploadFile } from '@/services/upload.service';
import type { AssetCategory, AssetCustomField } from '@/features/assets/types/asset';

const CATEGORIES: AssetCategory[] = ['Imóvel', 'Investimentos', 'Veículos', 'Contas', 'Outros'];

const COVER_PRESETS = [
  { name: 'Imóvel', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80' },
  { name: 'Veículo', url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=300&q=80' },
  { name: 'Investimento', url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=300&q=80' },
  { name: 'Outros', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80' },
];

export interface AssetFormValues {
  name: string;
  category: AssetCategory;
  subCategory: string;
  value: number;
  description: string;
  imageUrl: string;
  projectId: string;
  customFields: AssetCustomField[];
}

interface AssetFormProps {
  /** Todo bem pertence ao projeto ativo — não é mais uma escolha do usuário. */
  projectId: string;
  initialValues?: Partial<AssetFormValues>;
  submitLabel?: string;
  onSubmit: (values: AssetFormValues) => void;
  onCancel?: () => void;
}

export default function AssetForm({ projectId, initialValues, submitLabel = 'Salvar', onSubmit, onCancel }: AssetFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [category, setCategory] = useState<AssetCategory>(initialValues?.category ?? 'Imóvel');
  const [subCategory, setSubCategory] = useState(initialValues?.subCategory ?? '');
  const [valueRaw, setValueRaw] = useState(initialValues?.value ? String(initialValues.value) : '');
  const [valueNumeric, setValueNumeric] = useState(initialValues?.value ?? 0);
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? '');
  const [customFields, setCustomFields] = useState<AssetCustomField[]>(initialValues?.customFields ?? []);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Envie um arquivo de imagem válido.');
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadFile(file, `asset-covers/${generatePureId('cover')}-${file.name}`);
      setImageUrl(url);
      setError(null);
    } catch {
      setError('Falha ao enviar a imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim() || !newFieldValue.trim()) return;
    setCustomFields((prev) => [...prev, { label: newFieldLabel.trim(), value: newFieldValue.trim() }]);
    setNewFieldLabel('');
    setNewFieldValue('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = assetSchema.safeParse({ name: name.trim(), category, value: valueNumeric, projectId });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }
    setError(null);
    onSubmit({
      name: name.trim(),
      category,
      subCategory: subCategory.trim(),
      value: valueNumeric,
      description: description.trim(),
      imageUrl,
      projectId,
      customFields,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nome do bem</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Categoria</label>
          <Select value={category} onValueChange={(v) => setCategory(v as AssetCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status / subclasse</label>
          <Input value={subCategory} onChange={(e) => setSubCategory(e.target.value)} placeholder="Ex: Alugado, Quitado" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Valor estimado (R$)</label>
        <MoneyInput
          value={valueRaw}
          onChange={(raw, numeric) => {
            setValueRaw(raw);
            setValueNumeric(numeric);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Descrição (opcional)</label>
        <textarea
          rows={2}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes adicionais do bem..."
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Imagem de capa (opcional)</label>

        <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
          {imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Capa do bem" className="absolute inset-0 size-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
                title="Remover imagem"
              >
                <X className="size-3.5" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center text-xs text-muted-foreground">
              Sem imagem personalizada
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {COVER_PRESETS.map((preset) => (
            <button
              key={preset.url}
              type="button"
              onClick={() => setImageUrl(preset.url)}
              title={preset.name}
              className={cn(
                'aspect-square overflow-hidden rounded-lg border-2 transition',
                imageUrl === preset.url ? 'border-primary' : 'border-transparent'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preset.url} alt={preset.name} className="size-full object-cover" />
            </button>
          ))}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('asset-cover-file-input')?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-3 text-center transition',
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
          )}
        >
          <Upload className="size-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">
            {isUploading ? 'Enviando imagem...' : 'Arraste uma foto ou clique para escolher'}
          </p>
          <input
            id="asset-cover-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Especificações adicionais (opcional)</label>

        {customFields.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {customFields.map((field, idx) => (
              <span key={idx} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                <strong>{field.label}:</strong> {field.value}
                <button
                  type="button"
                  onClick={() => setCustomFields((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end gap-1.5 rounded-xl border border-border bg-muted/40 p-2.5">
          <div className="flex-1 space-y-1">
            <span className="text-xs text-muted-foreground">Rótulo</span>
            <Input value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="Ex: Área" />
          </div>
          <div className="flex-1 space-y-1">
            <span className="text-xs text-muted-foreground">Valor</span>
            <Input value={newFieldValue} onChange={(e) => setNewFieldValue(e.target.value)} placeholder="Ex: 120m²" />
          </div>
          <NexoButton type="button" size="icon" onClick={handleAddCustomField}>
            +
          </NexoButton>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <NexoButton type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </NexoButton>
        )}
        <NexoButton type="submit" disabled={isUploading}>
          {submitLabel}
        </NexoButton>
      </div>
    </form>
  );
}
