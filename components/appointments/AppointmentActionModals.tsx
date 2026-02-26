
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData, Appointment, AppointmentItem, Invoice } from '../../context/DataContext';

// --- CONSTANTS & HELPERS ---
const TIME_SLOTS = [
    '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM'
];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

// SAFE PARSE: Prevents crash if timeStr is undefined/null
const parseTimeSlot = (timeStr: string) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [time, modifier] = timeStr.split(' ');
    if (!time || !modifier) return 0;
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;
    if (modifier === 'AM' && hours === 0) hours = 24; 
    return hours * 60 + minutes;
};

// --- RESCHEDULE MODAL ---
interface RescheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
    onSuccess: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, appointment, onSuccess }) => {
    const { updateAppointment, addClientLog, addToast, invoices, updateInvoice } = useData();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [viewDate, setViewDate] = useState<Date>(new Date());

    useEffect(() => {
        if (isOpen && appointment) {
            // Safe date parsing
            const dateParts = appointment.date ? appointment.date.split('-').map(Number) : [];
            if (dateParts.length === 3) {
                const [y, m, d] = dateParts;
                const dateObj = new Date(y, m - 1, d);
                setSelectedDate(dateObj);
                setViewDate(dateObj);
            }
            setSelectedTime(appointment.time || '');
        }
    }, [isOpen, appointment]);

    const timeSlots = useMemo(() => {
        const now = new Date();
        const isToday = selectedDate.getDate() === now.getDate() && 
                        selectedDate.getMonth() === now.getMonth() && 
                        selectedDate.getFullYear() === now.getFullYear();
        
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        return TIME_SLOTS.map(slot => ({
            time: slot,
            disabled: isToday && parseTimeSlot(slot) <= currentMinutes
        }));
    }, [selectedDate]);

    if (!isOpen) return null;

    const handleDateSelect = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        setSelectedDate(newDate);
        
        const now = new Date();
        const isToday = newDate.getDate() === now.getDate() && 
                        newDate.getMonth() === now.getMonth() && 
                        newDate.getFullYear() === now.getFullYear();

        if (isToday) {
             const currentMinutes = now.getHours() * 60 + now.getMinutes();
             if (parseTimeSlot(selectedTime) <= currentMinutes) {
                 setSelectedTime('');
             }
        }
    };

    const changeMonth = (offset: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const handleConfirm = () => {
        if (!selectedTime) {
            addToast('error', 'Por favor selecciona una hora válida.');
            return;
        }
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        if (dateStr === appointment.date && selectedTime === appointment.time) {
            onClose();
            return;
        }

        // 1. Update Appointment
        updateAppointment(appointment.id, { date: dateStr, time: selectedTime });

        // 2. Sync Linked Invoice (Crucial for Dashboard/Finance consistency)
        const linkedInvoice = invoices.find(inv => inv.appointmentId === appointment.id && inv.status !== 'Anulada');
        if (linkedInvoice) {
            updateInvoice(linkedInvoice.id, { date: dateStr, time: selectedTime });
        }
        
        // LOG STRUCTURED: Context | Title | Detail (Arrow Format)
        addClientLog({
            clientId: appointment.clientId,
            type: 'interaction',
            action: 'edit_profile',
            description: `Cita #${appointment.id}|Reprogramada|${appointment.date} ${appointment.time} ➝ ${dateStr} ${selectedTime}`,
            date: new Date().toLocaleDateString('es-ES')
        });

        addToast('success', 'Cita y factura reprogramadas correctamente.');
        onSuccess();
        onClose();
    };

    const renderCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];
        const today = new Date();
        today.setHours(0,0,0,0);
        
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dateCheck = new Date(year, month, i);
            const isSelected = dateCheck.getDate() === selectedDate.getDate() && 
                               dateCheck.getMonth() === selectedDate.getMonth() && 
                               dateCheck.getFullYear() === selectedDate.getFullYear();
            const isToday = dateCheck.getDate() === today.getDate() && 
                            dateCheck.getMonth() === today.getMonth() && 
                            dateCheck.getFullYear() === today.getFullYear();
            const isPast = dateCheck < today;
            
            days.push(
                <button 
                    key={i} 
                    disabled={isPast}
                    onClick={() => handleDateSelect(i)} 
                    className={`h-9 w-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all 
                    ${isSelected ? 'bg-primary text-white shadow-md scale-105' : 
                      isToday ? 'border border-primary text-primary font-bold' :
                      isPast ? 'text-gray-300 cursor-not-allowed' :
                      'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                >
                    {i}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl w-full max-w-4xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-icons text-blue-500">edit_calendar</span> Reprogramar Cita
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cambiar fecha y hora del servicio.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors">
                        <span className="material-icons text-xl">close</span>
                    </button>
                </div>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-5/12 bg-gray-50 dark:bg-black/20 border-r border-gray-100 dark:border-gray-700 p-6 flex flex-col">
                        <div className="mb-6 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">FECHA ACTUAL</p>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg">
                                    <span className="material-icons text-gray-500">event</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{appointment.date}</p>
                                    <p className="text-xs text-gray-500">{appointment.time}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                                    {viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                                </span>
                                <div className="flex gap-1 bg-white dark:bg-white/5 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-gray-500"><span className="material-icons text-sm block">chevron_left</span></button>
                                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-gray-500"><span className="material-icons text-sm block">chevron_right</span></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {['D','L','M','M','J','V','S'].map(d => <span key={d} className="text-[10px] font-bold text-gray-400">{d}</span>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1 place-items-center">
                                {renderCalendarDays()}
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-7/12 p-6 flex flex-col h-full bg-white dark:bg-surface-dark overflow-hidden">
                        <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">NUEVA SELECCIÓN</p>
                            <h2 className="text-xl font-bold text-primary capitalize">
                                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h2>
                            {selectedTime ? (
                                <p className="text-lg font-medium text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                                    <span className="material-icons text-primary text-sm">schedule</span> {selectedTime}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400 mt-1 italic">Selecciona una hora...</p>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {timeSlots.map(({ time, disabled }) => (
                                    <button
                                        key={time}
                                        disabled={disabled}
                                        onClick={() => setSelectedTime(time)}
                                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border text-center
                                            ${disabled 
                                                ? 'opacity-30 cursor-not-allowed bg-gray-50 dark:bg-white/5 border-transparent text-gray-400' 
                                                : selectedTime === time 
                                                    ? 'bg-primary border-primary text-white shadow-md ring-2 ring-primary/20' 
                                                    : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary'}
                                        `}
                                    >
                                        {time.replace(/ [AP]M/, '')} <span className="text-[9px] opacity-70">{time.slice(-2)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                            <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirm} 
                                disabled={!selectedTime || (selectedTime === appointment.time && selectedDate.toDateString() === new Date(appointment.date.replace(/-/g, '/')).toDateString())} 
                                className="px-6 py-2.5 bg-primary hover:bg-green-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Cambio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODIFY ITEMS MODAL ---
interface ModifyAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
    onSuccess: () => void;
}

