
import React, { useState, useMemo } from 'react';
import { useData, Appointment } from '../../context/DataContext';

const Archive: React.FC = () => {
    const { appointments, reactivateArchivedAppointment } = useData();

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Modal States
    const [tempAppointment, setTempAppointment] = useState<Partial<Appointment>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reactivationReason, setReactivationReason] = useState('');

    // Date Handling States
    const [needsNewDate, setNeedsNewDate] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');

    // --- KPI Logic ---
    const stats = useMemo(() => {
        const completed = appointments.filter(a => a.isArchived && a.status === 'Finalized').length;
        const cancelled = appointments.filter(a => a.isArchived && a.status === 'Cancelled').length;
        const recovered = appointments.filter(a => !a.isArchived && a.notes && a.notes.includes('[Reactivada:')).length;
        return { completed, cancelled, recovered };
    }, [appointments]);

    // Filter Logic for Table View
    const archivedAppointments = useMemo(() => {
        return appointments
            .filter(a => a.isArchived)
            .filter(a => {
                const matchesSearch =
                    a.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (a.items?.[0]?.title || '').toLowerCase().includes(searchTerm.toLowerCase());

                const matchesStatus = filterStatus === 'all'
                    ? true
                    : a.status === filterStatus;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [appointments, searchTerm, filterStatus]);

    const handleOpenReactivate = (apt: Appointment) => {
        setTempAppointment({ ...apt });
        setReactivationReason('');

        // Validación de Fecha: ¿La cita original está en el pasado?
        const apptDate = new Date(`${apt.date}T${apt.time.includes(' ') ? apt.time.split(' ')[0] : apt.time}`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Comprobar si la fecha es anterior a hoy
        const isPast = new Date(apt.date) < today;

        setNeedsNewDate(isPast);
        setNewDate(isPast ? new Date().toLocaleDateString('en-CA') : apt.date);
        setNewTime(isPast ? '09:00' : apt.time);

        setIsModalOpen(true);
    };

    const confirmReactivation = () => {
        if (tempAppointment.id) {
            reactivateArchivedAppointment(
                tempAppointment.id,
                reactivationReason || 'Reactivación manual',
                needsNewDate ? newDate : undefined,
                needsNewDate ? newTime : undefined
            );
            setIsModalOpen(false);
            setReactivationReason('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-background-dark p-4 md:p-6 overflow-hidden">
            <div className="mb-4 md:mb-6 flex-shrink-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Archivo de Citas</h1>
                <p className="text-xs md:text-sm text-gray-500">Historial operativo y recuperación de flujo.</p>
            </div>

            {/* --- Operational Indicators --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6 flex-shrink-0">
                {/* Card 1: Completed */}
                <div className="bg-white dark:bg-surface-dark p-3 md:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completadas</p>
                        <div className="flex items-baseline gap-2 mt-0.5 md:mt-1">
                            <h3 className="text-xl md:text-2xl font-display font-bold text-gray-900 dark:text-white">{stats.completed}</h3>
                            <span className="hidden sm:inline text-[10px] text-gray-400">históricas</span>
                        </div>
                    </div>
                    <div className="hidden sm:flex w-8 h-8 md:w-10 md:h-10 items-center justify-center bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                        <span className="material-icons text-lg md:text-xl">task_alt</span>
                    </div>
                </div>

                {/* Card 2: Cancelled (Losses) */}
                <div className="bg-white dark:bg-surface-dark p-3 md:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Canceladas</p>
                        <div className="flex items-baseline gap-2 mt-0.5 md:mt-1">
                            <h3 className="text-xl md:text-2xl font-display font-bold text-gray-900 dark:text-white">{stats.cancelled}</h3>
                            <span className="hidden sm:inline text-[10px] text-gray-400">en archivo</span>
                        </div>
                    </div>
                    <div className="hidden sm:flex w-8 h-8 md:w-10 md:h-10 items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">
                        <span className="material-icons text-lg md:text-xl">delete_outline</span>
                    </div>
                </div>

                {/* Card 3: Recovered (Success Stories) */}
                <div className="col-span-2 md:col-span-1 bg-white dark:bg-surface-dark p-3 md:p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm flex items-center justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Recuperadas</p>
                        <div className="flex items-baseline gap-2 mt-0.5 md:mt-1">
                            <h3 className="text-xl md:text-2xl font-display font-bold text-blue-900 dark:text-white">{stats.recovered}</h3>
                            <span className="hidden sm:inline text-[10px] text-blue-600/70 dark:text-blue-300">salvadas</span>
                        </div>
                    </div>
                    <div className="relative z-10 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full shadow-sm">
                        <span className="material-icons text-lg md:text-xl">restore</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col flex-1 min-h-0">

                {/* Filters Toolbar */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 flex flex-col sm:flex-row gap-4 justify-between items-center flex-shrink-0">
                    <div className="relative w-full sm:max-w-xs">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar cliente, ID o servicio..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-gray-900 dark:text-white"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer font-medium"
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="Finalized">Completadas</option>
                            <option value="Cancelled">Canceladas</option>
                        </select>

                        {(searchTerm || filterStatus !== 'all') && (
                            <button
                                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                title="Limpiar filtros"
                            >
                                <span className="material-icons text-xl">filter_alt_off</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-white/5 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha Orig.</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Servicio</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado Final</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {archivedAppointments.map(apt => (
                                <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{apt.date}</span>
                                            <span className="text-xs text-gray-400">{apt.time}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{apt.clientName}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{apt.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{apt.items?.[0]?.title || 'Varios'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${apt.status === 'Finalized' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                            {apt.status === 'Finalized' ? 'Completada' : 'Cancelada'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {apt.status === 'Cancelled' ? (
                                            <button onClick={() => handleOpenReactivate(apt)} className="text-primary hover:text-green-900 hover:underline font-bold text-xs bg-primary/10 px-3 py-1 rounded-full">
                                                Reactivar
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs flex items-center justify-end gap-1">
                                                <span className="material-icons text-[14px]">lock</span> Permanente
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {archivedAppointments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <span className="material-icons text-4xl text-gray-300 mb-2">folder_off</span>
                                            <p>No se encontraron registros en el archivo.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mostrando <span className="font-bold">{archivedAppointments.length}</span> registros archivados
                    </p>
                </div>
            </div>

            {/* Reactivation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                <span className="material-icons text-xl">restore</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reactivar Cita</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    La cita de <strong>{tempAppointment.clientName}</strong> volverá al tablero en estado "Por Confirmar".
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Date Warning Logic */}
                            {needsNewDate && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                    <p className="text-xs text-amber-800 dark:text-amber-200 font-bold flex items-center gap-1 mb-2">
                                        <span className="material-icons text-sm">event_busy</span>
                                        Fecha original vencida ({tempAppointment.date})
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nueva Fecha</label>
                                            <input
                                                type="date"
                                                value={newDate}
                                                onChange={(e) => setNewDate(e.target.value)}
                                                className="w-full text-sm border rounded p-1.5 dark:bg-black/20 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nueva Hora</label>
                                            <input
                                                type="time"
                                                value={newTime}
                                                onChange={(e) => setNewTime(e.target.value)}
                                                className="w-full text-sm border rounded p-1.5 dark:bg-black/20 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Motivo de Reactivación</label>
                                <textarea
                                    value={reactivationReason}
                                    onChange={e => setReactivationReason(e.target.value)}
                                    placeholder="Ej: Cliente solicitó reagendar, error administrativo..."
                                    className="w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-sm dark:bg-black/20 outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] resize-none"
                                    autoFocus={!needsNewDate}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">Cancelar</button>
                            <button
                                onClick={confirmReactivation}
                                disabled={!reactivationReason.trim() || (needsNewDate && (!newDate || !newTime))}
                                className={`px-6 py-2 text-white text-sm font-bold rounded-lg shadow-lg transition-all 
                              ${(!reactivationReason.trim() || (needsNewDate && (!newDate || !newTime)))
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-primary hover:bg-green-800 shadow-primary/20'}`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Archive;
