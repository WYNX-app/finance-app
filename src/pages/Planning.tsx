import { useMemo, useState } from 'react';
import { useTransactions, useAccounts, useAccountBalances, useGoals, useDebts } from '@/hooks/useData';
import { formatMoney } from '@/lib/money';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  ShieldCheck, Calculator, Landmark
} from 'lucide-react';

export default function Planning() {
  const transactions = useTransactions();
  const accounts = useAccounts();
  const balances = useAccountBalances();
  const goals = useGoals();
  const debts = useDebts(); // NOVO: Integração de dívidas

  const [simulateAmount, setSimulateAmount] = useState('500');
  const [simulateGoal, setSimulateGoal] = useState('10000');

  // ==========================================
  // MATEMÁTICA FINANCEIRA
  // ==========================================
  const analysis = useMemo(() => {
    // Pega os últimos 3 meses para tirar uma média conservadora
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    const recentTx = transactions.filter(t => new Date(t.transaction_date) >= threeMonthsAgo);

    // Soma os valores
    const totalIncome = recentTx
      .filter(t => t.type === 'income' && t.status === 'received')
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = recentTx
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((s, t) => s + t.amount, 0);

    // Médias mensais
    const avgIncome = totalIncome / 3;
    const avgExpense = totalExpense / 3;

    // NOVO: Pega o comprometimento mensal de dívidas ativas
    const monthlyDebtCommitment = debts
      .filter(d => d.status === 'active')
      .reduce((s, d) => s + d.installment_amount, 0);

    // A capacidade de poupança real desconta as parcelas das dívidas
    const realSavingsCapacity = avgIncome - avgExpense - monthlyDebtCommitment;

    // Saldo Total Atual
    const currentBalance = accounts.reduce((s, a) => s + (balances[a.id] ?? 0), 0);

    // Reserva de Emergência ideal (6 meses de despesas)
    const idealEmergencyFund = avgExpense * 6;
    
    // Taxa de Poupança (% da renda que sobra após despesas e dívidas)
    const savingsRate = avgIncome > 0 ? (realSavingsCapacity / avgIncome) * 100 : 0;

    // Projeção de 12 meses baseada na NOVA capacidade de poupança
    const projectionData = [];
    let projectedBalance = currentBalance;
    for (let i = 0; i <= 12; i++) {
      const monthLabel = new Date(today.getFullYear(), today.getMonth() + i, 1)
        .toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      
      projectionData.push({
        month: i === 0 ? 'Hoje' : monthLabel,
        saldo: projectedBalance,
      });
      projectedBalance += realSavingsCapacity;
    }

    return {
      avgIncome,
      avgExpense,
      monthlyDebtCommitment, // Incluído no retorno
      avgSavings: realSavingsCapacity, // O avgSavings agora é a capacidade REAL
      currentBalance,
      idealEmergencyFund,
      savingsRate,
      projectionData
    };
  }, [transactions, accounts, balances, debts]); // debts adicionado as dependências

  // Simulador de metas (Juros simples)
  const sim = useMemo(() => {
    const amt = Number(simulateAmount.replace(',', '.')) || 0;
    const target = Number(simulateGoal.replace(',', '.')) || 0;
    if (amt <= 0 || target <= 0) return { months: 0, text: '-' };
    
    const months = Math.ceil(target / amt);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    let text = '';
    if (years > 0) text += `${years} ano${years > 1 ? 's' : ''} e `;
    text += `${remainingMonths} mês${remainingMonths !== 1 ? 'es' : ''}`;
    
    return { months, text };
  }, [simulateAmount, simulateGoal]);

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm text-muted-foreground">Análise e projeções</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Planejamento <span className="text-gradient">Financeiro</span>
        </h1>
      </header>

      {/* Alerta de Dívidas */}
      {analysis.monthlyDebtCommitment > 0 && (
        <div className="card-base border-warning/30 bg-warning/5 flex items-center justify-between p-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-warning/20 text-warning">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warning">Atenção às Dívidas</p>
              <p className="text-xs text-warning/80">
                Você tem <strong>{formatMoney(analysis.monthlyDebtCommitment)}</strong> comprometidos em parcelas todo mês. 
                Sua capacidade de poupança já desconta esse valor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPIs Principais */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Renda Média (3m)</p>
          <p className="mt-2 text-2xl font-bold text-success">{formatMoney(analysis.avgIncome)}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Despesa Média (3m)</p>
          <p className="mt-2 text-2xl font-bold text-danger">{formatMoney(analysis.avgExpense)}</p>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Capacidade de Poupança</p>
          <p className={`mt-2 text-2xl font-bold ${analysis.avgSavings < 0 ? 'text-danger' : 'text-primary'}`}>
            {formatMoney(analysis.avgSavings)}
            <span className="text-sm font-normal text-muted-foreground">/mês</span>
          </p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Taxa de Poupança</p>
          <div className="mt-2 flex items-end gap-2">
            <p className={`text-2xl font-bold ${analysis.savingsRate >= 20 ? 'text-success' : 'text-warning'}`}>
              {analysis.savingsRate.toFixed(1)}%
            </p>
            <span className="mb-1 text-xs text-muted-foreground">da renda</span>
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna Esquerda: Reserva e Projeção */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Reserva de Emergência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Reserva de Emergência
              </CardTitle>
              <span className="chip">Meta: 6 meses de despesas</span>
            </CardHeader>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Seu saldo atual em contas</span>
                <span className="font-semibold">{formatMoney(analysis.currentBalance)}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-muted-foreground">Reserva ideal</span>
                <span className="font-semibold">{formatMoney(analysis.idealEmergencyFund)}</span>
              </div>
              
              <div className="relative h-4 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-brand transition-all"
                  style={{ width: `${Math.min(100, (analysis.currentBalance / analysis.idealEmergencyFund) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-right">
                {analysis.idealEmergencyFund > 0 
                  ? `${Math.min(100, Math.round((analysis.currentBalance / analysis.idealEmergencyFund) * 100))}% completo`
                  : 'Adicione despesas para calcular'}
              </p>
            </div>
          </Card>

          {/* Gráfico de Projeção */}
          <Card>
            <CardHeader>
              <CardTitle>Projeção de Patrimônio (12 meses)</CardTitle>
              <span className="text-xs text-muted-foreground">Baseado na sua capacidade real de poupança</span>
            </CardHeader>
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analysis.projectionData} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g-proj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => formatMoney(v)} 
                  />
                  <Area type="monotone" dataKey="saldo" name="Saldo Projetado" stroke="#8b5cf6" strokeWidth={3} fill="url(#g-proj)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Coluna Direita: Simulador */}
        <div className="space-y-6">
          <Card className="bg-gradient-brand text-white border-0">
            <div className="mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-white/80" />
              <h2 className="text-lg font-bold">Simulador de Metas</h2>
            </div>
            <p className="text-xs text-white/70 mb-6">Descubra em quanto tempo você atinge um objetivo juntando um valor fixo por mês.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/90 mb-1 block">Quanto vou guardar por mês? (R$)</label>
                <input
                  value={simulateAmount}
                  onChange={e => setSimulateAmount(e.target.value)}
                  className="w-full h-10 rounded-xl bg-white/20 px-3 text-sm text-white placeholder-white/50 outline-none focus:bg-white/30 transition-colors"
                  placeholder="Ex: 500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/90 mb-1 block">Qual o objetivo final? (R$)</label>
                <input
                  value={simulateGoal}
                  onChange={e => setSimulateGoal(e.target.value)}
                  className="w-full h-10 rounded-xl bg-white/20 px-3 text-sm text-white placeholder-white/50 outline-none focus:bg-white/30 transition-colors"
                  placeholder="Ex: 10000"
                />
              </div>

              <div className="mt-6 rounded-xl bg-black/20 p-4 text-center">
                <p className="text-xs text-white/70 uppercase tracking-widest mb-1">Tempo estimado</p>
                <p className="text-2xl font-bold">{sim.text}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regra 50/30/20</CardTitle>
            </CardHeader>
            <div className="space-y-4 mt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Essenciais (50%)</span>
                  <span className="font-semibold">{formatMoney(analysis.avgIncome * 0.5)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: '50%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Estilo de vida (30%)</span>
                  <span className="font-semibold">{formatMoney(analysis.avgIncome * 0.3)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: '30%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Poupança/Investimentos (20%)</span>
                  <span className="font-semibold text-success">{formatMoney(analysis.avgIncome * 0.2)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-success" style={{ width: '20%' }} /></div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Baseado na sua renda média de {formatMoney(analysis.avgIncome)}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}