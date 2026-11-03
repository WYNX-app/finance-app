import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Moon, Search, Sun, AlertTriangle, CheckCircle2, Info, FileText, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { mode, toggle } = useTheme();
  const notifications = useNotifications();
  const navigate = useNavigate();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (iconType: string, type: string) => {
    const cls = type === 'danger' ? 'text-danger' : type === 'warning' ? 'text-warning' : type === 'success' ? 'text-success' : 'text-info';
    if (iconType === 'bill') return <FileText className={cn("h-4 w-4", cls)} />;
    if (iconType === 'goal') return <CheckCircle2 className={cn("h-4 w-4", cls)} />;
    if (iconType === 'budget') return <AlertTriangle className={cn("h-4 w-4", cls)} />;
    return <Info className={cn("h-4 w-4", cls)} />;
  };

  const handleNotificationClick = (link: string) => {
    setIsNotifOpen(false);
    navigate(link);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={onOpenSidebar}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Buscar transações, contas…"
          className="h-10 w-full rounded-xl border border-border/60 bg-surface/60 pl-9 pr-3 text-sm outline-none transition
                     placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={toggle}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Alternar tema"
        >
          {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        
        {/* SINO DE NOTIFICAÇÕES */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={cn(
              "relative grid h-9 w-9 place-items-center rounded-lg transition-colors",
              isNotifOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
            )}
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white shadow-sm">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Dropdown de Notificações */}
          {isNotifOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 animate-fade-in rounded-2xl border border-border/60 bg-surface/95 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-border/60 p-4">
                <h3 className="font-bold">Notificações</h3>
                <button onClick={() => setIsNotifOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">Tudo em dia!</p>
                    <p className="text-xs text-muted-foreground">Você não tem alertas no momento.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {notifications.map(n => (
                      <li key={n.id}>
                        <button
                          onClick={() => handleNotificationClick(n.link)}
                          className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50"
                        >
                          <div className={cn(
                            "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                            n.type === 'danger' ? 'bg-danger/10' : n.type === 'warning' ? 'bg-warning/10' : 'bg-info/10'
                          )}>
                            {getIcon(n.icon, n.type)}
                          </div>
                          <div>
                            <p className={cn(
                              "text-sm font-semibold",
                              n.type === 'danger' ? 'text-danger' : n.type === 'warning' ? 'text-warning' : 'text-foreground'
                            )}>{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}