import { supabase } from '@/integrations/supabase/client';
import type { 
  Account, Category, Transaction,
  CreditCard, CreditCardInvoice, CreditCardPurchase,
  Budget, BudgetCategory, FinancialGoal,
  Debt, Investment, Asset, Liability
} from '@/types/domain';

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

/* ================= ACCOUNTS ================= */
export const accountsService = {
  async list(userId: string): Promise<Account[]> {
    const { data, error } = await supabase.from('accounts').select('*').eq('user_id', userId).eq('is_archived', false).order('created_at');
    if (error) throw error;
    return (data ?? []).map((a: any) => ({ ...a, initial_balance: num(a.initial_balance) }));
  },
  async balances(userId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase.from('v_account_balances').select('account_id,current_balance').eq('user_id', userId);
    if (error) throw error;
    const map: Record<string, number> = {};
    for (const row of data ?? []) map[(row as any).account_id] = num((row as any).current_balance);
    return map;
  },
  async create(userId: string, data: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_archived'>): Promise<Account> {
    const { data: row, error } = await supabase.from('accounts').insert({ ...data, user_id: userId }).select().single();
    if (error) throw error;
    return { ...(row as any), initial_balance: num((row as any).initial_balance) };
  },
  async update(id: string, patch: Partial<Account>): Promise<void> {
    const { error } = await supabase.from('accounts').update(patch).eq('id', id);
    if (error) throw error;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
  },
};

/* ================= CATEGORIES ================= */
export const categoriesService = {
  async list(userId: string): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').eq('user_id', userId).eq('is_archived', false).order('name');
    if (error) throw error;
    return (data ?? []) as Category[];
  },
};

