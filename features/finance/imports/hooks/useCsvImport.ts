'use client';

import { useState } from 'react';
import { parseCsv, mapCsvRowsToTransactions, type ImportedTransactionRow } from '@/features/finance/imports/utils/csv';

export function useCsvImport() {
  const [rows, setRows] = useState<ImportedTransactionRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importFile = async (file: File) => {
    setIsParsing(true);
    setError(null);
    try {
      const text = await file.text();
      const { rows: csvRows } = parseCsv(text);
      setRows(mapCsvRowsToTransactions(csvRows));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo CSV.');
    } finally {
      setIsParsing(false);
    }
  };

  const toggleRow = (index: number) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)));
  };

  const reset = () => setRows([]);

  return { rows, isParsing, error, importFile, toggleRow, reset };
}