export const ModifyAppointmentModal: React.FC<ModifyAppointmentModalProps> = ({ isOpen, onClose, appointment, onSuccess }) => {
    const { updateAppointment, catalog, invoices, updateInvoice, addToast, addClientLog, createManualInvoice } = useData();
    const [currentItems, setCurrentItems] = useState<AppointmentItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'service' | 'product'>('service');
    
    // Multi-Invoice State
    const [targetInvoiceId, setTargetInvoiceId] = useState<string>('');

    // Get invoices linked to this appointment
    const linkedInvoices = useMemo(() => 
        invoices.filter(i => i.appointmentId === appointment.id && i.status !== 'Anulada'), 
    [invoices, appointment]);

    // Initial Load Logic
    useEffect(() => {
        if (isOpen && appointment) {
            setSearchTerm('');
            // If already set and valid, don't reset to avoid losing UI state on background refresh
            // But if empty, try to auto-select
            if (!targetInvoiceId) {
                const defaultInvoice = linkedInvoices.find(i => i.status === 'Pendiente' || i.status === 'Cotización') || linkedInvoices[0];
                if (defaultInvoice) {
                    setTargetInvoiceId(defaultInvoice.id);
                    setCurrentItems(defaultInvoice.items.map(i => ({...i})));
                } else {
                    setTargetInvoiceId(''); 
                    // Show generic appointment items as preview if no specific invoice selected yet
                    setCurrentItems((appointment.items || []).map(i => ({...i})));
                }
            }
        }
    }, [isOpen, appointment, linkedInvoices]); // Keep deps to react to new invoice creation

    // Handle switching between invoices via Radio Buttons
    const handleInvoiceChange = (invId: string) => {
        setTargetInvoiceId(invId);
        const selectedInv = linkedInvoices.find(i => i.id === invId);
        if (selectedInv) {
            // Load items from the newly selected invoice
            setCurrentItems(selectedInv.items.map(i => ({...i})));
        }
    };

    const handleCreateDefaultInvoice = () => {
        // Trigger creation
        createManualInvoice({
            clientId: appointment.clientId,
            clientName: appointment.clientName,
            items: appointment.items,
            amount: appointment.total,
            status: 'Pendiente',
            existingAppointmentId: appointment.id
        });
        // The useEffect above will pick up the new invoice once it's in context and auto-select it because targetInvoiceId is empty
    };

    const currentTotal = useMemo(() => 
        currentItems.reduce((acc, i) => acc + (i.price * (i.quantity || 1)), 0), 
    [currentItems]);

    const filteredCatalog = useMemo(() => 
        catalog.filter(i => 
            i.type === activeTab && 
            (searchTerm === '' || i.title.toLowerCase().includes(searchTerm.toLowerCase()))
        ), 
    [catalog, searchTerm, activeTab]);

    const handleAddItem = (item: AppointmentItem) => {
        if (!targetInvoiceId) {
            addToast('error', 'Crea una factura primero para agregar items.');
            return;
        }
        // If invoice is paid/locked, don't allow adding
        const targetInv = linkedInvoices.find(i => i.id === targetInvoiceId);
        if (targetInv && (targetInv.status === 'Pagada' || targetInv.status === 'En Tránsito')) {
            addToast('error', 'No se puede modificar una factura pagada.');
            return;
        }

        setCurrentItems(prev => {
            const existingIdx = prev.findIndex(i => i.id === item.id);
            if (existingIdx >= 0) {
                const newItems = [...prev];
                newItems[existingIdx] = { ...newItems[existingIdx], quantity: (newItems[existingIdx].quantity || 1) + 1 };
                return newItems;
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const handleUpdateQty = (idx: number, delta: number) => {
        const targetInv = linkedInvoices.find(i => i.id === targetInvoiceId);
        if (targetInv && (targetInv.status === 'Pagada' || targetInv.status === 'En Tránsito')) {
            return;
        }

        setCurrentItems(prev => {
            const newItems = [...prev];
            const item = newItems[idx];
            const newQty = (item.quantity || 1) + delta;
            if (newQty <= 0) {
                newItems.splice(idx, 1);
            } else {
                newItems[idx] = { ...item, quantity: newQty };
            }
            return newItems;
        });
    };

    const handleSave = () => {
        if (!targetInvoiceId) {
            addToast('error', 'Debes seleccionar o crear una factura destino.');
            return;
        }

        const targetInvoice = linkedInvoices.find(i => i.id === targetInvoiceId);
        if (targetInvoice) {
            // 1. Calculate Diff Strings BEFORE updating
            const oldTotal = targetInvoice.amount;
            const oldItemsSummary = targetInvoice.items.map(i => `${i.title} (x${i.quantity || 1})`).join(', ') || 'Vacío';
            const newItemsSummary = currentItems.map(i => `${i.title} (x${i.quantity || 1})`).join(', ') || 'Vacío';

            const serviceTotal = currentItems.filter(i => i.type === 'service').reduce((acc, i) => acc + (i.price * (i.quantity||1)), 0);
            const productTotal = currentItems.filter(i => i.type === 'product').reduce((acc, i) => acc + (i.price * (i.quantity||1)), 0);
            
            // 2. Update the Invoice
            updateInvoice(targetInvoiceId, {
                items: currentItems,
                amount: currentTotal,
                service: currentItems.length > 0 ? currentItems[0].title + (currentItems.length > 1 ? '...' : '') : 'Varios',
                paymentBreakdown: {
                    ...(targetInvoice.paymentBreakdown || { servicesPaid: false, productsPaid: false }),
                    servicesTotal: serviceTotal,
                    productsTotal: productTotal
                }
            });

            // 3. Also update Appointment for consistency IF it is the primary invoice
            if (linkedInvoices.length <= 1) {
                 updateAppointment(appointment.id, { 
                    items: currentItems, 
                    total: currentTotal 
                });
            }

            addToast('success', `Factura ${targetInvoice.idDisplay} actualizada.`);
            
            // LOG STRUCTURED: Context | Title | Detail | Item Diff
            // Format: "Cita #ID / Invoice #ID"
            const logContext = `Cita #${appointment.id} / ${targetInvoice.idDisplay}`;
            const detailDiff = `Total: $${oldTotal.toFixed(2)} ➝ $${currentTotal.toFixed(2)}`;
            const itemsDiff = `${oldItemsSummary} ➝ ${newItemsSummary}`;

            addClientLog({
                clientId: appointment.clientId,
                type: 'system',
                action: 'edit_profile',
                description: `${logContext}|Modificación de Items|${detailDiff}|${itemsDiff}`,
                date: new Date().toLocaleDateString('es-ES')
            });

            onSuccess();
            onClose();
        } else {
            addToast('error', 'Factura no encontrada. Intente nuevamente.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose}>
            <div className="bg-[#F8F9FA] dark:bg-surface-dark rounded-3xl shadow-2xl w-full max-w-6xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[800px]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-white dark:bg-black/20 border-b border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-xl text-purple-600 dark:text-purple-400">
                            <span className="material-icons">edit_note</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Modificar Factura</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">ID Cita: {appointment.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    
                    {/* LEFT COL: INVOICE SELECTOR & CART */}
                    <div className="w-full md:w-5/12 flex flex-col bg-white dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 relative z-10">
                        
                        {/* INVOICE SELECTOR */}
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
                            <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <span className="material-icons text-sm">receipt_long</span> Seleccionar Documento
                            </h4>
                            <div className="flex flex-col gap-2">
                                {linkedInvoices.length === 0 ? (
                                    <div className="text-center py-4 px-2 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl bg-white/50 dark:bg-white/5">
                                        <span className="material-icons text-gray-300 text-2xl mb-1">receipt</span>
                                        <p className="text-xs text-gray-500 mb-2">No hay facturas vinculadas.</p>
                                        <button 
                                            onClick={handleCreateDefaultInvoice}
                                            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                        >
                                            + Generar Factura Base
                                        </button>
                                    </div>
                                ) : (
                                    linkedInvoices.map(inv => {
                                        const isLocked = inv.status === 'Pagada' || inv.status === 'En Tránsito' || inv.status === 'Parcial';
                                        return (
                                            <label key={inv.id} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${targetInvoiceId === inv.id ? 'bg-white shadow-sm border-blue-200 ring-1 ring-blue-200' : 'border-transparent hover:bg-white/50'} ${isLocked ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                                                <input 
                                                    type="radio" 
                                                    name="targetInv" 
                                                    value={inv.id} 
                                                    checked={targetInvoiceId === inv.id} 
                                                    onChange={() => handleInvoiceChange(inv.id)} 
                                                    className="text-primary focus:ring-primary mr-3" 
                                                />
                                                <div className="flex-1 flex justify-between items-center">
                                                    <div>
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block flex items-center gap-1">
                                                            {isLocked && <span className="material-icons text-[10px]">lock</span>}
                                                            {inv.idDisplay}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 block">Total Actual: ${inv.amount.toFixed(2)}</span>
                                                    </div>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isLocked ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {inv.status}
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* ITEMS LIST (Updated dynamically based on selection) */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Items de la Factura</h3>
                            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{currentItems.length} Items</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                            {currentItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <span className="material-icons text-3xl mb-2">shopping_cart_checkout</span>
                                    <p className="text-xs">Sin items asignados</p>
                                </div>
                            ) : (
                                currentItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-black/20 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:border-purple-300 transition-colors group">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'service' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20'}`}>
                                            <span className="material-icons text-sm">{item.type === 'service' ? 'spa' : 'inventory_2'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.title}</p>
                                                <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">${((item.quantity || 1) * item.price).toFixed(0)}</p>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-[10px] text-gray-400">${item.price} unit.</p>
                                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-lg px-1 py-0.5">
                                                    <button onClick={() => handleUpdateQty(idx, -1)} className="w-5 h-5 flex items-center justify-center hover:text-red-500 text-gray-500"><span className="material-icons text-[10px]">remove</span></button>
                                                    <span className="text-xs font-bold w-4 text-center dark:text-white">{item.quantity || 1}</span>
                                                    <button onClick={() => handleUpdateQty(idx, 1)} className="w-5 h-5 flex items-center justify-center hover:text-green-500 text-gray-500"><span className="material-icons text-[10px]">add</span></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">NUEVO TOTAL</p>
                                    <p className="text-3xl font-display font-bold text-gray-900 dark:text-white">${currentTotal.toFixed(2)}</p>
                                </div>
                                <button onClick={handleSave} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                                    <span className="material-icons text-sm">save</span> Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL: CATALOG (POS) */}
                    <div className="w-full md:w-7/12 flex flex-col bg-[#F3F4F6] dark:bg-black/5 p-6">
                        
                        {/* Search & Tabs */}
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="relative">
                                <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                <input 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Buscar en catálogo..."
                                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none shadow-sm outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white bg-white dark:bg-surface-dark text-sm"
                                    autoFocus
                                />
                            </div>
                            <div className="flex p-1 bg-gray-200 dark:bg-black/20 rounded-xl">
                                <button 
                                    onClick={() => setActiveTab('service')} 
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'service' ? 'bg-white dark:bg-surface-dark text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <span className="material-icons text-sm">spa</span> Servicios
                                </button>
                                <button 
                                    onClick={() => setActiveTab('product')} 
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'product' ? 'bg-white dark:bg-surface-dark text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <span className="material-icons text-sm">inventory_2</span> Productos
                                </button>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredCatalog.length === 0 ? (
                                    <div className="col-span-full py-20 text-center text-gray-400 text-sm italic flex flex-col items-center">
                                        <span className="material-icons text-4xl mb-2 opacity-30">search_off</span>
                                        No se encontraron resultados
                                    </div>
                                ) : (
                                    filteredCatalog.map(item => (
                                        <button 
                                            key={item.id} 
                                            onClick={() => handleAddItem(item)}
                                            className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-transparent hover:border-primary shadow-sm hover:shadow-lg transition-all text-left flex flex-col justify-between group h-28 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                                                    <span className="material-icons text-xs">add</span>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight mb-1">{item.title}</p>
                                                <p className="text-[10px] text-gray-400 capitalize bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-md inline-block">{item.category || item.type}</p>
                                            </div>
                                            
                                            <div className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                                                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">${item.price}</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