/* ================= TRANSACTIONS ================= */
export const transactionsService = {
  async list(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('transaction_date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((t: any) => ({ ...t, amount: num(t.amount) }));
  },
  async create(userId: string, data: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const { data: row, error } = await supabase.from('transactions').insert({ ...data, user_id: userId }).select().single();
    if (error) {
      console.error("Erro no Supabase (Transação):", error);
      throw new Error(error.message);
    }
    return { ...(row as any), amount: num((row as any).amount) };
  },
  async update(id: string, patch: Partial<Transaction>): Promise<void> {
    const { error } = await supabase.from('transactions').update(patch).eq('id', id);
    if (error) {
      console.error("Erro no Supabase (Update Transação):", error);
      throw new Error(error.message);
    }
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },
};

/* ================= CREDIT CARDS ================= */
export const creditCardsService = {
  async list(userId: string): Promise<CreditCard[]> {
    const { data, error } = await supabase.from('credit_cards').select('*').eq('user_id', userId).eq('is_archived', false).order('created_at');
    if (error) throw error;
    return (data ?? []).map((c: any) => ({ ...c, credit_limit: num(c.credit_limit) }));
  },
  async create(userId: string, data: Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_archived'>): Promise<CreditCard> {
    const { data: row, error } = await supabase.from('credit_cards').insert({ ...data, user_id: userId }).select().single();
    if (error) throw error;
    return { ...(row as any), credit_limit: num((row as any).credit_limit) };
  },
  async update(id: string, patch: Partial<CreditCard>): Promise<void> {
    const { error } = await supabase.from('credit_cards').update(patch).eq('id', id);
    if (error) throw error;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (error) throw error;
  },
};

export const creditCardInvoicesService = {
  async listByCard(userId: string, cardId: string): Promise<CreditCardInvoice[]> {
    const { data, error } = await supabase.from('credit_card_invoices').select('*').eq('user_id', userId).eq('credit_card_id', cardId).order('reference_month', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((i: any) => ({ ...i, total_amount: num(i.total_amount) }));
  },
};

export const creditCardPurchasesService = {
  async create(data: { cardId: string; description: string; totalAmount: number; purchaseDate: string; categoryId?: string; installmentsCount: number; notes?: string; }): Promise<string> {
    const { data: purchaseId, error } = await supabase.rpc('create_credit_card_purchase', {
      p_credit_card_id: data.cardId, p_description: data.description, p_total_amount: data.totalAmount,
      p_purchase_date: data.purchaseDate, p_category_id: data.categoryId || null,
      p_installments_count: data.installmentsCount, p_notes: data.notes || '',
    });
    if (error) throw error;
    return purchaseId as string;
  },
  async listByCard(userId: string, cardId: string): Promise<CreditCardPurchase[]> {
    const { data, error } = await supabase.from('credit_card_purchases').select('*').eq('user_id', userId).eq('credit_card_id', cardId).order('purchase_date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((p: any) => ({ ...p, total_amount: num(p.total_amount) }));
  },
};

/* ================= BUDGETS ================= */
export const budgetsService = {
  async getOrCreateMonth(userId: string, month: string): Promise<{ budget: Budget, categories: BudgetCategory[] }> {
    const { data: b, error: e1 } = await supabase.from('budgets').select('*').eq('user_id', userId).eq('reference_month', month).maybeSingle();
    if (e1) throw e1;
    let budget = b;
    if (!budget) {
      const { data: nb, error: e2 } = await supabase.from('budgets').insert({ user_id: userId, reference_month: month }).select().single();
      if (e2) throw e2;
      budget = nb;
    }
    const { data: cats, error: e3 } = await supabase.from('budget_categories').select('*').eq('budget_id', budget.id);
    if (e3) throw e3;
    return { budget, categories: (cats ?? []).map(c => ({ ...c, planned_amount: num(c.planned_amount) })) };
  },
  async setLimit(userId: string, budgetId: string, categoryId: string, amount: number): Promise<void> {
    const { error } = await supabase.from('budget_categories').upsert({ user_id: userId, budget_id: budgetId, category_id: categoryId, planned_amount: amount }, { onConflict: 'budget_id, category_id' });
    if (error) throw error;
  }
};

/* ================= GOALS ================= */
export const goalsService = {
  async list(userId: string): Promise<FinancialGoal[]> {
    const { data, error } = await supabase.from('financial_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(g => ({ ...g, target_amount: num(g.target_amount), current_amount: num(g.current_amount) }));
  },
  async create(userId: string, data: { name: string, target_amount: number, target_date: string | null }): Promise<void> {
    const { error } = await supabase.from('financial_goals').insert({ ...data, user_id: userId });
    if (error) throw error;
  },
  async addContribution(goalId: string, amount: number, notes: string | null): Promise<void> {
    const { error } = await supabase.rpc('add_goal_contribution', { p_goal_id: goalId, p_amount: Number(amount), p_notes: notes || '' });
    if (error) throw error;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('financial_goals').delete().eq('id', id);
    if (error) throw error;
  }
};

/* ================= DEBTS ================= */
export const debtsService = {
  async list(userId: string): Promise<Debt[]> {
    const { data, error } = await supabase.from('debts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(d => ({ ...d, total_amount: num(d.total_amount), remaining_amount: num(d.remaining_amount), installment_amount: num(d.installment_amount) }));
  },
  async create(userId: string, data: any): Promise<void> {
    const { error } = await supabase.from('debts').insert({ ...data, user_id: userId }).select();
    if (error) { console.error(error); throw new Error(error.message); }
  },
  async payInstallment(debtId: string, amount: number, accountId: string | null, categoryId: string | null, date: string): Promise<void> {
    const { error } = await supabase.rpc('pay_debt_installment', { p_debt_id: debtId, p_amount: Number(amount), p_account_id: accountId || null, p_category_id: categoryId || null, p_payment_date: date });
    if (error) throw error;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) throw error;
  }
};

/* ================= INVESTMENTS ================= */
export const investmentsService = {
  async list(userId: string): Promise<Investment[]> {
    const { data, error } = await supabase.from('investments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(i => ({ ...i, initial_amount: num(i.initial_amount), current_amount: num(i.current_amount) }));
  },
  async create(userId: string, data: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { error } = await supabase.from('investments').insert({ ...data, user_id: userId });
    if (error) throw error;
  },
  async update(id: string, patch: Partial<Investment>): Promise<void> {
    const { error } = await supabase.from('investments').update(patch).eq('id', id);
    if (error) throw error;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('investments').delete().eq('id', id);
    if (error) throw error;
  }
};

/* ================= ASSETS & LIABILITIES ================= */
export const assetsService = {
  async list(userId: string): Promise<Asset[]> {
    const { data, error } = await supabase.from('assets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(a => ({ ...a, value: num(a.value) }));
  },
  async create(userId: string, data: Omit<Asset, 'id' | 'user_id' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('assets').insert({ ...data, user_id: userId });
    if (error) throw error;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) throw error;
  }
};

export const liabilitiesService = {
  async list(userId: string): Promise<Liability[]> {
    const { data, error } = await supabase.from('liabilities').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(l => ({ ...l, value: num(l.value) }));
  },
  async create(userId: string, data: Omit<Liability, 'id' | 'user_id' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('liabilities').insert({ ...data, user_id: userId });
    if (error) throw error;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('liabilities').delete().eq('id', id);
    if (error) throw error;
  }
};