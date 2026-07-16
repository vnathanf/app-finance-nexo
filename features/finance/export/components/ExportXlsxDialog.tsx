'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import NexoButton from '@/components/nexo/NexoButton';
import { exportTransactionsToXlsx } from '@/features/finance/export/utils/exportTransactions';
import { getErrorMessage } from '@/utils/errors';
import { todayISO } from '@/utils/date';
import type { Transaction } from '@/features/finance/transactions/types/transaction';
import type { Category } from '@/features/finance/categories/types/category';

interface ExportXlsxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Já filtradas pro projeto ativo — a exportação nunca mistura projetos. */
  transactions: Transaction[];
  categories: Category[];
}

function firstDayOfCurrentMonthISO(): string {
  return `${todayISO().slice(0, 7)}-01`;
}

export default function ExportXlsxDialog({ open, onOpenChange, transactions, categories }: ExportXlsxDialogProps) {
  const [startDate, setStartDate] = useState(firstDayOfCurrentMonthISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!startDate || !endDate || startDate > endDate) {
      setError('Informe um período válido (início até o fim).');
      return;
    }
    setIsExporting(true);
    setError(null);
    try {
      await exportTransactionsToXlsx(transactions, categories, startDate, endDate);
      onOpenChange(false);
    } catch (e) {
      setError(getErrorMessage(e, 'Não foi possível gerar o arquivo.'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar para planilha</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Gera um .xlsx com as transações deste projeto no período escolhido — pronto pra mandar pro contador.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Início</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Fim</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <NexoButton type="button" variant="outline" disabled={isExporting} onClick={() => onOpenChange(false)}>
              Cancelar
            </NexoButton>
            <NexoButton type="button" loading={isExporting} onClick={handleExport}>
              Exportar
            </NexoButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
