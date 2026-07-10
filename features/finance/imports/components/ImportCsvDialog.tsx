'use client';

import { useMemo, useState } from 'react';
import { Upload, Repeat, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import NexoButton from '@/components/nexo/NexoButton';
import Currency from '@/components/common/Currency';
import { useCsvImport } from '@/features/finance/imports/hooks/useCsvImport';
import { useTransactions } from '@/features/finance/transactions/hooks/useTransactions';
import { useCategories } from '@/features/finance/categories/hooks/useCategories';
import { useRules } from '@/features/finance/categories/hooks/useRules';
import { matchRuleForTitle } from '@/features/finance/categories/utils/matchRule';
import { resolveDefaultCategoryId } from '@/features/finance/categories/utils/category';
import { suggestRules, buildKeywordSignal, suggestCategoryForTitle } from '@/features/finance/categories/utils/suggestRules';
import RuleSuggestionsList from '@/features/finance/categories/components/RuleSuggestionsList';
import { expandInstallmentSeries } from '@/features/finance/imports/utils/csv';
import { generatePureId } from '@/lib/utils';
import { getErrorMessage } from '@/utils/errors';
import type { ImportedTransactionRow } from '@/features/finance/imports/utils/csv';

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Todo lançamento importado vai pro projeto ativo. */
  projectId: string;
}

const NO_COLUMN = '__none__';

interface InstallmentDraft {
  enabled: boolean;
  current: string;
  total: string;
}

