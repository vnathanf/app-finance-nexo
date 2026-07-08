'use client';

import { useState, type DragEvent, type FormEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NexoButton from '@/components/nexo/NexoButton';
import { projectSchema } from '@/features/projects/types/project.schema';
import { cn, generatePureId } from '@/lib/utils';
import { uploadFile } from '@/services/upload.service';
import { getErrorMessage } from '@/utils/errors';
import type { ProjectType } from '@/features/projects/types/project';

const PROJECT_TYPES: ProjectType[] = ['Pessoal', 'Negócios', 'Planejamento'];

const COVER_PRESETS = [
  { name: 'Casa M.', url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=300&q=80' },
  { name: 'Apto', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=300&q=80' },
  { name: 'Empresa', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80' },
  { name: 'Viagem', url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=300&q=80' },
  { name: 'Finanças', url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=300&q=80' },
];

export interface ProjectFormValues {
  name: string;
  type: ProjectType;
  imageUrl: string;
}

interface ProjectFormProps {
  initialValues?: Partial<ProjectFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel?: () => void;
}

export default function ProjectForm({
  initialValues,
  submitLabel = 'Salvar',
  isSubmitting = false,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [type, setType] = useState<ProjectType>(initialValues?.type ?? 'Pessoal');
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? '');
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
      const url = await uploadFile(file, `project-covers/${generatePureId('cover')}-${file.name}`);
      setImageUrl(url);
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e, 'Falha ao enviar a imagem. Tente novamente.'));
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = projectSchema.safeParse({ name: name.trim(), type, imageUrl: imageUrl.trim() });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }
    setError(null);
    onSubmit(result.data as ProjectFormValues);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nome do projeto</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tipo</label>
        <div className="grid grid-cols-3 gap-1.5">
          {PROJECT_TYPES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={cn(
                'rounded-lg border px-2 py-2 text-xs font-medium transition',
                type === option
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Imagem de capa (opcional)</label>

        <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
          {imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Capa do projeto" className="absolute inset-0 size-full object-contain" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
                title="Remover capa"
              >
                <X className="size-3.5" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center text-xs text-muted-foreground">
              Sem imagem de capa
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1.5">
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
          onClick={() => document.getElementById('project-cover-file-input')?.click()}
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
            id="project-cover-file-input"
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <NexoButton type="button" variant="outline" disabled={isUploading || isSubmitting} onClick={onCancel}>
            Cancelar
          </NexoButton>
        )}
        <NexoButton type="submit" disabled={isUploading} loading={isSubmitting}>
          {submitLabel}
        </NexoButton>
      </div>
    </form>
  );
}
