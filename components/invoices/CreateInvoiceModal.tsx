
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData, Client, AppointmentItem, Appointment } from '../../context/DataContext';

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedClient?: Client; // Nuevo prop
    lockClient?: boolean;       // Nuevo prop para bloquear cambio de cliente
}

// Estructura de datos aislada por pestaña
interface TabState {
    client: Client | null;
    items: AppointmentItem[];
    date: string;
    time: string;
    specialist: string;
    // Específico para modo Vincular
    linkApptId: string;
    foundAppt: Appointment | null;
    linkError: string;
    // Específico para Cotización/Descuentos
    discountType: 'percent' | 'fixed';
    discountValue: number;
}

// Tipo extendido para items con conteo de uso (interno para la vista)
interface RankedItem extends AppointmentItem {
    _usageCount?: number;
}

// Constantes
const TIME_SLOTS = [
    '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM',
    '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM'
];

const SPECIALISTS = ['Elena G.', 'Sarah C.', 'Jessica T.', 'Sin Asignar'];

// Helpers Calendario
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

// Helper Time Parser (AM/PM to minutes)
const parseTimeSlot = (timeStr: string) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    if (!time || !modifier) return 0;
    let [hours, minutes] = time.split(':').map(Number);
    
    if (hours === 12) {
        hours = 0;
    }
    if (modifier === 'PM') {
        hours += 12;
    }
    // Treat 12:00 AM at the end of the list as 24:00 (end of day)
    if (modifier === 'AM' && hours === 0) {
        hours = 24;
    }
    
    return hours * 60 + minutes;
};

