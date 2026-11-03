import { useState } from 'react';
import { Banknote, CreditCard, Pencil, Plus, Trash2, Wallet, Ticket, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAccounts,
  useAccountBalances,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '@/hooks/useData';
import { Modal } from '@/components/ui/Modal';
import { Button, Field, Input, Select } from '@/components/ui/Form';
import { formatMoney } from '@/lib/money';
import type { Account, AccountType } from '@/types/domain';

const ICONS: Record<AccountType, typeof Wallet> = {
  checking: Wallet,
  savings: Banknote,
  cash: Banknote,
  digital_wallet: CreditCard,
  payment: CreditCard,
  benefit: Ticket, // NOVO ÍCONE
  other: Wallet,
};

export default function Accounts() {
  const accounts = useAccounts();
  const balances = useAccountBalances();
  const createAcc = useCreateAccount();
  const updateAcc = useUpdateAccount();
  const deleteAcc = useDeleteAccount();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Account | null>(null);

  const total = accounts.reduce((sum, a) => sum + (balances[a.id] ?? 0), 0);

  const onDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAcc.mutateAsync(confirmDelete.id);
      toast.success('Conta excluída.');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Suas contas</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Contas & <span className="text-gradient">Benefícios</span>
          </h1>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nova conta
        </Button>
      </header>

      <div className="card-base border-0 bg-gradient-brand text-white">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-white/70">Saldo Total</p>
        <p className="text-3xl font-bold tracking-tight">{formatMoney(total)}</p>
        <p className="mt-1 text-xs text-white/70">{accounts.length} contas ativas</p>
      </div>

      {accounts.length === 0 ? (
        <div className="card-base p-10 text-center">
          <p className="text-sm font-medium">Nenhuma conta ainda</p>
          <p className="mt-1 text-xs text-muted-foreground">Crie sua primeira conta para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => {
            const Icon = ICONS[a.type] || Wallet;
            const balance = balances[a.id] ?? 0;
            return (
              <div key={a.id} className="card-base transition-transform duration-200 hover:-translate-y-0.5">
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl text-white"
                    style={{ background: a.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditing(a);
                        setOpenForm(true);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(a)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold">{a.name}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{formatMoney(balance)}</p>
                {a.institution && <p className="mt-0.5 text-[11px] text-muted-foreground">{a.institution}</p>}
              </div>
            );
          })}
        </div>
      )}

      <AccountFormModal open={openForm} onClose={() => setOpenForm(false)} editing={editing} />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir conta?"
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
          Tem certeza que deseja excluir <strong>{confirmDelete?.name}</strong>? Transações vinculadas
          continuarão existindo, mas sem conta.
        </p>
      </Modal>
    </div>
  );
}

function AccountFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Account | null;
}) {
  const createAcc = useCreateAccount();
  const updateAcc = useUpdateAccount();

  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [initialBalance, setInitialBalance] = useState('0');
  const [color, setColor] = useState('#8b5cf6');
  const [saving, setSaving] = useState(false);

  if (open && name === '' && editing) {
    setName(editing.name);
    setInstitution(editing.institution ?? '');
    setType(editing.type);
    setInitialBalance(String(editing.initial_balance));
    setColor(editing.color);
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      institution: institution.trim() || null,
      type,
      initial_balance: Number(initialBalance.replace(',', '.')) || 0,
      color,
      notes: null,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateAcc.mutateAsync({ id: editing.id, patch: payload });
        toast.success('Conta atualizada.');
      } else {
        await createAcc.mutateAsync(payload);
        toast.success('Conta criada.');
      }
      onClose();
      setName('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar conta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setName(''); }}
      title={editing ? 'Editar conta' : 'Nova conta'}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="acc-form" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <form id="acc-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Nome">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vale Alimentação, Nubank..." />
        </Field>
        <Field label="Instituição / Bandeira">
          <Input
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="Ex: Sodexo, Alelo, Itaú..."
          />
        </Field>
        <Field label="Tipo">
          <Select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            <option value="checking">Conta corrente</option>
            <option value="savings">Poupança</option>
            <option value="cash">Dinheiro</option>
            <option value="digital_wallet">Carteira digital</option>
            <option value="payment">Conta de pagamento</option>
            <option value="benefit">Benefício (Vale)</option> {/* NOVA OPÇÃO */}
            <option value="other">Outra</option>
          </Select>
        </Field>
        <Field label="Saldo Inicial (R$)">
          <Input
            inputMode="decimal"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
          />
        </Field>
        <Field label="Cor">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded-xl border border-border/60 bg-surface"
          />
        </Field>
      </form>
    </Modal>
  );
}