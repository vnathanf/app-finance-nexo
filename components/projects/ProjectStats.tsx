import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Currency from '@/components/common/Currency';
import {
  calculatePatrimonioLiquido,
  calculateTotalReceitas,
  calculateTotalDespesas,
  calculateLucro,
} from '@/utils/calculations';
import type { Project } from '@/types/project';

interface ProjectStatsProps {
  projects: Project[];
}

export default function ProjectStats({ projects }: ProjectStatsProps) {
  const patrimonio = calculatePatrimonioLiquido(projects);
  const receitas = calculateTotalReceitas(projects);
  const despesas = calculateTotalDespesas(projects);
  const lucro = calculateLucro(receitas, despesas);

  return (
    <div className="space-y-3">
      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Patrimônio líquido</p>
        <Currency value={patrimonio} className="text-2xl font-semibold" />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="gap-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Receitas</p>
            <TrendingUp className="size-4 text-emerald-600" />
          </div>
          <Currency value={receitas} signed className="text-sm font-semibold" />
        </Card>
        <Card className="gap-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Despesas</p>
            <TrendingDown className="size-4 text-red-600" />
          </div>
          <Currency value={-despesas} signed className="text-sm font-semibold" />
        </Card>
      </div>

      <Card className="flex-row items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Saldo do mês</p>
          <Currency value={lucro} signed className="text-lg font-bold" />
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Wallet className="size-4" />
        </div>
      </Card>
    </div>
  );
}
