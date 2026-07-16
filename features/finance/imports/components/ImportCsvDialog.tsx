'use client';

import { useMemo, useState } from 'react';
import { Upload, Repeat, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import NexoButton from '@/components/nexo/NexoButton';
import Currency from '@/components/common/Currency';
import { cn } from '@/lib/utils';
import { useCsvImport } from '@/features/finance/imports/hooks/useCsvImport';
import { useImportTemplates } from '@/features/finance/imports/hooks/useImportTemplates';
import { useTransactions } from '@/features/finance/transactions/hooks/useTransactions';
import { useCategories } from '@/features/finance/categories/hooks/useCategories';
import { useRules } from '@/features/finance/categories/hooks/useRules';
import { matchRuleForTitle } from '@/features/finance/categories/utils/matchRule';
import { resolveDefaultCategoryId } from '@/features/finance/categories/utils/category';
import {
  suggestRules,
  buildKeywordSignal,
  suggestCategoryForTitle,
  buildCnpjSignal,
  suggestCategoryForCnpj,
} from '@/features/finance/categories/utils/suggestRules';
import RuleSuggestionsList from '@/features/finance/categories/components/RuleSuggestionsList';
import { expandInstallmentSeries } from '@/features/finance/imports/utils/csv';
import { generatePureId } from '@/lib/utils';
import { getErrorMessage } from '@/utils/errors';
import type { ColumnMapping, ImportedTransactionRow } from '@/features/finance/imports/utils/csv';

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Todo lançamento importado vai pro projeto ativo. */
  projectId: string;
}

const NO_COLUMN = '__none__';
const NO_TEMPLATE = '__manual__';

interface InstallmentDraft {
  enabled: boolean;
  current: string;
  total: string;
}

