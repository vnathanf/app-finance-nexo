'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NexoPage from '@/components/nexo/NexoPage';
import ProjectForm from './ProjectForm';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { generatePureId } from '@/lib/utils';

export default function NewProjectScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { saveProject, isSavingProject } = useProjects();

  return (
    <NexoPage>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/dashboard/projetos" className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">Novo projeto</h1>
      </div>

      <ProjectForm
        submitLabel="Criar projeto"
        isSubmitting={isSavingProject}
        onSubmit={async (values) => {
          await saveProject({
            id: generatePureId('p'),
            ownerId: user!.id,
            name: values.name,
            type: values.type,
            sub: values.type,
            value: 0,
            isExpense: false,
            monthlyProfit: 0,
            trend: 0,
            receitas: 0,
            despesas: 0,
            imageUrl: values.imageUrl || undefined,
            customFields: values.customFields,
          });
          router.push('/dashboard/projetos');
        }}
      />
    </NexoPage>
  );
}
