import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  CalendarRange,
  PieChart,
  Target,
  Landmark,
  TrendingUp,
  Building2,
  CalendarDays,
  FileBarChart2,
  Settings,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/contas', label: 'Contas', icon: Wallet },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  { to: '/planejamento', label: 'Planejamento', icon: CalendarRange },
  { to: '/orcamentos', label: 'Orçamentos', icon: PieChart },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/dividas', label: 'Dívidas', icon: Landmark },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/patrimonio', label: 'Patrimônio', icon: Building2 },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/relatorios', label: 'Relatórios', icon: FileBarChart2 },
  { to: '/config', label: 'Configurações', icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-border/60 bg-surface/60 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand shadow-lg shadow-primary/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight">Finance</p>
          <p className="text-[11px] text-muted-foreground">Central pessoal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-surface-muted/60 p-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-white">
            U
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Usuário Demo</p>
            <p className="truncate text-[11px] text-muted-foreground">demo@finance.app</p>
          </div>
          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}