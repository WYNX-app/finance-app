import { useState } from 'react';
import { Landmark, Plus, Trash2, CheckCircle2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { useDebts, useCreateDebt, usePayDebt, useDeleteDebt, useAccounts, useCategories } from '@/hooks/useData';
import { Modal } from '@/components/ui/Modal';
import { Button, Field, Input, Select } from '@/components/ui/Form';
import { formatMoney } from '@/lib/money';
import { today } from '@/lib/storage';
import type { Debt } from '@/types/domain';

export default function Debts() {
  const debts = useDebts();
  const createDebt = useCreateDebt();
  const deleteDebt = useDeleteDebt();

  const [openForm, setOpenForm] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + d.remaining_amount, 0);
  const monthlyCommitment = debts.filter(d => d.status === 'active').reduce((s, d) => s + d.installment_amount, 0);

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDebt.mutateAsync(deletingId);
      toast.success('Dívida excluída.');
      setDeletingId(null);
    } catch { toast.error('Erro ao excluir.'); }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Controle de obrigações</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Minhas <span className="text-gradient">Dívidas</span>
          </h1>
        </div>
        <Button onClick={() => setOpenForm(true)}>
          <Plus className="h-4 w-4" /> Nova dívida
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-base border-danger/30 bg-danger/5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-danger">Dívida Total</p>
          <p className="mt-1 text-3xl font-bold text-danger">{formatMoney(totalDebt)}</p>
        </div>
        <div className="card-base border-warning/30 bg-warning/5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">Comprometimento Mensal</p>
          <p className="mt-1 text-3xl font-bold text-warning">{formatMoney(monthlyCommitment)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Soma das parcelas mensais</p>
        </div>
      </div>

      {debts.length === 0 ? (
        <div className="card-base p-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-surface-muted text-muted-foreground">
            <Landmark className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium">Nenhuma dívida cadastrada</p>
          <p className="mt-1 text-xs text-muted-foreground">Você está livre de dívidas ou ainda não as registrou.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {debts.map(d => {
            const paidAmount = d.total_amount - d.remaining_amount;
            const pct = Math.min(100, Math.round((paidAmount / d.total_amount) * 100));
            const isPaid = d.status === 'paid';
            const isSingle = d.total_installments === 1;

            return (
              <div key={d.id} className={`card-base flex flex-col justify-between relative ${isPaid ? 'opacity-60' : ''}`}>
                <div>
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{d.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{d.creditor || 'Credor não informado'}</p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                        <CalendarDays className="h-3 w-3" />
                        {isSingle 
                          ? `Vence em: ${d.first_due_date ? new Date(d.first_due_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não definido'}`
                          : `Todo dia ${d.due_day}`
                        }
                      </div>
                    </div>
                    <button onClick={() => setDeletingId(d.id)} className="text-muted-foreground hover:text-danger transition-colors p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-danger">{formatMoney(d.remaining_amount)}</span>
                      <span className="text-muted-foreground text-xs">de {formatMoney(d.total_amount)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{isSingle ? 'Pagamento Único' : `${d.total_installments}x de ${formatMoney(d.installment_amount)}`}</span>
                      <span>{pct}% pago</span>
                    </div>
                  </div>
                </div>

                {isPaid ? (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-success/10 py-2 text-xs font-semibold text-success">
                    <CheckCircle2 className="h-4 w-4" /> Dívida quitada
                  </div>
                ) : (
                  <button onClick={() => setPayingDebt(d)} className="btn-ghost mt-4 w-full border border-border/60 text-xs hover:bg-success/10 hover:text-success hover:border-success/30">
                    Registrar pagamento
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DebtFormModal open={openForm} onClose={() => setOpenForm(false)} onSave={createDebt.mutateAsync} />
      <PayDebtModal debt={payingDebt} onClose={() => setPayingDebt(null)} />

      <Modal open={!!deletingId} onClose={() => setDeletingId(null)} title="Excluir dívida?" footer={
        <>
          <Button variant="ghost" onClick={() => setDeletingId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
        </>
      }>
        <p className="text-sm text-muted-foreground">Tem certeza? O histórico de pagamentos será apagado (as transações já lançadas no extrato serão mantidas).</p>
      </Modal>
    </div>
  );
}

function DebtFormModal({ open, onClose, onSave }: { open: boolean, onClose: () => void, onSave: any }) {
  const [name, setName] = useState('');
  const [creditor, setCreditor] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installments, setInstallments] = useState('1');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [firstDate, setFirstDate] = useState(today());
  const [frequency, setFrequency] = useState<'monthly' | 'single'>('monthly');

  const handleFrequencyChange = (val: 'monthly' | 'single') => {
    setFrequency(val);
    if (val === 'single') {
      setInstallments('1');
      // Se for pagamento único, a parcela é o valor total
      setInstallmentAmount(totalAmount);
    }
  };

  const handleTotalChange = (val: string) => {
    setTotalAmount(val);
    if (frequency === 'single') setInstallmentAmount(val);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(totalAmount.replace(',', '.'));
    const inst = Number(installments);
    const instAmt = Number(installmentAmount.replace(',', '.'));
    
    if (total <= 0 || inst < 1 || instAmt <= 0) return toast.error('Preencha os valores corretamente.');

    // Pega o dia da data escolhida
    const day = firstDate ? new Date(firstDate + 'T12:00:00').getDate() : 1;

    try {
      await onSave({ 
        name, creditor, total_amount: total, remaining_amount: total, 
        total_installments: inst, installment_amount: instAmt, 
        due_day: day, first_due_date: firstDate
      });
      toast.success('Dívida registrada.');
      onClose();
      setName(''); setTotalAmount(''); setInstallmentAmount('');
    } catch (err: any) { 
      toast.error(`Erro: ${err.message}`); 
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova dívida" footer={<Button form="debt-form" type="submit">Salvar</Button>}>
      <form id="debt-form" onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Field label="Nome da dívida"><Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Empréstimo Banco X" /></Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Credor (Opcional)"><Input value={creditor} onChange={e => setCreditor(e.target.value)} /></Field>
        </div>
        
        <Field label="Valor Total (R$)"><Input required inputMode="decimal" value={totalAmount} onChange={e => handleTotalChange(e.target.value)} /></Field>
        <Field label="Frequência">
          <Select value={frequency} onChange={e => handleFrequencyChange(e.target.value as any)}>
            <option value="monthly">Todo mês (Parcelado)</option>
            <option value="single">Só uma vez (Único)</option>
          </Select>
        </Field>

        <Field label="Data do 1º Vencimento">
          <Input type="date" required value={firstDate} onChange={e => setFirstDate(e.target.value)} />
        </Field>
        
        {frequency === 'monthly' ? (
          <>
            <Field label="Nº de Parcelas"><Input required type="number" min="1" value={installments} onChange={e => setInstallments(e.target.value)} /></Field>
            <Field label="Valor da Parcela (R$)"><Input required inputMode="decimal" value={installmentAmount} onChange={e => setInstallmentAmount(e.target.value)} /></Field>
          </>
        ) : (
          <div className="md:col-span-2 rounded-xl bg-surface-muted p-3 text-sm">
            <p className="text-muted-foreground">Esta dívida será registrada como um pagamento único na data selecionada.</p>
          </div>
        )}
      </form>
    </Modal>
  );
}

function PayDebtModal({ debt, onClose }: { debt: Debt | null, onClose: () => void }) {
  const payDebt = usePayDebt();
  const accounts = useAccounts();
  const categories = useCategories();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt) return;
    const val = Number(amount.replace(',', '.'));
    if (val <= 0) return toast.error('Valor inválido.');

    try {
      await payDebt.mutateAsync({ 
        debtId: debt.id, amount: val, 
        accountId: accountId || null, categoryId: categoryId || null, date 
      });
      toast.success('Pagamento registrado e despesa lançada!');
      onClose();
      setAmount('');
    } catch (err) { 
      toast.error('Erro ao pagar.'); 
      console.error(err);
    }
  };

  return (
    <Modal open={!!debt} onClose={onClose} title="Registrar Pagamento" footer={<Button form="pay-form" type="submit">Confirmar Pagamento</Button>}>
      {debt && (
        <form id="pay-form" onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-xl bg-surface-muted p-3 text-sm mb-4">
            <p className="font-semibold">{debt.name}</p>
            <p className="text-muted-foreground text-xs">Saldo devedor: {formatMoney(debt.remaining_amount)}</p>
          </div>
          <Field label="Valor Pago (R$)">
            <Input required inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder={String(debt.installment_amount)} />
          </Field>
          <Field label="Data do Pagamento">
            <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
          </Field>
          <Field label="Conta de Saída (Opcional)" hint="Para descontar o saldo">
            <Select value={accountId} onChange={e => setAccountId(e.target.value)}>
              <option value="">Não descontar de conta</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="Categoria (Opcional)">
            <Select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">Sem categoria</option>
              {categories.filter(c => c.kind === 'expense' || c.kind === 'both').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </form>
      )}
    </Modal>
  );
}