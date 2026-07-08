'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import NexoButton from '@/components/nexo/NexoButton';
import MoneyInput from '@/components/common/MoneyInput';
import { formatCurrency, parseCurrencyInput } from '@/utils/currency';
import { getErrorMessage } from '@/utils/errors';
import type { Project } from '@/features/projects/types/project';

interface PlanningAnalysisProps {
  project: Project;
  totalGuardado: number;
  ritmoMensal: number | null;
  isSavingGoal: boolean;
  onSaveGoal: (goalAmount: number | undefined) => Promise<void>;
}

export default function PlanningAnalysis({
  project,
  totalGuardado,
  ritmoMensal,
  isSavingGoal,
  onSaveGoal,
}: PlanningAnalysisProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setGoalInput(project.goalAmount ? String(project.goalAmount) : '');
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const numeric = parseCurrencyInput(goalInput);
      await onSaveGoal(numeric > 0 ? numeric : undefined);
      setError(null);
      setIsEditing(false);
    } catch (e) {
      setError(getErrorMessage(e, 'Não foi possível salvar a meta.'));
    }
  };

  const goalAmount = project.goalAmount;
  const falta = goalAmount !== undefined ? Math.max(goalAmount - totalGuardado, 0) : null;
  const metaAtingida = goalAmount !== undefined && totalGuardado >= goalAmount;
  const projecaoMeses =
    falta !== null && falta > 0 && ritmoMensal !== null && ritmoMensal > 0 ? Math.ceil(falta / ritmoMensal) : null;

  return (
    <div className="space-y-3.5 rounded-2xl bg-slate-900 p-4 text-white shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Planejamento</p>
          <p className="text-[10px] font-semibold text-emerald-400/70">Seu progresso rumo à meta:</p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold text-emerald-400 transition hover:bg-white/5"
          >
            <Pencil className="size-3" />
            {goalAmount !== undefined ? 'Editar meta' : 'Definir meta'}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2 rounded-xl bg-white/5 p-3">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">
            Valor da meta (R$)
          </label>
          <MoneyInput value={goalInput} onChange={(raw) => setGoalInput(raw)} />
          {error && <p className="text-[10px] text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <NexoButton
              type="button"
              variant="outline"
              size="sm"
              disabled={isSavingGoal}
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </NexoButton>
            <NexoButton type="button" size="sm" loading={isSavingGoal} onClick={() => void handleSave()}>
              Salvar
            </NexoButton>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-xs font-semibold">
          <div className="space-y-1 border-b border-slate-700/60 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-200">Total guardado</span>
              <span className={cn('font-mono', totalGuardado >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatCurrency(totalGuardado)}
              </span>
            </div>
            <p className="text-[10px] font-medium leading-normal text-slate-400">
              Saldo acumulado (receitas − despesas) desde o início do projeto.
            </p>
          </div>

          {goalAmount !== undefined ? (
            <>
              <div className="space-y-1 border-b border-slate-700/60 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">Meta</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(goalAmount)}</span>
                </div>
                <p className="text-[10px] font-medium leading-normal text-slate-400">
                  {metaAtingida ? 'Meta atingida! 🎉' : `Faltam ${formatCurrency(falta ?? 0)} pra bater a meta.`}
                </p>
              </div>

              {!metaAtingida && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200">Projeção no ritmo atual</span>
                    <span className="font-mono text-amber-400">
                      {projecaoMeses !== null ? `${projecaoMeses} ${projecaoMeses === 1 ? 'mês' : 'meses'}` : '—'}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium leading-normal text-slate-400">
                    {ritmoMensal !== null && ritmoMensal > 0
                      ? `No ritmo de ${formatCurrency(ritmoMensal)}/mês de economia, é o tempo estimado pra bater a meta.`
                      : 'No ritmo atual, você não está se aproximando da meta.'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-200">Ritmo mensal de economia</span>
                <span className={cn('font-mono', (ritmoMensal ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {ritmoMensal !== null ? formatCurrency(ritmoMensal) : '—'}
                </span>
              </div>
              <p className="text-[10px] font-medium leading-normal text-slate-400">
                Defina uma meta pra ver quanto falta e em quantos meses você chega lá no ritmo atual.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