export default function ImportCsvDialog({ open, onOpenChange, projectId }: ImportCsvDialogProps) {
  const { headers, rows, mapping, setMapping, isMappingComplete, isParsing, error, importFile, reset } =
    useCsvImport();
  const { transactions, saveTransaction } = useTransactions();
  const { categories } = useCategories();
  const { rules, addRule, isSavingRule } = useRules(projectId);
  const [installmentDrafts, setInstallmentDrafts] = useState<Record<number, InstallmentDraft>>({});
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [selectionOverrides, setSelectionOverrides] = useState<Record<string, boolean>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const notesColumns = mapping.notes ?? [];
  const availableNotesHeaders = headers.filter((h) => !notesColumns.includes(h));

  const projectTransactions = useMemo(
    () => transactions.filter((t) => t.projectId === projectId),
    [transactions, projectId]
  );

  const keywordSignal = useMemo(
    () => buildKeywordSignal(projectTransactions, categories, rules),
    [projectTransactions, categories, rules]
  );

  // Sugestões combinam o histórico do projeto com os títulos do próprio CSV
  // sendo importado — pega comerciantes novos que se repetem no arquivo.
  const suggestions = useMemo(
    () => suggestRules(projectTransactions, categories, rules, rows.map((r) => r.title)),
    [projectTransactions, categories, rules, rows]
  );

  const getDraft = (idx: number): InstallmentDraft => installmentDrafts[idx] ?? { enabled: false, current: '', total: '' };

  const setDraft = (idx: number, patch: Partial<InstallmentDraft>) =>
    setInstallmentDrafts((prev) => ({ ...prev, [idx]: { ...getDraft(idx), ...patch } }));

  const getSeriesRows = (idx: number): ImportedTransactionRow[] | null => {
    const draft = getDraft(idx);
    if (!draft.enabled) return null;
    const current = parseInt(draft.current, 10);
    const total = parseInt(draft.total, 10);
    if (!(Number.isInteger(current) && Number.isInteger(total) && current >= 1 && total >= 2 && current <= total)) {
      return null;
    }
    return expandInstallmentSeries(rows[idx], current, total);
  };

  // Lista achatada: cada linha vira 1 entrada, ou N entradas se o usuário
  // marcou como parcela e informou parcela atual/total válidos.
  const flatRows = useMemo(() => {
    const result: { key: string; row: ImportedTransactionRow }[] = [];
    rows.forEach((row, idx) => {
      const series = getSeriesRows(idx);
      if (series) {
        series.forEach((r, i) => result.push({ key: `${idx}-${i + 1}`, row: r }));
      } else {
        result.push({ key: String(idx), row });
      }
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, installmentDrafts]);

  const isDuplicate = (row: ImportedTransactionRow) =>
    projectTransactions.some((t) => t.title === row.title && t.date === row.date && t.amount === row.amount);

  // Selecionada por padrão, a menos que já exista uma transação igual no
  // projeto (título + data + valor) — é o que garante que, numa compra
  // parcelada, só as parcelas que faltam fiquem marcadas.
  const isRowSelected = (key: string, row: ImportedTransactionRow) =>
    key in selectionOverrides ? selectionOverrides[key] : !isDuplicate(row);

  const toggleRowSelection = (key: string, row: ImportedTransactionRow) =>
    setSelectionOverrides((prev) => ({ ...prev, [key]: !isRowSelected(key, row) }));

  const selectedCount = flatRows.filter(({ key, row }) => isRowSelected(key, row)).length;

  const getRowCategoryId = (key: string, row: ImportedTransactionRow) => {
    if (categoryOverrides[key]) return categoryOverrides[key];
    const ruleMatch = matchRuleForTitle(rules, row.title);
    if (ruleMatch) return ruleMatch;
    const historyMatch = suggestCategoryForTitle(row.title, keywordSignal);
    return historyMatch?.categoryId ?? resolveDefaultCategoryId(categories) ?? '';
  };
  const setRowCategoryId = (key: string, catId: string) => setCategoryOverrides((prev) => ({ ...prev, [key]: catId }));

  const resetAll = () => {
    reset();
    setInstallmentDrafts({});
    setCategoryOverrides({});
    setSelectionOverrides({});
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetAll();
      setSaveError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    setIsImporting(true);
    setSaveError(null);
    try {
      for (const { key, row } of flatRows) {
        if (!isRowSelected(key, row)) continue;
        await saveTransaction({
          id: generatePureId('t'),
          title: row.title,
          type: row.type,
          projectId,
          categoryId: getRowCategoryId(key, row),
          amount: row.amount,
          date: row.date,
          notes: row.notes,
        });
      }
      resetAll();
      onOpenChange(false);
    } catch (e) {
      setSaveError(getErrorMessage(e, 'Não foi possível importar as transações.'));
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

        {headers.length === 0 ? (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition hover:bg-muted">
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">
              {isParsing ? 'Lendo arquivo...' : 'Arraste um .csv ou clique para escolher'}
            </p>
            <p className="text-xs text-muted-foreground">Você escolhe quais colunas usar no próximo passo</p>
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
            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">Quais colunas usar?</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Data *</label>
                  <Select value={mapping.date ?? ''} onValueChange={(v) => setMapping({ ...mapping, date: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Descrição *</label>
                  <Select value={mapping.title ?? ''} onValueChange={(v) => setMapping({ ...mapping, title: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Valor *</label>
                  <Select value={mapping.amount ?? ''} onValueChange={(v) => setMapping({ ...mapping, amount: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Observação</label>
                  <Select
                    value={NO_COLUMN}
                    onValueChange={(v) => {
                      if (v === NO_COLUMN) return;
                      setMapping({ ...mapping, notes: [...notesColumns, v] });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Adicionar coluna..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNotesHeaders.length === 0 ? (
                        <SelectItem value={NO_COLUMN} disabled>
                          Todas as colunas já selecionadas
                        </SelectItem>
                      ) : (
                        availableNotesHeaders.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {notesColumns.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {notesColumns.map((h) => (
                        <span
                          key={h}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium"
                        >
                          {h}
                          <button
                            type="button"
                            onClick={() => setMapping({ ...mapping, notes: notesColumns.filter((c) => c !== h) })}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                      <p className="w-full text-[11px] text-muted-foreground">Concatenadas com " | ", nessa ordem.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isMappingComplete && rows.length > 0 && suggestions.length > 0 && (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <p className="text-sm font-semibold">Sugestões encontradas</p>
                <RuleSuggestionsList
                  suggestions={suggestions}
                  categories={categories}
                  onAccept={(keyword, categoryId) => addRule(keyword, categoryId)}
                  isSaving={isSavingRule}
                />
              </div>
            )}

            {isMappingComplete ? (
              <div className="max-h-80 space-y-1.5 overflow-y-auto">
                {rows.length === 0 ? (
                  <p className="rounded-lg border border-border p-3 text-center text-xs text-muted-foreground">
                    Nenhuma linha com data válida encontrada nessas colunas.
                  </p>
                ) : (
                  rows.map((row, idx) => {
                    const draft = getDraft(idx);
                    const series = getSeriesRows(idx);
                    const singleKey = String(idx);

                    return (
                      <div key={idx} className="space-y-1.5 rounded-lg border border-border p-2 text-sm">
                        {!series ? (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isRowSelected(singleKey, row)}
                                  onChange={() => toggleRowSelection(singleKey, row)}
                                  className="size-4 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{row.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {row.date}
                                    {row.notes ? ` • ${row.notes}` : ''}
                                    {isDuplicate(row) && (
                                      <span className="ml-1 inline-flex items-center gap-0.5 text-emerald-600">
                                        <CheckCircle2 className="size-3" /> já existe
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </label>
                              <Currency
                                value={row.type === 'Receita' ? row.amount : -row.amount}
                                signed
                                className="shrink-0 text-xs font-semibold"
                              />
                            </div>
                            <Select
                              value={getRowCategoryId(singleKey, row)}
                              onValueChange={(v) => setRowCategoryId(singleKey, v)}
                            >
                              <SelectTrigger className="h-7 text-xs">
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
                          </>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <p className="min-w-0 truncate font-medium">{row.title}</p>
                            <Currency
                              value={row.type === 'Receita' ? row.amount : -row.amount}
                              signed
                              className="shrink-0 text-xs font-semibold"
                            />
                          </div>
                        )}

                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={draft.enabled}
                            onChange={(e) => setDraft(idx, { enabled: e.target.checked })}
                            className="size-3.5"
                          />
                          É uma compra parcelada?
                        </label>

                        {draft.enabled && (
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              min={1}
                              placeholder="Parcela atual"
                              value={draft.current}
                              onChange={(e) => setDraft(idx, { current: e.target.value })}
                              className="h-7 text-xs"
                            />
                            <Input
                              type="number"
                              min={2}
                              placeholder="Total de parcelas"
                              value={draft.total}
                              onChange={(e) => setDraft(idx, { total: e.target.value })}
                              className="h-7 text-xs"
                            />
                          </div>
                        )}

                        {draft.enabled && !series && (
                          <p className="text-[11px] text-muted-foreground">
                            Informe a parcela atual e o total (atual ≤ total) pra gerar a série completa.
                          </p>
                        )}

                        {series && (
                          <div className="space-y-1 border-t border-dashed border-border pt-1.5">
                            <p className="flex items-center gap-1 text-[11px] font-medium text-primary">
                              <Repeat className="size-3" /> {series.length} parcelas geradas
                            </p>
                            {series.map((seriesRow, i) => {
                              const key = `${idx}-${i + 1}`;
                              const dup = isDuplicate(seriesRow);
                              return (
                                <div
                                  key={key}
                                  className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1"
                                >
                                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5">
                                    <input
                                      type="checkbox"
                                      checked={isRowSelected(key, seriesRow)}
                                      onChange={() => toggleRowSelection(key, seriesRow)}
                                      className="size-3.5 shrink-0"
                                    />
                                    <span className="truncate text-xs">
                                      {seriesRow.date} — {seriesRow.installment!.current}/{seriesRow.installment!.total}
                                      {dup && <span className="ml-1 text-emerald-600">já existe</span>}
                                    </span>
                                  </label>
                                  <Select
                                    value={getRowCategoryId(key, seriesRow)}
                                    onValueChange={(v) => setRowCategoryId(key, v)}
                                  >
                                    <SelectTrigger className="h-6 w-28 shrink-0 text-[11px]">
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
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Escolha ao menos Data, Descrição e Valor pra ver a prévia.</p>
            )}

            {(error || saveError) && <p className="text-sm text-destructive">{error ?? saveError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <NexoButton type="button" variant="outline" disabled={isImporting} onClick={resetAll}>
                Trocar arquivo
              </NexoButton>
              <NexoButton type="button" disabled={selectedCount === 0} loading={isImporting} onClick={handleConfirm}>
                Importar{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </NexoButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
