import { useMemo } from 'react';
import { useTransactions, useGoals, useBudget } from './useData';

export type AppNotification = {
  id: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  link: string;
  icon: 'bill' | 'budget' | 'goal';
};

export function useNotifications() {
  const transactions = useTransactions();
  const goals = useGoals();
  
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  
  // Pega os orçamentos do mês atual
  const { data: budgetData } = useBudget(currentMonth);

  return useMemo(() => {
    const alerts: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. CONTAS A PAGAR/RECEBER (Vencidas ou vencendo hoje)
    transactions.forEach(t => {
      if (t.status !== 'pending' && t.status !== 'overdue') return;
      
      const dueDate = t.due_date ? new Date(t.due_date + 'T12:00:00') : null;
      if (!dueDate) return;

      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        alerts.push({
          id: `tx-overdue-${t.id}`,
          type: 'danger',
          title: 'Conta Atrasada',
          message: `${t.description} venceu em ${dueDate.toLocaleDateString('pt-BR')}`,
          link: '/transacoes',
          icon: 'bill'
        });
      } else if (diffDays === 0) {
        alerts.push({
          id: `tx-today-${t.id}`,
          type: 'warning',
          title: 'Vence Hoje',
          message: `${t.description} vence hoje.`,
          link: '/transacoes',
          icon: 'bill'
        });
      }
    });

    // 2. ORÇAMENTOS QUASE ESGOTADOS
    if (budgetData?.categories) {
      const spentMap = new Map<string, number>();
      // Soma as despesas pagas do mês
      transactions.forEach(t => {
        if (t.type === 'expense' && t.status === 'paid' && t.transaction_date.startsWith(now.toISOString().slice(0, 7))) {
          spentMap.set(t.category_id || 'none', (spentMap.get(t.category_id || 'none') || 0) + t.amount);
        }
      });

      budgetData.categories.forEach(bc => {
        if (bc.planned_amount <= 0) return;
        
        const spent = spentMap.get(bc.category_id) || 0;
        const pct = (spent / bc.planned_amount) * 100;

        if (pct >= 100) {
          alerts.push({
            id: `budget-100-${bc.category_id}`,
            type: 'danger',
            title: 'Orçamento Estourado',
            message: `Você atingiu 100% do limite nesta categoria.`,
            link: '/orcamentos',
            icon: 'budget'
          });
        } else if (pct >= 80) {
          alerts.push({
            id: `budget-80-${bc.category_id}`,
            type: 'warning',
            title: 'Atenção ao Orçamento',
            message: `Você já usou ${pct.toFixed(0)}% do limite.`,
            link: '/orcamentos',
            icon: 'budget'
          });
        }
      });
    }

    // 3. METAS ATRASADAS OU CONCLUÍDAS
    goals.forEach(g => {
      if (g.status === 'active' && g.target_date) {
        const target = new Date(g.target_date + 'T12:00:00');
        if (target < today) {
          alerts.push({
            id: `goal-late-${g.id}`,
            type: 'warning',
            title: 'Meta Atrasada',
            message: `A meta "${g.name}" passou do prazo estipulado.`,
            link: '/metas',
            icon: 'goal'
          });
        }
      }
    });

    return alerts;
  }, [transactions, goals, budgetData]);
}