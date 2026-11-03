import { useState } from 'react';
import { Calendar, Plus, Target, X } from 'lucide-react';
import { toast } from 'sonner';
import { useGoals, useCreateGoal, useAddContribution, useDeleteGoal } from '@/hooks/useData';
import { Modal } from '@/components/ui/Modal';
import { Button, Field, Input } from '@/components/ui/Form';
import { formatMoney } from '@/lib/money';

export default function Goals() {
  const goals = useGoals();
  const createGoal = useCreateGoal();
  const addContribution = useAddContribution();
  const deleteGoal = useDeleteGoal();

  const [openForm, setOpenForm] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteGoalId) return;
    try {
      await deleteGoal.mutateAsync(deleteGoalId);
      toast.success('Meta excluída.');
      setDeleteGoalId(null);
    } catch {
      toast.error('Erro ao excluir meta.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Seus objetivos</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Metas <span className="text-gradient">financeiras</span>
          </h1>
        </div>
        <Button onClick={() => setOpenForm(true)}>
          <Plus className="h-4 w-4" /> Nova meta
        </Button>
      </header>

      {goals.length === 0 ? (
        <div className="card-base p-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
            <Target className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium">Nenhuma meta cadastrada</p>
          <p className="mt-1 text-xs text-muted-foreground">Crie sua primeira meta e comece a guardar dinheiro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
            const isDone = g.status === 'completed';

            return (
              <div key={g.id} className="card-base flex flex-col justify-between relative group">
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-bold pr-6">{g.name}</h3>
                      {g.target_date && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(g.target_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isDone && <span className="chip bg-success/10 text-success">Concluída</span>}
                      <button
                        onClick={() => setDeleteGoalId(g.id)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                        title="Excluir meta"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{formatMoney(g.current_amount)}</span>
                      <span className="text-muted-foreground">de {formatMoney(g.target_amount)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${isDone ? 'bg-success' : 'bg-gradient-brand'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-right text-[11px] font-medium text-muted-foreground">{pct}%</p>
                  </div>
                </div>

                <button
                  onClick={() => setContributeGoalId(g.id)}
                  className="btn-ghost mt-4 w-full border border-border/60 text-xs"
                  disabled={isDone}
                >
                  + Adicionar dinheiro
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova Meta */}
      <GoalFormModal open={openForm} onClose={() => setOpenForm(false)} onSave={createGoal.mutateAsync} />
      
      {/* Modal Aporte */}
      <ContributeModal 
        goalId={contributeGoalId} 
        onClose={() => setContributeGoalId(null)} 
        onSave={addContribution.mutateAsync} 
      />

      {/* Modal Excluir Meta */}
      <Modal
        open={!!deleteGoalId}
        onClose={() => setDeleteGoalId(null)}
        title="Excluir meta?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteGoalId(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleteGoal.isPending}>
              {deleteGoal.isPending ? 'Excluindo…' : 'Excluir'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja excluir esta meta? Todo o histórico de aportes será apagado permanentemente.
        </p>
      </Modal>
    </div>
  );
}

function GoalFormModal({ open, onClose, onSave }: { open: boolean, onClose: () => void, onSave: any }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(target.replace(',', '.'));
    if (amt <= 0) return toast.error('Valor inválido.');
    
    try {
      await onSave({ name, target_amount: amt, target_date: date || null });
      toast.success('Meta criada.');
      onClose();
      setName(''); setTarget(''); setDate('');
    } catch { toast.error('Erro ao criar meta.'); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova meta" footer={<Button form="goal-form" type="submit">Salvar</Button>}>
      <form id="goal-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Nome da meta">
          <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Viagem, Reserva..." />
        </Field>
        <Field label="Valor desejado (R$)">
          <Input required inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} placeholder="0,00" />
        </Field>
        <Field label="Data alvo (Opcional)">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}

function ContributeModal({ goalId, onClose, onSave }: { goalId: string | null, onClose: () => void, onSave: any }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalId) return;
    const amt = Number(amount.replace(',', '.'));
    if (amt <= 0) return toast.error('Valor inválido.');

    try {
      await onSave({ goalId, amount: amt, notes: notes || null });
      toast.success('Aporte realizado.');
      onClose();
      setAmount(''); setNotes('');
    } catch { toast.error('Erro ao aportar.'); }
  };

  return (
    <Modal open={!!goalId} onClose={onClose} title="Adicionar dinheiro" footer={<Button form="contrib-form" type="submit">Confirmar</Button>}>
      <form id="contrib-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Valor (R$)">
          <Input required inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
        </Field>
        <Field label="Observações (Opcional)">
          <Input value={notes} onChange={e => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}