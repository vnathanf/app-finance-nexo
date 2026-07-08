'use client';

import { useMemo, useState } from 'react';
import NexoPage from '@/components/nexo/NexoPage';
import NexoLoading from '@/components/nexo/NexoLoading';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import ProjectHeader from './ProjectHeader';
import ProjectStats from './ProjectStats';
import ProjectList from './ProjectList';
import PendingInvitesBanner from '@/features/projects/collaboration/components/PendingInvitesBanner';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useTransactions } from '@/features/finance/transactions/hooks/useTransactions';
import { useAssets } from '@/features/assets/hooks/useAssets';
import { deriveProjectsWithLiveTotals } from '@/utils/calculations';
import { getMonthName, toMonthKey, todayISO } from '@/utils/date';

export default function ProjectsScreen() {
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const { transactions, isLoading: isLoadingTx } = useTransactions();
  const { assets, isLoading: isLoadingAssets } = useAssets();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('todos');

  const periodOptions = useMemo(() => {
    const monthKeys = new Set<string>([toMonthKey(todayISO()), ...transactions.map((t) => toMonthKey(t.date))]);
    const years = Array.from(new Set(Array.from(monthKeys).map((key) => key.slice(0, 4)))).sort((a, b) =>
      b.localeCompare(a)
    );

    const options = [{ key: 'todos', label: 'Todo o período' }];
    for (const year of years) {
      options.push({ key: year, label: `${year} (ano todo)` });
      const monthsInYear = Array.from(monthKeys)
        .filter((key) => key.startsWith(year))
        .sort((a, b) => b.localeCompare(a));
      for (const key of monthsInYear) {
        options.push({ key, label: `${getMonthName(key)} ${year}` });
      }
    }
    return options;
  }, [transactions]);

  // Patrimônio (bens) não é filtrado — é uma foto do momento atual, não um
  // fluxo do período. Só receitas/despesas/saldo variam com o período.
  const periodTransactions = useMemo(
    () => (selectedPeriod === 'todos' ? transactions : transactions.filter((t) => t.date.startsWith(selectedPeriod))),
    [transactions, selectedPeriod]
  );

  const liveProjects = useMemo(
    () => deriveProjectsWithLiveTotals(projects, periodTransactions, assets),
    [projects, periodTransactions, assets]
  );

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return liveProjects;
    return liveProjects.filter(
      (project) => project.name.toLowerCase().includes(query) || project.type.toLowerCase().includes(query)
    );
  }, [liveProjects, searchQuery]);

  const isLoading = isLoadingProjects || isLoadingTx || isLoadingAssets;

  if (isLoading) {
    return (
      <NexoPage title="Projetos">
        <NexoLoading />
      </NexoPage>
    );
  }

  return (
    <NexoPage>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Projetos</h1>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40 shrink-0">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((p) => (
              <SelectItem key={p.key} value={p.key}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <PendingInvitesBanner />

        <ProjectStats projects={liveProjects} />

        <ProjectHeader
          showSearch={showSearch}
          onToggleSearch={() => {
            setShowSearch((prev) => !prev);
            if (showSearch) setSearchQuery('');
          }}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

        <ProjectList
          projects={filteredProjects}
          emptyMessage={
            searchQuery ? 'Nenhum projeto encontrado para a pesquisa.' : 'Crie seu primeiro projeto para começar.'
          }
        />
      </div>
    </NexoPage>
  );
}
