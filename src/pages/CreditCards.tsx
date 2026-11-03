import { useMemo, useState } from 'react';
import { CreditCard as CreditCardIcon, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreditCards,
  useCreateCreditCard,
  useUpdateCreditCard,
  useDeleteCreditCard,
  useInvoices,
  usePurchases,
  useCreatePurchase,
  useCategories,
} from '@/hooks/useData';
import { Modal } from '@/components/ui/Modal';
import { Button, Field, Input, Select, Textarea } from '@/components/ui/Form';
import { formatMoney } from '@/lib/money';
import { today } from '@/lib/storage';
import type { CreditCard } from '@/types/domain';

export default function CreditCards() {
  const cards = useCreditCards();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CreditCard | null>(null);
  const [purchaseCard, setPurchaseCard] = useState<CreditCard | null>(null);

  const deleteCard = useDeleteCreditCard();

  const onDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteCard.mutateAsync(confirmDelete.id);
      toast.success('Cartão removido.');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Cartões de crédito</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Seus <span className="text-gradient">cartões</span>
          </h1>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo cartão
        </Button>
      </header>

      {cards.length === 0 ? (
        <div className="card-base p-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand shadow-lg shadow-primary/30">
            <CreditCardIcon className="h-7 w-7 text-white" />
          </div>
          <p className="text-sm font-medium">Nenhum cartão cadastrado</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cadastre seu primeiro cartão para acompanhar limite e faturas.
          </p>
          <button
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
            className="btn-primary mt-5"
          >
            <Plus className="h-4 w-4" /> Cadastrar cartão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((c) => (
            <CardItem
              key={c.id}
              card={c}
              onEdit={() => {
                setEditing(c);
                setOpenForm(true);
              }}
              onDelete={() => setConfirmDelete(c)}
              onPurchase={() => setPurchaseCard(c)}
            />
          ))}
        </div>
      )}

      <CardFormModal open={openForm} onClose={() => setOpenForm(false)} editing={editing} />

      <PurchaseFormModal
        open={!!purchaseCard}
        onClose={() => setPurchaseCard(null)}
        card={purchaseCard}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir cartão?"
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
          Tem certeza que deseja excluir <strong>{confirmDelete?.name}</strong>? As compras e faturas
          vinculadas a este cartão também serão removidas.
        </p>
      </Modal>
    </div>
  );
}

