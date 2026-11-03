import { useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { useTransactions, useCategories } from '@/hooks/useData';
import { formatMoney } from '@/lib/money';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button, Field, Input, Select } from '@/components/ui/Form';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell 
} from 'recharts';

const CHART_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

export default function Reports() {
  const transactions = useTransactions();
  const categories = useCategories();

  const [period, setPeriod] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // 1. CÁLCULO DO PERÍODO CORRIGIDO (Com hora final 23:59:59)
  const dateRange = useMemo(() => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (period === 'this_month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'last_month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (period === 'last_3_months') {
      start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'this_year') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    } else if (period === 'custom') {
      start = customStart ? new Date(customStart + 'T00:00:00') : new Date(0);
      end = customEnd ? new Date(customEnd + 'T23:59:59') : new Date();
    }

    // Ajuste fino: Força o início do dia (00:00) e o fim do dia (23:59:59)
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, [period, customStart, customEnd]);

  // 2. FILTRO DE TRANSAÇÕES
  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.transaction_date + 'T12:00:00');
      return d >= dateRange.start && d <= dateRange.end && t.status !== 'canceled';
    });
  }, [transactions, dateRange]);

  // 3. MATEMÁTICA (Agora soma TUDO, independente de ser pago/pendente)
  const { income, expense, balance, catData, monthData } = useMemo(() => {
    // Soma todas as receitas (exceto canceladas)
    const inc = filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    
    // Soma todas as despesas (exceto canceladas)
    const exp = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    // Gastos por categoria (Pizza)
    const catMap = new Map<string, number>();
    filteredTx.filter(t => t.type === 'expense').forEach(t => {
      const catName = categories.find(c => c.id === t.category_id)?.name || 'Sem Categoria';
      catMap.set(catName, (catMap.get(catName) || 0) + t.amount);
    });
    const catData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // Evolução Mensal (Barras)
    const monthMap = new Map<string, { month: string, receita: number, despesa: number }>();
    filteredTx.forEach(t => {
      const d = new Date(t.transaction_date + 'T12:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
      
      if (!monthMap.has(key)) monthMap.set(key, { month: label, receita: 0, despesa: 0 });
      
      const entry = monthMap.get(key)!;
      if (t.type === 'income') entry.receita += t.amount;
      if (t.type === 'expense') entry.despesa += t.amount;
    });
    const monthData = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    return { income: inc, expense: exp, balance: inc - exp, catData, monthData };
  }, [filteredTx, categories]);

  const exportCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Status', 'Valor'];
    const rows = filteredTx.map(t => [
      new Date(t.transaction_date + 'T12:00:00').toLocaleDateString('pt-BR'),
      `"${t.description}"`,
      `"${categories.find(c => c.id === t.category_id)?.name || ''}"`,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.status,
      t.amount.toString().replace('.', ',')
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-10 print:p-0">
      <header className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Análise de dados</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Relatórios <span className="text-gradient">Financeiros</span></h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="ghost" className="border border-border/60"><Download className="h-4 w-4" /> CSV</Button>
          <Button onClick={() => window.print()}><FileText className="h-4 w-4" /> PDF / Imprimir</Button>
        </div>
      </header>

      {/* Filtros */}
      <Card className="print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Field label="Período">
            <Select value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="this_month">Este mês</option>
              <option value="last_month">Mês passado</option>
              <option value="last_3_months">Últimos 3 meses</option>
              <option value="this_year">Este ano</option>
              <option value="custom">Personalizado</option>
            </Select>
          </Field>
          {period === 'custom' && (
            <>
              <Field label="De"><Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} /></Field>
              <Field label="Até"><Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></Field>
            </>
          )}
        </div>
      </Card>

      {/* Alerta caso não haja dados */}
      {filteredTx.length === 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-center text-sm text-warning">
          Nenhuma transação encontrada para o período selecionado. Mude o filtro de período acima.
        </div>
      )}

      {/* KPIs do Relatório */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-success/30 bg-success/5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-success">Receitas no Período</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatMoney(income)}</p>
        </Card>
        <Card className="border-danger/30 bg-danger/5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-danger">Despesas no Período</p>
          <p className="mt-1 text-2xl font-bold text-danger">{formatMoney(expense)}</p>
        </Card>
        <Card className="bg-surface-muted">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Resultado Líquido</p>
          <p className={`mt-1 text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-danger'}`}>{formatMoney(balance)}</p>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block print:space-y-6">
        <Card>
          <CardHeader><CardTitle>Evolução Mensal (Receita vs Despesa)</CardTitle></CardHeader>
          <div className="h-72 mt-4">
            {monthData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sem dados no período.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v/1000}k`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatMoney(v)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="receita" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
          <div className="h-72 mt-4">
            {catData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sem despesas no período.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" outerRadius={90} stroke="none" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                    {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Tabela de Lançamentos */}
      <Card className="hidden sm:block overflow-hidden">
        <CardHeader><CardTitle>Extrato Detalhado</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredTx.map(t => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">{new Date(t.transaction_date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 font-medium">{t.description}</td>
                  <td className="px-4 py-3 text-muted-foreground">{categories.find(c => c.id === t.category_id)?.name || '-'}</td>
                  <td className="px-4 py-3"><span className="text-[10px] uppercase tracking-wider bg-muted px-2 py-0.5 rounded-full">{t.status}</span></td>
                  <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}