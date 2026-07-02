'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProjectForm, { type ProjectFormValues } from './ProjectForm';
import type { Project } from '@/types/project';

interface ProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (project: Project) => void;
}

export default function ProjectDialog({ project, open, onOpenChange, onSave }: ProjectDialogProps) {
  if (!project) return null;

  const handleSubmit = (values: ProjectFormValues) => {
    onSave({
      ...project,
      name: values.name,
      type: values.type,
      sub: values.type,
      imageUrl: values.imageUrl || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar projeto</DialogTitle>
        </DialogHeader>
        <ProjectForm
          initialValues={{ name: project.name, type: project.type, imageUrl: project.imageUrl ?? '' }}
          submitLabel="Salvar alterações"
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