export default function ImportCsvDialog({ open, onOpenChange, projectId }: ImportCsvDialogProps) {
  const {
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
  } = useCsvImport();
  const { transactions, saveTransaction } = useTransactions();
  const { categories } = useCategories();
  const { rules, addRule, isSavingRule } = useRules(projectId);
  const { templates, saveTemplate, isSavingTemplate } = useImportTemplates(projectId);
  const [installmentDrafts, setInstallmentDrafts] = useState<Record<number, InstallmentDraft>>({});
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [selectionOverrides, setSelectionOverrides] = useState<Record<string, boolean>>({});
  const [templateName, setTemplateName] = useState('');
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
  const cnpjSignal = useMemo(() => buildCnpjSignal(projectTransactions, categories), [projectTransactions, categories]);

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

  // Duplicata é sempre um aviso, nunca um bloqueio — quando os dois lados têm
  // CPF/CNPJ, ele entra na comparação (mais preciso); sem ele, cai pra
  // título+data+valor como antes.
  const isDuplicate = (row: ImportedTransactionRow) =>
    projectTransactions.some((t) => {
      if (t.title !== row.title || t.date !== row.date || t.amount !== row.amount) return false;
      if (row.cpfCnpj && t.cpfCnpj) return t.cpfCnpj === row.cpfCnpj;
      return true;
    });

  // Selecionada por padrão, a menos que já exista uma transação igual no
  // projeto (título + data + valor) — é o que garante que, numa compra
  // parcelada, só as parcelas que faltam fiquem marcadas.
  const isRowSelected = (key: string, row: ImportedTransactionRow) =>
    key in selectionOverrides ? selectionOverrides[key] : !isDuplicate(row);

  const toggleRowSelection = (key: string, row: ImportedTransactionRow) =>
    setSelectionOverrides((prev) => ({ ...prev, [key]: !isRowSelected(key, row) }));

  const selectedCount = flatRows.filter(({ key, row }) => isRowSelected(key, row)).length;

  // Cascata: override manual da sessão → regra de palavra-chave curada →
  // padrão por CNPJ (histórico do projeto) → padrão por texto normalizado
  // (histórico do projeto) → "Outros"/sem categoria.
  const getRowCategoryId = (key: string, row: ImportedTransactionRow) => {
    if (categoryOverrides[key]) return categoryOverrides[key];
    const ruleMatch = matchRuleForTitle(rules, row.title);
    if (ruleMatch) return ruleMatch;
    if (row.cpfCnpj) {
      const cnpjMatch = suggestCategoryForCnpj(row.cpfCnpj, cnpjSignal);
      if (cnpjMatch) return cnpjMatch.categoryId;
    }
    const historyMatch = suggestCategoryForTitle(row.title, keywordSignal);
    return historyMatch?.categoryId ?? resolveDefaultCategoryId(categories) ?? '';
  };
  const setRowCategoryId = (key: string, catId: string) => setCategoryOverrides((prev) => ({ ...prev, [key]: catId }));

  const resetAll = () => {
    reset();
    setInstallmentDrafts({});
    setCategoryOverrides({});
    setSelectionOverrides({});
    setTemplateName('');
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetAll();
      setSaveError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !isMappingComplete) return;
    await saveTemplate(templateName.trim(), headerRowIndex, mapping as ColumnMapping);
    setTemplateName('');
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
          cpfCnpj: row.cpfCnpj,
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
          <DialogTitle>Importar extrato</DialogTitle>
        </DialogHeader>

        {preview.length === 0 ? (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition hover:bg-muted">
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">
              {isParsing ? 'Lendo arquivo...' : 'Arraste um .csv ou .xlsx ou clique para escolher'}
            </p>
            <p className="text-xs text-muted-foreground">Você escolhe o cabeçalho e as colunas no próximo passo</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFile(file);
              }}
            />
          </label>
        ) : (
          <div className="space-y-4">
            {templates.length > 0 && (
              <div className="space-y-1.5 rounded-xl border border-border p-3">
                <label className="text-xs font-medium text-muted-foreground">Usar template salvo</label>
                <Select
                  value={NO_TEMPLATE}
                  onValueChange={(v) => {
                    if (v === NO_TEMPLATE) return;
                    const tmpl = templates.find((t) => t.id === v);
                    if (tmpl) applyTemplate(tmpl);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Mapear manualmente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TEMPLATE}>Mapear manualmente</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">Qual linha é o cabeçalho?</p>
              <p className="text-xs text-muted-foreground">
                Linhas acima dela (ex: nome da conta, período) são ignoradas.
              </p>
              <div className="max-h-36 space-y-1 overflow-y-auto">
                {preview.map((row, idx) => (
                  <label
                    key={idx}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-xs',
                      idx === headerRowIndex
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-transparent text-muted-foreground hover:bg-muted',
                      idx < headerRowIndex && 'opacity-50 line-through'
                    )}
                  >
                    <input
                      type="radio"
                      name="header-row"
                      checked={idx === headerRowIndex}
                      onChange={() => setHeaderRowIndex(idx)}
                      className="size-3.5 shrink-0"
                    />
                    <span className="truncate">{row.filter(Boolean).join(' | ') || '(linha vazia)'}</span>
                  </label>
                ))}
              </div>
            </div>

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
                  <label className="text-xs font-medium text-muted-foreground">CPF/CNPJ</label>
                  <Select
                    value={mapping.cpfCnpj ?? NO_COLUMN}
                    onValueChange={(v) => setMapping({ ...mapping, cpfCnpj: v === NO_COLUMN ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_COLUMN}>Nenhuma</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1.5">
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

            {isMappingComplete && (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Nome do template (ex: Extrato Banco X)"
                  className="h-8 text-xs"
                />
                <NexoButton
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!templateName.trim()}
                  loading={isSavingTemplate}
                  onClick={handleSaveTemplate}
                >
                  Salvar como template
                </NexoButton>
              </div>
            )}

            {ignoredRows.length > 0 && (
              <details className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium text-foreground">
                  {ignoredRows.length} linha{ignoredRows.length > 1 ? 's' : ''} de saldo/rendimento ignorada
                  {ignoredRows.length > 1 ? 's' : ''}
                </summary>
                <ul className="mt-1.5 space-y-0.5">
                  {ignoredRows.map((r, i) => (
                    <li key={i}>
                      {r.date} — {r.title}
                    </li>
                  ))}
                </ul>
              </details>
            )}

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
