import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAccounts,
  useCategories,
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/useData';
import { Modal } from '@/components/ui/Modal';
import { Button, Field, Input, Select, Textarea } from '@/components/ui/Form';
import { formatMoney } from '@/lib/money';
import { today } from '@/lib/storage';
import type { Transaction, TransactionStatus, TransactionType } from '@/types/domain';

const FILTERS = ['Todas', 'Receitas', 'Despesas', 'Pendentes'] as const;

export default function Transactions() {
  const transactions = useTransactions();
  const accounts = useAccounts();
  const categories = useCategories();

  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Todas');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'Receitas' && t.type !== 'income') return false;
      if (filter === 'Despesas' && t.type !== 'expense') return false;
      if (filter === 'Pendentes' && t.status !== 'pending' && t.status !== 'overdue') return false;
      return true;
    });
  }, [transactions, search, filter]);

  const onDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteTx.mutateAsync(confirmDelete.id);
      toast.success('Transação excluída.');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Histórico completo</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Transações <span className="text-gradient">financeiras</span>
          </h1>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nova transação
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar por descrição…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border/60 bg-surface/60 pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? 'rounded-full bg-gradient-brand px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25'
                  : 'rounded-full border border-border/60 bg-surface/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted'
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card-base p-0">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium">Nenhuma transação encontrada</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ajuste os filtros ou crie sua primeira transação.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((t) => {
              const isIncome = t.type === 'income';
              const cat = categories.find((c) => c.id === t.category_id);
              const acc = accounts.find((a) => a.id === t.account_id);
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      isIncome ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
                    }`}
                  >
                    {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {cat?.name ?? 'Sem categoria'} · {acc?.name ?? 'Sem conta'}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        t.status === 'pending' || t.status === 'overdue'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="w-24 text-right">
                    {/* AQUI GARANTIMOS QUE RECEITA APARECE SEM SINAL E DESPESA COM SINAL DE MENOS */}
                    <p className={`text-sm font-semibold ${isIncome ? 'text-success' : 'text-danger'}`}>
                      {isIncome ? '+' : '- '}
                      {formatMoney(t.amount)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(t.transaction_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditing(t);
                        setOpenForm(true);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(t)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <TransactionFormModal open={openForm} onClose={() => setOpenForm(false)} editing={editing} />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir transação?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={onDelete}>
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja excluir <strong>{confirmDelete?.description}</strong>? Essa ação não
          pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}

function TransactionFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Transaction | null;
}) {
  const accounts = useAccounts();
  const categories = useCategories();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();

  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('paid');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Preenche ao abrir
  if (open && description === '' && editing) {
    setType(editing.type);
    setDescription(editing.description);
    setAmount(String(editing.amount));
    setCategoryId(editing.category_id ?? '');
    setAccountId(editing.account_id ?? '');
    setStatus(editing.status);
    setDate(editing.transaction_date);
    setNotes(editing.notes ?? '');
  }

  // CORREÇÃO MÁGICA: Quando muda o tipo, o status padrão muda junto!
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') setStatus('received'); // Receita entra como "Recebido"
    else if (newType === 'expense') setStatus('paid'); // Despesa entra como "Pago"
    else setStatus('pending');
  };

  const filteredCats = categories.filter((c) => c.kind === type || c.kind === 'both');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }

    const payload = {
      description: description.trim(),
      amount: value,
      type,
      status,
      category_id: categoryId || null,
      account_id: accountId || null,
      destination_account_id: null,
      transaction_date: date,
      due_date: null,
      payment_date: null,
      notes: notes.trim() || null,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateTx.mutateAsync({ id: editing.id, patch: payload });
        toast.success('Transação atualizada.');
      } else {
        await createTx.mutateAsync(payload);
        toast.success('Transação criada.');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar transação.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar transação' : 'Nova transação'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="tx-form" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <form id="tx-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Tipo">
          <Select value={type} onChange={(e) => handleTypeChange(e.target.value as TransactionType)}>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </Select>
        </Field>

        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as TransactionStatus)}>
            {type === 'income' && <option value="received">Recebido</option>}
            {type === 'expense' && <option value="paid">Pago</option>}
            <option value="pending">Pendente</option>
            <option value="overdue">Atrasado</option>
            <option value="canceled">Cancelado</option>
          </Select>
        </Field>

        <div className="md:col-span-2">
          <Field label="Descrição">
            <Input required value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>

        <Field label="Valor (R$)">
          <Input
            required
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>

        <Field label="Data">
          <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label="Categoria">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {filteredCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Conta">
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Sem conta</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="md:col-span-2">
          <Field label="Observações">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}