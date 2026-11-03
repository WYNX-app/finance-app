import { Navigate, Route, Routes } from 'react-router-dom';
import {
  Building2, CalendarDays, CalendarRange, FileBarChart2, Landmark,
  PieChart, Settings as SettingsIcon, TrendingUp,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Accounts from '@/pages/Accounts';
import CreditCards from '@/pages/CreditCards';
import Budgets from '@/pages/Budgets';
import Goals from '@/pages/Goals';
import { ComingSoon } from '@/pages/ComingSoon';
import Planning from '@/pages/Planning';
import Debts from '@/pages/Debts';
import Investments from '@/pages/Investments';
import NetWorth from '@/pages/NetWorth';
import Calendar from '@/pages/Calendar';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transacoes" element={<Transactions />} />
        <Route path="contas" element={<Accounts />} />
        <Route path="cartoes" element={<CreditCards />} />
        
        {/* Novas rotas ativas */}
        <Route path="orcamentos" element={<Budgets />} />
        <Route path="metas" element={<Goals />} />

        {/* Rotas em desenvolvimento */}
        <Route path="planejamento" element={<Planning />} />
        <Route path="dividas" element={<Debts />} />
        <Route path="investimentos" element={<Investments />} />
        <Route path="patrimonio" element={<NetWorth />} />
        <Route path="calendario" element={<Calendar />} />
       <Route path="relatorios" element={<Reports />} />
        <Route path="config" element={<Settings />} />


        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}