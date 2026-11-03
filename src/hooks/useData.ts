import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { accountsService, categoriesService, transactionsService } from '@/services';
import type { Account, Transaction } from '@/types/domain';

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

/* ---------- LEITURA ---------- */

export function useCategories() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: () => categoriesService.list(user!.id),
    enabled: !!user,
  });
  return data ?? [];
}

export function useAccounts() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: () => accountsService.list(user!.id),
    enabled: !!user,
  });
  return data ?? [];
}

export function useTransactions() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => transactionsService.list(user!.id),
    enabled: !!user,
  });
  return data ?? [];
}

export function useAccountBalances() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['account-balances', user?.id],
    queryFn: () => accountsService.balances(user!.id),
    enabled: !!user,
  });
  return data ?? {};
}

/* ---------- MUTAÇÕES ---------- */

export function useCreateAccount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_archived'>) =>
      accountsService.create(user!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Account> }) =>
      accountsService.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useCreateTransaction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      transactionsService.create(user!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Transaction> }) =>
      transactionsService.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}

/* compat: não usado mais, mantido pra evitar quebra de imports antigos */
export function useAccountBalance(_accountId: string) {
  const balances = useAccountBalances();
  return num(balances[_accountId]);
}

import { creditCardsService, creditCardInvoicesService, creditCardPurchasesService } from '@/services';
import type { CreditCard } from '@/types/domain';

/* ---------- CREDIT CARDS ---------- */
export function useCreditCards() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['credit_cards', user?.id],
    queryFn: () => creditCardsService.list(user!.id),
    enabled: !!user,
  });
  return data ?? [];
}

export function useCreateCreditCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_archived'>) =>
      creditCardsService.create(user!.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credit_cards'] }),
  });
}

export function useUpdateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CreditCard> }) =>
      creditCardsService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credit_cards'] }),
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creditCardsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit_cards'] });
      qc.invalidateQueries({ queryKey: ['credit_card_invoices'] });
      qc.invalidateQueries({ queryKey: ['credit_card_purchases'] });
    },
  });
}

export function useInvoices(cardId: string | null) {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['credit_card_invoices', user?.id, cardId],
    queryFn: () => creditCardInvoicesService.listByCard(user!.id, cardId!),
    enabled: !!user && !!cardId,
  });
  return data ?? [];
}

export function usePurchases(cardId: string | null) {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['credit_card_purchases', user?.id, cardId],
    queryFn: () => creditCardPurchasesService.listByCard(user!.id, cardId!),
    enabled: !!user && !!cardId,
  });
  return data ?? [];
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      cardId: string;
      description: string;
      totalAmount: number;
      purchaseDate: string;
      categoryId?: string;
      installmentsCount: number;
      notes?: string;
    }) => creditCardPurchasesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit_card_invoices'] });
      qc.invalidateQueries({ queryKey: ['credit_card_purchases'] });
    },
  });
}

import { budgetsService, goalsService } from '@/services';
import type { Budget, BudgetCategory, FinancialGoal } from '@/types/domain';

/* ---------- BUDGETS ---------- */
export function useBudget(month: string) {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['budget', user?.id, month],
    queryFn: () => budgetsService.getOrCreateMonth(user!.id, month),
    enabled: !!user,
  });
  return { data, isLoading };
}

export function useSaveBudgetLimit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, categoryId, amount }: { budgetId: string, categoryId: string, amount: number }) =>
      budgetsService.setLimit(user!.id, budgetId, categoryId, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget'] }),
  });
}

/* ---------- GOALS ---------- */
export function useGoals() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => goalsService.list(user!.id),
    enabled: !!user,
  });
  return data ?? [];
}

export function useCreateGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string, target_amount: number, target_date: string | null }) =>
      goalsService.create(user!.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useAddContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, amount, notes }: { goalId: string; amount: number; notes: string | null }) => {
      return goalsService.addContribution(
        goalId,
        Number(amount),
        notes && notes.trim() !== '' ? notes : null
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

import { debtsService } from '@/services';
import type { Debt } from '@/types/domain';

export function useDebts() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['debts', user?.id],
    queryFn: () => debtsService.list(user!.id),
    enabled: !!user,
  });
  return data ?? [];
}

export function useCreateDebt() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'status'>) => debtsService.create(user!.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  });
}

export function usePayDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { debtId: string, amount: number, accountId: string | null, categoryId: string | null, date: string }) => 
      debtsService.payInstallment(data.debtId, data.amount, data.accountId, data.categoryId, data.date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => debtsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  });
}

import { investmentsService } from '@/services';
import type { Investment } from '@/types/domain';

export function useInvestments() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: () => investmentsService.list(user!.id),
    enabled: !!user,
  });
  return data ?? [];
}

export function useCreateInvestment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => 
      investmentsService.create(user!.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investments'] }),
  });
}

export function useUpdateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string, patch: Partial<Investment> }) => 
      investmentsService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investments'] }),
  });
}

export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => investmentsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investments'] }),
  });
}

import { assetsService, liabilitiesService } from '@/services';
import type { Asset, Liability } from '@/types/domain';

export function useAssets() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['assets', user?.id],
    queryFn: () => assetsService.list(user!.id),
    enabled: !!user,
  });
  return data ?? [];
}

export function useCreateAsset() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Asset, 'id' | 'user_id' | 'created_at'>) => assetsService.create(user!.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useLiabilities() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['liabilities', user?.id],
    queryFn: () => liabilitiesService.list(user!.id),
    enabled: !!user,
  });
  return data ?? [];
}

export function useCreateLiability() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Liability, 'id' | 'user_id' | 'created_at'>) => liabilitiesService.create(user!.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liabilities'] }),
  });
}

export function useDeleteLiability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liabilitiesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liabilities'] }),
  });
}