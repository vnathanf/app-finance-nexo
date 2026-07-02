import { Card } from '@/components/ui/card';
import Currency from '@/components/common/Currency';

interface KPICardsProps {
  receitas: number;
  despesas: number;
  saldo: number;
  patrimonio: number;
}

export default function KPICards({ receitas, despesas, saldo, patrimonio }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Card className="gap-1 border-emerald-200/60 bg-emerald-50/50">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Entradas consolidadas</p>
        <Currency value={receitas} className="text-sm font-black text-emerald-700" />
      </Card>

      <Card className="gap-1 border-red-200/60 bg-red-50/50">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Saídas consolidadas</p>
        <Currency value={despesas} className="text-sm font-black text-red-700" />
      </Card>

      <Card className="gap-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Saldo líquido</p>
        <Currency value={saldo} signed className="text-sm font-black" />
      </Card>

      <Card className="gap-1 bg-slate-900 text-white">
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">Patrimônio vinculado</p>
        <Currency value={patrimonio} className="text-sm font-black text-white" />
      </Card>
    </div>
  );
}
