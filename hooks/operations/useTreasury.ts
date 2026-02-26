
import { useMemo, useState } from 'react';
import { useData, Invoice } from '../../context/DataContext';

export const useTreasury = () => {
  const { invoices, confirmInTransitInvoice, rejectInTransitInvoice } = useData();
  const [financialGoal, setFinancialGoal] = useState(25000); // Monthly Goal
  const [reserves, setReserves] = useState([
    { id: 'tax', name: 'Impuestos', amount: 2400, icon: 'savings', color: 'blue' },
    { id: 'maint', name: 'Mantenimiento', amount: 850, icon: 'handyman', color: 'orange' },
    { id: 'exp', name: 'Expansión', amount: 5000, icon: 'trending_up', color: 'purple' }
  ]);

  // 1. Calculate Balances
  const stats = useMemo(() => {
    const available = invoices
      .filter(i => i.status === 'Pagada')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const inTransit = invoices
      .filter(i => i.status === 'En Tránsito')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const pending = invoices
      .filter(i => i.status === 'Pendiente' || i.status === 'Parcial')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return { available, inTransit, pending };
  }, [invoices]);

  // 2. Forecast Scenarios
  const forecast = useMemo(() => {
    const base = stats.available;
    return {
      pessimistic: base * 1.1,
      realistic: base * 1.25,
      optimistic: base * 1.5
    };
  }, [stats.available]);

  // 3. Transactions in Transit
  const transitItems = useMemo(() => 
    invoices.filter(i => i.status === 'En Tránsito'),
  [invoices]);

  // 4. Progress to Goal
  const goalProgress = Math.min(100, Math.round((stats.available / financialGoal) * 100));

  // 5. Breakeven Day (Mocked)
  const breakevenDay = 18; 

  // 6. Liquidity Risk Analysis
  const liquidityAlert = useMemo(() => {
      const burnRate = 2000; // Mock weekly burn rate
      const weeksRunway = stats.available / burnRate;
      
      if (weeksRunway < 2) return { level: 'critical', message: 'Liquidez Crítica: < 2 semanas de operación.' };
      if (weeksRunway < 4) return { level: 'warning', message: 'Alerta: Reservas bajas para el mes siguiente.' };
      return { level: 'healthy', message: 'Liquidez Saludable.' };
  }, [stats.available]);

  const updateGoal = (newGoal: number) => setFinancialGoal(newGoal);

  const transferToReserve = (id: string, amount: number) => {
      setReserves(prev => prev.map(r => r.id === id ? { ...r, amount: r.amount + amount } : r));
  };

  return {
    stats,
    forecast,
    transitItems,
    goalProgress,
    financialGoal,
    setFinancialGoal,
    updateGoal,
    breakevenDay,
    confirmInTransitInvoice,
    rejectInTransitInvoice,
    reserves,
    transferToReserve,
    liquidityAlert
  };
};
