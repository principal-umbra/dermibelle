
import React, { useState, useEffect, useMemo } from 'react';
import { useData, Invoice, Appointment } from '../../context/DataContext';

// --- Void Modal ---
export const VoidModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void }> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 dark:border-gray-700 transform scale-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 mx-auto">
                    <span className="material-icons text-2xl">warning</span>
                </div>
                <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">¿Anular Documento?</h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    Esta acción invalidará la factura y desvinculará cualquier cita asociada. <strong>No se puede deshacer.</strong>
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-sm font-bold transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 transition-colors">
                        Sí, Anular
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Quote Conversion Modal ---
export const QuoteConversionModal: React.FC<{ isOpen: boolean; onClose: () => void; invoice: Invoice | null }> = ({ isOpen, onClose, invoice }) => {
    const { appointments, addAppointment, linkInvoiceToAppointment, clients } = useData();
    const [mode, setMode] = useState<'link' | 'create'>('create');
    const [linkApptId, setLinkApptId] = useState('');
    const [createDate, setCreateDate] = useState('');
    const [createTime, setCreateTime] = useState('09:00');
    const [specialist, setSpecialist] = useState('Elena G.');

    useEffect(() => {
        if (isOpen) {
            setMode('create');
            setLinkApptId('');
            const today = new Date().toLocaleDateString('en-CA');
            setCreateDate(today);
            setCreateTime('09:00');
        }
    }, [isOpen]);

    if (!isOpen || !invoice) return null;

    const availableAppointments = appointments.filter(a => 
        a.clientId === invoice.clientId && 
        (a.status === 'Confirmed' || a.status === 'In Progress') && 
        !a.isArchived
    );

    const handleLink = () => {
        if (!linkApptId) return;
        linkInvoiceToAppointment(invoice.id, linkApptId);
        onClose();
    };

    const handleCreate = () => {
        if (!createDate || !createTime) return;
        const client = clients.find(c => c.id === invoice.clientId);
        
        const newApptId = addAppointment({
            clientId: invoice.clientId,
            clientName: invoice.client,
            client: invoice.client,
            clientAvatar: client?.avatar || null,
            avatar: null,
            service: invoice.service,
            items: invoice.items, 
            date: createDate,
            time: createTime,
            specialistName: specialist,
            total: invoice.amount,
            status: 'Confirmed', 
            notes: `Generada desde Cotización ${invoice.idDisplay}`
        });

        linkInvoiceToAppointment(invoice.id, newApptId);
        onClose();
    };

    const getDateParts = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return { day: '??', month: '???' };
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return {
            day: d.getDate(),
            month: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', '')
        };
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className={`bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all ${mode === 'link' ? 'max-w-2xl' : 'max-w-lg'}`} onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-indigo-50 dark:bg-indigo-900/20">
                    <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-100">Procesar Cotización</h3>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">Convierte la cotización en una cita o vincúlala.</p>
                </div>
                
                <div className="flex border-b border-gray-100 dark:border-gray-800">
                    <button onClick={() => setMode('create')} className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'create' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                        Crear Nueva Cita
                    </button>
                    <button onClick={() => setMode('link')} className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'link' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                        Vincular Existente
                    </button>
                </div>

                <div className="p-6">
                    {mode === 'create' ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Se creará una nueva cita <strong>CONFIRMADA</strong> para <strong>{invoice.client}</strong> con los items de esta cotización.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                                    <input type="date" value={createDate} onChange={e => setCreateDate(e.target.value)} className="w-full border rounded-lg p-2 text-sm dark:bg-black/20 dark:border-gray-600 dark:text-white"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora</label>
                                    <input type="time" value={createTime} onChange={e => setCreateTime(e.target.value)} className="w-full border rounded-lg p-2 text-sm dark:bg-black/20 dark:border-gray-600 dark:text-white"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Especialista</label>
                                <select value={specialist} onChange={e => setSpecialist(e.target.value)} className="w-full border rounded-lg p-2 text-sm dark:bg-black/20 dark:border-gray-600 dark:text-white">
                                    <option>Elena G.</option>
                                    <option>Jessica T.</option>
                                    <option>Sarah C.</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Selecciona una cita <strong>activa</strong> de <strong>{invoice.client}</strong> para asociar esta cotización.</p>
                            
                            {availableAppointments.length === 0 ? (
                                <div className="p-8 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                        <span className="material-icons">event_busy</span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No hay citas disponibles.</p>
                                    <p className="text-xs text-gray-400 mt-1">El cliente no tiene citas confirmadas o en proceso sin facturar.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {availableAppointments.map(appt => {
                                        const { day, month } = getDateParts(appt.date);
                                        const isSelected = linkApptId === appt.id;
                                        
                                        return (
                                            <div 
                                                key={appt.id} 
                                                onClick={() => setLinkApptId(appt.id)}
                                                className={`relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer gap-4 group ${
                                                    isSelected 
                                                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-md' 
                                                    : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300 bg-white dark:bg-surface-dark hover:shadow-md'
                                                }`}
                                            >
                                                <div className={`flex-shrink-0 w-14 h-14 rounded-lg border flex flex-col items-center justify-center shadow-sm transition-colors ${isSelected ? 'bg-white dark:bg-white/10 border-indigo-200' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-gray-600'}`}>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-0.5">{month}</span>
                                                    <span className={`text-xl font-bold leading-none ${isSelected ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-700 dark:text-white'}`}>{day}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate pr-2">
                                                        {appt.items.map(i => i.title).join(', ') || 'Servicios Varios'}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1"><span className="material-icons text-[10px]">schedule</span> {appt.time}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span>{appt.specialistName}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="font-mono bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600 dark:text-gray-300">ID: {appt.id}</span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                                            appt.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300'
                                                        }`}>
                                                            {appt.status === 'Confirmed' ? 'Confirmada' : 'En Proceso'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right flex flex-col items-end gap-2 pl-2">
                                                    <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">${appt.total}</span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                        isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 dark:border-gray-500 text-transparent'
                                                    }`}>
                                                        <span className="material-icons text-[12px] font-bold">check</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg">Cancelar</button>
                    {mode === 'create' ? (
                        <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md">
                            Crear y Vincular
                        </button>
                    ) : (
                        <button onClick={handleLink} disabled={!linkApptId} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                            Vincular
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Invoice Detail Modal ---
export const InvoiceDetailModal: React.FC<{ isOpen: boolean; onClose: () => void; invoice: Invoice | null }> = ({ isOpen, onClose, invoice: initialInvoice }) => {
    const { clients, addToast, unlinkAndVoidInvoice, invoices } = useData();
    const [showSendOptions, setShowSendOptions] = useState(false);
    const [isConversionOpen, setIsConversionOpen] = useState(false);
    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

    const invoice = useMemo(() => {
        return invoices.find(i => i.id === initialInvoice?.id) || initialInvoice;
    }, [invoices, initialInvoice]);

    useEffect(() => {
        if (!isOpen) {
            setShowSendOptions(false);
            setIsVoidModalOpen(false);
        }
    }, [isOpen]);

    const clientData = useMemo(() => {
        if (!invoice) return null;
        return clients.find(c => c.id === invoice.clientId);
    }, [invoice, clients]);

    if (!isOpen || !invoice) return null;

    const isPaid = invoice.status === 'Pagada';
    const isCancelled = invoice.status === 'Anulada';
    const isQuote = invoice.status === 'Cotización';
    const isInTransit = invoice.status === 'En Tránsito';

    const handlePrint = () => window.print();

    const handleVoidClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsVoidModalOpen(true);
    };

    const confirmVoid = () => {
        unlinkAndVoidInvoice(invoice.id);
        setIsVoidModalOpen(false);
        onClose(); 
    };

    const handleSendEmail = () => {
        if (!clientData?.email) {
            addToast('error', 'El cliente no tiene email registrado.');
            return;
        }
        const docType = isQuote ? 'Cotización' : 'Factura';
        const subject = `${docType} ${invoice.idDisplay} - Dermibelle Studio`;
        const body = `Hola ${clientData.name},\n\nAdjuntamos el detalle de su ${docType.toLowerCase()} ${invoice.idDisplay} por un total de $${invoice.amount.toFixed(2)}.\n\nGracias por su preferencia.\nDermibelle Studio`;
        window.location.href = `mailto:${clientData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setShowSendOptions(false);
    };

    const handleSendWhatsApp = () => {
        if (!clientData?.phone) {
            addToast('error', 'El cliente no tiene teléfono registrado.');
            return;
        }
        const docType = isQuote ? 'cotización' : 'factura';
        const phone = clientData.phone.replace(/\D/g, '');
        const text = `Hola ${clientData.name}, aquí tienes el detalle de tu ${docType} ${invoice.idDisplay} por $${invoice.amount.toFixed(2)}. Gracias por visitarnos en Dermibelle Studio.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
        setShowSendOptions(false);
    };

    // Calculate subtotal and discount display
    const subtotal = invoice.items?.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0) || invoice.amount;
    const discountData = invoice.discount;
    const discountAmount = discountData ? (discountData.type === 'percent' ? subtotal * (discountData.value / 100) : discountData.value) : 0;

    return (
        <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh] relative" onClick={e => { e.stopPropagation(); setShowSendOptions(false); }}>
                {/* Visual Status Bar */}
                <div className={`h-1.5 w-full ${isPaid ? 'bg-green-500' : isCancelled ? 'bg-red-500' : isQuote ? 'bg-indigo-500' : 'bg-yellow-500'}`}></div>
                
                {/* Header Actions */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                            <span className="material-icons text-sm">print</span> Imprimir
                        </button>
                        {isCancelled && (
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold border border-red-200 dark:border-red-800">
                                <span className="material-icons text-sm">cancel</span> ANULADA
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white dark:bg-surface-dark print:p-0">
                    <div className="max-w-2xl mx-auto">
                        
                        {/* Company & Document Info */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                            <div className="flex items-center gap-3">
                                <span className="material-icons text-primary text-5xl">spa</span>
                                <div>
                                    <h2 className="font-display font-bold text-2xl text-primary">Dermibelle Studio</h2>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Luxury Wellness & Beauty</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className={`font-display text-4xl font-bold mb-1 ${isCancelled ? 'text-red-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                    {isQuote ? 'COTIZACIÓN' : 'FACTURA'}
                                </h1>
                                <p className={`font-mono text-lg font-bold ${isQuote ? 'text-indigo-600' : 'text-primary'}`}>{invoice.idDisplay}</p>
                                <p className="text-sm text-gray-500 mt-2">Fecha: <span className="font-bold text-gray-700 dark:text-gray-300">{invoice.date}</span></p>
                            </div>
                        </div>

                        {/* Addresses Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 border-y border-gray-100 dark:border-gray-800 py-8">
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">De:</h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p className="font-bold text-gray-900 dark:text-white">Dermibelle Studio LLC</p>
                                    <p>123 Beauty Lane, Port Charlotte</p>
                                    <p>Florida, US 33952</p>
                                    <p>Tel: (941) 555-0123</p>
                                </div>
                            </div>
                            <div className="md:text-right">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Para:</h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p className="font-bold text-gray-900 dark:text-white">{invoice.client}</p>
                                    <p className="font-mono text-xs opacity-70">ID: {invoice.clientId}</p>
                                    <p>Cliente Registrado</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-12">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-gray-900 dark:border-gray-100">
                                    <tr>
                                        <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Descripción</th>
                                        <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {invoice.items && invoice.items.length > 0 ? (
                                        invoice.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="py-4">
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{item.quantity || 1} x ${item.price.toFixed(2)}</p>
                                                </td>
                                                <td className="py-4 text-right font-mono text-gray-800 dark:text-gray-200">
                                                    ${(item.price * (item.quantity || 1)).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="py-5">
                                                <p className="font-bold text-gray-900 dark:text-white text-base">{invoice.service}</p>
                                            </td>
                                            <td className="py-5 text-right font-mono font-bold text-gray-900 dark:text-white text-lg">
                                                ${subtotal.toFixed(2)}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Payment & Totals */}
                        <div className="flex flex-col md:flex-row justify-between gap-12">
                            <div className="flex-1">
                                {isPaid || isInTransit ? (
                                    <div className={`p-4 rounded-xl border ${isPaid ? 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-800' : 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-800'}`}>
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Conciliación de Pago</h4>
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <p className="text-gray-500 mb-1">Método:</p>
                                                <p className="font-bold text-gray-900 dark:text-white capitalize">{invoice.paymentMethod || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Referencia:</p>
                                                <p className="font-mono font-bold text-gray-900 dark:text-white uppercase">{invoice.transactionReference || 'Interna'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : isQuote ? (
                                    <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-900/10">
                                        <p className="text-xs text-indigo-800 dark:text-indigo-300 italic">Cotización válida por 30 días.</p>
                                    </div>
                                ) : isCancelled ? (
                                    <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                                        <p className="text-xs text-red-800 dark:text-red-300 font-bold">DOCUMENTO ANULADO</p>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                        <p className="text-xs text-gray-500 italic">Documento pendiente de cobro.</p>
                                    </div>
                                )}
                            </div>
                            <div className="w-full md:w-64 space-y-3">
                                {discountData && (
                                    <>
                                        <div className="flex justify-between items-center text-gray-500">
                                            <span className="text-sm">Subtotal</span>
                                            <span className="text-sm font-mono">${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                                            <span className="text-sm">Descuento {discountData.type === 'percent' ? `(${discountData.value}%)` : ''}</span>
                                            <span className="text-sm font-mono">-${discountAmount.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between items-center text-gray-500">
                                    <span className="text-sm">Impuestos (0%)</span>
                                    <span className="text-sm font-mono">$0.00</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-900 dark:border-gray-100">
                                    <span className="font-display font-bold text-xl text-gray-900 dark:text-white">TOTAL</span>
                                    <span className={`font-display font-bold text-2xl font-mono ${isQuote ? 'text-indigo-600' : 'text-primary'}`}>${invoice.amount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        {!isPaid && !isCancelled ? (
                            <button 
                                onClick={handleVoidClick} 
                                className="flex items-center gap-2 px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-bold transition-all"
                            >
                                <span className="material-icons text-sm">block</span>
                                Anular Documento
                            </button>
                        ) : (
                             <p className="text-[10px] text-gray-400 font-medium">© 2024 Dermibelle Studio.</p>
                        )}
                    </div>
                    
                    <div className="flex gap-3 items-center">
                        {isQuote && !isCancelled && (
                            <button onClick={() => setIsConversionOpen(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
                                <span className="material-icons text-sm">event_available</span> Vincular / Agendar
                            </button>
                        )}
                        <div className="relative">
                            {showSendOptions && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-20">
                                    <button onClick={(e) => { e.stopPropagation(); handleSendEmail(); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-gray-800">
                                        <span className="material-icons text-gray-400 text-sm">email</span> Por Correo
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors">
                                        <span className="material-icons text-green-500 text-sm">chat</span> Por WhatsApp
                                    </button>
                                </div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); setShowSendOptions(!showSendOptions); }} className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20 hover:bg-green-800 transition-all flex items-center gap-2">
                                <span>Enviar al Cliente</span>
                                <span className={`material-icons text-sm transition-transform duration-200 ${showSendOptions ? 'rotate-180' : ''}`}>expand_less</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <QuoteConversionModal isOpen={isConversionOpen} onClose={() => { setIsConversionOpen(false); onClose(); }} invoice={invoice} />
        <VoidModal isOpen={isVoidModalOpen} onClose={() => setIsVoidModalOpen(false)} onConfirm={confirmVoid} />
        </>
    );
};

// --- Confirm Transfer Modal ---
export const ConfirmTransferModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    onConfirm: (id: string, ref: string) => void;
    onReject: (id: string) => void;
}> = ({ isOpen, onClose, invoice, onConfirm, onReject }) => {
    const [refId, setRefId] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferDate, setTransferDate] = useState('');
    const [originBank, setOriginBank] = useState('');
    const [targetAccount, setTargetAccount] = useState('Cuenta Corriente - Bco Principal');
    const { addToast } = useData();

    useEffect(() => {
        if (isOpen && invoice) {
            setRefId(invoice.transactionReference || '');
            setTransferAmount(invoice.amount.toString());
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setTransferDate(now.toISOString().slice(0, 16));
            setOriginBank('');
            setTargetAccount('Cuenta Corriente - Bco Principal');
        }
    }, [isOpen, invoice]);

    if (!isOpen || !invoice) return null;

    const handleConfirm = () => {
        if (!refId.trim()) { addToast('error', 'El número de referencia/comprobante es obligatorio.'); return; }
        if (!transferAmount || parseFloat(transferAmount) !== invoice.amount) { addToast('error', `El monto transferido ($${transferAmount}) no coincide con el total de la factura ($${invoice.amount.toFixed(2)}).`); return; }
        if (!transferDate) { addToast('error', 'La fecha y hora de transferencia son obligatorias.'); return; }
        if (!originBank.trim()) { addToast('error', 'Debes especificar el Banco de Origen.'); return; }

        const finalCompositeRef = `${refId} (${originBank}) - ${new Date(transferDate).toLocaleDateString()}`;
        onConfirm(invoice.id, finalCompositeRef);
        onClose();
    };

    const handleReject = () => {
        onReject(invoice.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={e => e.stopPropagation()}>
            <div className="relative w-full max-w-lg bg-white dark:bg-surface-dark rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-orange-50 dark:bg-orange-900/10">
                    <h2 className="text-xl font-bold tracking-tight text-orange-900 dark:text-orange-100 flex items-center gap-2">
                        <span className="material-icons">verified</span>
                        Conciliar Transferencia
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/5 transition-colors text-orange-800 dark:text-orange-200">
                        <span className="material-icons">close</span>
                    </button>
                </div>
                
                <div className="p-6 space-y-5">
                    <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-4 border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Factura</p>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{invoice.idDisplay}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-500 uppercase">Monto Esperado</p>
                            <p className="font-mono font-bold text-lg text-primary">${invoice.amount.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">N° Referencia / Comprobante <span className="text-red-500">*</span></label>
                            <input type="text" value={refId} onChange={(e) => setRefId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 px-3 py-2.5 text-sm focus:ring-orange-500 focus:border-orange-500 font-mono tracking-wide" placeholder="Ej: 9988776655 (ID Tracking)"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Monto Recibido <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                <input type="number" step="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className={`w-full rounded-lg border px-3 pl-7 py-2.5 text-sm font-bold outline-none transition-colors ${parseFloat(transferAmount) === invoice.amount ? 'border-green-300 focus:border-green-500 bg-green-50/10 text-green-700' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 text-gray-900 focus:border-orange-500'}`}/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Fecha y Hora <span className="text-red-500">*</span></label>
                            <input type="datetime-local" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 px-3 py-2.5 text-sm focus:ring-orange-500 focus:border-orange-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Banco de Origen <span className="text-red-500">*</span></label>
                            <input type="text" value={originBank} onChange={(e) => setOriginBank(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 px-3 py-2.5 text-sm focus:ring-orange-500 focus:border-orange-500" placeholder="Ej: Chase, Wells Fargo..."/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Cuenta de Destino <span className="text-red-500">*</span></label>
                            <select value={targetAccount} onChange={(e) => setTargetAccount(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 px-3 py-2.5 text-sm focus:ring-orange-500 focus:border-orange-500">
                                <option>Cuenta Corriente - Bco Principal</option>
                                <option>Cuenta Ahorros - Secundaria</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-black/20 px-6 py-4 flex justify-between gap-3 border-t border-gray-100 dark:border-white/5">
                    <button onClick={handleReject} className="px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200">Rechazar Pago</button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors">Cancelar</button>
                        <button onClick={handleConfirm} className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center gap-2"><span className="material-icons text-sm">check_circle</span> Confirmar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Payment Modal ---
export const PaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onConfirm: (id: string, scope: 'services' | 'products' | 'total', method: string, txId?: string) => void;
}> = ({ isOpen, onClose, invoice, onConfirm }) => {
  const [paymentMethod, setPaymentMethod] = useState('tarjeta');
  const [paymentScope, setPaymentScope] = useState<'services' | 'products' | 'total'>('total');
  const [transactionId, setTransactionId] = useState('');
  const { checkReferenceExists, addToast } = useData();
  
  const breakdown = invoice?.paymentBreakdown;
  const canPayServices = breakdown ? !breakdown.servicesPaid && breakdown.servicesTotal > 0 : true;
  const canPayProducts = breakdown ? !breakdown.productsPaid && breakdown.productsTotal > 0 : true;
  const showSplitOptions = canPayServices && canPayProducts && (breakdown?.servicesTotal || 0) > 0 && (breakdown?.productsTotal || 0) > 0;

  useEffect(() => {
      if (isOpen) {
          setPaymentScope('total');
          setTransactionId('');
          setPaymentMethod('tarjeta');
      }
  }, [isOpen, invoice?.id]);

  if (!isOpen || !invoice) return null;

  const requiresTransactionId = paymentMethod === 'tarjeta' || paymentMethod === 'transferencia';
  const referenceLabel = paymentMethod === 'tarjeta' ? 'Cód. Autorización (Auth Code)' : 'N° Referencia / Comprobante';

  const getAmountToPay = () => {
      if (!invoice.paymentBreakdown) return invoice.amount;
      if (paymentScope === 'services') return invoice.paymentBreakdown.servicesTotal;
      if (paymentScope === 'products') return invoice.paymentBreakdown.productsTotal;
      let total = 0;
      if (!invoice.paymentBreakdown.servicesPaid) total += invoice.paymentBreakdown.servicesTotal;
      if (!invoice.paymentBreakdown.productsPaid) total += invoice.paymentBreakdown.productsTotal;
      return total;
  };

  const handleConfirm = () => {
      if (requiresTransactionId) {
          const cleanRef = transactionId.trim();
          if (!cleanRef) { addToast('error', 'Ingrese la referencia.'); return; }
          if (checkReferenceExists(cleanRef, paymentMethod)) { addToast('error', 'Referencia duplicada.'); return; }
      }
      onConfirm(invoice.id, paymentScope, paymentMethod, transactionId);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={e => e.stopPropagation()}>
      <div className="relative w-full max-w-lg bg-white dark:bg-surface-dark rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Registrar Pago</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"><span className="material-icons text-gray-400">close</span></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 dark:bg-[#152825] rounded-lg p-4 border border-gray-100 dark:border-white/5 flex justify-between items-center">
            <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">A cobrar</p>
                <p className="text-2xl font-display font-bold text-primary font-mono">${getAmountToPay().toFixed(2)}</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-500">Factura</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{invoice.idDisplay}</p>
            </div>
          </div>
          {showSplitOptions && (
              <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setPaymentScope('total')} className={`py-2 px-1 text-[10px] font-bold rounded border ${paymentScope === 'total' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-black/20 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>TOTAL</button>
                  <button onClick={() => setPaymentScope('services')} className={`py-2 px-1 text-[10px] font-bold rounded border ${paymentScope === 'services' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-black/20 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>SERVICIOS</button>
                  <button onClick={() => setPaymentScope('products')} className={`py-2 px-1 text-[10px] font-bold rounded border ${paymentScope === 'products' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-black/20 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>PRODUCTOS</button>
              </div>
          )}
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Método de Pago</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#152825] px-4 py-3 text-sm focus:ring-primary focus:border-primary">
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                  </select>
              </div>
              {requiresTransactionId && (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{referenceLabel}</label>
                      <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#152825] px-4 py-3 text-sm focus:ring-primary focus:border-primary" placeholder="Referencia..."/>
                  </div>
              )}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-black/20 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-white/5">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleConfirm} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-green-800 transition-all">Confirmar Pago</button>
        </div>
      </div>
    </div>
  );
};