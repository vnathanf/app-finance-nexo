'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit2, Share2 } from 'lucide-react';
import NexoPage from '@/components/nexo/NexoPage';
import NexoLoading from '@/components/nexo/NexoLoading';
import NexoEmpty from '@/components/nexo/NexoEmpty';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ProjectDialog from './ProjectDialog';
import ProjectOverviewTab from './ProjectOverviewTab';
import ShareDialog from '@/features/projects/collaboration/components/ShareDialog';
import TransactionsTab from '@/features/finance/transactions/components/TransactionsTab';
import type { TransactionTab } from '@/features/finance/transactions/components/TransactionFilters';
import AssetsTab from '@/features/assets/components/AssetsTab';
import ReportsTab from '@/features/finance/reports/components/ReportsTab';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useTransactions } from '@/features/finance/transactions/hooks/useTransactions';
import { useAssets } from '@/features/assets/hooks/useAssets';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { deriveProjectsWithLiveTotals } from '@/utils/calculations';

type Tab = 'geral' | 'transacoes' | 'patrimonio' | 'relatorios';

export default function ProjectDetailScreen() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id') ?? '';
  const { user } = useAuth();
  const { projects, saveProject, isLoading: isLoadingProjects } = useProjects();
  const { transactions, isLoading: isLoadingTx } = useTransactions();
  const { assets, isLoading: isLoadingAssets } = useAssets();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('geral');
  const [txInitialFilter, setTxInitialFilter] = useState<TransactionTab | undefined>(undefined);

  const liveProjects = useMemo(
    () => deriveProjectsWithLiveTotals(projects, transactions, assets),
    [projects, transactions, assets]
  );

  const project = liveProjects.find((p) => p.id === projectId) ?? null;

  const recentTransactions = useMemo(
    () => transactions.filter((t) => t.projectId === projectId).slice(0, 3),
    [transactions, projectId]
  );

  if (isLoadingProjects || isLoadingTx || isLoadingAssets) {
    return (
      <NexoPage>
        <NexoLoading />
      </NexoPage>
    );
  }

  if (!project) {
    return (
      <NexoPage>
        <NexoEmpty title="Projeto não encontrado" description="Ele pode ter sido removido." />
        <Link href="/dashboard/projetos" className="mt-4 block text-center text-sm font-medium text-primary">
          Voltar para projetos
        </Link>
      </NexoPage>
    );
  }

  const isOwner = project.ownerId === user?.id;

  return (
    <NexoPage>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/projetos"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{project.name}</h1>
          <button
            onClick={() => setIsShareOpen(true)}
            aria-label="Compartilhar projeto"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Share2 className="size-3.5" />
          </button>
          {isOwner && (
            <button
              onClick={() => setIsEditOpen(true)}
              aria-label="Editar projeto"
              className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Edit2 className="size-3.5" />
            </button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <TabsList className="w-full">
            <TabsTrigger value="geral">Visão geral</TabsTrigger>
            <TabsTrigger value="transacoes">Transações</TabsTrigger>
            <TabsTrigger value="patrimonio">Patrimônio</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <ProjectOverviewTab
              project={project}
              recentTransactions={recentTransactions}
              onViewAllTransactions={(filter) => {
                setTxInitialFilter(filter);
                setActiveTab('transacoes');
              }}
            />
          </TabsContent>

          <TabsContent value="transacoes">
            <TransactionsTab projectId={project.id} initialTypeFilter={txInitialFilter} />
          </TabsContent>

          <TabsContent value="patrimonio">
            <AssetsTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="relatorios">
            <ReportsTab project={project} />
          </TabsContent>
        </Tabs>
      </div>

      <ProjectDialog project={project} open={isEditOpen} onOpenChange={setIsEditOpen} onSave={saveProject} />
      <ShareDialog projectId={project.id} open={isShareOpen} onOpenChange={setIsShareOpen} canManage={isOwner} />
    </NexoPage>
  );
}
