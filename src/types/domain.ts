export type User = {
  id: string;
  email: string;
  name: string;
};

export type AccountType = 
  | 'checking' 
  | 'savings' 
  | 'cash' 
  | 'digital_wallet' 
  | 'payment' 
  | 'benefit' // <--- NOVO AQUI
  | 'other';
  
export type Account = {
  id: string;
  user_id: string;
  name: string;
  institution: string | null;
  type: AccountType;
  initial_balance: number;
  color: string;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryKind = 'income' | 'expense' | 'both';

export type Category = {
  id: string;
  user_id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  is_archived: boolean;
  created_at: string;
};

export type TransactionType = 'income' | 'expense' | 'transfer' | 'refund' | 'adjustment';
export type TransactionStatus = 'pending' | 'paid' | 'received' | 'overdue' | 'canceled';

export type Transaction = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  category_id: string | null;
  account_id: string | null;
  destination_account_id: string | null;
  transaction_date: string;
  due_date: string | null;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreditCard = {
  id: string;
  user_id: string;
  name: string;
  institution: string | null;
  brand: string | null;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  payment_account_id: string | null;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type CreditCardInvoice = {
  id: string;
  user_id: string;
  credit_card_id: string;
  reference_month: string;
  closing_date: string;
  due_date: string;
  total_amount: number;
  status: 'open' | 'closed' | 'paid' | 'overdue';
  paid_at: string | null;
  payment_transaction_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreditCardPurchase = {
  id: string;
  user_id: string;
  credit_card_id: string;
  description: string;
  total_amount: number;
  purchase_date: string;
  category_id: string | null;
  installments_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Installment = {
  id: string;
  user_id: string;
  purchase_id: string;
  invoice_id: string | null;
  installment_number: number;
  amount: number;
  due_date: string;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  reference_month: string;
  created_at: string;
};

export type BudgetCategory = {
  id: string;
  user_id: string;
  budget_id: string;
  category_id: string;
  planned_amount: number;
};

export type FinancialGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: 'active' | 'completed' | 'canceled';
  created_at: string;
};

export type Debt = {
  first_due_date: string;
  id: string;
  user_id: string;
  name: string;
  creditor: string | null;
  total_amount: number;
  remaining_amount: number;
  installment_amount: number;
  total_installments: number;
  due_day: number | null;
  status: 'active' | 'paid' | 'overdue';
  created_at: string;
};

export type InvestmentType = 'fixed_income' | 'stocks' | 'reits' | 'crypto' | 'funds' | 'other';

export type Investment = {
  id: string;
  user_id: string;
  name: string;
  type: InvestmentType;
  institution: string | null;
  initial_amount: number;
  current_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Asset = {
  id: string;
  user_id: string;
  entity: string;
  name: string;
  type: string;
  value: number;
  created_at: string;
};

export type Liability = {
  id: string;
  user_id: string;
  entity: string;
  name: string;
  type: string;
  value: number;
  created_at: string;
};