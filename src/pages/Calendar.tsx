import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, ArrowUpRight, ArrowDownRight, Landmark, X } from 'lucide-react';
import { useTransactions, useDebts } from '@/hooks/useData';
import { formatMoney } from '@/lib/money';
import { Modal } from '@/components/ui/Modal';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'debt';
  status: string;
};

export default function Calendar() {
  const transactions = useTransactions();
  const debts = useDebts();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // ==========================================
  // AGRUPAR EVENTOS
  // ==========================================
  const events = useMemo(() => {
    const list: CalendarEvent[] = [];

    // 1. Transações (Data de vencimento ou data da transação)
    transactions.forEach(t => {
      if (t.status === 'canceled') return;
      const date = t.due_date || t.transaction_date;
      if (!date) return;

      list.push({
        id: t.id,
        date,
        title: t.description,
        amount: t.amount,
        type: t.type === 'income' ? 'income' : 'expense',
        status: t.status
      });
    });

    // 2. Dívidas (Calcula o vencimento no mês visualizado)
    debts.forEach(d => {
      if (d.status !== 'active' || !d.due_day) return;
      
      // Se a data de primeiro vencimento for no mês atual, usa ela. 
      // Senão, usa o "dia do vencimento" padrão no mês visualizado.
      let eventDate = '';
      if (d.first_due_date) {
        const [fy, fm, fd] = d.first_due_date.split('-').map(Number);
        if (fy === year && fm - 1 === month) {
          eventDate = d.first_due_date;
        } else {
          eventDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d.due_day).padStart(2, '0')}`;
        }
      } else {
        eventDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d.due_day).padStart(2, '0')}`;
      }

      // Só adiciona se a dívida não estiver totalmente paga
      if (d.remaining_amount > 0) {
        list.push({
          id: d.id,
          date: eventDate,
          title: `Parcela: ${d.name}`,
          amount: d.installment_amount,
          type: 'debt',
          status: d.status
        });
      }
    });

    return list;
  }, [transactions, debts, year, month]);

  // ==========================================
  // MATEMÁTICA DO CALENDÁRIO
  // ==========================================
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Dom) a 6 (Sáb)
  
  // Dias em branco antes do dia 1
  const blanks = Array.from({ length: firstDayOfWeek });
  // Dias do mês (1 a 30/31)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const selectedEvents = selectedDate 
    ? events.filter(e => e.date === selectedDate)
    : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Sua agenda financeira</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Calendário <span className="text-gradient">Financeiro</span>
          </h1>
        </div>
      </header>

      <div className="card-base p-4 sm:p-6">
        {/* Navegação do Mês */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {MONTHS[month]} <span className="text-muted-foreground">{year}</span>
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="grid h-8 w-8 place-items-center rounded-lg border border-border/60 hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 h-8 text-xs font-semibold rounded-lg border border-border/60 hover:bg-muted transition-colors">
              Hoje
            </button>
            <button onClick={nextMonth} className="grid h-8 w-8 place-items-center rounded-lg border border-border/60 hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Legenda */}
        <div className="mb-4 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Receitas</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Despesas</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Dívidas</span>
        </div>

        {/* Grid do Calendário */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {day}
            </div>
          ))}

          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="min-h-24 rounded-xl bg-surface-muted/20 p-2 opacity-50" />
          ))}

          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`group relative flex min-h-24 cursor-pointer flex-col rounded-xl border p-1.5 transition-all hover:border-primary/50 sm:p-2 ${
                  isToday ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/40 bg-surface'
                }`}
              >
                <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {day}
                </span>
                
                {/* Bolinhas indicadoras */}
                <div className="mt-1 flex flex-wrap gap-1">
                  {dayEvents.map(e => (
                    <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${
                      e.type === 'income' ? 'bg-success' : e.type === 'debt' ? 'bg-warning' : 'bg-danger'
                    }`} />
                  ))}
                </div>

                {/* Resumo em texto (Desktop) */}
                <div className="mt-auto hidden sm:block">
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} className="truncate text-[9px] font-medium text-muted-foreground">
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] font-bold text-primary">+{dayEvents.length - 2} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Detalhes do Dia */}
      <Modal 
        open={!!selectedDate} 
        onClose={() => setSelectedDate(null)} 
        title={selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : ''}
      >
        <div className="space-y-3">
          {selectedEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento para este dia.</p>
          ) : (
            selectedEvents.map(e => (
              <div key={e.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-muted/40 p-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg ${
                    e.type === 'income' ? 'bg-success/10 text-success' : e.type === 'debt' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                  }`}>
                    {e.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : e.type === 'debt' ? <Landmark className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{e.title}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{e.status}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${
                  e.type === 'income' ? 'text-success' : e.type === 'debt' ? 'text-warning' : 'text-danger'
                }`}>
                  {e.type === 'income' ? '+' : '-'} {formatMoney(e.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}