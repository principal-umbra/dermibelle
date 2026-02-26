
import { useMemo } from 'react';
import { useData } from '../context/DataContext';

export const useClientProfile = (clientId?: string) => {
    const { clients, appointments, invoices } = useData();

    const client = useMemo(() => clients.find(c => c.id === clientId), [clients, clientId]);

    const stats = useMemo(() => {
        if (!client || !clientId) return null;

        // 0. Base Data
        const clientAppts = appointments
            .filter(a => a.clientId === clientId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const clientInvoices = invoices.filter(inv => inv.clientId === clientId && inv.status !== 'Anulada');
        
        // 1. Financial Metrics
        let totalRevenue = 0;
        let servicesRevenue = 0;
        let productsRevenue = 0;
        let transitRevenue = 0;

        clientInvoices.forEach(inv => {
            if (inv.status === 'Pagada') {
                totalRevenue += inv.amount;
                const breakdown = inv.paymentBreakdown;
                if (breakdown) {
                    servicesRevenue += breakdown.servicesTotal;
                    productsRevenue += breakdown.productsTotal;
                } else {
                    inv.items.forEach(item => {
                        const itemTotal = item.price * (item.quantity || 1);
                        if (item.type === 'service') servicesRevenue += itemTotal;
                        else productsRevenue += itemTotal;
                    });
                }
            } else if (inv.status === 'En Tránsito') {
                transitRevenue += inv.amount;
            }
        });

        // 2. Operational Metrics
        const completedAppts = clientAppts.filter(a => a.status === 'Finalized');
        const upcomingAppts = clientAppts.filter(a => a.status === 'Confirmed' || a.status === 'Pending' || a.status === 'In Progress');
        
        const lastAppt = completedAppts.length > 0 ? completedAppts[0] : null; 
        
        const formatDate = (dateStr: string) => {
            if(!dateStr) return null;
            const date = new Date(dateStr + 'T12:00:00');
            return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        const lastVisitValue = lastAppt ? formatDate(lastAppt.date) : null;
        const lastVisitSubtext = lastAppt ? lastAppt.time : null;

        const nextApptData = upcomingAppts.length > 0 ? upcomingAppts[upcomingAppts.length - 1] : null; 
        const nextVisitValue = nextApptData ? formatDate(nextApptData.date) : null;
        const nextVisitSubtext = nextApptData ? 'Programada' : null;

        // 3. Activity Level Logic
        const now = new Date();
        let activityStatus = 'Inactivo';
        let activityColor = 'bg-gray-100 text-gray-500';
        let activityIcon = '';

        const lastDate = lastAppt ? new Date(lastAppt.date) : null;
        const daysSince = lastDate ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)) : 999;
        
        if ((lastDate && daysSince <= 45) || nextApptData) {
            activityStatus = 'Activo';
            activityColor = 'bg-green-500 text-white';
            activityIcon = 'check';
        }

        return {
            totalRevenue,
            servicesRevenue,
            productsRevenue,
            transitRevenue,
            lastVisitValue,
            lastVisitSubtext,
            nextVisitValue,
            nextVisitSubtext,
            activityStatus,
            activityColor,
            activityIcon
        };
    }, [client, invoices, appointments, clientId]);

    return { client, stats };
};
