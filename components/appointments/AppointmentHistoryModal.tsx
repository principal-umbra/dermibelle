
import React, { useMemo } from 'react';
import { Appointment, useData } from '../../context/DataContext';

interface AppointmentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
}

const STATUS_STEPS = [
    { id: 'Pending', label: 'Solicitada' },
    { id: 'Confirmed', label: 'Confirmada' },
    { id: 'In Progress', label: 'En Proceso' },
    { id: 'Finalized', label: 'Finalizada' }
];

const AppointmentHistoryModal: React.FC<AppointmentHistoryModalProps> = ({ isOpen, onClose, appointment }) => {
    const { clientLogs, invoices, clients, updateAppointmentStatus, getInvoiceByAppointmentId, addToast, appointments } = useData();
    const [isItemsExpanded, setIsItemsExpanded] = React.useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

    // FIX: Retrieve latest appointment state from context to ensure reactivity
    const currentAppointment = useMemo(() => 
        appointments.find(a => a.id === appointment?.id) || appointment
    , [appointment, appointments]);

    // --- Data Preparation ---
    const data = useMemo(() => {
        if (!currentAppointment) return null;

        // 1. Linked Invoice Info (Current State)
        const linkedInvoices = invoices.filter(inv => inv.appointmentId === currentAppointment.id);
        
        // 2. Client Info
        const client = clients.find(c => c.id === currentAppointment.clientId);

        // 3. Calculated Total (Sum of all linked invoices OR appointment total if no invoices)
        const calculatedTotal = linkedInvoices.length > 0 
            ? linkedInvoices.reduce((sum, inv) => sum + inv.amount, 0)
            : currentAppointment.total;

        // 4. Timeline Events Generation
        const events: any[] = [];

        // A. Creation (The Origin)
        if (currentAppointment.createdAt) {
            const createdNote = currentAppointment.notes?.includes('Creada desde') ? currentAppointment.notes : 'Reserva ingresada al sistema';
            events.push({
                id: 'create',
                type: 'creation',
                title: 'Cita Creada',
                desc: createdNote,
                date: new Date(currentAppointment.createdAt),
                icon: 'add_circle',
                color: 'text-gray-500 bg-gray-100 dark:bg-white/10',
                details: {
                    'Origen': 'Sistema / Admin',
                    'Cliente': currentAppointment.clientName
                }
            });
        }

        // B. Logs specific to this appointment (Interactions & Finance)
        const relatedLogs = clientLogs.filter(log => {
            const isDirectMatch = log.description && log.description.includes(currentAppointment.id);
            const isInvoiceMatch = linkedInvoices.some(inv => log.description.includes(inv.idDisplay));
            return isDirectMatch || isInvoiceMatch;
        });

        relatedLogs.forEach(log => {
            let title = 'Actividad';
            let icon = 'info';
            let color = 'text-gray-500 bg-gray-50 dark:bg-white/5';
            let desc = '';
            let amountDisplay = '';
            
            // Rich Data Containers
            let details: Record<string, string | React.ReactNode> | null = null;
            let tags: string[] = [];

            // --- FINANCE EVENTS PARSING ---
            if (log.type === 'finance') {
                const parts = log.description.split('|');
                const docId = parts[0];
                const rawAmount = parts[1];

                amountDisplay = rawAmount && !isNaN(parseFloat(rawAmount)) ? `$${parseFloat(rawAmount).toFixed(2)}` : '';

                // SMART CONTEXT: Find the referenced invoice to check its content
                const relevantInvoice = invoices.find(inv => inv.idDisplay === docId || inv.id === docId);
                const hasServices = relevantInvoice?.items.some(i => i.type === 'service') ?? false;
                const hasProducts = relevantInvoice?.items.some(i => i.type === 'product') ?? false;

                if (log.action === 'invoice_created' || log.action === 'quote_created') {
                    title = log.action === 'quote_created' ? 'Cotización Generada' : 'Factura Emitida';
                    icon = log.action === 'quote_created' ? 'description' : 'receipt_long';
                    color = 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
                    
                    details = {
                        'Documento ID': <span className="font-mono font-bold text-blue-600">{docId}</span>,
                        'Concepto': parts[2] || 'General',
                        'Contenido': parts[3] || '-',
                        'Ajustes/Desc': parts[4] || 'Ninguno'
                    };
                } 
                else if (log.action === 'payment_received' || log.action === 'transfer_reported') {
                    // Standard Payment Handling
                    const method = (parts[2] || 'N/A').toUpperCase();
                    const ref = parts[3] || '-';
                    const balanceStatus = parts[4] || '';
                    const rawScope = (parts[5] || '').toLowerCase().trim();

                    // Logic: Determine Partial vs Full based on balance text ("Resta: $X" vs "Saldado")
                    const isPartial = balanceStatus.toLowerCase().includes('resta');
                    
                    // Logic: Smart Scope Label
                    let scopeLabel = 'General';
                    
                    if (rawScope.includes('servicios')) {
                        scopeLabel = 'Servicios';
                    } else if (rawScope.includes('productos')) {
                        scopeLabel = 'Productos';
                    } else {
                        // Scope is 'total' or unspecified. Infer strictly from invoice content.
                        if (hasServices && hasProducts) {
                            scopeLabel = 'General (Mixto)';
                        } else if (hasServices) {
                            scopeLabel = 'Servicios';
                        } else if (hasProducts) {
                            scopeLabel = 'Productos';
                        } else {
                            scopeLabel = 'General';
                        }
                    }

                    if (log.action === 'transfer_reported') {
                        title = 'Pago En Tránsito';
                        icon = 'hourglass_top';
                        color = 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
                    } else {
                        // Payment Received: Distinguish Partial vs Final
                        if (isPartial) {
                            title = 'Abono Recibido'; // More accurate for partials
                            icon = 'savings'; // Indicates depositing into account
                            color = 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
                        } else {
                            title = 'Liquidación Final'; // Indicates clearing the balance
                            icon = 'price_check'; // Checkmark with money
                            color = 'text-green-600 bg-green-50 dark:bg-green-900/20';
                        }
                    }

                    details = {
                        'Documento': <span className="font-mono font-bold">{docId}</span>,
                        'Método': method,
                        'Referencia': <span className="font-mono bg-white dark:bg-black/20 px-1 rounded border text-[10px]">{ref}</span>,
                        'Aplicado a': <span className="font-bold text-gray-800 dark:text-gray-200 underline decoration-dotted">{scopeLabel}</span>,
                        'Saldo Restante': <span className={!isPartial ? 'text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-1 rounded' : 'text-orange-600 font-bold'}>{balanceStatus}</span>,
                    };
                }
                else if (log.action === 'transfer_confirmed') {
                    // Validated Transfer Logic
                    const fullRef = parts[2] || '';
                    const bankMatch = fullRef.match(/\((.*?)\)/);
                    const bankName = bankMatch ? bankMatch[1] : 'Banco Principal';
                    const cleanRef = fullRef.split('(')[0].trim(); 

                    title = 'Transferencia Validada';
                    icon = 'verified';
                    color = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';

                    details = {
                        'Documento': <span className="font-mono font-bold">{docId}</span>,
                        'Banco Origen': <span className="font-bold text-blue-600 uppercase text-[10px] bg-blue-50 px-1 rounded border border-blue-100">{bankName}</span>,
                        'Ref. Bancaria': <span className="font-mono text-[10px]">{cleanRef}</span>,
                        'Estado Saldo': <span className="text-green-600 font-bold">Saldado (Conciliado)</span>,
                        'Estado Pago': 'Acreditado en cuenta'
                    };
                }
                else if (log.action === 'invoice_voided') {
                    title = 'Documento Anulado';
                    icon = 'block';
                    color = 'text-red-600 bg-red-50 dark:bg-red-900/20';
                    amountDisplay = ''; 
                    tags.push('ANULADA');
                    
                    details = {
                        'Documento': <span className="font-mono font-bold text-red-600 line-through">{docId}</span>,
                        'Monto Anulado': `$${parseFloat(rawAmount).toFixed(2)}`,
                        'Motivo': parts[2] || 'Administrativo',
                        'Origen': parts[3] || 'Sistema'
                    };
                } 
                else if (log.action === 'invoice_linked') {
                    title = 'Factura Vinculada';
                    icon = 'link';
                    color = 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
                    details = {
                        'Documento': <span className="font-mono font-bold">{parts[0]}</span>,
                        'Acción': 'Vinculación Manual',
                        'Destino': parts[2] || 'Esta Cita'
                    };
                }
            } 
            // --- SYSTEM MODIFICATIONS ---
            else if (log.action === 'edit_profile') {
                if (log.description.includes('Modificación de Items')) {
                    const parts = log.description.split('|');
                    title = 'Modificación de Orden';
                    icon = 'edit_note';
                    color = 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
                    
                    const context = parts[0].split('/'); 
                    const invoiceRef = context[1] ? context[1].trim() : 'N/A';
                    const moneyDiff = parts[2] || '-';
                    const itemsDiff = parts[3] || '';
                    const [itemsBefore, itemsAfter] = itemsDiff.includes('➝') ? itemsDiff.split('➝') : [itemsDiff, ''];

                    details = {
                        'Factura Afectada': <span className="font-mono font-bold">{invoiceRef}</span>,
                        'Cambio Financiero': <span className="font-mono font-bold text-purple-700">{moneyDiff.replace('Total:', '').trim()}</span>,
                        'Items (Antes)': <span className="text-red-400 line-through text-[10px] block leading-tight">{itemsBefore.trim()}</span>,
                        'Items (Después)': <span className="text-green-600 font-medium text-[10px] block leading-tight">{itemsAfter.trim()}</span>
                    };
                } else {
                    title = 'Datos Actualizados';
                    icon = 'manage_accounts';
                    color = 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
                    
                    if (log.description.includes('|')) {
                        const changes = log.description.split('|');
                        const detailObj: Record<string, any> = {};
                        changes.forEach(c => {
                            const [key, val] = c.split(':');
                            if (key && val) detailObj[key.trim()] = val.trim();
                        });
                        details = detailObj;
                    } else {
                        desc = log.description;
                    }
                }
            }
            // --- INTERACTION & SYSTEM LOGS ---
            else {
                let cleanDesc = log.description.replace(currentAppointment.id, '').replace(/\|/g, ' ').trim();

                if (log.action === 'whatsapp') {
                    title = 'WhatsApp Enviado';
                    icon = 'chat';
                    color = 'text-green-600 bg-green-50 dark:bg-green-900/20';
                    if (log.description.includes('|')) {
                        const msgParts = log.description.split('|');
                        details = {
                            'Motivo': msgParts[0] || 'General',
                            'Mensaje': <span className="italic">"{msgParts[1]?.replace('Mensaje enviado:', '').trim()}"</span>,
                            'Destino': <span className="font-mono">{msgParts[3] || client?.phone}</span>
                        };
                    } else {
                        desc = cleanDesc;
                    }
                } else if (log.action === 'call') {
                    title = 'Llamada Saliente';
                    icon = 'call';
                    color = 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
                    desc = cleanDesc;
                } else if (log.action === 'email') {
                    title = 'Email Enviado';
                    icon = 'mail';
                    color = 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
                    desc = cleanDesc;
                } else if (log.action.startsWith('status_change')) {
                    // Logic to make status changes more descriptive
                    const rawStatus = log.action.replace('status_change_', '').toLowerCase();
                    tags.push(rawStatus.toUpperCase());
                    
                    if (rawStatus === 'confirmed') {
                        title = 'Cita Confirmada / Reactivada';
                        icon = 'check_circle';
                        color = 'text-green-600 bg-green-50 dark:bg-green-900/20';
                    } else if (rawStatus === 'in_progress') {
                        title = 'Cita Iniciada';
                        icon = 'play_circle';
                        color = 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
                    } else if (rawStatus === 'finalized') {
                        title = 'Cita Finalizada';
                        icon = 'task_alt';
                        color = 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
                    } else {
                        title = 'Cambio de Estado';
                        icon = 'flag'; 
                        color = 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
                    }
                } else if (log.action === 'manual_note') {
                    title = 'Nota Interna';
                    icon = 'sticky_note_2';
                    color = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
                    desc = cleanDesc.replace('Nota editada:', '').replace(/"/g, '');
                } else if (log.action === 'appointment_reactivated') {
                    title = 'Cita Reactivada';
                    icon = 'restore';
                    color = 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20';
                    const reason = log.description.split('Motivo:')[1];
                    details = {
                        'Acción': 'Restaurada a Pendiente',
                        'Motivo': reason ? reason.trim() : 'Recuperación manual'
                    };
                } else if (log.action === 'appointment_cancelled') {
                    title = 'Cita Cancelada';
                    icon = 'event_busy';
                    color = 'text-red-600 bg-red-50 dark:bg-red-900/20';
                    try {
                        const snapshot = JSON.parse(log.description);
                        details = {
                            'Items Snapshot': snapshot.items,
                            'Valor Total': `$${snapshot.total}`,
                            'ID Ref': snapshot.id
                        };
                    } catch (e) {
                        desc = 'Cancelación registrada';
                    }
                } else {
                    desc = cleanDesc;
                }
            }

            events.push({
                id: log.id,
                type: log.action.startsWith('status_change') ? 'milestone' : (log.type === 'finance' ? 'finance' : 'interaction'),
                title,
                desc,
                details,
                tags,
                date: new Date(log.timestamp),
                icon,
                color,
                amount: amountDisplay
            });
        });

        const sortedEvents = events.sort((a, b) => b.date.getTime() - a.date.getTime());

        return { linkedInvoices, client, timeline: sortedEvents, calculatedTotal };
    }, [currentAppointment, clientLogs, invoices, clients]);

    const handleStatusChange = (newStatus: string) => {
        if (!currentAppointment) return;
        if (newStatus === currentAppointment.status) return;

        if (newStatus === 'Finalized') {
            const invoice = getInvoiceByAppointmentId(currentAppointment.id);
            if (!invoice || (invoice.status !== 'Pagada' && invoice.status !== 'En Tránsito')) {
                addToast('error', 'Debe saldar la cuenta antes de finalizar.');
                return;
            }
        }
        updateAppointmentStatus(currentAppointment.id, newStatus as Appointment['status']);
        setShowCancelConfirm(false); // Reset confirmation buttons
    };

    if (!isOpen || !currentAppointment || !data) return null;

    // --- Visual Helpers ---
    const getStatusColor = (s: string) => {
        switch(s) {
            case 'Confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Finalized': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // --- Detail Items Logic ---
    const totalItemsCount = data.linkedInvoices.length > 0 
        ? data.linkedInvoices.reduce((acc, inv) => acc + inv.items.length, 0)
        : (currentAppointment.items?.length || 0);

    const currentStatusIndex = STATUS_STEPS.findIndex(s => s.id === currentAppointment.status);
    const isCancelled = currentAppointment.status === 'Cancelled';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-[85vh] max-h-[700px] overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header Compacto con Status Stepper - REDESIGNED & FIXED */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark shrink-0">
                    
                    {/* Title Section */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <span className="material-icons text-xl">history_edu</span>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white leading-none">
                                Bitácora
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-[10px] text-gray-500 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-bold">
                                    #{currentAppointment.id}
                                </span>
                                {/* DATE REMOVED FROM HERE as requested */}
                            </div>
                        </div>
                    </div>

                    {/* STATUS STEPPER & ACTIONS - FIX: Added flex-wrap and correct sizing */}
                    <div className="flex items-center gap-3 justify-end flex-1 min-w-0 w-full md:w-auto overflow-x-auto no-scrollbar">
                        {isCancelled ? (
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => handleStatusChange('Confirmed')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm border border-blue-100 dark:border-blue-800"
                                >
                                    <span className="material-icons text-sm">restore</span>
                                    Reactivar
                                </button>
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-full shadow-sm whitespace-nowrap">
                                    <span className="flex h-2.5 w-2.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">Cancelada</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Cancel Action (MOVED HERE TO THE LEFT) */}
                                {showCancelConfirm ? (
                                    <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/10 px-1 py-1 rounded-lg border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-right-2">
                                        <button onClick={() => handleStatusChange('Cancelled')} className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700">Si</button>
                                        <button onClick={() => setShowCancelConfirm(false)} className="px-2 py-1 bg-white text-gray-600 text-[10px] font-bold rounded hover:bg-gray-100">No</button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setShowCancelConfirm(true)}
                                        className="group p-2 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all border border-transparent hover:border-red-100"
                                        title="Cancelar Cita"
                                    >
                                        <span className="material-icons text-lg">block</span>
                                    </button>
                                )}

                                {/* Status Pill Container - FIXED SIZE & IMPROVED INTERACTIVITY */}
                                <div className="flex items-center p-1 bg-gray-100 dark:bg-black/40 rounded-full border border-gray-200 dark:border-gray-700/50">
                                    {STATUS_STEPS.map((step, idx) => {
                                        const isCompleted = idx < currentStatusIndex;
                                        const isCurrent = idx === currentStatusIndex;
                                        
                                        return (
                                            <button 
                                                key={step.id}
                                                onClick={() => handleStatusChange(step.id)}
                                                className={`group relative flex items-center justify-center px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer select-none
                                                    ${isCurrent 
                                                        ? 'bg-white dark:bg-surface-dark text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 z-10 font-bold' 
                                                        : 'hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-sm'
                                                    }
                                                    ${!isCurrent && isCompleted ? 'text-gray-500 dark:text-gray-400' : ''}
                                                    ${!isCurrent && !isCompleted ? 'text-gray-400 dark:text-gray-600' : ''}
                                                `}
                                            >
                                                {/* Indicator Dot */}
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 transition-colors 
                                                    ${isCurrent 
                                                        ? (step.id === 'Confirmed' ? 'bg-green-500' : step.id === 'In Progress' ? 'bg-blue-500' : 'bg-yellow-400') 
                                                        : isCompleted 
                                                            ? 'bg-gray-400 group-hover:bg-gray-600 dark:group-hover:bg-gray-300' 
                                                            : 'bg-gray-300 dark:bg-gray-700 group-hover:bg-gray-400 dark:group-hover:bg-gray-500'}
                                                `}></div>
                                                
                                                <span className="text-[10px] uppercase tracking-wide whitespace-nowrap group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                                    {step.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                        
                        {/* Close Modal (Kept at the far right) */}
                        <button onClick={onClose} className="ml-1 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 transition-colors">
                            <span className="material-icons text-lg">close</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    
                    {/* COLUMNA IZQUIERDA: DETALLE (Contexto) */}
                    <div className="w-1/3 bg-gray-50 dark:bg-black/10 border-r border-gray-100 dark:border-gray-800 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                        
                        {/* 1. Detalles de Servicio (Expandible) */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">DETALLE DE SERVICIOS</p>
                            <div 
                                onClick={() => totalItemsCount > 1 && setIsItemsExpanded(!isItemsExpanded)}
                                className={`bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all overflow-hidden
                                    ${totalItemsCount > 1 ? 'cursor-pointer hover:border-primary/50' : ''}
                                `}
                            >
                                <div className="p-3 flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">
                                            {currentAppointment.items?.[0]?.title || currentAppointment.service}
                                        </h4>
                                        {!isItemsExpanded && totalItemsCount > 1 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                + {totalItemsCount - 1} items adicionales
                                            </p>
                                        )}
                                    </div>
                                    {totalItemsCount > 1 && (
                                        <span className={`material-icons text-gray-400 text-lg transition-transform duration-300 ${isItemsExpanded ? 'rotate-180' : ''}`}>
                                            expand_more
                                        </span>
                                    )}
                                </div>

                                {/* Expanded List: Grouped by Invoice */}
                                {isItemsExpanded && (
                                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
                                        {data.linkedInvoices.length > 0 ? (
                                            data.linkedInvoices.map((inv) => (
                                                <div key={inv.id} className="p-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                                        <span className="material-icons text-[10px]">receipt</span> {inv.idDisplay}
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {inv.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-700 dark:text-gray-300 truncate pr-2">{item.title}</span>
                                                                <span className="font-mono text-gray-500">x{item.quantity || 1}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 space-y-1.5">
                                                {currentAppointment.items?.slice(1).map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-700 dark:text-gray-300 truncate pr-2">{item.title}</span>
                                                        <span className="font-mono text-gray-500">x{item.quantity || 1}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Total & Status (Dynamic Total) */}
                        <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Cita</p>
                                <span className="font-display font-bold text-3xl text-gray-900 dark:text-white">
                                    ${data.calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border mb-1 ${getStatusColor(currentAppointment.status)}`}>
                                {currentAppointment.status}
                            </span>
                        </div>

                        {/* 3. Fechas */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white dark:bg-surface-dark p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <span className="material-icons text-sm">event</span>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">FECHA AGENDADA</p>
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                        {new Date(currentAppointment.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                                <span className="ml-auto text-xs font-mono font-bold text-gray-600 dark:text-gray-400">{currentAppointment.time}</span>
                            </div>
                        </div>

                        {/* 4. Factura Links */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">DOCUMENTOS VINCULADOS</p>
                            {data.linkedInvoices.length > 0 ? (
                                <div className="space-y-2">
                                    {data.linkedInvoices.map(inv => (
                                        <div key={inv.id} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-yellow-600 text-lg">receipt</span>
                                                <div>
                                                    <p className="text-xs font-bold text-yellow-800 dark:text-yellow-200">{inv.idDisplay}</p>
                                                    <p className="text-[10px] text-yellow-700 dark:text-yellow-400 uppercase">{inv.status} • ${inv.amount}</p>
                                                </div>
                                            </div>
                                            {inv.status === 'Pagada' && (
                                                <span className="material-icons text-green-600 text-base">check_circle</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 italic bg-gray-100 dark:bg-white/5 p-2 rounded-lg text-center">
                                    Sin facturas vinculadas
                                </div>
                            )}
                        </div>

                    </div>

                    {/* COLUMNA DERECHA: PROGRESO (Bitácora) */}
                    <div className="w-2/3 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-surface-dark">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <span className="material-icons text-sm">history</span> LÍNEA DE TIEMPO
                            </h4>
                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                {data.timeline.length} Eventos
                            </span>
                        </div>

                        <div className="relative pl-2">
                            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                            <div className="space-y-6">
                                {data.timeline.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic pl-10">No hay registros en la bitácora.</p>
                                ) : (
                                    data.timeline.map((event: any, idx: number) => {
                                        const isFirstItem = idx === 0;
                                        const isFinance = event.type === 'finance';
                                        const isMilestone = event.type === 'milestone' || isFinance || event.id === 'create';

                                        return (
                                            <div key={idx} className="relative flex gap-4 group">
                                                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-surface-dark shrink-0 transition-transform 
                                                    ${isFirstItem ? 'scale-110 shadow-md ring-2 ring-primary/20' : ''}
                                                    ${isFinance ? event.color.replace('text-', 'bg-').replace('bg-', 'ring-') + ' text-white shadow-sm' : event.color}
                                                `}>
                                                    <span className="material-icons text-sm">{event.icon}</span>
                                                </div>

                                                <div className="flex-1 pt-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex flex-col">
                                                            <h5 className={`text-sm font-bold ${isFinance ? 'text-gray-900 dark:text-white' : isMilestone ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                {event.title}
                                                            </h5>
                                                            {event.amount && (
                                                                <span className={`text-xs font-mono font-bold ${event.title.includes('Anul') ? 'text-red-500 line-through' : 'text-green-600'}`}>
                                                                    {event.amount}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                                                            {event.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>
                                                    
                                                    {event.details ? (
                                                        <div className={`mt-2 text-xs rounded-lg p-3 ${isFinance ? 'bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-gray-800' : 'bg-gray-50 dark:bg-white/5'}`}>
                                                            <div className={`grid ${Object.keys(event.details).length > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-y-2 gap-x-4`}>
                                                                {Object.entries(event.details).map(([key, val]: any) => (
                                                                    <div key={key} className="flex flex-col">
                                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{key}</span>
                                                                        <span className="text-gray-700 dark:text-gray-300 font-medium break-words leading-tight">{val}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {event.desc && !isFinance && <p className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 italic text-gray-500">{event.desc}</p>}
                                                        </div>
                                                    ) : (
                                                        event.desc && (
                                                            <p className={`text-xs mt-1 leading-relaxed break-words ${isFinance ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500'}`}>
                                                                {event.desc}
                                                            </p>
                                                        )
                                                    )}

                                                    {event.tags && event.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {event.tags.map((tag: string) => (
                                                                <span key={tag} className="text-[9px] font-bold bg-gray-100 dark:bg-white/10 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 uppercase tracking-wider">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    <p className="text-[10px] text-gray-300 mt-2">
                                                        {event.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                
                                <div className="relative flex gap-4 opacity-40">
                                    <div className="relative z-10 w-10 h-3 flex justify-center shrink-0">
                                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pt-0.5">Inicio</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentHistoryModal;
