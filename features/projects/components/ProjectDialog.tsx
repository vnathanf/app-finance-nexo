'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProjectForm, { type ProjectFormValues } from './ProjectForm';
import type { Project } from '@/features/projects/types/project';

interface ProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving?: boolean;
  onSave: (project: Project) => void | Promise<void>;
}

export default function ProjectDialog({ project, open, onOpenChange, isSaving = false, onSave }: ProjectDialogProps) {
  if (!project) return null;

  const handleSubmit = async (values: ProjectFormValues) => {
    await onSave({
      ...project,
      name: values.name,
      type: values.type,
      sub: values.type,
      imageUrl: values.imageUrl || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar projeto</DialogTitle>
        </DialogHeader>
        <ProjectForm
          initialValues={{ name: project.name, type: project.type, imageUrl: project.imageUrl ?? '' }}
          submitLabel="Salvar alterações"
          isSubmitting={isSaving}
          onSubmit={(values) => void handleSubmit(values)}
        />
      </DialogContent>
    </Dialog>
  );
}
