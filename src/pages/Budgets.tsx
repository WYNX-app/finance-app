import { useMemo, useState } from 'react';
import { PieChart, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useBudget, useCategories, useSaveBudgetLimit, useTransactions } from '@/hooks/useData';
import { formatMoney } from '@/lib/money';
import { Input } from '@/components/ui/Form';

export default function Budgets() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });

  const { data, isLoading } = useBudget(selectedMonth);
  const categories = useCategories();
  const transactions = useTransactions();
  const saveLimit = useSaveBudgetLimit();

  const expenseCategories = categories.filter((c) => c.kind === 'expense' || c.kind === 'both');

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => {
      if (t.type === 'expense' && t.status === 'paid' && t.transaction_date.startsWith(selectedMonth.slice(0, 7)) && t.category_id) {
        map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount);
      }
    });
    return map;
  }, [transactions, selectedMonth]);

  const totalPlanned = data?.categories.reduce((s, c) => s + c.planned_amount, 0) ?? 0;
  const totalSpent = [...spentByCategory.values()].reduce((s, v) => s + v, 0);

  const handleLimitChange = async (categoryId: string, val: string) => {
    if (!data?.budget) return;
    const amount = Number(val.replace(',', '.')) || 0;
    try {
      await saveLimit.mutateAsync({ budgetId: data.budget.id, categoryId, amount });
      toast.success('Limite salvo.');
    } catch {
      toast.error('Erro ao salvar limite.');
    }
  };

  if (isLoading) return <div className="p-10 text-center text-sm">Carregando orçamentos…</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Planejamento de gastos</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Orçamentos <span className="text-gradient">mensais</span>
          </h1>
        </div>
        <input
          type="month"
          value={selectedMonth.slice(0, 7)}
          onChange={(e) => setSelectedMonth(`${e.target.value}-01`)}
          className="h-10 rounded-xl border border-border/60 bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-base">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Planejado</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(totalPlanned)}</p>
        </div>
        <div className="card-base">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gasto</p>
          <p className="mt-1 text-2xl font-bold text-danger">{formatMoney(totalSpent)}</p>
        </div>
        <div className="card-base bg-gradient-brand text-white border-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Disponível</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(totalPlanned - totalSpent)}</p>
        </div>
      </div>

      <div className="card-base">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold">Limite por categoria</h2>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="space-y-5">
          {expenseCategories.map((cat) => {
            const budgetCat = data?.categories.find((c) => c.category_id === cat.id);
            const limit = budgetCat?.planned_amount ?? 0;
            const spent = spentByCategory.get(cat.id) ?? 0;
            const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
            const isOver = spent > limit && limit > 0;

            return (
              <div key={cat.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex flex-1 items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: cat.color }} />
                  <span className="w-32 truncate text-sm font-medium">{cat.name}</span>
                </div>
                
                <div className="flex flex-1 items-center gap-4">
                  <div className="relative flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${isOver ? 'bg-danger' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>{formatMoney(spent)}</span>
                      <span>{pct}%</span>
                    </div>
                  </div>
                  
                  <div className="w-28 shrink-0">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                      <Input
                        defaultValue={limit > 0 ? String(limit).replace('.', ',') : ''}
                        onBlur={(e) => handleLimitChange(cat.id, e.target.value)}
                        className="h-8 pl-8 text-right text-xs"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}