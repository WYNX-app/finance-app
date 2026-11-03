import { useMemo, useState } from 'react';
import { Building2, Plus, Trash2, Briefcase, TrendingUp, Wallet, CreditCard, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { 
  useAccounts, useAccountBalances, useInvestments, useDebts, 
  useAssets, useCreateAsset, useDeleteAsset,
  useLiabilities, useCreateLiability, useDeleteLiability
} from '@/hooks/useData';
import { Modal } from '@/components/ui/Modal';
import { Button, Field, Input, Select } from '@/components/ui/Form';
import { formatMoney } from '@/lib/money';

export default function NetWorth() {
  const accounts = useAccounts();
  const balances = useAccountBalances();
  const investments = useInvestments();
  const debts = useDebts();
  
  const assets = useAssets();
  const liabilities = useLiabilities();

  const createAsset = useCreateAsset();
  const deleteAsset = useDeleteAsset();
  const createLiability = useCreateLiability();
  const deleteLiability = useDeleteLiability();

  const [entityFilter, setEntityFilter] = useState('Tudo');
  const [openAssetForm, setOpenAssetForm] = useState(false);
  const [openLiabilityForm, setOpenLiabilityForm] = useState(false);

  // Lista de entidades únicas (Pessoal, HTech, etc)
  const entities = ['Tudo', ...Array.from(new Set([
    ...assets.map(a => a.entity), 
    ...liabilities.map(l => l.entity),
    'Pessoal', 'HTech' // Garante que as principais apareçam
  ]))];

  const data = useMemo(() => {
    // 1. Saldos de Contas (Padrão: Pessoal)
    const cash = accounts.reduce((s, a) => s + (balances[a.id] ?? 0), 0);
    
    // 2. Investimentos (Padrão: Pessoal)
    const invTotal = investments.reduce((s, i) => s + i.current_amount, 0);

    // 3. Dívidas (Padrão: Pessoal)
    const debtTotal = debts.filter(d => d.status === 'active').reduce((s, d) => s + d.remaining_amount, 0);

    // 4. Ativos Manuais (Filtrados por Entidade)
    const manualAssets = entityFilter === 'Tudo' ? assets : assets.filter(a => a.entity === entityFilter);
    const manualAssetsTotal = manualAssets.reduce((s, a) => s + a.value, 0);

    // 5. Passivos Manuais (Filtrados por Entidade)
    const manualLiabilities = entityFilter === 'Tudo' ? liabilities : liabilities.filter(l => l.entity === entityFilter);
    const manualLiabilitiesTotal = manualLiabilities.reduce((s, l) => s + l.value, 0);

    // Cálculos Finais (Se filtrar por HTech, ignora o dinheiro das contas pessoais, a menos que você crie um ativo "Caixa HTech")
    const isAll = entityFilter === 'Tudo';
    
    const totalAssets = (isAll ? cash + invTotal : 0) + manualAssetsTotal;
    const totalLiabilities = (isAll ? debtTotal : 0) + manualLiabilitiesTotal;
    const netWorth = totalAssets - totalLiabilities;

    return {
      cash, invTotal, debtTotal,
      manualAssets, manualLiabilities,
      totalAssets, totalLiabilities, netWorth
    };
  }, [accounts, balances, investments, debts, assets, liabilities, entityFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Visão patrimonial</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Patrimônio <span className="text-gradient">Líquido</span>
          </h1>
        </div>
        
        {/* Filtro de Entidade */}
        <div className="flex gap-2 bg-surface/60 p-1 rounded-xl border border-border/60">
          {entities.map(ent => (
            <button
              key={ent}
              onClick={() => setEntityFilter(ent)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                entityFilter === ent 
                  ? 'bg-gradient-brand text-white shadow-md' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {ent}
            </button>
          ))}
        </div>
      </header>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-base border-success/30 bg-success/5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-success">Total de Ativos</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatMoney(data.totalAssets)}</p>
        </div>
        <div className="card-base border-danger/30 bg-danger/5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-danger">Total de Passivos</p>
          <p className="mt-1 text-2xl font-bold text-danger">{formatMoney(data.totalLiabilities)}</p>
        </div>
        <div className="card-base bg-gradient-brand text-white border-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Patrimônio Líquido</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(data.netWorth)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Coluna de Ativos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-success" /> Ativos (Bens)</h2>
            <Button onClick={() => setOpenAssetForm(true)} className="text-xs py-1.5 h-8"><Plus className="h-3 w-3"/> Adicionar</Button>
          </div>

          <div className="card-base p-0 divide-y divide-border/60">
            {/* Contas (Apenas na visão Tudo) */}
            {entityFilter === 'Tudo' && (
              <div className="flex items-center justify-between p-4 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-surface text-primary"><Wallet className="h-4 w-4"/></div>
                  <div><p className="text-sm font-semibold">Saldo em Contas</p><p className="text-[10px] text-muted-foreground">Automático</p></div>
                </div>
                <span className="font-bold">{formatMoney(data.cash)}</span>
              </div>
            )}
            
            {/* Investimentos (Apenas na visão Tudo) */}
            {entityFilter === 'Tudo' && (
              <div className="flex items-center justify-between p-4 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-surface text-primary"><Briefcase className="h-4 w-4"/></div>
                  <div><p className="text-sm font-semibold">Investimentos</p><p className="text-[10px] text-muted-foreground">Automático</p></div>
                </div>
                <span className="font-bold">{formatMoney(data.invTotal)}</span>
              </div>
            )}

            {/* Ativos Manuais (HTech, Imóveis, etc) */}
            {data.manualAssets.map(a => (
              <div key={a.id} className="flex items-center justify-between p-4 group">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-success/10 text-success"><Building2 className="h-4 w-4"/></div>
                  <div>
                    <p className="text-sm font-semibold">{a.name}</p>
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{a.entity}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-success">{formatMoney(a.value)}</span>
                  <button onClick={() => deleteAsset.mutate(a.id)} className="text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4"/></button>
                </div>
              </div>
            ))}

            {data.manualAssets.length === 0 && entityFilter !== 'Tudo' && (
              <p className="p-6 text-center text-xs text-muted-foreground">Nenhum ativo cadastrado para {entityFilter}.</p>
            )}
          </div>
        </div>

        {/* Coluna de Passivos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><CreditCard className="h-5 w-5 text-danger" /> Passivos (Dívidas)</h2>
            <Button onClick={() => setOpenLiabilityForm(true)} variant="ghost" className="text-xs py-1.5 h-8 border border-border/60"><Plus className="h-3 w-3"/> Adicionar</Button>
          </div>

          <div className="card-base p-0 divide-y divide-border/60">
            {/* Dívidas do sistema (Apenas na visão Tudo) */}
            {entityFilter === 'Tudo' && (
              <div className="flex items-center justify-between p-4 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-surface text-danger"><Landmark className="h-4 w-4"/></div>
                  <div><p className="text-sm font-semibold">Dívidas Ativas</p><p className="text-[10px] text-muted-foreground">Automático</p></div>
                </div>
                <span className="font-bold">{formatMoney(data.debtTotal)}</span>
              </div>
            )}

            {/* Passivos Manuais (Empréstimos HTech, etc) */}
            {data.manualLiabilities.map(l => (
              <div key={l.id} className="flex items-center justify-between p-4 group">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-danger/10 text-danger"><CreditCard className="h-4 w-4"/></div>
                  <div>
                    <p className="text-sm font-semibold">{l.name}</p>
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{l.entity}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-danger">- {formatMoney(l.value)}</span>
                  <button onClick={() => deleteLiability.mutate(l.id)} className="text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4"/></button>
                </div>
              </div>
            ))}

            {data.manualLiabilities.length === 0 && entityFilter !== 'Tudo' && (
              <p className="p-6 text-center text-xs text-muted-foreground">Nenhum passivo cadastrado para {entityFilter}.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modais */}
      <AssetFormModal open={openAssetForm} onClose={() => setOpenAssetForm(false)} onSave={createAsset.mutateAsync} />
      <LiabilityFormModal open={openLiabilityForm} onClose={() => setOpenLiabilityForm(false)} onSave={createLiability.mutateAsync} />
    </div>
  );
}

function AssetFormModal({ open, onClose, onSave }: { open: boolean, onClose: () => void, onSave: any }) {
  const [name, setName] = useState('');
  const [entity, setEntity] = useState('Pessoal');
  const [value, setValue] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(value.replace(',', '.'));
    if (val <= 0) return toast.error('Valor inválido.');
    try {
      await onSave({ name, entity, value: val, type: 'other' });
      toast.success('Ativo adicionado.');
      onClose(); setName(''); setValue('');
    } catch { toast.error('Erro ao salvar.'); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Ativo" footer={<Button form="asset-form" type="submit">Salvar</Button>}>
      <form id="asset-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Nome do Bem"><Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Notebook Dell, Carro..." /></Field>
        <Field label="Proprietário / Empresa">
          <Select value={entity} onChange={e => setEntity(e.target.value)}>
            <option value="Pessoal">Pessoal</option>
            <option value="HTech">HTech</option>
            <option value="Outra Empresa">Outra Empresa</option>
          </Select>
        </Field>
        <Field label="Valor Estimado (R$)"><Input required inputMode="decimal" value={value} onChange={e => setValue(e.target.value)} /></Field>
      </form>
    </Modal>
  );
}

function LiabilityFormModal({ open, onClose, onSave }: { open: boolean, onClose: () => void, onSave: any }) {
  const [name, setName] = useState('');
  const [entity, setEntity] = useState('Pessoal');
  const [value, setValue] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(value.replace(',', '.'));
    if (val <= 0) return toast.error('Valor inválido.');
    try {
      await onSave({ name, entity, value: val, type: 'other' });
      toast.success('Passivo adicionado.');
      onClose(); setName(''); setValue('');
    } catch { toast.error('Erro ao salvar.'); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Passivo" footer={<Button variant="danger" form="liab-form" type="submit">Salvar</Button>}>
      <form id="liab-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Nome da Obrigação"><Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Financiamento Notebook..." /></Field>
        <Field label="Proprietário / Empresa">
          <Select value={entity} onChange={e => setEntity(e.target.value)}>
            <option value="Pessoal">Pessoal</option>
            <option value="HTech">HTech</option>
            <option value="Outra Empresa">Outra Empresa</option>
          </Select>
        </Field>
        <Field label="Valor da Dívida (R$)"><Input required inputMode="decimal" value={value} onChange={e => setValue(e.target.value)} /></Field>
      </form>
    </Modal>
  );
}