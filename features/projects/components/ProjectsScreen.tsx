'use client';

import { useMemo, useState } from 'react';
import NexoPage from '@/components/nexo/NexoPage';
import NexoLoading from '@/components/nexo/NexoLoading';
import ProjectHeader from './ProjectHeader';
import ProjectStats from './ProjectStats';
import ProjectList from './ProjectList';
import PendingInvitesBanner from '@/features/projects/collaboration/components/PendingInvitesBanner';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useTransactions } from '@/features/finance/transactions/hooks/useTransactions';
import { useAssets } from '@/features/assets/hooks/useAssets';
import { deriveProjectsWithLiveTotals } from '@/utils/calculations';

export default function ProjectsScreen() {
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const { transactions, isLoading: isLoadingTx } = useTransactions();
  const { assets, isLoading: isLoadingAssets } = useAssets();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const liveProjects = useMemo(
    () => deriveProjectsWithLiveTotals(projects, transactions, assets),
    [projects, transactions, assets]
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
    <NexoPage title="Projetos">
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
