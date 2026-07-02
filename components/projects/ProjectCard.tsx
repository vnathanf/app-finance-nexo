'use client';

import { useRouter } from 'next/navigation';
import { Building2, Edit2, Home, Plane, Briefcase, Trash2, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Currency from '@/components/common/Currency';
import { useAuth } from '@/contexts/AuthContext';
import type { Project } from '@/types/project';

function ProjectIcon({ type }: { type: Project['type'] }) {
  switch (type) {
    case 'Imóvel':
      return <Home className="size-5 text-blue-600" />;
    case 'Pessoal':
      return <User className="size-5 text-emerald-600" />;
    case 'Negócios':
      return <Briefcase className="size-5 text-purple-600" />;
    case 'Viagem':
      return <Plane className="size-5 text-sky-600" />;
    default:
      return <Building2 className="size-5 text-indigo-600" />;
  }
}

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = project.ownerId === user?.id;
  const saldoMes = project.receitas - project.despesas;

  return (
    <Card
      onClick={() => router.push(`/dashboard/projetos/detalhe?id=${project.id}`)}
      className="cursor-pointer gap-2 transition hover:ring-2 hover:ring-primary/20"
    >
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ProjectIcon type={project.type} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{project.name}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{project.type}</p>
          </div>
        </div>

        {isOwner && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="Editar projeto"
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Edit2 className="size-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Remover projeto"
              className="rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border pt-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Patrimônio</p>
          <Currency value={project.value} className="text-xs font-semibold" />
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Saldo do mês</p>
          <Currency value={saldoMes} signed className="text-xs font-semibold" />
        </div>
      </div>
    </Card>
  );
}
