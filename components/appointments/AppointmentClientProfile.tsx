
import React, { useMemo } from 'react';
import { Appointment, useData } from '../../context/DataContext';

interface AppointmentClientProfileProps {
    appointment: Appointment | null;
    onNavigateToProfile: (clientId: string) => void;
}

const AppointmentClientProfile: React.FC<AppointmentClientProfileProps> = ({
    appointment,
    onNavigateToProfile
}) => {
    const { clients, appointments, addToast, addClientLog } = useData();

    // Internal Logic: Calculate Client Stats & History independently
    const { clientData, history } = useMemo(() => {
        if (!appointment) return { clientData: null, history: [] };

        // 1. Find or Mock Client
        const baseClient = clients.find(c => c.id === appointment.clientId) || { 
            id: 'temp', 
            name: appointment.clientName, 
            email: 'Sin registrar', 
            phone: 'Sin registrar', 
            avatar: appointment.clientAvatar, 
            initials: appointment.clientName.substring(0,2).toUpperCase(), 
            status: 'New',
            totalSpent: 0
        };

        // 2. Get History (Completed appointments only)
        const clientHistory = appointments
            .filter(a => a.clientId === appointment.clientId && a.status === 'Finalized' && a.id !== appointment.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5); // Limit to last 5 for this view

        // 3. Calculate Stats
        const fullHistory = appointments.filter(a => a.clientId === appointment.clientId && a.status === 'Finalized');
        const visitCount = fullHistory.length; 
        const totalSpent = fullHistory.reduce((sum, a) => sum + a.total, 0); 
        const ticketAvg = visitCount > 0 ? totalSpent / visitCount : 0;
        
        // Logic: Loyalty Status
        let loyaltyStatus = 'NUEVO'; 
        if (visitCount > 10) loyaltyStatus = 'VIP'; 
        else if (visitCount >= 2) loyaltyStatus = 'HABITUAL';

        // Logic: Favorite Service
        const serviceCounts: Record<string, number> = {};
        fullHistory.forEach(appt => {
            appt.items.forEach(item => {
                if (item.type === 'service') {
                    serviceCounts[item.title] = (serviceCounts[item.title] || 0) + 1;
                }
            });
        });
        
        let favoriteService = 'Ninguno';
        let maxCount = 0;
        Object.entries(serviceCounts).forEach(([name, count]) => {
            if (count > maxCount) {
                maxCount = count;
                favoriteService = name;
            }
        });

        // Logic: Visit Rhythm (Average days between visits)
        let visitRhythm = 'Primera Visita';
        if (fullHistory.length >= 2) {
            const sortedDates = fullHistory
                .map(a => new Date(a.date).getTime())
                .sort((a, b) => a - b);
            
            const firstDate = sortedDates[0];
            const lastDate = sortedDates[sortedDates.length - 1];
            const diffDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
            const avgDays = Math.round(diffDays / (fullHistory.length - 1));
            
            visitRhythm = `Cada ${avgDays} días`;
        }

        // 4. Combine
        const processedClientData = { 
            ...baseClient, 
            visitCount, 
            totalSpent, 
            ticketAvg, 
            loyaltyStatus,
            favoriteService,
            visitRhythm,
            lastVisitTimeAgo: (baseClient as any).lastVisitTimeAgo || '-' 
        };

        return { clientData: processedClientData, history: clientHistory };
    }, [appointment, clients, appointments]);

    if (!clientData) return null;

    // Helper to format appointment context for logs
    const getContextTag = () => {
        if (!appointment) return 'Perfil Cita';
        // Use ID for immutable reference instead of mutable Date/Time
        return `Cita #${appointment.id}`;
    };

    return (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300 h-full">
            
            {/* 1. Profile Header Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shrink-0">
                {/* Avatar */}
                <div className="relative shrink-0">
                    {clientData?.avatar ? (
                        <img src={clientData.avatar} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-gray-50" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-3xl font-bold border-4 border-gray-50">
                            {clientData?.initials}
                        </div>
                    )}
                </div>
                
                {/* Info Center */}
                <div className="flex-1 text-center md:text-left min-w-0">
                    <h2 
                        onClick={() => { 
                            if (clientData?.id && !clientData.id.includes('temp')) { 
                                onNavigateToProfile(clientData.id); 
                            } 
                        }} 
                        className={`text-3xl font-body font-bold text-gray-900 mb-1 truncate ${clientData?.id && !clientData.id.includes('temp') ? 'cursor-pointer hover:text-primary hover:underline' : ''}`}
                    >
                        {clientData?.name}
                    </h2>
                    <p className="text-sm text-gray-500 mb-3 font-mono">ID: {clientData?.id}</p>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-gray-500">
                        <div onClick={() => (window.location.href = `mailto:${clientData?.email}`)} className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                            <span className="material-icons text-gray-400 text-sm">email</span>
                            <span className="truncate max-w-[200px]">{clientData?.email}</span>
                        </div>
                        <div onClick={() => (window.location.href = `tel:${clientData?.phone}`)} className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                            <span className="material-icons text-gray-400 text-sm">phone</span>
                            {clientData?.phone}
                        </div>
                    </div>
                </div>

                {/* Financial Stats (Right) */}
                <div className="flex gap-12 border-l border-gray-100 pl-8 md:pr-8">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">TOTAL GASTADO</p>
                        <p className="text-3xl font-display font-bold text-gray-900">${clientData?.totalSpent}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">TICKET PROM.</p>
                        <p className="text-3xl font-display font-bold text-gray-900">${clientData?.ticketAvg?.toFixed(0)}</p>
                    </div>
                </div>
            </div>

            {/* 2. Action Buttons Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <button 
                    onClick={() => {
                        if (!appointment || !clientData) return;
                        const phone = clientData.phone?.replace(/\D/g, '') || '';
                        if (!phone) { addToast('error', 'El cliente no tiene teléfono registrado.'); return; }
                        
                        const name = clientData.name?.split(' ')[0] || 'Cliente';
                        const time = appointment.time || '';
                        const msg = `Hola ${name}, te escribimos de Dermibelle. Notamos un pequeño retraso para tu cita de las ${time}. ¿Todo bien? Te estamos esperando. Avísanos si vienes en camino.`;
                        
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');

                        // Save phone in the log description (4th part)
                        addClientLog({
                            clientId: clientData.id,
                            type: 'interaction',
                            action: 'whatsapp',
                            description: `Gestión de Retraso|Mensaje enviado: "¿Todo bien?..."|${getContextTag()}|${clientData.phone}`,
                            date: new Date().toLocaleDateString('es-ES')
                        });
                    }}
                    className="bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <span className="material-icons">alarm_off</span>
                        </div>
                        <div className="text-left">
                            <span className="block text-purple-700 font-bold text-sm">Llegada Tarde</span>
                            <span className="block text-[10px] text-purple-400 font-medium">"¿Todo bien? Te esperamos..."</span>
                        </div>
                    </div>
                </button>
                <button 
                    onClick={() => {
                        if (!appointment || !clientData) return;
                        const phone = clientData.phone?.replace(/\D/g, '') || '';
                        if (!phone) { addToast('error', 'El cliente no tiene teléfono registrado.'); return; }
                        
                        const name = clientData.name?.split(' ')[0] || 'Cliente';
                        const msg = `Hola ${name}, buenas noticias. Se liberó un espacio antes de tu cita programada en Dermibelle. ¿Te gustaría adelantar tu visita? Avísanos si te interesa para esperarte antes.`;
                        
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');

                        // Save phone in the log description (4th part)
                        addClientLog({
                            clientId: clientData.id,
                            type: 'interaction',
                            action: 'whatsapp',
                            description: `Oportunidad de Agenda|Mensaje enviado: Oferta de adelanto|${getContextTag()}|${clientData.phone}`,
                            date: new Date().toLocaleDateString('es-ES')
                        });
                    }}
                    className="bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <span className="material-icons">update</span>
                        </div>
                        <div className="text-left">
                            <span className="block text-blue-700 font-bold text-sm">Adelantar Cita</span>
                            <span className="block text-[10px] text-blue-400 font-medium">"Tengo un espacio antes..."</span>
                        </div>
                    </div>
                </button>
                <button 
                    onClick={() => {
                        if (!appointment || !clientData) return;
                        const phone = clientData.phone?.replace(/\D/g, '') || '';
                        if (!phone) { addToast('error', 'El cliente no tiene teléfono registrado.'); return; }
                        
                        const name = clientData.name?.split(' ')[0] || 'Cliente';
                        const msg = `Hola ${name}, te esperamos en Dermibelle Studio. Nuestra ubicación es: 123 Beauty Lane, Port Charlotte, FL. Ver en mapa: https://maps.google.com/?q=Dermibelle+Studio`;
                        
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');

                        // Save phone in the log description (4th part)
                        addClientLog({
                            clientId: clientData.id,
                            type: 'interaction',
                            action: 'whatsapp',
                            description: `Asistencia de Ubicación|Mensaje enviado: Dirección Maps|${getContextTag()}|${clientData.phone}`,
                            date: new Date().toLocaleDateString('es-ES')
                        });
                    }}
                    className="bg-green-50 hover:bg-green-100 border border-green-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-green-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <span className="material-icons">location_on</span>
                        </div>
                        <div className="text-left">
                            <span className="block text-green-700 font-bold text-sm">Enviar Ubicación</span>
                            <span className="block text-[10px] text-green-400 font-medium">Google Maps via WhatsApp</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* 3. Habits Section */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 shrink-0">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">HÁBITOS DE CLIENTE</h3>
                <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-100">
                    <div className="flex flex-col items-center">
                        <span className="block text-[10px] text-gray-400 uppercase tracking-wide mb-2">ESTATUS DE FIDELIDAD</span>
                        <span className="inline-block px-4 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600 uppercase tracking-wide">
                            {clientData?.loyaltyStatus || 'NUEVO'}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="block text-[10px] text-gray-400 uppercase tracking-wide mb-2">RITMO DE VISITAS</span>
                        <span className="text-sm font-bold text-gray-800">
                            {clientData?.visitRhythm}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="block text-[10px] text-gray-400 uppercase tracking-wide mb-2">SERVICIO FAVORITO</span>
                        <span className="text-green-700 font-bold text-sm truncate max-w-[120px]" title={clientData?.favoriteService}>
                            {clientData?.favoriteService}
                        </span>
                    </div>
                </div>
            </div>

            {/* 4. History Section */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex-1 min-h-[150px] flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Historial Reciente</h3>
                {history.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-gray-400 italic font-medium">No hay historial previo.</p>
                    </div>
                ) : (
                    <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {history.map(h => (
                            <div key={h.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer">
                                <div>
                                    <p className="font-bold text-gray-800">{h.date}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{h.items?.[0]?.title} {h.items.length > 1 && `+${h.items.length - 1} más`}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-mono text-gray-900 font-bold">${h.total}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 font-bold">Completado</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default AppointmentClientProfile;
