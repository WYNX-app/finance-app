import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Moon, Sun, Download, User, Shield, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button, Field, Input } from '@/components/ui/Form';

export default function Settings() {
  const { user } = useAuth();
  const { mode, toggle } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const downloadBackup = async () => {
    if (!user) return;
    toast.info('Preparando backup...');
    
    try {
      const [acc, tx, cat, cc, inv, dbt] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('credit_cards').select('*').eq('user_id', user.id),
        supabase.from('investments').select('*').eq('user_id', user.id),
        supabase.from('debts').select('*').eq('user_id', user.id),
      ]);

      const backup = {
        user: { name: user.name, email: user.email },
        accounts: acc.data || [],
        transactions: tx.data || [],
        categories: cat.data || [],
        credit_cards: cc.data || [],
        investments: inv.data || [],
        debts: dbt.data || [],
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_finance_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Backup baixado!');
    } catch {
      toast.error('Erro ao gerar backup.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <p className="mb-1 text-sm text-muted-foreground">Preferências do sistema</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Configurações</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Perfil */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Seu Perfil</CardTitle></CardHeader>
          <form onSubmit={updateProfile} className="space-y-4 mt-2">
            <Field label="E-mail (Não editável)">
              <Input disabled value={user?.email} className="opacity-60" />
            </Field>
            <Field label="Nome de exibição">
              <Input required value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Button>
          </form>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sun className="h-4 w-4" /> Aparência</CardTitle></CardHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
              <div>
                <p className="text-sm font-semibold">Modo {mode === 'dark' ? 'Escuro' : 'Claro'}</p>
                <p className="text-xs text-muted-foreground">Altera o tema da interface.</p>
              </div>
              <button onClick={toggle} className="grid h-10 w-10 place-items-center rounded-xl bg-surface-muted hover:bg-muted transition-colors">
                {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </Card>

        {/* Dados e Backup */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-4 w-4" /> Dados e Privacidade</CardTitle></CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-sm font-semibold mb-1">Exportar Backup</p>
              <p className="text-xs text-muted-foreground mb-4">Baixe um arquivo JSON com todas as suas transações, contas e investimentos.</p>
              <Button onClick={downloadBackup} variant="ghost" className="w-full border border-border/60"><Download className="h-4 w-4"/> Baixar Backup (.json)</Button>
            </div>
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
              <p className="text-sm font-semibold text-danger mb-1 flex items-center gap-1"><Shield className="h-4 w-4"/> Zona de Perigo</p>
              <p className="text-xs text-danger/80 mb-4">Ações irreversíveis. Tenha certeza absoluta antes de prosseguir.</p>
              <Button onClick={() => toast.error('Para excluir a conta, entre em contato com o suporte.')} variant="danger" className="w-full">Excluir minha Conta</Button>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}