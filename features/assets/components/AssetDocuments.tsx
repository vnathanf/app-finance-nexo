'use client';

import { useState } from 'react';
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { DOCUMENTS_BUCKET, deleteFile, getSignedUrl, uploadPrivateFile } from '@/services/upload.service';
import { cn, generatePureId } from '@/lib/utils';
import { getErrorMessage } from '@/utils/errors';
import type { AssetDocument } from '@/features/assets/types/asset';

interface AssetDocumentsProps {
  /** Dono do path de storage (`asset-documents/{projectId}/...`) — a RLS do bucket privado usa isso pra checar acesso. */
  projectId: string;
  documents: AssetDocument[];
  /** Trava upload/remoção enquanto o asset está sendo salvo por outra ação (ex: edição do formulário). */
  disabled?: boolean;
  onAdd: (doc: AssetDocument) => void;
  onRemove: (index: number) => void;
}

function formatFileSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function AssetDocuments({ projectId, documents, disabled = false, onAdd, onRemove }: AssetDocumentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);
  const [removingIdx, setRemovingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isBusy = isUploading || disabled;

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const path = await uploadPrivateFile(
        file,
        `asset-documents/${projectId}/${generatePureId('doc')}-${file.name}`,
        DOCUMENTS_BUCKET
      );
      onAdd({ name: file.name, size: formatFileSize(file.size), path });
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e, 'Falha ao enviar o documento. Tente novamente.'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: AssetDocument, idx: number) => {
    if (doc.url) {
      window.open(doc.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!doc.path) return;
    setDownloadingIdx(idx);
    try {
      const signedUrl = await getSignedUrl(doc.path, DOCUMENTS_BUCKET);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e, 'Falha ao gerar o link de download.'));
    } finally {
      setDownloadingIdx(null);
    }
  };

  const handleRemove = async (doc: AssetDocument, idx: number) => {
    setRemovingIdx(idx);
    try {
      if (doc.path) await deleteFile(doc.path, DOCUMENTS_BUCKET);
      onRemove(idx);
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e, 'Falha ao remover o documento.'));
    } finally {
      setRemovingIdx(null);
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
                {(doc.url || doc.path) && (
                  <button
                    onClick={() => void handleDownload(doc, idx)}
                    disabled={isBusy || downloadingIdx === idx}
                    className="text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                    title="Baixar"
                  >
                    {downloadingIdx === idx ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => void handleRemove(doc, idx)}
                  disabled={isBusy || removingIdx === idx}
                  className="text-muted-foreground transition hover:text-destructive disabled:opacity-50"
                  title="Remover"
                >
                  {removingIdx === idx ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border p-3 text-center transition',
          isBusy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-muted'
        )}
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="size-4 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {isUploading ? 'Enviando documento...' : 'Clique para anexar um documento'}
        </span>
        <input
          type="file"
          className="hidden"
          disabled={isBusy}
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
