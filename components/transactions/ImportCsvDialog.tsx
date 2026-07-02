'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import NexoButton from '@/components/nexo/NexoButton';
import Currency from '@/components/common/Currency';
import { useCsvImport } from '@/hooks/useCsvImport';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { generatePureId } from '@/lib/utils';

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Todo lançamento importado vai pro projeto ativo. */
  projectId: string;
}

export default function ImportCsvDialog({ open, onOpenChange, projectId }: ImportCsvDialogProps) {
  const { rows, isParsing, error, importFile, toggleRow, reset } = useCsvImport();
  const { saveTransaction } = useTransactions();
  const { categories } = useCategories();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [isImporting, setIsImporting] = useState(false);

  const selectedCount = rows.filter((r) => r.selected).length;

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    setIsImporting(true);
    try {
      for (const row of rows.filter((r) => r.selected)) {
        await saveTransaction({
          id: generatePureId('t'),
          title: row.title,
          type: row.type,
          projectId,
          categoryId,
          amount: row.amount,
          date: row.date,
        });
      }
      reset();
      onOpenChange(false);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar extrato CSV</DialogTitle>
        </DialogHeader>

        {rows.length === 0 ? (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition hover:bg-muted">
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">
              {isParsing ? 'Lendo arquivo...' : 'Arraste um .csv ou clique para escolher'}
            </p>
            <p className="text-xs text-muted-foreground">Data, descrição e valor são detectados automaticamente</p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFile(file);
              }}
            />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoria padrão</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
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

            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {rows.map((row, idx) => (
                <label
                  key={idx}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggleRow(idx)}
                      className="size-4 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.title}</p>
                      <p className="text-xs text-muted-foreground">{row.date}</p>
                    </div>
                  </div>
                  <Currency
                    value={row.type === 'Receita' ? row.amount : -row.amount}
                    signed
                    className="shrink-0 text-xs font-semibold"
                  />
                </label>
              ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <NexoButton type="button" variant="outline" onClick={reset}>
                Trocar arquivo
              </NexoButton>
              <NexoButton type="button" disabled={selectedCount === 0 || isImporting} onClick={handleConfirm}>
                Importar{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </NexoButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
