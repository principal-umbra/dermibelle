
import React, { useState, useMemo } from 'react';
import { Appointment, AppointmentItem, useData } from '../../context/DataContext';
import { RescheduleModal, ModifyAppointmentModal } from './AppointmentActionModals';

interface AppointmentDetailsProps {
    appointment: Appointment;
    onTabChange: (tab: 'details' | 'client' | 'finance') => void;
    onUpdate: (updatedAppt: Appointment | null) => void;
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ appointment, onTabChange, onUpdate }) => {
    const { invoices, updateAppointmentStatus, updateAppointment, getInvoiceByAppointmentId, addToast, reactivateArchivedAppointment, catalog } = useData();
    
    // --- STATE: MODALS ---
    const [confirmModal, setConfirmModal] = useState<{isOpen: boolean; title: string; message: string; action: () => void} | null>(null);
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [isModifyOpen, setIsModifyOpen] = useState(false);

    // --- LOGIC: STOCK VALIDATION ---
    const stockValidation = useMemo(() => {
        const issues: string[] = [];
        
        appointment.items.forEach(item => {
            const catalogItem = catalog.find(c => c.id === item.id);
            if (!catalogItem) return;

            if (catalogItem.type === 'product') {
                if ((catalogItem.stock || 0) <= 0) issues.push(String(item.id));
            } else if (catalogItem.type === 'service' && catalogItem.recipe) {
                const missingIngredients = catalogItem.recipe.some(ing => {
                    const product = catalog.find(p => p.id === ing.id);
                    return product ? (product.stock || 0) <= 0 : false;
                });
                if (missingIngredients) issues.push(String(item.id));
            }
        });

        return {
            hasIssues: issues.length > 0,
            problematicItemIds: issues
        };
    }, [appointment.items, catalog]);

    const isEmpty = !appointment.items || appointment.items.length === 0;
    const isLockedStatus = stockValidation.hasIssues || isEmpty;

    // --- LOGIC: CONSOLIDATED DISPLAY (Read Only View) ---
    const consolidatedDetails = useMemo(() => {
        const linkedInvoices = invoices.filter(inv => inv.appointmentId === appointment.id && inv.status !== 'Anulada');
        if (linkedInvoices.length === 0) {
          return { 
            items: (appointment.items || []).filter(Boolean).map(i => ({ 
                item: { ...i }, 
                totalQty: i.quantity || 1, 
                sources: [] as string[] 
            })), 
            total: appointment.total 
          };
        }
        const itemsMap = new Map<string, { item: AppointmentItem, totalQty: number, sources: string[] }>();
        let totalGlobal = 0;
        linkedInvoices.forEach(inv => {
          totalGlobal += inv.amount;
          (inv.items || []).filter(Boolean).forEach(item => {
            const key = String(item.id);
            const qty = item.quantity || 1;
            if (itemsMap.has(key)) {
              const existing = itemsMap.get(key)!;
              existing.totalQty += qty;
              if (!existing.sources.includes(inv.idDisplay)) existing.sources.push(inv.idDisplay);
            } else {
              itemsMap.set(key, { item: { ...item }, totalQty: qty, sources: [inv.idDisplay] });
            }
          });
        });
        return { items: Array.from(itemsMap.values()), total: totalGlobal };
    }, [appointment, invoices]);

    // --- ACTIONS ---

    const handleStatusChange = (status: Appointment['status']) => {
        if (isLockedStatus && status !== 'Cancelled') {
            addToast('error', isEmpty ? 'La cita está vacía. Añade servicios o cancéla.' : 'No hay stock suficiente para realizar el servicio.');
            return;
        }

        if (status === 'Finalized') {
            const invoice = getInvoiceByAppointmentId(appointment.id);
            if (!invoice || (invoice.status !== 'Pagada' && invoice.status !== 'En Tránsito')) {
                addToast('error', 'La factura debe estar pagada o en tránsito para finalizar.');
                return;
            }
        }
        updateAppointmentStatus(appointment.id, status);
        // If status changes to Finalized/Cancelled, the parent might close the modal or refresh list
        if (status === 'Finalized' || status === 'Cancelled') onUpdate(null); 
        else onUpdate({ ...appointment, status });
    };

    const requestCancellation = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirmar Cancelación',
            message: '¿Estás seguro? Si existe una factura, será anulada automáticamente.',
            action: () => { handleStatusChange('Cancelled'); setConfirmModal(null); }
        });
    };
  
    const requestReactivation = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Reactivar Cita',
            message: 'Se creará una nueva cita "Por Confirmar" basada en esta. La actual permanecerá en el historial.',
            action: () => { 
                reactivateArchivedAppointment(appointment.id, 'Reactivación desde detalles'); 
                setConfirmModal(null); 
                onUpdate(null); 
            }
        });
    };

    // Callback when modification happens
    const handleUpdateSuccess = () => {
        // Trigger a re-fetch or re-render logic if needed
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="lg:col-span-8 flex flex-col gap-4">
                    {/* 1. People Card */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4 pr-6 md:border-r border-gray-100 dark:border-gray-800">
                                {appointment.clientAvatar ? <img src={appointment.clientAvatar} alt="" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-500 dark:text-gray-400">{appointment.clientName.substring(0,2)}</div>}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">CLIENTE</span><button onClick={() => onTabChange('client')} className="text-[9px] font-bold text-primary hover:underline">VER PERFIL</button></div>
                                    <h3 className="font-body font-bold text-base text-gray-900 dark:text-white truncate">{appointment.clientName}</h3>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Cliente Registrado</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-lg border border-purple-100 dark:border-purple-800">{appointment.specialistName.substring(0,2)}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-0.5"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">ASIGNADO A</span><button className="text-[9px] font-bold text-primary hover:underline">CAMBIAR</button></div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{appointment.specialistName}</h3>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Lead Specialist</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Date Card */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center sm:justify-start flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-300"><span className="material-icons text-xl">event</span></div>
                            <div><span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">FECHA Y HORA</span><h3 className="font-body font-bold text-sm text-gray-900 dark:text-white capitalize">{new Date(appointment.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}<span className="mx-2 text-gray-300 dark:text-gray-600">|</span><span className="text-primary">{appointment.time}</span></h3></div>
                        </div>
                    </div>

                    {/* 3. Items Table with Stock Check */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                        <div className="px-4 py-2.5 bg-gray-50/50 dark:bg-black/20 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">SERVICIOS / PRODUCTOS (CONSOLIDADO)</span>
                            <span className="text-[9px] font-bold text-gray-400">{consolidatedDetails.items.length} ITEMS</span>
                        </div>
                        
                        {isEmpty ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center bg-red-50/50 dark:bg-red-900/10">
                                <span className="material-icons text-red-300 text-3xl mb-2">remove_shopping_cart</span>
                                <p className="text-sm font-bold text-red-500">Cita Vacía</p>
                                <p className="text-xs text-red-400 max-w-xs mt-1">Esta cita no tiene productos ni servicios vinculados. Se sugiere cancelarla.</p>
                            </div>
                        ) : (
                            <div className="p-2 overflow-y-auto max-h-[200px] custom-scrollbar">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {consolidatedDetails.items.map((entry, idx) => {
                                            const hasIssue = stockValidation.problematicItemIds.includes(String(entry.item.id));
                                            
                                            return (
                                                <tr key={idx} className={`group transition-colors ${hasIssue ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50/50 dark:hover:bg-white/5'}`}>
                                                    <td className="py-2.5 px-2">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className={`material-icons text-[14px] ${hasIssue ? 'text-red-500' : (entry?.item?.type === 'service' ? 'text-green-700 dark:text-green-400' : 'text-amber-600 dark:text-amber-400')}`}>
                                                                    {hasIssue ? 'warning' : (entry?.item?.type === 'service' ? 'spa' : 'shopping_bag')}
                                                                </span>
                                                                <span className={`font-bold text-[13px] ${hasIssue ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                                                    {entry?.item?.title}
                                                                </span>
                                                                {entry.totalQty > 1 && <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-black">x{entry.totalQty}</span>}
                                                            </div>
                                                            {hasIssue && (
                                                                <span className="text-[10px] font-bold text-red-500 ml-6 mt-0.5 bg-white/50 px-1.5 rounded w-fit border border-red-100 dark:border-red-800">
                                                                    {entry.item.type === 'service' ? 'Falta Insumo (Receta)' : 'Sin Stock Físico'}
                                                                </span>
                                                            )}
                                                            {entry.sources.length > 0 && <div className="flex gap-1 mt-1 ml-6">{entry.sources.map(src => <span key={src} className="text-[8px] px-1 bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 rounded border border-gray-200 dark:border-gray-700 font-mono">{src}</span>)}</div>}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-2 text-right">
                                                        <div className="flex flex-col"><span className={`font-mono text-[13px] font-bold ${hasIssue ? 'text-red-700 line-through opacity-70' : 'text-gray-900 dark:text-white'}`}>${(entry?.item?.price * entry.totalQty).toFixed(2)}</span>{entry.totalQty > 1 && <span className="text-[9px] text-gray-400 font-medium">${entry?.item?.price} c/u</span>}</div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="px-4 py-3 bg-gray-50/30 dark:bg-black/10 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center"><div className="flex flex-col"><span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Global</span><span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">(Suma de Facturas)</span></div><span className="text-2xl font-display font-bold text-primary">${consolidatedDetails.total.toFixed(2)}</span></div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    
                    {/* BLOCKING ALERT BANNER */}
                    {isLockedStatus && (
                        <div className="bg-red-500 text-white p-4 rounded-2xl shadow-lg shadow-red-500/20 border border-red-400 animate-pulse">
                            <div className="flex items-start gap-3">
                                <span className="material-icons text-xl bg-white/20 p-1 rounded-full">block</span>
                                <div>
                                    <h4 className="font-bold text-sm">Acción Requerida</h4>
                                    <p className="text-xs opacity-90 mt-1 leading-snug">
                                        {isEmpty ? 'Esta cita no tiene items. Modifícala para añadir servicios o cancélala.' : 'Faltan insumos o stock. No se puede avanzar ni facturar hasta reponer inventario o modificar la cita.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border ${isLockedStatus ? 'border-red-200 dark:border-red-900/50' : 'border-gray-100 dark:border-gray-700'}`}>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">ESTADO ACTUAL</span>
                        {appointment.status === 'Cancelled' ? (
                            <div className="flex flex-col gap-2">
                                <button onClick={requestReactivation} className="w-full py-2.5 px-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:text-yellow-400 font-bold rounded-xl flex items-center justify-center gap-2 border border-yellow-100 dark:border-yellow-800 text-sm transition-colors">
                                    <span className="material-icons text-sm">restore</span> Reactivar Cita
                                </button>
                                {appointment.wasReactivated && (
                                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 bg-gray-50 dark:bg-white/5 py-1 rounded-lg border border-gray-100 dark:border-gray-800 cursor-help" title="Esta cita ya ha sido utilizada como base para una reactivación previa">
                                        <span className="material-icons text-[12px]">history</span> 
                                        <span>Registro histórico (Ya reactivada previamente)</span>
                                    </div>
                                )}
                            </div>
                        ) : appointment.status === 'Finalized' ? (
                            <div className="w-full py-2.5 px-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-bold rounded-xl flex items-center justify-center gap-2 border border-purple-100 dark:border-purple-800 text-sm"><span className="material-icons text-sm">task_alt</span> Finalizada</div>
                        ) : (
                            <div className="relative group">
                                <select 
                                    value={appointment.status} 
                                    onChange={(e) => handleStatusChange(e.target.value as Appointment['status'])} 
                                    disabled={isLockedStatus} // BLOCK SELECTOR
                                    className={`w-full border-0 rounded-xl px-4 py-3 font-bold text-sm appearance-none transition-colors 
                                        ${isLockedStatus 
                                            ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed opacity-70' 
                                            : 'bg-gray-100 dark:bg-black/20 text-gray-700 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-black/30 outline-none'
                                        }`}
                                >
                                    <option value="Pending">Por Confirmar</option>
                                    <option value="Confirmed">Confirmada</option>
                                    <option value="In Progress">En Proceso</option>
                                </select>
                                <span className={`material-icons absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLockedStatus ? 'text-gray-300' : 'text-gray-400'}`}>
                                    {isLockedStatus ? 'lock' : 'expand_more'}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-2.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-1">ACCIONES DISPONIBLES</span>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => appointment.status !== 'Finalized' && appointment.status !== 'Cancelled' && setIsRescheduleOpen(true)}
                                disabled={appointment.status === 'Finalized' || appointment.status === 'Cancelled'}
                                className={`rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-1 transition-all group
                                    ${appointment.status === 'Finalized' || appointment.status === 'Cancelled' 
                                        ? 'bg-gray-50 dark:bg-white/5 opacity-50 cursor-not-allowed' 
                                        : 'bg-white dark:bg-surface-dark hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-100 dark:hover:border-blue-800 cursor-pointer'}
                                `}
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 flex items-center justify-center mb-1 group-hover:bg-white dark:group-hover:bg-white/10 transition-colors"><span className="material-icons text-sm">edit_calendar</span></div>
                                <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px] group-hover:text-blue-600 dark:group-hover:text-blue-400">Reprogramar</span>
                            </button>
                            
                            <button 
                                onClick={() => appointment.status !== 'Finalized' && appointment.status !== 'Cancelled' && setIsModifyOpen(true)}
                                disabled={appointment.status === 'Finalized' || appointment.status === 'Cancelled'}
                                className={`rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-1 transition-all group relative overflow-hidden
                                    ${appointment.status === 'Finalized' || appointment.status === 'Cancelled' 
                                        ? 'bg-gray-50 dark:bg-white/5 opacity-50 cursor-not-allowed' 
                                        : 'bg-white dark:bg-surface-dark hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:border-purple-100 dark:hover:border-purple-800 cursor-pointer'}
                                `}
                            >
                                {stockValidation.hasIssues && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>}
                                <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-500 dark:text-purple-400 flex items-center justify-center mb-1 group-hover:bg-white dark:group-hover:bg-white/10 transition-colors"><span className="material-icons text-sm">shopping_cart</span></div>
                                <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px] group-hover:text-purple-600 dark:group-hover:text-purple-400">Modificar</span>
                            </button>
                        </div>
                        {appointment.status !== 'Finalized' && appointment.status !== 'Cancelled' && (
                            <button onClick={requestCancellation} className="w-full bg-white dark:bg-surface-dark rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-100 dark:hover:border-red-900/30 transition-all group">
                                <span className="material-icons text-red-500 text-sm">cancel</span><span className="font-bold text-red-600 dark:text-red-400 text-xs">Anular Reserva</span>
                            </button>
                        )}
                    </div>
                    
                    {isLockedStatus && !isEmpty && (
                         <div className="mt-auto bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800">
                             <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                                 <span className="material-icons text-[14px] mt-0.5">lightbulb</span>
                                 <span>Para desbloquear: Modifica la cita para quitar items sin stock O repón inventario en el catálogo.</span>
                             </p>
                         </div>
                    )}
                    {!isLockedStatus && (
                        <div className="mt-auto bg-primary/5 rounded-2xl p-4 border border-primary/10"><p className="text-[10px] text-primary leading-relaxed italic">"Asegúrate de verificar la disponibilidad antes de reprogramar para evitar conflictos en la agenda."</p></div>
                    )}
                </div>
            </div>

            {/* Local Confirm Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"><span className="material-icons text-2xl">warning_amber</span></div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{confirmModal.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{confirmModal.message}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">Cancelar</button>
                            <button onClick={confirmModal.action} className="px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm bg-primary hover:bg-green-800">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Modals */}
            <RescheduleModal 
                isOpen={isRescheduleOpen} 
                onClose={() => setIsRescheduleOpen(false)} 
                appointment={appointment} 
                onSuccess={handleUpdateSuccess} 
            />
            <ModifyAppointmentModal 
                isOpen={isModifyOpen} 
                onClose={() => setIsModifyOpen(false)} 
                appointment={appointment} 
                onSuccess={handleUpdateSuccess} 
            />
        </>
    );
};

export default AppointmentDetails;
