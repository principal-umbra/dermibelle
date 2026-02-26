
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData, Client, AppointmentItem, Appointment } from '../context/DataContext';

export interface TabState {
    client: Client | null;
    items: AppointmentItem[];
    date: string;
    time: string;
    specialist: string;
    linkApptId: string;
    foundAppt: Appointment | null;
    linkError: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
}

// Helpers
export const TIME_SLOTS = [
    '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM',
    '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM'
];

export const SPECIALISTS = ['Elena G.', 'Sarah C.', 'Jessica T.', 'Sin Asignar'];

export const checkItemAvailability = (item: AppointmentItem, catalog: AppointmentItem[]) => {
    if (item.type === 'product') {
        const available = (item.stock || 0) - (item.reserved || 0);
        return available > 0;
    } else if (item.type === 'service' && item.recipe) {
        return item.recipe.every(ingredient => {
            const product = catalog.find(p => p.id === ingredient.id);
            return product ? ((product.stock || 0) > 0) : true; 
        });
    }
    return true; 
};

const parseTimeSlot = (timeStr: string) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    if (!time || !modifier) return 0;
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;
    if (modifier === 'AM' && hours === 0) hours = 24;
    return hours * 60 + minutes;
};

export const useCreateAppointment = (isOpen: boolean, onClose: () => void, preselectedClient?: Client) => {
    const { clients, catalog, createManualInvoice, appointments, addAppointment, invoices, addClient, addToast, openStock } = useData();
    const [mode, setMode] = useState<'new' | 'link' | 'quote'>('new');
    
    // UI States
    const [clientSearch, setClientSearch] = useState('');
    const [catalogFilter, setCatalogFilter] = useState('');
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);
    
    // Calendar View
    const [viewDate, setViewDate] = useState(new Date());

    const getInitialTabState = (): TabState => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const initialTime = TIME_SLOTS.find(slot => parseTimeSlot(slot) > currentMinutes) || TIME_SLOTS[0];
        
        return {
            client: preselectedClient || null,
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

    const [formStates, setFormStates] = useState({
        new: getInitialTabState(),
        link: getInitialTabState(),
        quote: getInitialTabState()
    });

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
            setShowClientSuggestions(false);
        }
    }, [isOpen, preselectedClient]);

    const updateForm = useCallback((updates: Partial<TabState>) => {
        setFormStates(prev => ({
            ...prev,
            [mode]: { ...prev[mode], ...updates }
        }));
    }, [mode]);
    
    const currentForm = formStates[mode];

    // --- Computed ---
    const filteredClients = useMemo(() => clientSearch.trim() === '' 
        ? [] 
        : clients.filter(c => 
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
            c.id.toLowerCase().includes(clientSearch.toLowerCase())
          ).slice(0, 5), [clients, clientSearch]);

    const searchResults = useMemo(() => {
        const term = catalogFilter.trim().toLowerCase();
        if (!term) return null;
        return catalog.filter(i => 
            (i.subtype !== 'consumable') && 
            (i.title.toLowerCase().includes(term) || (i.sku && i.sku.toLowerCase().includes(term)) || (i.category && i.category.toLowerCase().includes(term)))
        );
    }, [catalog, catalogFilter]);

    const topLists = useMemo(() => {
        const counts: Record<string, number> = {};
        invoices.forEach(inv => {
            if (inv.status === 'Anulada') return;
            (inv.items || []).forEach(item => { counts[String(item.id)] || 0 + (item.quantity || 1); });
        });
        // eslint-disable-next-line
        const rankedCatalog: any[] = catalog.map(item => ({ ...item, _usageCount: counts[String(item.id)] || 0 }));
        return { 
            services: rankedCatalog.filter(i => i.type === 'service').sort((a, b) => b._usageCount - a._usageCount).slice(0, 4),
            products: rankedCatalog.filter(i => i.type === 'product' && i.subtype !== 'consumable').sort((a, b) => b._usageCount - a._usageCount).slice(0, 4)
        };
    }, [catalog, invoices]);

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

    const hasStockIssues = useMemo(() => {
        return currentForm.items.some(i => !checkItemAvailability(i, catalog));
    }, [currentForm.items, catalog]);

    // --- Handlers ---

    const handleAddItem = useCallback((item: AppointmentItem) => {
        setFormStates(prev => {
            const currentItems = prev[mode].items;
            // Check for existing item with same ID AND same sale unit (pack vs unit)
            // Default saleUnit to 'pack' if undefined for comparison
            const targetSaleUnit = item.saleUnit || 'pack';
            const existingIdx = currentItems.findIndex(i => i.id === item.id && (i.saleUnit || 'pack') === targetSaleUnit);
            
            let newItems;
            if (existingIdx >= 0) {
                newItems = [...currentItems];
                newItems[existingIdx] = { 
                    ...newItems[existingIdx], 
                    quantity: (newItems[existingIdx].quantity || 1) + 1 
                };
            } else {
                // eslint-disable-next-line
                const { _usageCount, ...cleanItem } = item as any;
                // Ensure saleUnit defaults to 'pack' if undefined for consistency
                newItems = [...currentItems, { 
                    ...cleanItem, 
                    quantity: 1,
                    saleUnit: targetSaleUnit 
                }];
            }
            return { ...prev, [mode]: { ...prev[mode], items: newItems } };
        });
    }, [mode]);

    const handleRemoveItem = (idx: number) => { 
        const newItems = [...currentForm.items]; 
        newItems.splice(idx, 1); 
        updateForm({ items: newItems }); 
    };

    const handleUpdateQuantity = (idx: number, delta: number) => {
        const newItems = [...currentForm.items];
        const item = newItems[idx];
        const newQty = (item.quantity || 1) + delta;
        if (newQty <= 0) { newItems.splice(idx, 1); } 
        else { newItems[idx] = { ...item, quantity: newQty }; }
        updateForm({ items: newItems });
    };

    const handleToggleUnit = useCallback((idx: number) => {
        setFormStates(prev => {
            const currentItems = [...prev[mode].items];
            const item = currentItems[idx];
            const catalogItem = catalog.find(c => c.id === item.id);

            if (!catalogItem || !catalogItem.allowFractionalSale) return prev;

            const isCurrentlyPack = !item.saleUnit || item.saleUnit === 'pack';
            const newUnit = isCurrentlyPack ? 'unit' : 'pack';
            const newPrice = newUnit === 'unit' ? (catalogItem.fractionalPrice || 0) : catalogItem.price;
            const newTitle = newUnit === 'unit' ? `${catalogItem.title} (Unidad)` : catalogItem.title;

            // Check if we can merge with an existing item of the target unit
            const existingIdx = currentItems.findIndex((i, iIdx) => iIdx !== idx && i.id === item.id && (i.saleUnit || 'pack') === newUnit);

            if (existingIdx >= 0) {
                // Merge
                currentItems[existingIdx] = {
                    ...currentItems[existingIdx],
                    quantity: (currentItems[existingIdx].quantity || 1) + (item.quantity || 1)
                };
                currentItems.splice(idx, 1);
            } else {
                // Update
                currentItems[idx] = {
                    ...item,
                    saleUnit: newUnit,
                    price: newPrice,
                    title: newTitle
                };
            }

            return { ...prev, [mode]: { ...prev[mode], items: currentItems } };
        });
    }, [mode, catalog]);

    const handleSubmit = () => {
        const { client, items, date, time, specialist, foundAppt } = currentForm;
        const now = new Date();
        const invoiceDate = now.toLocaleDateString('en-CA');
        const invoiceTime = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

        if (mode === 'new' || mode === 'quote') {
            if (!client || items.length === 0) return;
            if (mode === 'new') {
                const stockIssue = items.some(i => !checkItemAvailability(i, catalog));
                const finalStatus = stockIssue ? 'Pending' : 'Confirmed';
                const finalNote = stockIssue ? 'Pendiente por falta de stock/insumos' : 'Venta Directa (POS)';

                const newApptId = addAppointment({
                    clientId: client.id, 
                    clientName: client.name, 
                    client: client.name,
                    clientAvatar: client.avatar, 
                    avatar: null,
                    service: items.length > 0 ? items[0].title : 'Venta Directa',
                    items: items, 
                    date: date, 
                    time: time, 
                    specialistName: specialist, 
                    total: totalAmount, 
                    status: finalStatus, 
                    notes: finalNote
                });
                
                if (stockIssue) {
                    addToast('info', 'Cita creada como "Por Confirmar" debido a falta de stock. No se generó factura.');
                } else {
                    createManualInvoice({ 
                        clientId: client.id, 
                        clientName: client.name, 
                        items: items, 
                        date: invoiceDate, 
                        time: invoiceTime, 
                        status: 'Pendiente', 
                        existingAppointmentId: newApptId 
                    });
                }
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

    const handleCheckAppt = () => {
        updateForm({ linkError: '' });
        const appt = appointments.find(a => a.id === currentForm.linkApptId);
        if (!appt) { updateForm({ linkError: 'Cita no encontrada', foundAppt: null }); return; }
        if (appt.status !== 'Confirmed' && appt.status !== 'In Progress') { updateForm({ linkError: `Estado inválido: ${appt.status === 'Pending' ? 'Por Confirmar' : 'Finalizada/Cancelada'}`, foundAppt: null }); return; }
        updateForm({ foundAppt: appt, client: clients.find(c => c.id === appt.clientId) || null, items: [] });
    };

    return {
        mode, setMode,
        currentForm, updateForm,
        clientSearch, setClientSearch,
        catalogFilter, setCatalogFilter,
        showClientSuggestions, setShowClientSuggestions,
        viewDate, setViewDate,
        filteredClients, searchResults, topLists,
        subTotalAmount, discountAmount, totalAmount, hasStockIssues,
        handleAddItem, handleRemoveItem, handleUpdateQuantity, handleToggleUnit, handleSubmit, handleCheckAppt,
        addClient, addToast,
        clients, catalog, openStock
    };
};