function CardItem({
  card,
  onEdit,
  onDelete,
  onPurchase,
}: {
  card: CreditCard;
  onEdit: () => void;
  onDelete: () => void;
  onPurchase: () => void;
}) {
  const invoices = useInvoices(card.id);
  const purchases = usePurchases(card.id);

  const currentInvoice = useMemo(() => {
    // pega fatura mais recente ainda não paga
    return invoices.find((i) => i.status === 'open' || i.status === 'closed');
  }, [invoices]);

  const used = currentInvoice?.total_amount ?? 0;
  const available = card.credit_limit - used;
  const pct = card.credit_limit > 0 ? Math.min(100, Math.round((used / card.credit_limit) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${card.color} 0%, #ec4899 100%)`,
        }}
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="mb-6 flex items-start justify-between">
            <CreditCardIcon className="h-7 w-7" />
            <div className="text-right">
              <p className="text-xs font-medium text-white/80">{card.institution ?? ''}</p>
              {card.brand && <p className="text-[10px] uppercase text-white/60">{card.brand}</p>}
            </div>
          </div>
          <p className="text-lg font-bold">{card.name}</p>
          <p className="text-[11px] text-white/70">
            Fecha dia {card.closing_day} · Vence dia {card.due_day}
          </p>

          <div className="mt-5 space-y-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-white/70">Fatura atual</span>
              <span className="font-semibold">
                {formatMoney(used)} / {formatMoney(card.credit_limit)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[11px] text-white/70">Disponível: {formatMoney(available)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={onPurchase} className="btn-primary text-xs">
          <ShoppingBag className="h-3.5 w-3.5" /> Nova compra
        </button>
        <button onClick={onEdit} className="btn-ghost text-xs">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Excluir
        </button>
      </div>

      {purchases.length > 0 && (
        <div className="card-base p-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Compras recentes ({purchases.length})
          </p>
          <ul className="space-y-1.5">
            {purchases.slice(0, 3).map((p) => (
              <li key={p.id} className="flex items-center justify-between text-xs">
                <span className="truncate">
                  {p.description}
                  {p.installments_count > 1 && (
                    <span className="ml-1 text-muted-foreground">({p.installments_count}x)</span>
                  )}
                </span>
                <span className="font-medium">{formatMoney(p.total_amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CardFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: CreditCard | null;
}) {
  const createCard = useCreateCreditCard();
  const updateCard = useUpdateCreditCard();

  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [brand, setBrand] = useState('');
  const [limit, setLimit] = useState('0');
  const [closingDay, setClosingDay] = useState('5');
  const [dueDay, setDueDay] = useState('12');
  const [color, setColor] = useState('#8b5cf6');
  const [saving, setSaving] = useState(false);

  // Sincroniza ao abrir
  if (open && name === '' && editing) {
    setName(editing.name);
    setInstitution(editing.institution ?? '');
    setBrand(editing.brand ?? '');
    setLimit(String(editing.credit_limit));
    setClosingDay(String(editing.closing_day));
    setDueDay(String(editing.due_day));
    setColor(editing.color);
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      institution: institution.trim() || null,
      brand: brand.trim() || null,
      credit_limit: Number(limit.replace(',', '.')) || 0,
      closing_day: Number(closingDay),
      due_day: Number(dueDay),
      payment_account_id: null,
      color,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateCard.mutateAsync({ id: editing.id, patch: payload });
        toast.success('Cartão atualizado.');
      } else {
        await createCard.mutateAsync(payload);
        toast.success('Cartão cadastrado.');
      }
      setName('');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar cartão.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setName('');
        onClose();
      }}
      title={editing ? 'Editar cartão' : 'Novo cartão'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="card-form" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <form id="card-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Nome do cartão">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank" />
          </Field>
        </div>
        <Field label="Instituição">
          <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Opcional" />
        </Field>
        <Field label="Bandeira">
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Visa, Master…" />
        </Field>
        <Field label="Limite total (R$)">
          <Input inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </Field>
        <Field label="Cor">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded-xl border border-border/60 bg-surface"
          />
        </Field>
        <Field label="Dia de fechamento" hint="1 a 28">
          <Select value={closingDay} onChange={(e) => setClosingDay(e.target.value)}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Dia de vencimento" hint="1 a 28">
          <Select value={dueDay} onChange={(e) => setDueDay(e.target.value)}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}

function PurchaseFormModal({
  open,
  onClose,
  card,
}: {
  open: boolean;
  onClose: () => void;
  card: CreditCard | null;
}) {
  const categories = useCategories();
  const createPurchase = useCreatePurchase();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [categoryId, setCategoryId] = useState('');
  const [installments, setInstallments] = useState('1');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setDescription('');
    setAmount('');
    setDate(today());
    setCategoryId('');
    setInstallments('1');
    setNotes('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    const value = Number(amount.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }
    const count = Number(installments);
    if (count < 1 || count > 48) {
      toast.error('Parcelas entre 1 e 48.');
      return;
    }
    setSaving(true);
    try {
      await createPurchase.mutateAsync({
        cardId: card.id,
        description: description.trim(),
        totalAmount: value,
        purchaseDate: date,
        categoryId: categoryId || undefined,
        installmentsCount: count,
        notes: notes.trim() || undefined,
      });
      toast.success('Compra registrada.');
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar compra.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Nova compra no cartão"
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="purchase-form" disabled={saving}>
            {saving ? 'Salvando…' : 'Registrar'}
          </Button>
        </>
      }
    >
      <form id="purchase-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Descrição">
            <Input required value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <Field label="Valor total (R$)">
          <Input
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
          />
        </Field>
        <Field label="Data da compra">
          <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Categoria">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {categories
              .filter((c) => c.kind === 'expense' || c.kind === 'both')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Parcelas" hint="1x = à vista">
          <Select value={installments} onChange={(e) => setInstallments(e.target.value)}>
            {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}x {n > 1 && amount ? `de ${formatMoney(Number(amount.replace(',', '.')) / n)}` : ''}
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