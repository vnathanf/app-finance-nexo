'use client';

import { useState } from 'react';
import {
  readCsvFile,
  parseCsv,
  guessColumnMapping,
  buildTransactionRows,
  type ParsedCsvRow,
  type ColumnMapping,
  type ImportedTransactionRow,
} from '@/features/finance/imports/utils/csv';

export function useCsvImport() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<ParsedCsvRow[]>([]);
  const [mapping, setMappingState] = useState<Partial<ColumnMapping>>({});
  const [rows, setRows] = useState<ImportedTransactionRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMappingComplete = !!(mapping.date && mapping.title && mapping.amount);

  const applyMapping = (raw: ParsedCsvRow[], next: Partial<ColumnMapping>) => {
    if (!next.date || !next.title || !next.amount) {
      setRows([]);
      return;
    }
    setRows(buildTransactionRows(raw, next as ColumnMapping));
  };

  const setMapping = (next: Partial<ColumnMapping>) => {
    setMappingState(next);
    applyMapping(rawRows, next);
  };

  const importFile = async (file: File) => {
    setIsParsing(true);
    setError(null);
    try {
      const text = await readCsvFile(file);
      const { headers: parsedHeaders, rows: parsedRows } = parseCsv(text);
      if (parsedHeaders.length === 0) {
        throw new Error('Não foi possível identificar colunas neste arquivo.');
      }
      const guess = guessColumnMapping(parsedHeaders);
      setHeaders(parsedHeaders);
      setRawRows(parsedRows);
      setMappingState(guess);
      applyMapping(parsedRows, guess);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo CSV.');
    } finally {
      setIsParsing(false);
    }
  };

  const reset = () => {
    setHeaders([]);
    setRawRows([]);
    setMappingState({});
    setRows([]);
    setError(null);
  };

  return { headers, rows, mapping, setMapping, isMappingComplete, isParsing, error, importFile, reset };
}
