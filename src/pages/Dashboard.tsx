import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, CreditCard, Plus, Wallet } from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts, useAccountBalances, useCategories, useTransactions } from '@/hooks/useData';
import { formatMoney } from '@/lib/money';

const CHART_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
const monthKey = (d: string) => d.slice(0, 7);

export default function Dashboard() {
  const { user } = useAuth();
  const transactions = useTransactions();
  const accounts = useAccounts();
  const balances = useAccountBalances();
  const categories = useCategories();
  const navigate = useNavigate();

  const isEmpty = accounts.length === 0 && transactions.length === 0;

  const { kpis, months, pieData, recent } = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthTx = transactions.filter((t) => monthKey(t.transaction_date) === thisMonth);
    const income = monthTx
      .filter((t) => t.type === 'income' && t.status === 'received')
      .reduce((s, t) => s + t.amount, 0);
    const expense = monthTx
      .filter((t) => t.type === 'expense' && t.status === 'paid')
      .reduce((s, t) => s + t.amount, 0);

    const totalBalance = accounts.reduce((s, a) => s + (balances[a.id] ?? 0), 0);

    const monthsMap = new Map<string, { m: string; receitas: number; despesas: number }>();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      monthsMap.set(key, { m: label, receitas: 0, despesas: 0 });
    }
    transactions.forEach((t) => {
      const m = monthsMap.get(monthKey(t.transaction_date));
      if (!m) return;
      if (t.type === 'income' && t.status === 'received') m.receitas += t.amount;
      if (t.type === 'expense' && t.status === 'paid') m.despesas += t.amount;
    });

    const byCat = new Map<string, number>();
    monthTx.forEach((t) => {
      if (t.type !== 'expense' || t.status !== 'paid' || !t.category_id) return;
      byCat.set(t.category_id, (byCat.get(t.category_id) ?? 0) + t.amount);
    });
    const pieData = [...byCat.entries()]
      .map(([id, value]) => ({ name: categories.find((c) => c.id === id)?.name ?? 'Outros', value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      kpis: [
        { label: 'Saldo total', value: totalBalance, icon: Wallet, color: 'primary' as const },
        { label: 'Receitas do mês', value: income, icon: ArrowUpRight, color: 'success' as const },
        { label: 'Despesas do mês', value: expense, icon: ArrowDownRight, color: 'danger' as const },
        { label: 'Faturas cartão', value: 0, icon: CreditCard, color: 'accent' as const },
      ],
      months: [...monthsMap.values()],
      pieData,
      recent: transactions.slice(0, 5),
    };
  }, [transactions, accounts, balances, categories]);

  const KPI_BG = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
    accent: 'bg-accent/10 text-accent',
  };

  if (isEmpty) {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
        <div className="w-full max-w-lg animate-fade-in text-center">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-brand shadow-2xl shadow-primary/40">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            Vamos <span className="text-gradient">começar</span>
          </h1>
          <p className="mx-auto mb-8 max-w-sm text-sm text-muted-foreground">
            Sua central financeira está pronta. Cadastre sua primeira conta e registre suas movimentações.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => navigate('/contas')} className="btn-primary">
              <Plus className="h-4 w-4" /> Criar primeira conta
            </button>
            <button onClick={() => navigate('/transacoes')} className="btn-ghost">
              Registrar transação
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm text-muted-foreground">Bem-vindo de volta, {user?.name}</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Visão <span className="text-gradient">geral</span>
        </h1>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="group transition-transform duration-200 hover:-translate-y-0.5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${KPI_BG[color]}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{formatMoney(value)}</p>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receitas vs. Despesas</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--surface))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatMoney(v)}
                />
                <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#8b5cf6" strokeWidth={2} fill="url(#g-inc)" />
                <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ec4899" strokeWidth={2} fill="url(#g-exp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por categoria</CardTitle>
          </CardHeader>
          <div className="relative h-72">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Sem despesas esse mês
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3} stroke="none">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--surface))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatMoney(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</span>
                  <span className="text-lg font-bold">
                    {formatMoney(pieData.reduce((s, p) => s + p.value, 0))}
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Transações recentes</CardTitle>
        </CardHeader>
        {recent.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium">Nenhuma transação ainda</p>
            <button
              onClick={() => navigate('/transacoes')}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Criar primeira transação →
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {recent.map((t) => {
              const isIncome = t.type === 'income';
              const cat = categories.find((c) => c.id === t.category_id);
              return (
                <li key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isIncome ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'}`}>
                    {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{cat?.name ?? 'Sem categoria'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isIncome ? 'text-success' : 'text-foreground'}`}>
                      {formatMoney(t.amount)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(t.transaction_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}