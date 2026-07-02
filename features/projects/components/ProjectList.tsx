'use client';

import { useState } from 'react';
import ProjectCard from './ProjectCard';
import ProjectDialog from './ProjectDialog';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import NexoEmpty from '@/components/nexo/NexoEmpty';
import { useProjects } from '@/features/projects/hooks/useProjects';
import type { Project } from '@/features/projects/types/project';

interface ProjectListProps {
  projects: Project[];
  emptyMessage?: string;
}

export default function ProjectList({ projects, emptyMessage }: ProjectListProps) {
  const { saveProject, deleteProject } = useProjects();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  if (projects.length === 0) {
    return <NexoEmpty title="Nenhum projeto encontrado" description={emptyMessage} />;
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={() => setEditingProject(project)}
          onDelete={() => setDeletingProject(project)}
        />
      ))}

      <ProjectDialog
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        onSave={(project) => saveProject(project)}
      />

      <ConfirmDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        title="Excluir projeto"
        description={`Tem certeza que deseja excluir o projeto "${deletingProject?.name}"? As transações vinculadas a ele também serão removidas.`}
        confirmLabel="Sim, remover"
        variant="destructive"
        onConfirm={() => deletingProject && deleteProject(deletingProject.id)}
      />
    </div>
  );
}
