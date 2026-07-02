'use client';

import { useState } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { uploadFile } from '@/services/upload.service';
import { generatePureId } from '@/lib/utils';
import type { AssetDocument } from '@/features/assets/types/asset';

interface AssetDocumentsProps {
  documents: AssetDocument[];
  onAdd: (doc: AssetDocument) => void;
  onRemove: (index: number) => void;
}

function formatFileSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function AssetDocuments({ documents, onAdd, onRemove }: AssetDocumentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadFile(file, `asset-documents/${generatePureId('doc')}-${file.name}`);
      onAdd({ name: file.name, size: formatFileSize(file.size), url });
      setError(null);
    } catch {
      setError('Falha ao enviar o documento. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documentos e escrituras</p>

      {documents.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">Nenhum documento anexado.</p>
      ) : (
        <div className="space-y-1.5">
          {documents.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-xl border border-border bg-card p-2.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <FileText className="size-3.5 shrink-0 text-primary" />
                <span className="truncate text-sm font-medium" title={doc.name}>
                  {doc.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">({doc.size})</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-foreground"
                    title="Baixar"
                  >
                    <Download className="size-3.5" />
                  </a>
                )}
                <button
                  onClick={() => onRemove(idx)}
                  className="text-muted-foreground transition hover:text-destructive"
                  title="Remover"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border p-3 text-center transition hover:bg-muted">
        <Upload className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {isUploading ? 'Enviando documento...' : 'Clique para anexar um documento'}
        </span>
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