// Componente Item (ULTRA COMPACTO - HORIZONTAL)
const ItemCard = React.memo(({ item, onAdd }: { item: RankedItem; onAdd: (item: AppointmentItem) => void }) => {
    const available = item.type === 'service' ? 9999 : (item.stock || 0) - (item.reserved || 0);
    const isOutOfStock = available <= 0;

    return (
    <button 
        onClick={() => !isOutOfStock && onAdd(item)}
        disabled={isOutOfStock}
        className={`flex items-center gap-2 p-2 w-full bg-white dark:bg-surface-dark border rounded-lg transition-all group h-12 overflow-hidden text-left
            ${isOutOfStock ? 'opacity-50 cursor-not-allowed border-gray-100 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700 hover:border-primary hover:shadow-sm'}
        `}
    >
        {/* Icon Box */}
        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${item.type === 'service' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 group-hover:bg-purple-100' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300 group-hover:bg-orange-100'}`}>
            <span className="material-icons text-base">{item.type === 'service' ? 'spa' : 'inventory_2'}</span>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="font-bold text-[11px] text-gray-800 dark:text-gray-200 truncate leading-tight group-hover:text-primary transition-colors">{item.title}</p>
            <div className="flex items-center gap-1.5">
                <p className="text-[9px] text-gray-400 capitalize truncate max-w-[80px]">{item.category || item.type}</p>
                {item.type === 'product' && (
                    <span className={`text-[8px] px-1 rounded font-bold leading-none py-0.5 ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {isOutOfStock ? 'Sin Stock' : `${available} Disp.`}
                    </span>
                )}
            </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0 pl-1 border-l border-gray-100 dark:border-gray-700/50">
            <span className="font-mono font-bold text-xs text-gray-900 dark:text-white block">${item.price}</span>
        </div>
    </button>
)});

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ isOpen, onClose, preselectedClient, lockClient = false }) => {
    const { clients, catalog, createManualInvoice, appointments, addAppointment, invoices, addClient, addToast } = useData();
    const [mode, setMode] = useState<'new' | 'link' | 'quote'>('new');
    
    // UI States
    const [clientSearch, setClientSearch] = useState('');
    const [catalogFilter, setCatalogFilter] = useState('');
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);
    const [showTimeOptions, setShowTimeOptions] = useState(false);
    
    // New Client Inline State
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientData, setNewClientData] = useState({ name: '', email: '', phone: '' });

    // Calendar View State (Independent of selected date)
    const [viewDate, setViewDate] = useState(new Date());

    // Initial State Factory
    const getInitialTabState = (): TabState => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const initialTime = TIME_SLOTS.find(slot => parseTimeSlot(slot) > currentMinutes) || TIME_SLOTS[0];
        
        return {
            client: preselectedClient || null, // Inicializar con preseleccionado
            items: [],
            date: now.toLocaleDateString('en-CA'),
            time: initialTime,
            specialist: 'Elena G.',
            linkApptId: '',
            foundAppt: null,
            linkError: '',
            discountType: 'percent',
            discountValue: 0
        };
    };

    // State Container
    const [formStates, setFormStates] = useState({
        new: getInitialTabState(),
        link: getInitialTabState(),
        quote: getInitialTabState()
    });

    // Reset on Open or when preselectedClient changes
    useEffect(() => {
        if (isOpen) {
            setMode('new');
            const initialState = getInitialTabState();
            setFormStates({
                new: initialState,
                link: initialState,
                quote: initialState
            });
            setClientSearch('');
            setCatalogFilter('');
            setViewDate(new Date());
            setShowTimeOptions(false);
            setIsCreatingClient(false);
            setNewClientData({ name: '', email: '', phone: '' });
        }
    }, [isOpen, preselectedClient]); // Re-run if preselectedClient changes

    // Helpers
    const updateForm = useCallback((updates: Partial<TabState>) => {
        setFormStates(prev => ({
            ...prev,
            [mode]: { ...prev[mode], ...updates }
        }));
    }, [mode]);
    
    const currentForm = formStates[mode];

    // --- Computed Values ---
    const filteredClients = useMemo(() => clientSearch.trim() === '' 
        ? [] 
        : clients.filter(c => 
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
            c.id.toLowerCase().includes(clientSearch.toLowerCase())
          ).slice(0, 5), [clients, clientSearch]);
    
    const topLists = useMemo(() => {
        const counts: Record<string, number> = {};
        invoices.forEach(inv => {
            if (inv.status === 'Anulada') return;
            (inv.items || []).forEach(item => { counts[String(item.id)] || 0 + (item.quantity || 1); });
        });
        const rankedCatalog: RankedItem[] = catalog.map(item => ({ ...item, _usageCount: counts[String(item.id)] || 0 }));
        return { 
            services: rankedCatalog.filter(i => i.type === 'service').sort((a, b) => (b._usageCount || 0) - (a._usageCount || 0)).slice(0, 4),
            products: rankedCatalog.filter(i => i.type === 'product').sort((a, b) => (b._usageCount || 0) - (a._usageCount || 0)).slice(0, 4)
        };
    }, [catalog, invoices]);

    // ... (Keep existing linkedContent, searchResults, totals logic) ...
    const linkedContent = useMemo(() => {
        if (!currentForm.foundAppt) return { items: [], total: 0, count: 0 };
        const relevantInvoices = invoices.filter(inv => 
            inv.appointmentId === currentForm.foundAppt?.id && 
            inv.status !== 'Anulada'
        );
        if (relevantInvoices.length === 0) {
             return {
                 items: (currentForm.foundAppt.items || []).map(i => ({...i, _sourceInvoice: 'Reserva Original'})),
                 total: currentForm.foundAppt.total,
                 count: (currentForm.foundAppt.items || []).length
             };
        }
        const aggregatedItems: any[] = [];
        let total = 0;
        relevantInvoices.forEach(inv => {
            total += inv.amount;
            (inv.items || []).forEach(item => {
                aggregatedItems.push({ ...item, _sourceInvoice: inv.idDisplay });
            });
        });
        return { items: aggregatedItems, total: total, count: aggregatedItems.length };
    }, [currentForm.foundAppt, invoices]);

    const searchResults = useMemo(() => {
        const term = catalogFilter.trim().toLowerCase();
        if (!term) return null;
        return catalog.filter(i => i.title.toLowerCase().includes(term) || (i.sku && i.sku.toLowerCase().includes(term)) || (i.category && i.category.toLowerCase().includes(term)));
    }, [catalog, catalogFilter]);

    const subTotalAmount = useMemo(() => currentForm.items.reduce((acc, i) => acc + (i.price * (i.quantity || 1)), 0), [currentForm.items]);
    const discountAmount = useMemo(() => {
        if (currentForm.discountValue <= 0) return 0;
        if (currentForm.discountType === 'percent') {
            return subTotalAmount * (currentForm.discountValue / 100);
        } else {
            return Math.min(subTotalAmount, currentForm.discountValue);
        }
    }, [subTotalAmount, currentForm.discountValue, currentForm.discountType]);
    const totalAmount = subTotalAmount - discountAmount;

    // ... (Keep existing Calendar/Time Logic) ...
    const availableTimeSlots = useMemo(() => {
        const selectedDateStr = currentForm.date;
        if (!selectedDateStr) return TIME_SLOTS;
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayFormatted = `${year}-${month}-${day}`;
        if (selectedDateStr === todayFormatted) {
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            return TIME_SLOTS.filter(slot => parseTimeSlot(slot) > currentMinutes);
        }
        return TIME_SLOTS;
    }, [currentForm.date]);

    useEffect(() => {
        if (availableTimeSlots.length > 0) {
            if (!currentForm.time || !availableTimeSlots.includes(currentForm.time)) {
                updateForm({ time: availableTimeSlots[0] });
            }
        }
    }, [availableTimeSlots, updateForm, currentForm.time]);

    const getTheme = () => {
        switch(mode) {
            case 'quote': return { bg: 'bg-indigo-600', lightBg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', icon: 'description', label: 'Cotización', desc: 'Presupuesto sin reserva.' };
            case 'link': return { bg: 'bg-blue-600', lightBg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: 'link', label: 'Vincular', desc: 'Facturar cita existente.' };
            default: return { bg: 'bg-emerald-600', lightBg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: 'shopping_cart', label: 'Venta', desc: 'Crea cita y factura.' };
        }
    };
    const theme = getTheme();

    // ... (Keep Handlers) ...
    const handleAddClient = (c: Client) => { updateForm({ client: c }); setClientSearch(''); setShowClientSuggestions(false); };
    const handleCreateClient = () => { /* ...existing logic... */ 
        if (!newClientData.name) { addToast('error', 'El nombre es obligatorio.'); return; }
        const newId = addClient({
            name: newClientData.name,
            email: newClientData.email || 'Sin email',
            phone: newClientData.phone || '',
            avatar: null,
            initials: newClientData.name.substring(0, 2).toUpperCase(),
            status: 'New',
            lastVisit: '-',
            totalSpent: 0
        });
        const newClientObj: Client = { id: newId, name: newClientData.name, email: newClientData.email || 'Sin email', phone: newClientData.phone || '', avatar: null, initials: newClientData.name.substring(0, 2).toUpperCase(), status: 'New', lastVisit: '-', totalSpent: 0, tags: [] };
        updateForm({ client: newClientObj });
        setIsCreatingClient(false);
        setNewClientData({ name: '', email: '', phone: '' });
        addToast('success', 'Cliente creado y seleccionado.');
    };

    const handleAddItem = useCallback((item: AppointmentItem) => {
        if (item.type === 'product') {
            const available = (item.stock || 0) - (item.reserved || 0);
            if (available <= 0) { addToast('error', `No hay stock disponible para ${item.title}`); return; }
        }
        setFormStates(prev => {
            const currentItems = prev[mode].items;
            const existingIdx = currentItems.findIndex(i => i.id === item.id);
            let newItems;
            if (existingIdx >= 0) {
                if (item.type === 'product') {
                    const currentQty = currentItems[existingIdx].quantity || 1;
                    const available = (item.stock || 0) - (item.reserved || 0);
                    if (currentQty + 1 > available) { addToast('error', 'Cantidad excede disponibilidad.'); return prev; }
                }
                newItems = [...currentItems];
                newItems[existingIdx] = { ...newItems[existingIdx], quantity: (newItems[existingIdx].quantity || 1) + 1 };
            } else {
                const { ...cleanItem } = item as any;
                delete cleanItem._usageCount; 
                newItems = [...currentItems, { ...cleanItem, quantity: 1 }];
            }
            return { ...prev, [mode]: { ...prev[mode], items: newItems } };
        });
    }, [mode, addToast]);

    const handleRemoveItem = (idx: number) => { const newItems = [...currentForm.items]; newItems.splice(idx, 1); updateForm({ items: newItems }); };
    const handleUpdateQuantity = (idx: number, delta: number) => { /* ...existing logic... */
        const newItems = [...currentForm.items];
        const item = newItems[idx];
        const newQty = (item.quantity || 1) + delta;
        if (newQty <= 0) { newItems.splice(idx, 1); } 
        else {
            if (item.type === 'product' && delta > 0) {
                const catalogItem = catalog.find(c => c.id === item.id);
                if (catalogItem) {
                    const available = (catalogItem.stock || 0) - (catalogItem.reserved || 0);
                    if (newQty > available) { addToast('error', `Solo hay ${available} disponibles.`); return; }
                }
            }
            newItems[idx] = { ...item, quantity: newQty };
        }
        updateForm({ items: newItems });
    };

    const handleCheckAppt = () => { /* ...existing logic... */ 
        updateForm({ linkError: '' });
        const appt = appointments.find(a => a.id === currentForm.linkApptId);
        if (!appt) { updateForm({ linkError: 'Cita no encontrada', foundAppt: null }); return; }
        if (appt.status !== 'Confirmed' && appt.status !== 'In Progress') { updateForm({ linkError: `Estado inválido: ${appt.status === 'Pending' ? 'Por Confirmar' : 'Finalizada/Cancelada'}`, foundAppt: null }); return; }
        updateForm({ foundAppt: appt, client: clients.find(c => c.id === appt.clientId) || null, items: [] });
    };

    const handleSubmit = () => {
        const { client, items, date, time, specialist, foundAppt } = currentForm;
        
        // --- FECHAS ---
        // 1. Fecha de Emisión (Factura): Siempre HOY
        const now = new Date();
        const invoiceDate = now.toLocaleDateString('en-CA');
        const invoiceTime = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

        // 2. Fecha de Servicio (Cita): Viene del formulario (date, time)

        if (mode === 'new' || mode === 'quote') {
            if (!client || items.length === 0) return;
            if (mode === 'new') {
                const newApptId = addAppointment({
                    clientId: client.id, 
                    clientName: client.name, 
                    client: client.name,
                    clientAvatar: client.avatar, 
                    avatar: null,
                    service: items.length > 0 ? items[0].title : 'Venta Directa',
                    items: items, 
                    date: date, // Fecha Servicio
                    time: time, // Hora Servicio
                    specialistName: specialist, 
                    total: totalAmount, 
                    status: 'Confirmed', 
                    notes: 'Venta Directa (POS)'
                });
                
                createManualInvoice({ 
                    clientId: client.id, 
                    clientName: client.name, 
                    items: items, 
                    date: invoiceDate, // Fecha Emisión
                    time: invoiceTime, // Hora Emisión
                    status: 'Pendiente', 
                    existingAppointmentId: newApptId 
                });
            } else {
                createManualInvoice({ 
                    clientId: client.id, 
                    clientName: client.name, 
                    items: items, 
                    date: invoiceDate, 
                    time: invoiceTime, 
                    status: 'Cotización', 
                    amount: totalAmount, 
                    discount: currentForm.discountValue > 0 ? { type: currentForm.discountType, value: currentForm.discountValue } : undefined
                });
            }
        } else {
            if (!foundAppt) return;
            createManualInvoice({ 
                existingAppointmentId: foundAppt.id, 
                clientId: foundAppt.clientId, 
                clientName: foundAppt.clientName, 
                items: items, 
                date: invoiceDate,
                time: invoiceTime,
                status: 'Pendiente' 
            });
        }
        onClose();
    };

    // Calendar render helpers
    const changeMonth = (offset: number) => { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1)); };
    const handleDateSelect = (day: number) => { 
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(newDate.getDate()).padStart(2, '0');
        updateForm({ date: `${year}-${month}-${dayStr}` });
    };
    const renderCalendar = () => { /* ...existing logic... */ 
        const year = viewDate.getFullYear(); const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month); const firstDay = getFirstDayOfMonth(year, month);
        const days = []; const today = new Date(); today.setHours(0, 0, 0, 0); const [selY, selM, selD] = currentForm.date.split('-').map(Number);
        for (let i = 0; i < firstDay; i++) { days.push(<div key={`empty-${i}`} className="h-6 w-6"></div>); }
        for (let i = 1; i <= daysInMonth; i++) {
            const dateToCheck = new Date(year, month, i); const isPast = dateToCheck < today; const isSelected = selD === i && selM === month + 1 && selY === year;
            days.push(<button key={i} disabled={isPast} onClick={() => !isPast && handleDateSelect(i)} className={`h-6 w-6 flex items-center justify-center rounded-full text-[10px] font-bold transition-all ${isSelected ? 'bg-primary text-white shadow-md scale-110' : isPast ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-white/5' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-primary'}`}>{i}</button>);
        }
        return days;
    };
    const getFormattedPreviewDate = () => { const [y, m, d] = currentForm.date.split('-').map(Number); const previewDate = new Date(y, m - 1, d); return previewDate.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: '2-digit'}); };
    const getStepNumber = (stepName: 'client' | 'date' | 'catalog' | 'discount') => { /* ...existing logic... */ 
        if (mode === 'link') { if (stepName === 'client') return 1; if (stepName === 'catalog') return 2; } 
        else if (mode === 'quote') { if (stepName === 'client') return 1; if (stepName === 'discount') return 2; if (stepName === 'catalog') return 3; } 
        else { if (stepName === 'client') return 1; if (stepName === 'date') return 2; if (stepName === 'catalog') return 3; }
        return 0;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#F8F9FA] dark:bg-surface-dark rounded-3xl shadow-2xl w-full max-w-6xl border border-gray-200 dark:border-gray-700 flex flex-col h-[90vh] md:h-[800px] overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* --- HEADER --- */}
                <div className="bg-white dark:bg-black/20 border-b border-gray-100 dark:border-gray-800 p-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="hidden md:block">
                        <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className={`material-icons ${theme.text}`}>{theme.icon}</span> 
                            {theme.label}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{theme.desc}</p>
                    </div>
                    
                    <div className="flex p-1.5 bg-gray-100 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-gray-700/50 w-full md:w-auto shadow-inner">
                        {(['new', 'link', 'quote'] as const).map((m) => {
                            const isActive = mode === m;
                            let activeClass = '';
                            let icon = '';
                            let label = '';
                            
                            if (m === 'new') { activeClass = 'bg-white dark:bg-surface-dark text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5'; icon = 'shopping_cart'; label = 'Venta'; } 
                            else if (m === 'link') { activeClass = 'bg-white dark:bg-surface-dark text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5'; icon = 'link'; label = 'Vincular'; } 
                            else { activeClass = 'bg-white dark:bg-surface-dark text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5'; icon = 'description'; label = 'Cotizar'; }

                            return (
                                <button key={m} onClick={() => setMode(m)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 ${isActive ? activeClass : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/5'}`}>
                                    <span className="material-icons text-[18px]">{icon}</span>
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <button onClick={onClose} className="hidden md:flex w-8 h-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"><span className="material-icons">close</span></button>
                </div>

                {/* --- BODY --- */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* LEFT COL */}
                    <div className="w-full md:w-6/12 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black/10 h-full overflow-hidden p-8 gap-6">
                        
                        {/* CONFIGURATION SECTION */}
                        <div className="shrink-0 space-y-5">
                            {mode === 'link' ? (
                                <div className="space-y-4">
                                    {/* ... Link content ... */}
                                    <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">{getStepNumber('client')}</span><h3 className="text-sm font-bold text-gray-900 dark:text-white">Identificar Cita</h3></div>
                                    <div className="space-y-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <label className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2"><span className="material-icons text-sm">link</span> ID de Cita Existente</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={currentForm.linkApptId} onChange={e => updateForm({ linkApptId: e.target.value })} className="flex-1 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-700 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: APT-1234"/>
                                            <button onClick={handleCheckAppt} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md">Buscar</button>
                                        </div>
                                        {currentForm.linkError && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><span className="material-icons text-xs">error</span> {currentForm.linkError}</p>}
                                        {currentForm.foundAppt && (<div className="mt-2 p-3 bg-white dark:bg-black/20 rounded-lg flex justify-between items-center animate-in fade-in"><div><p className="font-bold text-sm text-gray-900 dark:text-white">{currentForm.foundAppt.clientName}</p><p className="text-xs text-gray-500">{currentForm.foundAppt.date} | {currentForm.foundAppt.time}</p></div><span className="text-green-600 material-icons text-sm">check_circle</span></div>)}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Client Input */}
                                    <div className="relative z-30 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">{getStepNumber('client')}</span>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cliente</h3>
                                        </div>
                                        {currentForm.client ? (
                                            <div className={`flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700 group ${lockClient ? 'border-primary/20 bg-primary/5' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{currentForm.client.initials}</div>
                                                    <div><p className="text-sm font-bold text-gray-900 dark:text-white">{currentForm.client.name}</p><p className="text-[10px] text-gray-500">{currentForm.client.email}</p></div>
                                                </div>
                                                {!lockClient && (
                                                    <button onClick={() => updateForm({ client: null })} className="text-gray-400 hover:text-red-500 p-1"><span className="material-icons text-sm">close</span></button>
                                                )}
                                                {lockClient && (
                                                    <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded font-bold">LOCKED</span>
                                                )}
                                            </div>
                                        ) : isCreatingClient ? (
                                            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nuevo Cliente</span>
                                                    <button onClick={() => setIsCreatingClient(false)} className="text-gray-400 hover:text-gray-600"><span className="material-icons text-sm">close</span></button>
                                                </div>
                                                <input 
                                                    autoFocus
                                                    className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg text-xs outline-none focus:border-primary transition-colors"
                                                    placeholder="Nombre Completo *"
                                                    value={newClientData.name}
                                                    onChange={e => setNewClientData({...newClientData, name: e.target.value})}
                                                />
                                                <div className="flex gap-2">
                                                    <input 
                                                        className="w-1/2 px-3 py-1.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg text-xs outline-none focus:border-primary transition-colors"
                                                        placeholder="Email"
                                                        value={newClientData.email}
                                                        onChange={e => setNewClientData({...newClientData, email: e.target.value})}
                                                    />
                                                    <input 
                                                        className="w-1/2 px-3 py-1.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg text-xs outline-none focus:border-primary transition-colors"
                                                        placeholder="Teléfono"
                                                        value={newClientData.phone}
                                                        onChange={e => setNewClientData({...newClientData, phone: e.target.value})}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={handleCreateClient}
                                                    disabled={!newClientData.name}
                                                    className="w-full py-1.5 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Guardar y Seleccionar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-lg">search</span>
                                                    <input type="text" value={clientSearch} onChange={e => { setClientSearch(e.target.value); setShowClientSuggestions(true); }} onFocus={() => setShowClientSuggestions(true)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Buscar cliente..." />
                                                    {showClientSuggestions && clientSearch && (<div className="absolute top-full left-0 w-full bg-white dark:bg-surface-dark shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl mt-1 max-h-60 overflow-y-auto z-50">{filteredClients.map(c => (<div key={c.id} onClick={() => handleAddClient(c)} className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 last:border-0"><div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">{c.initials}</div><div><p className="text-sm font-bold text-gray-800 dark:text-white">{c.name}</p><p className="text-[10px] text-gray-500">{c.email}</p></div></div>))}</div>)}
                                                </div>
                                                <button onClick={() => setIsCreatingClient(true)} className="w-10 h-10 shrink-0 flex items-center justify-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-primary hover:border-primary transition-colors shadow-sm" title="Crear nuevo cliente"><span className="material-icons text-xl">person_add</span></button>
                                            </div>
                                        )}
                                    </div>

                                    {/* CALENDAR & TIME WIDGET - HIDDEN IN QUOTE MODE */}
                                    {mode !== 'quote' && (
                                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-3 shadow-sm flex flex-col gap-3">
                                            {/* ... Calendar content ... */}
                                            <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 flex items-center justify-center text-xs font-bold">{getStepNumber('date')}</span><h3 className="text-sm font-bold text-gray-900 dark:text-white">Fecha y Hora</h3></div>
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold uppercase text-gray-500">{viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span><div className="flex gap-1"><button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500"><span className="material-icons text-sm block">chevron_left</span></button><button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500"><span className="material-icons text-sm block">chevron_right</span></button></div></div>
                                                    <div className="grid grid-cols-7 gap-1 text-center mb-1">{['D','L','M','M','J','V','S'].map(d => <span key={d} className="text-[9px] font-bold text-gray-400">{d}</span>)}</div>
                                                    <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                                                </div>
                                                <div className="w-full md:w-40 flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">HORA INICIO</label>
                                                        <div className="relative group/time">
                                                            <input type="text" value={currentForm.time} onChange={e => updateForm({ time: e.target.value })} disabled={availableTimeSlots.length === 0} className={`w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-3 pr-10 text-xs font-bold text-gray-800 dark:text-white outline-none focus:border-primary transition-colors ${availableTimeSlots.length === 0 ? 'text-gray-400 cursor-not-allowed' : ''}`} placeholder="00:00 AM" />
                                                            <button type="button" onClick={() => availableTimeSlots.length > 0 && setShowTimeOptions(!showTimeOptions)} className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all flex items-center justify-center outline-none ${showTimeOptions ? 'text-primary bg-primary/20 ring-2 ring-primary/30 shadow-inner' : availableTimeSlots.length > 0 ? 'text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30' : 'text-gray-300 dark:text-gray-600'} ${availableTimeSlots.length === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer shadow-sm hover:scale-105 active:scale-95'}`} title="Ver horarios disponibles"><span className="material-icons text-lg">schedule</span></button>
                                                            {showTimeOptions && (<div className="absolute top-full right-0 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 custom-scrollbar animate-in fade-in zoom-in-95 duration-150">{availableTimeSlots.map(t => (<button key={t} type="button" onClick={() => { updateForm({ time: t }); setShowTimeOptions(false); }} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-primary/5 hover:text-primary dark:hover:bg-white/10 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">{t}</button>))}</div>)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">ESPECIALISTA</label>
                                                        <div className="relative">
                                                            <select value={currentForm.specialist} onChange={e => updateForm({ specialist: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-2 pr-6 text-xs font-bold text-gray-800 dark:text-white outline-none focus:border-primary appearance-none cursor-pointer">{SPECIALISTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                                                            <span className="material-icons text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-sm pointer-events-none">expand_more</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* DISCOUNTS WIDGET (Paso 2 - Cotización) */}
                        {mode === 'quote' && (
                            <div className="shrink-0 animate-in fade-in slide-in-from-top-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">{getStepNumber('discount')}</span>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Descuentos y Ajustes</h3>
                                    </div>
                                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">Opcional</span>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    {/* Control Segmentado (Toggle % vs $) */}
                                    <div className="flex bg-gray-100 dark:bg-black/40 p-1 rounded-xl w-full sm:w-auto shrink-0 relative h-10 border border-gray-200 dark:border-gray-700 shadow-inner">
                                        <button 
                                            onClick={() => updateForm({ discountType: 'percent' })}
                                            className={`relative z-10 flex-1 sm:w-14 flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 ${currentForm.discountType === 'percent' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            %
                                        </button>
                                        <button 
                                            onClick={() => updateForm({ discountType: 'fixed' })}
                                            className={`relative z-10 flex-1 sm:w-14 flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 ${currentForm.discountType === 'fixed' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            $
                                        </button>
                                    </div>

                                    {/* Input Numérico con Sufijo */}
                                    <div className="relative flex-1 w-full group">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={currentForm.discountValue || ''}
                                            onChange={e => updateForm({ discountValue: parseFloat(e.target.value) || 0 })}
                                            className="w-full h-10 pl-4 pr-16 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-300"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none pl-3 border-l border-gray-200 dark:border-gray-700 h-5">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">
                                                {currentForm.discountType === 'percent' ? '% OFF' : 'USD'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p className="hidden xl:block text-[10px] text-gray-400 max-w-[100px] leading-tight">Ajuste global sobre el total.</p>
                                </div>
                            </div>
                        )}

                        {/* VISUAL CATALOG */}
                        <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="px-5 py-3 shrink-0">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold">{getStepNumber('catalog')}</span>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Catálogo</h3>
                                    </div>
                                    <span className="text-[9px] font-bold bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-full text-gray-400 border border-gray-200 dark:border-gray-700">{searchResults ? searchResults.length : catalog.length}</span>
                                </div>
                                <div className="relative group">
                                    <span className="material-icons absolute left-2.5 top-2 text-gray-400 text-base group-focus-within:text-primary transition-colors">filter_list</span>
                                    <input type="text" value={catalogFilter} onChange={e => setCatalogFilter(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all" placeholder="Filtrar..."/>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 pb-4 pt-0 custom-scrollbar">
                                {searchResults ? (
                                    searchResults.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-gray-400 italic text-xs"><span className="material-icons text-2xl mb-1 opacity-50">search_off</span>No se encontraron items.</div> : <div className="grid grid-cols-2 gap-2">{searchResults.map(item => <ItemCard key={item.id} item={item} onAdd={handleAddItem} />)}</div>
                                ) : (
                                    <div className="space-y-4">
                                        {topLists.services.length > 0 && (<div><h4 className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><span className="material-icons text-[10px]">spa</span> Servicios Frecuentes</h4><div className="grid grid-cols-2 gap-2">{topLists.services.map(item => <ItemCard key={item.id} item={item} onAdd={handleAddItem} />)}</div></div>)}
                                        {topLists.products.length > 0 && (<div><h4 className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><span className="material-icons text-[10px]">shopping_bag</span> Productos Top</h4><div className="grid grid-cols-2 gap-2">{topLists.products.map(item => <ItemCard key={item.id} item={item} onAdd={handleAddItem} />)}</div></div>)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Compact Previous Content Footer (Link Mode Only) */}
                        {mode === 'link' && currentForm.foundAppt && linkedContent.count > 0 && (
                            <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2">
                                <details className="group bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                    <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors select-none">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                <span className="material-icons text-xs">inventory_2</span>
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Historial Facturado ({linkedContent.count})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">${linkedContent.total.toFixed(2)}</span>
                                            <span className="material-icons text-gray-400 text-sm transform group-open:rotate-180 transition-transform">expand_more</span>
                                        </div>
                                    </summary>
                                    <div className="px-3 pb-3 pt-0 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-black/10">
                                        <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                            {linkedContent.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-[10px] p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors group/item">
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.type === 'service' ? 'bg-purple-400' : 'bg-orange-400'}`}></span>
                                                            <span className="text-gray-600 dark:text-gray-400 truncate font-medium">{item.title}</span>
                                                        </div>
                                                        {item._sourceInvoice && (
                                                            <span className="text-[8px] text-gray-400 ml-3.5 opacity-75">{item._sourceInvoice}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-gray-500 font-mono whitespace-nowrap ml-2">x{item.quantity || 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COL: RECEIPT PREVIEW */}
                    <div className="w-full md:w-6/12 bg-gray-100 dark:bg-black/40 flex flex-col items-center p-10 relative overflow-hidden">
                        {/* ... (Keep existing Receipt Preview) ... */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

                        <div className="w-full max-w-[380px] bg-white dark:bg-surface-dark shadow-2xl rounded-sm overflow-hidden flex flex-col flex-1 min-h-0 animate-in slide-in-from-right-4 duration-500 relative">
                            <div className="h-2 w-full bg-primary"></div>
                            <div className="p-8 pb-4 text-center">
                                <h3 className="font-display font-bold text-2xl text-gray-900 dark:text-white tracking-widest uppercase">DERMIBELLE STUDIO</h3>
                                <p className="text-[10px] text-gray-500 font-medium tracking-widest mt-1 uppercase">Beauty & Wellness Center</p>
                                <div className="text-[9px] text-gray-400 mt-2">123 Beauty Lane, Port Charlotte, FL • (941) 555-0123</div>
                            </div>
                            <div className="px-8 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                                <div className="text-left"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">FECHA</p><p className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{getFormattedPreviewDate()}</p></div>
                                <div className="text-right"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">HORA</p><p className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{currentForm.time}</p></div>
                            </div>
                            <div className="px-8 pt-6">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">FACTURAR A:</p>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div><p className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">{currentForm.client ? currentForm.client.name : 'Cliente General'}</p><p className="text-[10px] text-gray-500 truncate max-w-[180px]">{currentForm.client ? currentForm.client.email : 'Sin registro'}</p></div>
                                    {currentForm.client && (<div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">{currentForm.client.initials}</div>)}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                                <table className="w-full">
                                    <thead><tr className="border-b border-dashed border-gray-200 dark:border-gray-700"><th className="text-[9px] font-bold text-gray-400 uppercase tracking-wider py-2 text-left">Cant.</th><th className="text-[9px] font-bold text-gray-400 uppercase tracking-wider py-2 text-left pl-2">Descripción</th><th className="text-[9px] font-bold text-gray-400 uppercase tracking-wider py-2 text-right">Importe</th></tr></thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                        {currentForm.items.length === 0 ? (<tr><td colSpan={3} className="py-8 text-center text-xs text-gray-400 italic">— Sin items agregados —</td></tr>) : (currentForm.items.map((item, idx) => (
                                            <tr key={idx} className="group relative">
                                                <td className="py-3 text-center align-top w-12">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 w-4 text-center">{item.quantity}</span>
                                                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleUpdateQuantity(idx, 1)} className="w-4 h-3 flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-t text-[8px] leading-none">▲</button>
                                                            <button onClick={() => handleUpdateQuantity(idx, -1)} className="w-4 h-3 flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-b text-[8px] leading-none">▼</button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 pl-2 align-top"><p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{item.title}</p><p className="text-[10px] text-gray-500 font-mono mt-0.5">${item.price.toFixed(2)} c/u</p></td>
                                                <td className="py-3 text-right align-top relative"><span className="font-mono text-sm font-bold text-gray-900 dark:text-white">${((item.quantity || 1) * item.price).toFixed(2)}</span><button onClick={() => handleRemoveItem(idx)} className="absolute -right-4 top-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-icons text-sm">close</span></button></td>
                                            </tr>
                                        )))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-8 pb-8 pt-4 bg-gray-50/30 dark:bg-black/10 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center text-xs text-gray-500 mb-1"><span>SUBTOTAL</span><span className="font-mono">${subTotalAmount.toFixed(2)}</span></div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between items-center text-xs text-green-600 dark:text-green-400 mb-1 font-bold">
                                        <span>DESCUENTO ({currentForm.discountType === 'percent' ? `${currentForm.discountValue}%` : 'FIJO'})</span>
                                        <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-xs text-gray-500 mb-4"><span>IMPUESTOS (0%)</span><span className="font-mono">$0.00</span></div>
                                <div className="flex justify-between items-end border-t border-gray-200 dark:border-gray-700 pt-3 mb-6"><span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">TOTAL</span><span className="text-3xl font-display font-bold text-gray-900 dark:text-white">${totalAmount.toFixed(2)}</span></div>
                                <div className="text-center opacity-60"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">GRACIAS POR SU PREFERENCIA</p><div className="h-8 w-2/3 mx-auto bg-current opacity-20 flex justify-between px-1">{[...Array(20)].map((_, i) => <div key={i} className="w-[1px] h-full bg-white"></div>)}</div></div>
                            </div>
                        </div>

                        <div className="w-full max-w-[380px] mt-6 flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">CANCELAR</button>
                            <button onClick={handleSubmit} disabled={totalAmount <= 0 || (!currentForm.client && mode !== 'link') || (mode === 'link' && !currentForm.foundAppt)} className={`flex-[2] py-3 rounded-xl text-white text-xs font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${theme.bg} hover:brightness-110`}><span className="material-icons text-sm">print</span> {mode === 'quote' ? 'GUARDAR COTIZACIÓN' : 'CONFIRMAR & EMITIR'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateInvoiceModal;