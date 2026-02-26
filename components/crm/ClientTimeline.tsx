
import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';

interface ClientTimelineProps {
    clientId: string;
}

// --- Helpers ---

const parseDateTime = (dateStr: string, timeStr: string): Date => {
    try {
        if (!dateStr) return new Date();
        const cleanDate = dateStr.trim(); 
        const cleanTime = (timeStr || '00:00').trim().toUpperCase();
        const dateParts = cleanDate.split('-');
        if (dateParts.length !== 3) return new Date(); 
        
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; 
        const day = parseInt(dateParts[2], 10);

        let hours = 0;
        let minutes = 0;

        const timeMatch = cleanTime.match(/^(\d{1,2})[:.](\d{2})(\s?(AM|PM))?$/);
        
        if (timeMatch) {
            hours = parseInt(timeMatch[1], 10);
            minutes = parseInt(timeMatch[2], 10);
            const meridian = timeMatch[4];
            if (meridian === 'PM' && hours < 12) hours += 12;
            if (meridian === 'AM' && hours === 12) hours = 0;
        } else if (cleanTime.includes(':')) {
            const parts = cleanTime.split(':');
            hours = parseInt(parts[0], 10);
            minutes = parseInt(parts[1], 10);
        }

        const d = new Date(year, month, day, hours, minutes);
        return isNaN(d.getTime()) ? new Date() : d;
    } catch (e) {
        return new Date();
    }
};

const getEvolutionSteps = (currentStatus: string, timestamps: Record<string, number> = {}) => {
    const stepsDefinition = [
        { id: 'Pending', label: 'Solicitada' },
        { id: 'Confirmed', label: 'Confirmada' },
        { id: 'In Progress', label: 'Iniciada' },
        { id: 'Finalized', label: 'Completada' }
    ];

    if (currentStatus === 'Cancelled') {
        const steps = [];
        steps.push({
            id: 'Pending',
            label: 'Solicitada',
            state: 'past',
            time: timestamps['Pending'] ? new Date(timestamps['Pending']).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null
        });
        if (timestamps['Confirmed']) {
            steps.push({ id: 'Confirmed', label: 'Confirmada', state: 'past', time: new Date(timestamps['Confirmed']).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) });
        }
        if (timestamps['In Progress']) {
            steps.push({ id: 'In Progress', label: 'Iniciada', state: 'past', time: new Date(timestamps['In Progress']).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) });
        }
        steps.push({
            id: 'Cancelled',
            label: 'Cancelada',
            state: 'cancelled',
            time: timestamps['Cancelled'] ? new Date(timestamps['Cancelled']).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null
        });
        return steps;
    }

    const statusOrder = ['Pending', 'Confirmed', 'In Progress', 'Finalized'];
    let currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex === -1) currentIndex = 0;

    return stepsDefinition.map((step, index) => {
        let state = 'future';
        if (index < currentIndex) state = 'past';
        else if (index === currentIndex) state = 'current';
        
        const ts = timestamps[step.id];
        const timeStr = ts ? new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null;
        if (ts && state === 'future') state = 'past';

        return { id: step.id, label: step.label, state: state, time: timeStr };
    });
};

const getEventStyle = (type: string, status: string, action?: string) => {
    if (type === 'appointment_cycle' || type === 'appointment_snapshot') {
        switch (status) {
            case 'Confirmed': return { bg: 'bg-green-100', border: 'border-green-200', color: 'text-green-600', icon: 'check_circle' };
            case 'Pending': return { bg: 'bg-yellow-100', border: 'border-yellow-200', color: 'text-yellow-600', icon: 'hourglass_empty' };
            case 'In Progress': return { bg: 'bg-blue-100', border: 'border-blue-200', color: 'text-blue-600', icon: 'timelapse' };
            case 'Finalized': return { bg: 'bg-purple-100', border: 'border-purple-200', color: 'text-purple-600', icon: 'task_alt' };
            case 'Cancelled': return { bg: 'bg-gray-100', border: 'border-gray-200', color: 'text-gray-500', icon: 'event_busy' }; 
            default: return { bg: 'bg-gray-100', border: 'border-gray-200', color: 'text-gray-600', icon: 'event' };
        }
    }
    return { bg: 'bg-gray-100', border: 'border-gray-200', color: 'text-gray-600', icon: 'circle' };
};

// --- Sub-Components (Cards) ---

const InteractionCard: React.FC<{ event: any }> = ({ event }) => {
    const isWhatsapp = event.action === 'whatsapp';
    const isCall = event.action === 'call';
    const isEmail = event.action === 'email';

    let styles = {
        borderClass: 'border-l-4 border-l-gray-300',
        bgClass: 'bg-gray-50',
        textClass: 'text-gray-600',
        icon: 'notifications',
        label: 'Notificación',
        actionLabel: 'Notificación'
    };

    if (isWhatsapp) {
        styles = { 
            borderClass: 'border-l-4 border-l-[#25D366]', 
            bgClass: 'bg-[#F0FDF4]',
            textClass: 'text-green-800',
            icon: 'whatsapp',
            label: 'WhatsApp',
            actionLabel: 'Enviado vía WhatsApp'
        };
    } else if (isCall) {
        styles = { 
            borderClass: 'border-l-4 border-l-blue-500', 
            bgClass: 'bg-blue-50', 
            textClass: 'text-blue-800',
            icon: 'call',
            label: 'Teléfono',
            actionLabel: 'Llamada Saliente'
        };
    } else if (isEmail) {
        styles = { 
            borderClass: 'border-l-4 border-l-orange-500', 
            bgClass: 'bg-orange-50', 
            textClass: 'text-orange-800',
            icon: 'mail',
            label: 'Email',
            actionLabel: 'Enviado por Email'
        };
    }

    let contextLabel = '';
    let contextId = '';
    
    if (event.subtitle) {
        if (event.subtitle.includes('Cita')) {
            contextLabel = 'Cita ID';
            contextId = event.subtitle.replace('Cita', '').replace(/#/g, '').trim();
        } else {
            contextLabel = 'Ref';
            contextId = event.subtitle;
        }
    }

    return (
        <div className="flex gap-4 relative py-2 group">
            <div className="w-14 flex flex-col items-center pt-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-gray-400 font-mono font-medium">
                    {event.dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            <div className="absolute top-0 bottom-0 left-[3.35rem] w-px bg-gray-200 dark:bg-gray-800"></div>
            <div className="flex-1 min-w-0">
                <div className={`relative rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${styles.borderClass} ${styles.bgClass} dark:bg-surface-dark p-3 transition-all hover:shadow-md`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${styles.bgClass} brightness-95`}>
                                <span className={`material-icons text-[12px] ${styles.textClass}`}>{styles.icon}</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.textClass}`}>{styles.actionLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {event.destPhone && (isWhatsapp || isCall) && (
                                <span className="text-[10px] font-mono text-gray-500 font-bold flex items-center gap-1 bg-white dark:bg-white/10 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 shadow-sm">
                                    <span className="material-icons text-[10px] opacity-50">smartphone</span>
                                    {event.destPhone}
                                </span>
                            )}
                            {contextId && (
                                <span className="text-[10px] font-mono font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-black/40 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 shadow-sm" title={contextLabel}>
                                    {contextLabel}: {contextId}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="pl-7">
                        <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">{event.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-snug border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                            "{event.details}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FinanceTransactionCard: React.FC<{ event: any }> = ({ event }) => {
    const parts = event.details[0] ? event.details[0].split('|') : [];
    
    let config = { 
        theme: 'gray', 
        icon: 'info', 
        label: 'Transacción',
        amountColor: 'text-gray-900 dark:text-white',
        amountPrefix: ''
    };

    const isPayment = event.action === 'payment_received';
    const isTransfer = event.action === 'transfer_reported';
    const isConfirmed = event.action === 'transfer_confirmed';
    const isInvoice = event.action === 'invoice_created';
    const isQuote = event.action === 'quote_created';
    const isVoid = event.action === 'invoice_voided';
    const isLink = event.action === 'invoice_linked';

    const id = parts[0] || 'N/A';
    const amount = parseFloat(parts[1] || '0').toFixed(2);
    
    if (isPayment) {
        config = { theme: 'green', icon: 'payments', label: 'Pago Recibido', amountColor: 'text-green-600 dark:text-green-400', amountPrefix: '+' };
    } else if (isTransfer) {
        config = { theme: 'orange', icon: 'hourglass_top', label: 'Pago En Tránsito', amountColor: 'text-orange-600 dark:text-orange-400', amountPrefix: '' };
    } else if (isConfirmed) {
        config = { theme: 'green', icon: 'verified', label: 'Transferencia Validada', amountColor: 'text-green-600 dark:text-green-400', amountPrefix: '+' };
    } else if (isInvoice) {
        config = { theme: 'blue', icon: 'receipt_long', label: 'Factura Emitida', amountColor: 'text-blue-600 dark:text-blue-400', amountPrefix: '' };
    } else if (isQuote) {
        config = { theme: 'indigo', icon: 'description', label: 'Cotización', amountColor: 'text-indigo-600 dark:text-indigo-400', amountPrefix: '' };
    } else if (isVoid) {
        config = { theme: 'red', icon: 'block', label: 'Anulación', amountColor: 'text-red-500 dark:text-red-400 line-through', amountPrefix: '' };
    } else if (isLink) {
        config = { theme: 'gray', icon: 'link', label: 'Vinculación', amountColor: 'text-gray-500', amountPrefix: '' };
    }

    const themeColors: Record<string, string> = {
        green: 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30',
        orange: 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30',
        blue: 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30',
        indigo: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30',
        red: 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30',
        gray: 'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700'
    };

    const iconColors: Record<string, string> = {
        green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300',
        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
        indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
        gray: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
    };

    return (
        <div className="flex gap-4 relative py-2">
            <div className="w-14 flex flex-col items-center pt-1 shrink-0">
                <span className="text-[10px] text-gray-400 font-mono font-medium">
                    {event.dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            <div className="absolute top-0 bottom-0 left-[3.35rem] w-px bg-gray-200 dark:bg-gray-800"></div>
            <div className="flex-1 min-w-0">
                <div className={`rounded-xl border p-4 flex flex-col gap-3 ${themeColors[config.theme]}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${iconColors[config.theme]}`}>
                                <span className="material-icons text-sm">{config.icon}</span>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">{config.label}</h4>
                                <span className="text-[11px] font-mono font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-black/40 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 shadow-sm">
                                    {id}
                                </span>
                            </div>
                        </div>
                        {!isLink && (
                            <div className="text-right">
                                <span className={`text-lg font-mono font-bold ${config.amountColor}`}>
                                    {config.amountPrefix}${amount}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-white/50 dark:border-white/5 text-xs text-gray-600 dark:text-gray-300">
                        {isPayment ? (
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                <div>
                                    <span className="text-[9px] text-gray-400 uppercase font-bold block">Método</span>
                                    <span className="font-medium capitalize flex items-center gap-1">
                                        <span className="material-icons text-[10px]">{parts[2] === 'efectivo' ? 'money' : 'credit_card'}</span> 
                                        {parts[2]}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-400 uppercase font-bold block">Referencia</span>
                                    <span className="font-mono bg-gray-100 dark:bg-white/10 px-1 rounded text-[10px]">{parts[3] || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-400 uppercase font-bold block">Concepto</span>
                                    <span>{parts[5] === 'total' ? 'Total Factura' : parts[5] === 'services' ? 'Solo Servicios' : 'Solo Productos'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-400 uppercase font-bold block">Estado Saldo</span>
                                    <span className={`font-bold ${parts[4] === 'Saldado' ? 'text-green-600' : 'text-orange-500'}`}>{parts[4]}</span>
                                </div>
                            </div>
                        ) : isInvoice || isQuote ? (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-gray-400 uppercase font-bold">Concepto Principal</span>
                                    <span className="text-[9px] text-gray-400 uppercase font-bold">Detalle</span>
                                </div>
                                <div className="flex justify-between items-center font-medium">
                                    <span>{parts[2]}</span>
                                    <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{parts[3]}</span>
                                </div>
                                {parts[4] && parts[4] !== 'Neto' && (
                                    <div className="mt-1 pt-1 border-t border-gray-200/50 dark:border-gray-700/50 text-[10px] text-green-600 dark:text-green-400 flex justify-end">
                                        {parts[4]}
                                    </div>
                                )}
                            </div>
                        ) : isTransfer ? (
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Referencia Bancaria</span>
                                </div>
                                <span className="font-mono bg-orange-100/50 dark:bg-orange-900/20 px-2 py-1 rounded text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800/50">
                                    {parts[4]}
                                </span>
                            </div>
                        ) : isVoid ? (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <span className="material-icons text-sm">info</span>
                                <span>{parts[2] || 'Anulación Manual'}</span>
                                {parts[3] && <span className="text-gray-400 text-[10px]">({parts[3]})</span>}
                            </div>
                        ) : (
                            <p className="italic">{parts[1]}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileChangesCard: React.FC<{ event: any }> = ({ event }) => {
    const changes = event.details[0] ? event.details[0].split('|').map((change: string) => {
        const [label, valPart] = change.split(':');
        const [oldVal, newVal] = valPart ? valPart.split('➝') : ['', ''];
        return { 
            label: label?.trim() || 'Campo', 
            oldVal: oldVal?.trim(), 
            newVal: newVal?.trim() 
        };
    }) : [];

    const getFieldIcon = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes('mail')) return 'mail';
        if (l.includes('tel') || l.includes('phone')) return 'phone';
        if (l.includes('direcc') || l.includes('addres')) return 'place';
        return 'badge';
    };

    return (
        <div className="flex gap-4 relative py-2">
            <div className="w-14 flex flex-col items-center pt-1 shrink-0">
                <span className="text-[9px] text-gray-400 font-mono">
                    {event.dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            <div className="absolute top-0 bottom-0 left-[3.35rem] w-px bg-gray-200 dark:bg-gray-800"></div>
            <div className="flex-1 min-w-0">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                            <span className="material-icons text-xs">manage_accounts</span>
                        </div>
                        <span className="text-xs font-bold text-blue-800 dark:text-blue-200">Datos Actualizados</span>
                    </div>
                    <div className="bg-white dark:bg-black/20 rounded-lg border border-blue-100/50 dark:border-blue-900/20 overflow-hidden">
                        {changes.map((change: any, idx: number) => (
                            <div key={idx} className="flex items-center p-2 border-b border-gray-50 dark:border-gray-800 last:border-0 text-xs">
                                <div className="w-6 shrink-0 flex justify-center text-gray-400">
                                    <span className="material-icons text-[14px]">{getFieldIcon(change.label)}</span>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide min-w-[60px]">{change.label}</span>
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-gray-400 line-through truncate max-w-[40%]">{change.oldVal}</span>
                                        <span className="material-icons text-[10px] text-blue-400 shrink-0">arrow_forward</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{change.newVal}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PrivateNoteCard: React.FC<{ event: any }> = ({ event }) => {
    return (
        <div className="flex gap-4 relative py-2">
            <div className="w-14 flex flex-col items-center pt-1 shrink-0">
                <span className="text-[9px] text-gray-400 font-mono">
                    {event.dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            <div className="absolute top-0 bottom-0 left-[3.35rem] w-px bg-gray-200 dark:bg-gray-800"></div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-background-dark z-10 flex items-center justify-center shrink-0">
                        <span className="material-icons text-xs text-gray-500">sticky_note_2</span>
                    </div>
                    <div className="flex-1">
                        <div className="bg-[#fffbeb] dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4 shadow-sm relative">
                            <h4 className="text-xs font-bold text-yellow-800 dark:text-yellow-500 mb-1">Nota Privada</h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed whitespace-pre-wrap">
                                "{event.details}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CompactChangeCard: React.FC<{ event: any }> = ({ event }) => {
    return (
        <div className="flex gap-4 relative py-1 group">
            <div className="w-14 flex justify-center shrink-0">
                <span className="text-[9px] text-gray-300 dark:text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {event.dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            <div className="absolute top-0 bottom-0 left-[3.35rem] w-px bg-gray-200 dark:bg-gray-800"></div>
            <div className="flex-1 min-w-0 flex items-center gap-3 pl-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">{event.title}</span>
                    <span className="mx-1.5 text-gray-300">•</span>
                    {Array.isArray(event.details) ? event.details.join(', ') : event.details}
                </p>
            </div>
        </div>
    );
};

const TimelineCard: React.FC<{ event: any; isSameDay?: boolean; isHistoric?: boolean; isLatestCancellation?: boolean }> = ({ event, isSameDay, isHistoric, isLatestCancellation }) => {
    const { reactivateArchivedAppointment, appointments } = useData();
    const isAppt = event.type === 'appointment_cycle';
    const isSnapshot = event.type === 'appointment_snapshot';
    const styles = getEventStyle(event.type, event.status, event.action);
    const [isExpanded, setIsExpanded] = useState(false);

    const isImmutable = event.status === 'Cancelled' || event.status === 'Finalized' || isSnapshot;
    const dateObj = event.dateObj;
    const isValidDate = !isNaN(dateObj.getTime());
    
    // In un-grouped mode, we show date on all major cards that start a new day
    // Or simpler: always show date/time on the left column for "Major" events
    const day = isValidDate ? dateObj.getDate() : '--';
    const month = isValidDate ? dateObj.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', '') : '';
    const time = isValidDate ? dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';

    let showReactivateButton = false;
    if (isSnapshot && event.originalId) {
        // Only show reactivate button if it's the LATEST cancellation for this ID
        if (isLatestCancellation) {
            showReactivateButton = true;
        }
    }

    // Determine if we should show the full date badge
    const showDateBadge = !isSameDay;

    return (
        <div className="flex gap-4 relative group">
            {/* Left Column: Date */}
            <div className="w-14 flex flex-col items-center pt-1 shrink-0">
                {showDateBadge ? (
                    <>
                        <span className="text-xl font-display font-bold text-gray-800 dark:text-gray-200 leading-none">{day}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{month}</span>
                    </>
                ) : (
                    <div className="h-6"></div>
                )}
                <span className={`text-[9px] text-gray-400 font-mono ${showDateBadge ? 'mt-1' : ''}`}>{time}</span>
            </div>

            {/* Center Column: Line & Node */}
            <div className="relative flex flex-col items-center">
                <div className="absolute top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-800 group-last:hidden"></div>
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm transition-transform group-hover:scale-110 ${styles.bg} ${styles.border} ${styles.color} dark:bg-opacity-10 dark:border-opacity-20`}>
                    <span className="material-icons text-sm">{styles.icon}</span>
                </div>
            </div>

            {/* Right Column: Content */}
            <div className={`flex-1 min-w-0 ${(isAppt || isSnapshot) ? 'pb-6' : 'pb-5'}`}>
                <div 
                    className={`
                        relative rounded-2xl border transition-all duration-300
                        ${(isAppt || isSnapshot) ? 'bg-white dark:bg-surface-dark shadow-sm hover:shadow-md cursor-pointer overflow-hidden' : 'bg-transparent border-transparent overflow-visible'}
                        ${(isAppt || isSnapshot) && isExpanded ? 'ring-1 ring-primary/20 border-primary/30' : (isAppt || isSnapshot) ? 'border-gray-200 dark:border-gray-700' : ''}
                        ${isImmutable && (isAppt || isSnapshot) ? 'bg-gray-50/50 dark:bg-black/10' : ''}
                    `}
                    onClick={() => (isAppt || isSnapshot) && setIsExpanded(!isExpanded)}
                >
                    {isImmutable && (isAppt || isSnapshot) && (
                        <div className="absolute top-2 right-2 z-20" title="Registro inmutable">
                            <span className="material-icons text-gray-300 dark:text-gray-600 text-xs">lock</span>
                        </div>
                    )}

                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${(isAppt || isSnapshot) ? 'p-3' : 'py-2'}`}>
                        <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center gap-2">
                                <h4 className={`text-sm font-bold truncate ${(isAppt || isSnapshot) ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} ${isImmutable && (isAppt || isSnapshot) ? 'opacity-70' : ''}`}>
                                    {event.title}
                                </h4>
                                {(isAppt || isSnapshot) && event.total > 150 && (
                                    <span className="text-[8px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold uppercase border border-yellow-200">High Value</span>
                                )}
                            </div>
                            
                            {!(isAppt || isSnapshot) ? (
                                <div className={`text-xs mt-1 leading-relaxed break-words text-gray-500 dark:text-gray-400`}>
                                    {event.subtitle && (
                                        <span className="inline-block bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 dark:text-gray-300 mb-1.5 border border-gray-200 dark:border-gray-700">
                                            {event.subtitle}
                                        </span>
                                    )}
                                    {event.details}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                    <span className="truncate max-w-[200px] text-gray-600 dark:text-gray-400">
                                        {(event.items || '').split(', ').length} Servicio(s) • {(event.items || '').split(', ')[0]}...
                                    </span>
                                </div>
                            )}
                        </div>

                        {(isAppt || isSnapshot) && (
                            <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                                {isSnapshot && showReactivateButton && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            reactivateArchivedAppointment(event.originalId, 'Reactivación desde historial');
                                        }}
                                        className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 text-white px-3 py-1 rounded shadow-md hover:bg-blue-700 transition-colors z-20"
                                    >
                                        <span className="material-icons text-[10px]">restore</span> Reactivar
                                    </button>
                                )}

                                <div className="text-right hidden sm:block">
                                    <span className={`block font-mono font-bold text-sm ${isImmutable ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-900 dark:text-white'}`}>${event.total}</span>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase border ${
                                    event.status === 'Finalized' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    event.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-100' :
                                    event.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                    event.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                    'bg-gray-50 text-gray-700 border-gray-100'
                                }`}>
                                    {event.status === 'In Progress' ? 'En Curso' : event.status === 'Pending' ? 'Pendiente' : event.status}
                                </span>
                                <span className={`material-icons text-gray-400 text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                            </div>
                        )}
                    </div>

                    {(isAppt || isSnapshot) && (
                        <div className={`grid transition-all duration-300 ease-in-out border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 ${isExpanded ? 'grid-rows-[1fr] opacity-100 p-4' : 'grid-rows-[0fr] opacity-0 h-0 p-0 overflow-hidden'}`}>
                            <div className="min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Detalle</h5>
                                    <div className="space-y-2">
                                        {(event.items || '').split(', ').map((item: string, i: number) => (
                                            <div key={i} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-surface-dark rounded-lg border border-gray-100 dark:border-gray-800 opacity-80">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{item}</span>
                                                <span className="text-gray-400 font-mono text-[10px]">--</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span className="text-xs font-bold text-gray-500">Total</span>
                                        <span className="font-display font-bold text-lg text-gray-600 dark:text-gray-400">${event.total.toFixed(2)}</span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 space-y-2">
                                        {event.scheduledDisplay ? (
                                            <div className="bg-white dark:bg-surface-dark rounded-lg p-2.5 border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100">
                                                        <span className="material-icons text-sm">event_available</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">Fecha Agendada</span>
                                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                            {event.scheduledDisplay.split('•')[0].trim()}
                                                            <span className="text-gray-300 mx-1 font-light">|</span>
                                                            {event.scheduledDisplay.split('•')[1] || ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-gray-400 italic px-1">Fecha original no disponible</div>
                                        )}
                                        {event.invoices && event.invoices.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                                {event.invoices.map((inv: any, idx: number) => (
                                                    <div key={idx} className="bg-white dark:bg-surface-dark rounded-lg p-2.5 border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-7 h-7 rounded flex items-center justify-center ${inv.status === 'Pagada' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                                <span className="material-icons text-sm">receipt_long</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">Factura</span>
                                                                <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">{inv.id}</span>
                                                            </div>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                                            inv.status === 'Pagada' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                            inv.status === 'Anulada' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                        }`}>
                                                            {inv.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-orange-400/80 italic flex items-center gap-1.5 bg-orange-50/50 dark:bg-orange-900/10 px-2 py-1.5 rounded border border-orange-100 dark:border-orange-900/20">
                                                <span className="material-icons text-[12px]">warning_amber</span> Sin factura vinculada
                                            </div>
                                        )}
                                    </div>
                                    {event.status === 'Cancelled' && !event.wasReactivated && !isSnapshot && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                reactivateArchivedAppointment(event.id, 'Restaurado desde historial');
                                            }}
                                            className="sm:hidden w-full mt-3 flex items-center justify-center gap-1 text-xs font-bold bg-blue-50 text-blue-600 px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                                        >
                                            <span className="material-icons text-sm">restore</span> Reactivar Cita
                                        </button>
                                    )}
                                </div>
                                <div className="md:border-l md:border-gray-200 md:dark:border-gray-700 md:pl-6">
                                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Progreso & Tiempos</h5>
                                    <div className="space-y-4 relative mb-6">
                                        <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                        {getEvolutionSteps(event.status, event.statusTimestamps).map((step) => (
                                            <div key={step.id} className="relative flex items-center justify-between gap-3 group/step">
                                                <div className="flex items-center gap-3">
                                                    <div className={`relative z-10 w-3 h-3 rounded-full border-2 
                                                        ${step.state === 'past' || step.state === 'current' ? 'bg-primary border-primary' : 
                                                        step.state === 'cancelled' ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300 dark:bg-surface-dark dark:border-gray-600'}
                                                    `}></div>
                                                    <p className={`text-xs font-bold ${
                                                        step.state === 'current' ? 'text-primary' : 
                                                        step.state === 'past' ? 'text-gray-700 dark:text-gray-300' :
                                                        step.state === 'cancelled' ? 'text-red-500 line-through' : 'text-gray-400'
                                                    }`}>
                                                        {step.label}
                                                    </p>
                                                </div>
                                                {step.time && (
                                                    <span className="text-[9px] font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-1">
                                                        <span className="material-icons text-[8px] opacity-50">schedule</span>
                                                        {step.time}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {event.internalLogs && event.internalLogs.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                                            <h5 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <span className="material-icons text-[10px]">history</span> Actividad Registrada
                                            </h5>
                                            <ul className="space-y-2">
                                                {event.internalLogs.map((log: any, i: number) => (
                                                    <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 items-start">
                                                        <span className="font-mono text-[10px] text-gray-400 min-w-[30px] pt-0.5">
                                                            {new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="leading-snug">{log.description.replace(/^Cita .*?: /, '')}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {isImmutable && (
                                        <p className="mt-4 text-[10px] text-gray-400 italic bg-gray-50 dark:bg-white/5 p-2 rounded border border-gray-100 dark:border-gray-800">
                                            Registro cerrado.{event.wasReactivated ? " (Ya utilizado)." : ""}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ClientTimeline: React.FC<ClientTimelineProps> = ({ clientId }) => {
    const { clientLogs, appointments, invoices, clients } = useData();
    const currentClient = useMemo(() => clients.find(c => c.id === clientId), [clients, clientId]);

    const timelineItems = useMemo(() => {
        // --- 1. Filter Raw Data ---
        const logs = clientLogs.filter(l => l.clientId === clientId);
        const appts = appointments.filter(a => a.clientId === clientId);
        const statusLogs = logs.filter(l => l.action.startsWith('status_change_'));
        const regularLogs = logs.filter(l => !l.action.startsWith('status_change_'));

        // Pre-calculation: Find Reactivation Events for determining snapshot positions
        const reactivationEvents = logs.filter(l => l.action === 'appointment_reactivated');

        // --- 2. Process LOGS (Always Historical) ---
        const logEvents = regularLogs.map(log => {
            let details: string | string[] = log.description;
            let eventType = 'log';
            let eventStatus = '';
            let eventItems = '';
            let eventTotal = 0;
            let eventTitle = '';
            let eventSubtitle = '';
            let eventWasReactivated = true;
            let isCompact = false;
            let isFinance = false;
            let isProfileEdit = false;
            let isPrivateNote = false;
            let isInteraction = false;
            let staticPhone = '';
            let originalApptId = '';
            let effectiveDateObj = new Date(log.timestamp);

            if (log.type === 'finance') {
                isFinance = true;
                details = [log.description];
            } else if (log.action === 'edit_profile') {
                isProfileEdit = true;
                if (log.description.includes('|')) {
                    details = [log.description];
                } else {
                    eventTitle = 'Datos Actualizados';
                    details = [log.description];
                }
            } else if (log.action === 'manual_note') {
                isPrivateNote = true;
                eventTitle = 'Nota Privada';
                details = log.description;
            } else if (log.action === 'appointment_cancelled') {
                try {
                    const snapshot = JSON.parse(log.description);
                    if (snapshot.snapshot) {
                        eventType = 'appointment_snapshot';
                        eventTitle = snapshot.title;
                        eventItems = snapshot.items;
                        eventTotal = snapshot.total;
                        eventStatus = 'Cancelled';
                        details = [];
                        eventWasReactivated = false;
                        originalApptId = snapshot.id;

                        // --- TIME TRAVEL LOGIC FOR CANCELLATION SNAPSHOT ---
                        const originalAppt = appointments.find(a => a.id === originalApptId);
                        
                        const priorReactivations = reactivationEvents
                            .filter(r => r.description.includes('Cita reactivada') && r.timestamp < log.timestamp)
                            .sort((a, b) => b.timestamp - a.timestamp); 

                        if (originalAppt) {
                            let baseTime = originalAppt.createdAt || 0; // T1
                            
                            if (priorReactivations.length > 0) {
                                // Use the latest reactivation time as the new "Creation Time" for this cycle
                                baseTime = priorReactivations[0].timestamp; 
                            }

                            if (baseTime > 0) {
                                effectiveDateObj = new Date(baseTime);
                            }
                        }
                    }
                } catch (e) {
                    eventTitle = 'Cita Cancelada';
                }
            } else if (['whatsapp', 'call', 'email'].includes(log.action)) {
                isInteraction = true;
                if (log.description.includes('|')) {
                    const parts = log.description.split('|');
                    eventTitle = parts[0];
                    details = parts[1];
                    if (parts[2]) eventSubtitle = parts[2];
                    if (parts[3]) staticPhone = parts[3];
                } else {
                    eventTitle = log.action === 'whatsapp' ? 'WhatsApp' : log.action === 'call' ? 'Llamada' : 'Email';
                    details = log.description;
                }
            } else {
                if (log.description.includes('|')) {
                    const parts = log.description.split('|');
                    eventTitle = parts[0];
                    details = parts[1];
                    if (parts[2]) eventSubtitle = parts[2];
                } else {
                    eventTitle = log.action === 'appointment_reactivated' ? 'Cita Reactivada' : 'Actividad';
                }
            }

            return {
                id: log.id,
                type: eventType,
                action: log.action,
                title: eventTitle,
                subtitle: eventSubtitle,
                details: details,
                dateObj: effectiveDateObj, // Use calculated date
                status: eventStatus,
                items: eventItems,
                total: eventTotal,
                wasReactivated: eventWasReactivated,
                originalId: originalApptId,
                isCompact: isCompact,
                isFinance: isFinance,
                isProfileEdit: isProfileEdit,
                isPrivateNote: isPrivateNote,
                isInteraction: isInteraction,
                destPhone: staticPhone || currentClient?.phone
            };
        });

        // --- 3. Process APPOINTMENTS ---
        const apptEvents = appts.map(apt => {
            let registrationDate = apt.createdAt ? new Date(apt.createdAt) : parseDateTime(apt.date, apt.time);
            
            // Logic: Find reactivation time to set effective date for sorting (Active Cards float to top)
            let latestReactivationTime = 0;
            if (apt.wasReactivated) {
                // Find the latest reactivation log for this specific appointment context
                const targetLog = reactivationEvents.sort((a, b) => b.timestamp - a.timestamp)[0];

                if (targetLog) {
                    latestReactivationTime = targetLog.timestamp;
                    // Add a larger buffer (1000ms) to ensure it sits ABOVE the Cancellation Snapshot and the Log itself
                    registrationDate = new Date(targetLog.timestamp + 1000);
                }
            }

            const scheduledDisplay = parseDateTime(apt.date, apt.time).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) + ' • ' + apt.time;
            const statusTimestamps: Record<string, number> = {};
            if (apt.createdAt) statusTimestamps['Pending'] = apt.createdAt;
            if (apt.wasReactivated && latestReactivationTime > 0) statusTimestamps['Pending'] = latestReactivationTime;

            const myStatusLogs = statusLogs.filter(l => l.description.includes(apt.id));
            myStatusLogs.forEach(l => {
                if (l.action === 'status_change_confirmed') statusTimestamps['Confirmed'] = l.timestamp;
                if (l.action === 'status_change_in_progress') statusTimestamps['In Progress'] = l.timestamp;
                if (l.action === 'status_change_finalized') statusTimestamps['Finalized'] = l.timestamp;
                if (l.action === 'status_change_cancelled') statusTimestamps['Cancelled'] = l.timestamp;
            });

            // Fill gaps in timestamps
            const stepsOrder = ['Pending', 'Confirmed', 'In Progress', 'Finalized'];
            let lastTs = statusTimestamps['Pending'];
            stepsOrder.forEach(step => {
                if (statusTimestamps[step]) lastTs = statusTimestamps[step];
                else {
                    const currentStatusIdx = stepsOrder.indexOf(apt.status);
                    const thisStepIdx = stepsOrder.indexOf(step);
                    if (thisStepIdx <= currentStatusIdx && thisStepIdx > -1) statusTimestamps[step] = lastTs;
                }
            });

            const linkedInvoices = invoices.filter(inv => inv.appointmentId === apt.id);

            // Filter out Cancelled/Finalized appointments from being "Live Cards"
            if (apt.status === 'Cancelled' || apt.status === 'Finalized') return null;

            return {
                id: apt.id,
                type: 'appointment_cycle',
                title: `Cita #${apt.id.split('-')[1] || apt.id}`,
                status: apt.status,
                items: (apt.items || []).map(i => i.title).join(', '),
                total: apt.total,
                dateObj: registrationDate,
                scheduledDisplay: scheduledDisplay,
                createdAt: apt.createdAt,
                wasReactivated: apt.wasReactivated,
                statusTimestamps: statusTimestamps,
                internalLogs: myStatusLogs.sort((a,b) => b.timestamp - a.timestamp), 
                invoices: linkedInvoices.map(inv => ({ id: inv.idDisplay, status: inv.status, amount: inv.amount })),
                specialist: apt.specialistName,
                // Missing properties to align with Log type for Union
                action: '',
                subtitle: '',
                details: '',
                originalId: undefined,
                isCompact: false,
                isFinance: false,
                isProfileEdit: false,
                isPrivateNote: false,
                isInteraction: false,
                destPhone: undefined
            };
        }).filter(Boolean); // Remove nulls

        // --- 4. MERGE & SORT ---
        return [...logEvents, ...apptEvents].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    }, [clientLogs, appointments, clientId, invoices, currentClient]); 

    // Calculate which snapshot is the latest for each appointment ID (To show Reactivate button only on latest)
    const latestSnapshotIds = useMemo(() => {
        const ids = new Set<string>();
        const seenAppts = new Set<string>();
        
        timelineItems.forEach(item => {
            if (item.type === 'appointment_snapshot' && item.originalId) {
                // Check if the REAL appointment is currently cancelled
                const realAppt = appointments.find(a => a.id === item.originalId);
                if (realAppt && realAppt.status === 'Cancelled') {
                     if (!seenAppts.has(item.originalId)) {
                        seenAppts.add(item.originalId);
                        ids.add(item.id);
                    }
                }
            }
        });
        return ids;
    }, [timelineItems, appointments]);

    return (
        <div className="max-w-3xl mx-auto pl-2 pr-4 py-4">
            {timelineItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <span className="material-icons text-4xl text-gray-300 mb-2">history_toggle_off</span>
                    <p className="text-sm font-medium text-gray-500">No hay historia registrada aún.</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    <div className="relative">
                        {/* Timeline Connector Line */}
                        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gray-200 dark:bg-gray-800 z-0"></div>

                        {timelineItems.map((evt: any, index: number) => {
                            const prevEvt = index > 0 ? timelineItems[index - 1] : null;
                            const isSameDay = prevEvt && 
                                prevEvt.dateObj.getDate() === evt.dateObj.getDate() &&
                                prevEvt.dateObj.getMonth() === evt.dateObj.getMonth() &&
                                prevEvt.dateObj.getFullYear() === evt.dateObj.getFullYear();

                            if (evt.isFinance) return <FinanceTransactionCard key={`fin-${evt.id}`} event={evt} />;
                            if (evt.isProfileEdit) return <ProfileChangesCard key={`prof-${evt.id}`} event={evt} />;
                            if (evt.isPrivateNote) return <PrivateNoteCard key={`note-${evt.id}`} event={evt} />;
                            if (evt.isInteraction) return <InteractionCard key={`chat-${evt.id}`} event={evt} />;

                            return evt.isCompact 
                                ? <CompactChangeCard key={`compact-${evt.id}`} event={evt} /> 
                                : <TimelineCard key={`${evt.type}-${evt.id}`} event={evt} isSameDay={isSameDay} isHistoric={true} isLatestCancellation={latestSnapshotIds.has(evt.id)} />;
                        })}
                    </div>

                    <div className="flex gap-4 opacity-40">
                        <div className="w-14 flex justify-center"><div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div></div>
                        <div className="pt-1 text-[10px] text-gray-400 uppercase tracking-wider">Inicio del registro</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientTimeline;