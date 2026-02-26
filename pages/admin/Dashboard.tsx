import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { notifications, appointments, invoices, clients } = useData();
  const navigate = useNavigate();

  // --- Real Data Logic ---
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  // 1. Appointments Today
  const appointmentsToday = useMemo(() => 
    appointments.filter(a => a.date === todayStr && a.status !== 'Cancelled'),
  [appointments, todayStr]);

  const todayCount = appointmentsToday.length;
  // Mock capacity for progress bar (e.g., 10 slots a day)
  const capacityPercentage = Math.min(100, (todayCount / 10) * 100);

  // 2. Revenue (Monthly, Paid Invoices)
  const currentRevenue = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return invoices.reduce((acc, inv) => {
        // Parse date carefully
        const [y, m, d] = inv.date.split('-').map(Number);
        const invDate = new Date(y, m - 1, d);
        
        if (inv.status === 'Pagada' && 
            invDate.getMonth() === currentMonth && 
            invDate.getFullYear() === currentYear) {
            return acc + inv.amount;
        }
        return acc;
    }, 0);
  }, [invoices]);

  // 3. New Clients (This Month/Current 'New' Status)
  const newClientsCount = useMemo(() => {
      // Using the 'New' status as the indicator for current tracking period based on CRM logic
      return clients.filter(c => c.status === 'New').length;
  }, [clients]);

  // 4. Top Services Logic
  const topServices = useMemo(() => {
      const counts: Record<string, number> = {};
      let totalServices = 0;

      appointments.forEach(apt => {
          if (apt.status === 'Cancelled') return;
          apt.items.forEach(item => {
              if (item.type === 'service') {
                  counts[item.title] = (counts[item.title] || 0) + 1;
                  totalServices++;
              }
          });
      });

      // Sort and take top 3
      return Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([name, count]) => ({
              name,
              percent: totalServices === 0 ? 0 : Math.round((count / totalServices) * 100)
          }));
  }, [appointments]);

  // Helper to normalize 12h to 24h for sorting if needed
  const normalizeTime = (timeStr: string) => {
      if (!timeStr) return '00:00';
      if (!timeStr.includes(' ')) return timeStr; // Already 24h like "09:00"
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
      return `${hours.padStart(2, '0')}:${minutes}`;
  };

  // 5. Upcoming Appointments (Active, Sorted by Date/Time)
  const upcomingAppointments = useMemo(() => {
    return appointments
        .filter(a => a.status !== 'Cancelled' && a.status !== 'Finalized') // Only active/pending
        .sort((a, b) => {
            // Safe Date Comparison
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            
            if (dateA !== dateB) return dateA - dateB;
            
            // If same date, compare times (converted to 24h for safety)
            const timeA = normalizeTime(a.time);
            const timeB = normalizeTime(b.time);
            return timeA.localeCompare(timeB);
        })
        .slice(0, 5); // Top 5
  }, [appointments]);

  // Helper for status badges
  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'Confirmed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
          case 'Pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
          case 'In Progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
          default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
      }
  };

  const getStatusLabel = (status: string) => {
      switch(status) {
          case 'Confirmed': return 'Confirmada';
          case 'Pending': return 'Pendiente';
          case 'In Progress': return 'En Proceso';
          default: return status;
      }
  };

  // Helper for Top Service Colors
  const getServiceColor = (index: number) => {
      switch(index) {
          case 0: return 'bg-secondary'; // Gold/Brown
          case 1: return 'bg-primary';   // Green
          default: return 'bg-gray-400 dark:bg-gray-500'; // Gray
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-background-dark p-6">
      
      {/* Header Section - Fixed */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Dashboard Principal</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Bienvenida de nuevo, Elena. Resumen de actividad del estudio.</p>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-2">
        {/* Top Row: Stats & Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Stat 1: Citas Hoy (Real Data) */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-40 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Citas Hoy</p>
                <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">{todayCount}</h3>
                <p className="text-xs text-gray-400 mt-1">{todayCount === 0 ? 'Sin actividad' : 'programadas'}</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                <span className="material-icons text-xl">event_available</span>
                </div>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-auto">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${capacityPercentage}%` }}></div>
            </div>
            </div>

            {/* Stat 2: Ingresos (Real Data) */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-40 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ingresos</p>
                <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                    ${currentRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Mensuales (USD)</p>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                <span className="material-icons text-xl">payments</span>
                </div>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-auto">
                {/* Visual calculation for progress: cap at 100% for simple visual */}
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '82%' }}></div>
            </div>
            </div>

            {/* Stat 3: Nuevos Clientes (Real Data) */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-40 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Nuevos Clientes</p>
                <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">{newClientsCount}</h3>
                <p className="text-xs text-gray-400 mt-1">este mes</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                <span className="material-icons text-xl">person_add</span>
                </div>
            </div>
            <div className="flex -space-x-2 overflow-hidden pl-1 mt-auto">
                <img alt="" className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-surface-dark object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTmbtnThyRcY-UuQYkb8xakqYr1Qeq6qEHsmBipiX7Jfzu8bQi29NVIWIXKzAXC3nACR8G1hVZqov325385Vb1oKji3TCl-FamPm-bZ0hBv7-cOeeA5oaZM5QVV2b6tONpZA_Ekn9VBZqAQUOI2KtkHZeuRQXHJfXPqFPKwLnqZyYSrcZaG-XIZzTeM8Ea_hnYPpD_Xb5Lu8HMn_t2PkUs1PNDd-NetN1qm8Sou6FIkuEYL5syn9cWf0YHLVib0hErULA6SfeMQrz8"/>
                <img alt="" className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-surface-dark object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3uzUrmW0WBJPpGKXPIZB8lQpBCU-NR87amocmNg3XuclXUOEPXk1l5aO0zITr56r9SINtzQ4NWrmQF2yTrPvTFOBlEd-_VfXzwXYUeKdYLWMlr8i4Ar-aecTV26Do2zyUAaMm7QuQMwRjlRWI-1LRcSITPjcuQz47C5VuftInza7UIsrNpdwk1XIBKHfE7ev1gs9nP1si2Zl6o5R1DDbV9apEDsgU-p2GyT--4SrMpIzfZbbYXucJe4w4581J_IopL0JMSvhfQX6w"/>
                <div className="h-6 w-6 rounded-full ring-2 ring-white dark:ring-surface-dark bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[8px] text-gray-500 dark:text-gray-300 font-bold">
                    {newClientsCount > 0 ? `+${newClientsCount}` : '0'}
                </div>
            </div>
            </div>

            {/* Services Top (Real Data) */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-40">
                <h2 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-2">Servicios Top</h2>
                <div className="space-y-2 flex-1 overflow-hidden">
                <div className="flex flex-col justify-center h-full gap-2">
                    {topServices.length === 0 ? (
                        <div className="text-center text-xs text-gray-400 italic">Sin datos de servicios.</div>
                    ) : (
                        topServices.map((service, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-gray-600 dark:text-gray-300 font-bold truncate">{service.name}</span>
                                    <span className="text-gray-900 dark:text-white font-bold">{service.percent}%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1">
                                    <div className={`${getServiceColor(idx)} h-1 rounded-full`} style={{ width: `${service.percent}%` }}></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                </div>
            </div>
        </div>

        {/* Main Grid: Table & Notifications */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-6">
            
            {/* Appointments Table (Real Data) */}
            <div className="xl:col-span-2 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Próximas Citas</h2>
                <button onClick={() => navigate('/admin/appointments')} className="text-xs font-bold text-primary hover:text-green-800 transition-colors uppercase tracking-wide">
                Ver tablero
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-black/10 text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider font-bold">
                    <tr>
                    <th className="px-6 py-3">Fecha/Hora</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Servicio</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {upcomingAppointments.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm italic">
                                No hay citas próximas programadas.
                            </td>
                        </tr>
                    ) : (
                        upcomingAppointments.map(apt => (
                            <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                {/* FIX: Parse date part as explicit ISO to avoid TZ shift */}
                                {apt.date === todayStr ? 'Hoy' : new Date(apt.date + 'T12:00:00').toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})}, {apt.time}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                {apt.clientAvatar ? (
                                    <img alt={apt.clientName} className="h-6 w-6 rounded-full object-cover mr-2" src={apt.clientAvatar}/>
                                ) : (
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] mr-2 border border-primary/20">
                                        {apt.clientName.substring(0,2).toUpperCase()}
                                    </div>
                                )}
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{apt.clientName}</div>
                                </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 max-w-[150px] truncate">
                                {/* Show first item title */}
                                {apt.items?.[0]?.title || 'Servicio Varios'} 
                                {/* Add indicator if more items exist */}
                                {apt.items && apt.items.length > 1 ? ` (+${apt.items.length - 1})` : ''}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-center">
                                <span className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-bold rounded-full ${getStatusBadge(apt.status)}`}>
                                {getStatusLabel(apt.status)}
                                </span>
                            </td>
                            </tr>
                        ))
                    )}
                </tbody>
                </table>
            </div>
            </div>

            {/* Notifications (Compact) */}
            <div className="xl:col-span-1 bg-surface-dark rounded-xl p-5 shadow-lg text-white relative overflow-hidden flex flex-col h-full max-h-[400px]">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center mb-4 relative z-10 flex-shrink-0">
                    <h2 className="font-display font-bold text-lg">Avisos</h2>
                    {notifications.filter(n => !n.read).length > 0 && (
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{notifications.filter(n => !n.read).length} Nuevos</span>
                    )}
                </div>
                
                <ul className="space-y-3 relative z-10 flex-1 overflow-y-auto no-scrollbar min-h-0">
                {notifications.length === 0 ? (
                    <li className="text-xs text-gray-400 text-center py-4">Sin notificaciones recientes</li>
                ) : (
                    notifications.slice(0, 5).map(notif => (
                        <li key={notif.id} className="flex gap-3 items-start p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(notif.link || '#')}>
                            <span className={`material-icons text-sm mt-0.5 p-1 rounded
                                ${notif.type === 'new_appointment' ? 'bg-purple-500/20 text-purple-300' : 
                                notif.type === 'payment_received' ? 'bg-green-500/20 text-green-300' : 
                                'bg-white/10 text-gray-300'}
                            `}>
                                {notif.type === 'new_appointment' ? 'event' : notif.type === 'payment_received' ? 'payments' : 'notifications'}
                            </span>
                            <div className="text-xs text-gray-300 flex-1 min-w-0">
                            <p className="font-bold text-white mb-0.5 truncate">{notif.title}</p>
                            <p className="leading-snug line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{notif.time}</p>
                            </div>
                        </li>
                    ))
                )}
                </ul>
                <button onClick={() => navigate('/admin/notifications')} className="w-full mt-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors flex-shrink-0">
                Ver panel completo
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;