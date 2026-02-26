
import React, { useMemo, useState } from 'react';
import { useData, Appointment } from '../../context/DataContext';
import AppointmentHistoryModal from '../appointments/AppointmentHistoryModal';

interface ClientAppointmentsTabProps {
    clientId: string;
}

const ClientAppointmentsTab: React.FC<ClientAppointmentsTabProps> = ({ clientId }) => {
    const { appointments } = useData();
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    const clientAppointments = useMemo(() => 
        appointments.filter(a => a.clientId === clientId)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments, clientId]);

    return (
        <>
            <div className="space-y-4 animate-in fade-in">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historial de Citas</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientAppointments.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-12 h-12 bg-gray-50 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-icons text-2xl text-gray-300">event_busy</span>
                            </div>
                            <p className="text-gray-400 font-bold text-xs">No hay citas registradas.</p>
                        </div>
                    ) : (
                        clientAppointments.map(apt => (
                            <div key={apt.id} className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700">
                                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{new Date(apt.date).toLocaleString('es-ES', {month: 'short'})}</span>
                                                <span className="text-base font-bold text-gray-900 dark:text-white leading-none">{new Date(apt.date).getDate()}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-display font-bold text-base text-gray-900 dark:text-white">
                                                    {apt.time}
                                                </h4>
                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                                                    apt.status === 'Finalized' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    apt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">${apt.total.toFixed(0)}</span>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Servicios</p>
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                            {apt.items.map(i => i.title).join(', ')}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="px-5 py-2 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <span className="text-[9px] text-gray-400 font-mono">ID: {apt.id}</span>
                                    <button 
                                        onClick={() => setSelectedAppointment(apt)}
                                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Ver Bitácora <span className="material-icons text-[10px]">history_edu</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <AppointmentHistoryModal 
                isOpen={!!selectedAppointment} 
                onClose={() => setSelectedAppointment(null)} 
                appointment={selectedAppointment} 
            />
        </>
    );
};

export default ClientAppointmentsTab;
