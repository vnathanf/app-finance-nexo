'use client';

import { useState } from 'react';
import {
  readWorkbookRows,
  rowsFromAOA,
  guessHeaderRowIndex,
  guessColumnMapping,
  buildTransactionRows,
  type ParsedCsvRow,
  type ColumnMapping,
  type ImportedTransactionRow,
  type IgnoredRow,
} from '@/features/finance/imports/utils/csv';

const PREVIEW_ROW_LIMIT = 15;

export function useCsvImport() {
  const [aoa, setAoa] = useState<string[][]>([]);
  const [headerRowIndex, setHeaderRowIndexState] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<ParsedCsvRow[]>([]);
  const [mapping, setMappingState] = useState<Partial<ColumnMapping>>({});
  const [rows, setRows] = useState<ImportedTransactionRow[]>([]);
  const [ignoredRows, setIgnoredRows] = useState<IgnoredRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMappingComplete = !!(mapping.date && mapping.title && mapping.amount);
  const preview = aoa.slice(0, PREVIEW_ROW_LIMIT);

  const applyMapping = (raw: ParsedCsvRow[], next: Partial<ColumnMapping>) => {
    if (!next.date || !next.title || !next.amount) {
      setRows([]);
      setIgnoredRows([]);
      return;
    }
    const { rows: builtRows, ignored } = buildTransactionRows(raw, next as ColumnMapping);
    setRows(builtRows);
    setIgnoredRows(ignored);
  };

  const setMapping = (next: Partial<ColumnMapping>) => {
    setMappingState(next);
    applyMapping(rawRows, next);
  };

  const recomputeFromHeaderRow = (source: string[][], idx: number) => {
    const { headers: nextHeaders, rows: nextRawRows } = rowsFromAOA(source, idx);
    setHeaders(nextHeaders);
    setRawRows(nextRawRows);
    return { nextHeaders, nextRawRows };
  };

  const setHeaderRowIndex = (idx: number) => {
    setHeaderRowIndexState(idx);
    const { nextHeaders, nextRawRows } = recomputeFromHeaderRow(aoa, idx);
    const guess = guessColumnMapping(nextHeaders);
    setMappingState(guess);
    applyMapping(nextRawRows, guess);
  };

  /** Aplica um template salvo (linha de cabeçalho + mapeamento) de uma vez — o usuário ainda pode ajustar depois. */
  const applyTemplate = (template: { headerRowIndex: number; columnMapping: ColumnMapping }) => {
    setHeaderRowIndexState(template.headerRowIndex);
    const { nextRawRows } = recomputeFromHeaderRow(aoa, template.headerRowIndex);
    setMappingState(template.columnMapping);
    applyMapping(nextRawRows, template.columnMapping);
  };

  const importFile = async (file: File) => {
    setIsParsing(true);
    setError(null);
    try {
      const parsedAoa = await readWorkbookRows(file);
      if (parsedAoa.length === 0) {
        throw new Error('Não foi possível ler nenhuma linha neste arquivo.');
      }
      setAoa(parsedAoa);
      const guessedHeaderIndex = guessHeaderRowIndex(parsedAoa);
      setHeaderRowIndexState(guessedHeaderIndex);
      const { nextHeaders, nextRawRows } = recomputeFromHeaderRow(parsedAoa, guessedHeaderIndex);
      if (nextHeaders.length === 0) {
        throw new Error('Não foi possível identificar colunas neste arquivo.');
      }
      const guess = guessColumnMapping(nextHeaders);
      setMappingState(guess);
      applyMapping(nextRawRows, guess);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.');
    } finally {
      setIsParsing(false);
    }
  };

  const reset = () => {
    setAoa([]);
    setHeaderRowIndexState(0);
    setHeaders([]);
    setRawRows([]);
    setMappingState({});
    setRows([]);
    setIgnoredRows([]);
    setError(null);
  };

  return {
    preview,
    headerRowIndex,
    setHeaderRowIndex,
    headers,
    rows,
    ignoredRows,
    mapping,
    setMapping,
    applyTemplate,
    isMappingComplete,
    isParsing,
    error,
    importFile,
    reset,
  };
}
