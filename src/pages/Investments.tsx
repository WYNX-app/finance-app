import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useInvestments, useCreateInvestment, useUpdateInvestment, useDeleteInvestment } from '@/hooks/useData';
import { Modal } from '@/components/ui/Modal';
import { Button, Field, Input, Select } from '@/components/ui/Form';
import { formatMoney } from '@/lib/money';
import type { Investment, InvestmentType } from '@/types/domain';

const TYPE_LABELS: Record<InvestmentType, string> = {
  fixed_income: 'Renda Fixa',
  stocks: 'Ações',
  reits: 'Fundos Imobiliários',
  crypto: 'Criptomoedas',
  funds: 'Fundos',
  other: 'Outros',
};

export default function Investments() {
  const investments = useInvestments();
  const deleteInv = useDeleteInvestment();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [updatingValue, setUpdatingValue] = useState<Investment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { totalInitial, totalCurrent, totalProfit, profitPct } = useMemo(() => {
    const init = investments.reduce((s, i) => s + i.initial_amount, 0);
    const curr = investments.reduce((s, i) => s + i.current_amount, 0);
    const profit = curr - init;
    const pct = init > 0 ? (profit / init) * 100 : 0;
    return { totalInitial: init, totalCurrent: curr, totalProfit: profit, profitPct: pct };
  }, [investments]);

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteInv.mutateAsync(deletingId);
      toast.success('Investimento excluído.');
      setDeletingId(null);
    } catch { toast.error('Erro ao excluir.'); }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Sua carteira</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Investimentos <span className="text-gradient">Pessoais</span>
          </h1>
        </div>
        <Button onClick={() => { setEditing(null); setOpenForm(true); }}>
          <Plus className="h-4 w-4" /> Novo Investimento
        </Button>
      </header>

      {/* Resumo da Carteira */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-base">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total Investido</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(totalInitial)}</p>
        </div>
        <div className="card-base border-primary/30 bg-primary/5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Valor Atual</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatMoney(totalCurrent)}</p>
        </div>
        <div className={`card-base ${totalProfit >= 0 ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>Rentabilidade</p>
          <div className="mt-1 flex items-end gap-2">
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatMoney(totalProfit)}
            </p>
            <span className={`mb-1 text-sm font-semibold ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              ({profitPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Ativos */}
      {investments.length === 0 ? (
        <div className="card-base p-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-surface-muted text-muted-foreground">
            <Briefcase className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium">Nenhum investimento cadastrado</p>
          <p className="mt-1 text-xs text-muted-foreground">Adicione seus ativos para acompanhar a rentabilidade.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {investments.map(inv => {
            const profit = inv.current_amount - inv.initial_amount;
            const pct = inv.initial_amount > 0 ? (profit / inv.initial_amount) * 100 : 0;
            const isPositive = profit >= 0;

            return (
              <div key={inv.id} className="card-base flex flex-col justify-between">
                <div>
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{inv.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{inv.institution || TYPE_LABELS[inv.type]}</p>
                      <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {TYPE_LABELS[inv.type]}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(inv); setOpenForm(true); }} className="p-1 text-muted-foreground hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeletingId(inv.id)} className="p-1 text-muted-foreground hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Investido:</span>
                      <span className="font-medium">{formatMoney(inv.initial_amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Valor Atual:</span>
                      <span className="font-semibold">{formatMoney(inv.current_amount)}</span>
                    </div>
                    <div className={`flex justify-between items-center rounded-lg p-2 mt-2 ${isPositive ? 'bg-success/10' : 'bg-danger/10'}`}>
                      <span className={`text-xs font-medium flex items-center gap-1 ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isPositive ? 'Lucro' : 'Prejuízo'}
                      </span>
                      <span className={`text-xs font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? '+' : ''}{pct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <button onClick={() => setUpdatingValue(inv)} className="btn-ghost mt-4 w-full border border-border/60 text-xs">
                  Atualizar Valor
                </button>
              </div>
            );
          })}
        </div>
      )}

      <InvestmentFormModal open={openForm} onClose={() => setOpenForm(false)} editing={editing} />
      <UpdateValueModal investment={updatingValue} onClose={() => setUpdatingValue(null)} />

      <Modal open={!!deletingId} onClose={() => setDeletingId(null)} title="Excluir investimento?" footer={
        <>
          <Button variant="ghost" onClick={() => setDeletingId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
        </>
      }>
        <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este ativo da sua carteira?</p>
      </Modal>
    </div>
  );
}

function InvestmentFormModal({ open, onClose, editing }: { open: boolean, onClose: () => void, editing: Investment | null }) {
  const createInv = useCreateInvestment();
  const updateInv = useUpdateInvestment();

  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>('fixed_income');
  const [institution, setInstitution] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');

  if (open && name === '' && editing) {
    setName(editing.name);
    setType(editing.type);
    setInstitution(editing.institution || '');
    setInitialAmount(String(editing.initial_amount));
    setCurrentAmount(String(editing.current_amount));
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const init = Number(initialAmount.replace(',', '.'));
    const curr = Number(currentAmount.replace(',', '.'));
    if (init <= 0 || curr < 0) return toast.error('Valores inválidos.');

    const payload = {
      name, type, institution: institution || null,
      initial_amount: init, current_amount: curr, notes: null
    };

    try {
      if (editing) {
        await updateInv.mutateAsync({ id: editing.id, patch: payload });
        toast.success('Investimento atualizado.');
      } else {
        await createInv.mutateAsync(payload);
        toast.success('Investimento adicionado.');
      }
      onClose();
      setName('');
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
  };

  return (
    <Modal open={open} onClose={() => { onClose(); setName(''); }} title={editing ? 'Editar Investimento' : 'Novo Investimento'} footer={<Button form="inv-form" type="submit">Salvar</Button>}>
      <form id="inv-form" onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Field label="Nome do Ativo"><Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tesouro Selic 2029, PETR4..." /></Field>
        </div>
        <Field label="Classe do Ativo">
          <Select value={type} onChange={e => setType(e.target.value as InvestmentType)}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Instituição (Opcional)"><Input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Ex: Nubank, XP..." /></Field>
        <Field label="Valor Investido (R$)"><Input required inputMode="decimal" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} /></Field>
        <Field label="Valor Atual (R$)"><Input required inputMode="decimal" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} /></Field>
      </form>
    </Modal>
  );
}

function UpdateValueModal({ investment, onClose }: { investment: Investment | null, onClose: () => void }) {
  const updateInv = useUpdateInvestment();
  const [newValue, setNewValue] = useState('');

  if (investment && newValue === '') {
    setNewValue(String(investment.current_amount));
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investment) return;
    const val = Number(newValue.replace(',', '.'));
    if (val < 0) return toast.error('Valor inválido.');

    try {
      await updateInv.mutateAsync({ id: investment.id, patch: { current_amount: val } });
      toast.success('Valor atualizado!');
      onClose();
      setNewValue('');
    } catch { toast.error('Erro ao atualizar.'); }
  };

  return (
    <Modal open={!!investment} onClose={() => { onClose(); setNewValue(''); }} title="Atualizar Saldo" footer={<Button form="update-form" type="submit">Atualizar</Button>}>
      {investment && (
        <form id="update-form" onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-xl bg-surface-muted p-3 text-sm">
            <p className="font-semibold">{investment.name}</p>
            <p className="text-muted-foreground text-xs">Investido: {formatMoney(investment.initial_amount)}</p>
          </div>
          <Field label="Novo Valor Atual (R$)">
            <Input required inputMode="decimal" value={newValue} onChange={e => setNewValue(e.target.value)} />
          </Field>
        </form>
      )}
    </Modal>
  );
}