
import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, useData, AppointmentItem } from '../../context/DataContext';

interface AppointmentFinanceProps {
    linkedInvoices: Invoice[];
    financeSummary: { total: number; paid: number; pending: number };
    totalSelectedToPay: number;
    showHistory: boolean;
    setShowHistory: (show: boolean) => void;
    onGenerateInvoice: () => void;
    paymentSelection: Record<string, { services: boolean; products: boolean }>;
    onToggleFullSelection: (id: string, select: boolean) => void;
    onToggleSelection: (id: string, part: 'services' | 'products') => void;
    paymentMethod: string;
    setPaymentMethod: (m: 'tarjeta' | 'efectivo' | 'transferencia') => void;
    cashTendered: string;
    setCashTendered: (val: string) => void;
    reference: string;
    setReference: (val: string) => void;
    onProcessPayment: () => void;
    isProcessing: boolean;
    appointmentId?: string;
    clientId?: string;
}

const AppointmentFinance: React.FC<AppointmentFinanceProps> = ({
    linkedInvoices, financeSummary, totalSelectedToPay, showHistory, setShowHistory,
    onGenerateInvoice, paymentSelection, onToggleFullSelection, onToggleSelection,
    paymentMethod, setPaymentMethod, cashTendered, setCashTendered, reference,
    setReference, onProcessPayment, isProcessing, appointmentId, clientId
}) => {
    const { checkReferenceExists, addToast, invoices, linkInvoiceToAppointment, unlinkAndVoidInvoice, appointments, catalog } = useData();

    // --- Local State for Management Modal ---
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [linkSearchTerm, setLinkSearchTerm] = useState('');
    const [unlinkConfirmId, setUnlinkConfirmId] = useState<string | null>(null);

    const [cardRef, setCardRef] = useState('');
    const [transferRef, setTransferRef] = useState('');

    // --- Check for Stock Issues (Blocking Finance) ---
    const hasStockIssues = useMemo(() => {
        if (!appointmentId) return false;
        const appt = appointments.find(a => a.id === appointmentId);
        if (!appt) return false;

        return appt.items.some(apptItem => {
             const catalogItem = catalog.find(i => i.id === apptItem.id);
             if (!catalogItem) return false;
             if (catalogItem.type === 'product') {
                 return (catalogItem.stock || 0) <= 0;
             }
             if (catalogItem.type === 'service' && catalogItem.recipe) {
                 return catalogItem.recipe.some(ing => {
                     const product = catalog.find(p => p.id === ing.id);
                     return product ? (product.stock || 0) <= 0 : false;
                 });
             }
             return false;
        });
    }, [appointmentId, appointments, catalog]);

    useEffect(() => {
        if (paymentMethod === 'tarjeta') {
            setReference(cardRef);
        } else if (paymentMethod === 'transferencia') {
            setReference(transferRef);
        } else {
            setReference('');
        }
    }, [paymentMethod]);

    const handleReferenceChange = (val: string) => {
        if (paymentMethod === 'tarjeta') {
            setCardRef(val);
        } else if (paymentMethod === 'transferencia') {
            setTransferRef(val);
        }
        setReference(val);
    };

    const currentRefValue = paymentMethod === 'tarjeta' ? cardRef : (paymentMethod === 'transferencia' ? transferRef : '');
    const isTransfer = paymentMethod === 'transferencia';
    const referenceLabel = paymentMethod === 'tarjeta' ? 'Cód. Autorización' : 'Datos de Transferencia';
    const referencePlaceholder = paymentMethod === 'tarjeta' ? 'Ej: 058921' : 'Banco, N° Cuenta, Beneficiario...';

    const handleConfirmPayment = () => {
        if (paymentMethod === 'tarjeta') {
            const cleanRef = reference.trim();
            if (!cleanRef) {
                addToast('error', 'Por favor, ingrese el código de autorización.');
                return;
            }
            if (checkReferenceExists(cleanRef, paymentMethod)) {
                addToast('error', 'Este código ya fue registrado previamente.');
                return;
            }
        } else if (isTransfer) {
            if (!reference.trim()) {
                addToast('error', 'Por favor, ingrese detalles de la transferencia.');
                return;
            }
        }
        onProcessPayment();
    };

    // --- Link/Unlink Logic ---
    
    // 1. Available Invoices to Link (Same client, Pending, Strictly Orphan)
    const availableInvoices = useMemo(() => {
        if (!isManageModalOpen || !clientId) return [];
        return invoices.filter(inv => {
            const isClientMatch = inv.clientId === clientId;
            // CRITICAL FIX: Ensure invoice is strictly orphan
            const isOrphan = !inv.appointmentId; 
            const isPending = inv.status === 'Pendiente'; 
            const isNotVoid = inv.status !== 'Anulada';
            
            const matchesSearch = inv.idDisplay.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
                                  inv.amount.toString().includes(linkSearchTerm) || 
                                  inv.service.toLowerCase().includes(linkSearchTerm.toLowerCase());
            
            return isClientMatch && isOrphan && isPending && isNotVoid && matchesSearch;
        });
    }, [invoices, isManageModalOpen, clientId, linkSearchTerm]);

    // 2. Active Invoices (Already linked to this appointment)
    // We use 'linkedInvoices' prop but filter out 'Anulada' just in case context hasn't refreshed yet visually
    const activeInvoices = useMemo(() => {
        return linkedInvoices.filter(i => i.status !== 'Anulada');
    }, [linkedInvoices]);

    const handleLinkInvoice = (invId: string) => {
        if (appointmentId) {
            linkInvoiceToAppointment(invId, appointmentId);
            // Don't close modal, allow multiple links
        }
    };

    const handleUnlinkClick = (invId: string, status: string) => {
        if (status === 'Pagada' || status === 'En Tránsito') {
            addToast('error', 'No se puede desvincular una factura pagada o en tránsito.');
            return;
        }
        setUnlinkConfirmId(invId);
    };

    const confirmUnlink = () => {
        if (unlinkConfirmId) {
            unlinkAndVoidInvoice(unlinkConfirmId);
            setUnlinkConfirmId(null);
        }
    };

    return (
        <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col lg:flex-row p-0 bg-transparent gap-6 overflow-hidden relative">
                            
            <div className="flex-[1.5] flex flex-col min-w-0 h-full overflow-hidden">
                
                <div className="px-1 py-3 flex justify-between items-center mb-2 shrink-0">
                    <div>
                        <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">Detalle de Cargos</h3>
                        <p className="text-xs text-gray-500">Selecciona los bloques de items a cobrar.</p>
                    </div>
                    <div className="flex gap-2">
                        {appointmentId && clientId && (
                            <button 
                                onClick={() => setIsManageModalOpen(true)}
                                className="bg-white dark:bg-surface-dark px-3 py-1.5 rounded-full shadow-sm text-[10px] font-bold text-primary hover:bg-primary/5 flex items-center gap-1.5 border border-primary/20 transition-all hover:pr-4 group"
                            >
                                <span className="material-icons text-xs group-hover:rotate-180 transition-transform duration-500">settings</span>
                                Gestionar Facturas
                            </button>
                        )}
                        {financeSummary.paid > 0 && (
                            <button 
                                onClick={() => setShowHistory(!showHistory)}
                                className="bg-white dark:bg-surface-dark px-3 py-1.5 rounded-full shadow-sm text-[10px] font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 border border-gray-100 dark:border-gray-800 transition-all hover:scale-105"
                            >
                                <span className="material-icons text-xs">{showHistory ? 'visibility_off' : 'history'}</span>
                                {showHistory ? 'Ocultar Historial' : 'Ver Pagados'} 
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pb-4 pr-1">
                    {linkedInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${hasStockIssues ? 'bg-red-50 text-red-300' : 'bg-gray-50 dark:bg-black/20 text-gray-300'}`}>
                                <span className="material-icons text-3xl">{hasStockIssues ? 'production_quantity_limits' : 'receipt_long'}</span>
                            </div>
                            <h3 className={`font-bold text-base mb-1 ${hasStockIssues ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                {hasStockIssues ? 'Facturación Bloqueada' : 'Sin facturas'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-4">
                                {hasStockIssues ? 'No hay stock suficiente para los servicios agendados. Reponga inventario o modifique la cita.' : 'No hay cargos generados para esta cita.'}
                            </p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={onGenerateInvoice}
                                    disabled={hasStockIssues}
                                    className={`px-4 py-2 text-white rounded-lg font-bold shadow-lg text-xs flex items-center gap-2 ${hasStockIssues ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-green-800 shadow-primary/20'}`}
                                >
                                    <span className="material-icons text-xs">{hasStockIssues ? 'block' : 'add_circle'}</span> Generar Orden
                                </button>
                                {appointmentId && clientId && (
                                    <button 
                                        onClick={() => setIsManageModalOpen(true)}
                                        className="px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-gray-50"
                                    >
                                        <span className="material-icons text-xs">link</span> Vincular Existente
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {linkedInvoices.map(inv => {
                                const breakdown = inv.paymentBreakdown;
                                const selection = paymentSelection[inv.id] || { services: false, products: false };
                                const isFullyPaid = inv.status === 'Pagada';
                                const isInTransit = inv.status === 'En Tránsito';
                                const isFullySelected = selection.services && selection.products;

                                // Dividimos los items reales para el detalle visual
                                const cleanItems = (inv.items || []).filter(Boolean);
                                const serviceItems = cleanItems.filter(i => i?.type === 'service');
                                const productItems = cleanItems.filter(i => i?.type === 'product');

                                if (isFullyPaid && !showHistory) return null;

                                return (
                                    <div key={inv.id} className={`bg-white dark:bg-surface-dark rounded-xl shadow-sm border transition-all duration-300 relative overflow-hidden group/card
                                        ${isFullyPaid ? 'opacity-70 border-gray-100 dark:border-gray-800 bg-gray-50/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
                                    `}>
                                        <div className="absolute top-0 left-0 w-full h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBDNSAzIDE1IDMgMjAgMTBWMGgtMjB6IiBmaWxsPSIjZjNmNGY2IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBDNSAzIDE1IDMgMjAgMTBWMGgtMjB6IiBmaWxsPSIjMTcyYTMzIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] bg-repeat-x opacity-50"></div>

                                        <div className="px-4 pt-5 pb-3 flex justify-between items-center bg-gray-50/50 dark:bg-black/10 border-b border-gray-100 dark:border-gray-800">
                                            <div className="flex gap-3 items-center">
                                                {!isFullyPaid && !isInTransit && (
                                                    <div 
                                                        onClick={() => onToggleFullSelection(inv.id, !isFullySelected)}
                                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all flex-shrink-0
                                                            ${isFullySelected 
                                                                ? 'bg-primary border-primary text-white shadow-sm scale-105' 
                                                                : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-primary'}
                                                        `}
                                                    >
                                                        <span className="material-icons text-xs font-bold">check</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-display font-bold text-base text-gray-900 dark:text-white tracking-tight">{inv.idDisplay}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase">{inv.date}</span>
                                                        {isFullyPaid && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">Liquidada</span>}
                                                        {isInTransit && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">En Tránsito</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Monto Total</p>
                                                <p className="font-mono font-bold text-lg text-gray-900 dark:text-white">${inv.amount.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="p-3 space-y-3">
                                            {/* BLOQUE SERVICIOS */}
                                            {serviceItems.length > 0 && (
                                                <div 
                                                    onClick={() => !breakdown?.servicesPaid && !isFullyPaid && !isInTransit && onToggleSelection(inv.id, 'services')}
                                                    className={`rounded-xl border transition-all cursor-pointer overflow-hidden
                                                        ${selection.services && !isFullyPaid && !isInTransit ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.02]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}
                                                        ${breakdown?.servicesPaid ? 'bg-gray-50/50 dark:bg-white/5 opacity-80' : ''}
                                                    `}
                                                >
                                                    <div className="px-3 py-2 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`material-icons text-sm ${selection.services ? 'text-primary' : 'text-gray-400'}`}>spa</span>
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${selection.services ? 'text-primary' : 'text-gray-500'}`}>Servicios</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">${breakdown?.servicesTotal.toFixed(2)}</span>
                                                            {breakdown?.servicesPaid && <span className="material-icons text-green-600 text-sm">check_circle</span>}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 space-y-2">
                                                        {serviceItems.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-600 dark:text-gray-400">{item.title} x{item.quantity || 1}</span>
                                                                <span className="font-medium text-gray-500">${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* BLOQUE PRODUCTOS */}
                                            {productItems.length > 0 && (
                                                <div 
                                                    onClick={() => !breakdown?.productsPaid && !isFullyPaid && !isInTransit && onToggleSelection(inv.id, 'products')}
                                                    className={`rounded-xl border transition-all cursor-pointer overflow-hidden
                                                        ${selection.products && !isFullyPaid && !isInTransit ? 'border-secondary ring-1 ring-secondary/20 bg-secondary/[0.02]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}
                                                        ${breakdown?.productsPaid ? 'bg-gray-50/50 dark:bg-white/5 opacity-80' : ''}
                                                    `}
                                                >
                                                    <div className="px-3 py-2 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`material-icons text-sm ${selection.products ? 'text-secondary' : 'text-gray-400'}`}>shopping_bag</span>
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${selection.products ? 'text-secondary' : 'text-gray-500'}`}>Productos</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">${breakdown?.productsTotal.toFixed(2)}</span>
                                                            {breakdown?.productsPaid && <span className="material-icons text-green-600 text-sm">check_circle</span>}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 space-y-2">
                                                        {productItems.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-600 dark:text-gray-400">{item.title} x{item.quantity || 1}</span>
                                                                <span className="font-medium text-gray-500">${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full lg:w-[380px] flex flex-col bg-[#1e293b] text-white flex-shrink-0 relative overflow-hidden rounded-[2rem] shadow-2xl border border-gray-700 lg:h-fit lg:max-h-[calc(100vh-200px)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="p-6 pb-2 flex-shrink-0 relative z-10 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">LIQUIDACIÓN ACTUAL</p>
                    <h2 className="text-5xl font-display font-bold text-white tracking-tight scale-y-110">
                        ${totalSelectedToPay.toFixed(2)}
                    </h2>
                    
                    <div className="h-6 mt-1 flex justify-center">
                        {totalSelectedToPay === 0 && financeSummary.pending > 0 && (
                            <p className="text-[10px] text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 rounded-full border border-orange-500/20">
                                <span className="material-icons text-[10px]">touch_app</span> Toca un bloque para cobrar
                            </p>
                        )}
                        {financeSummary.pending === 0 && (
                            <p className="text-[10px] text-green-400 flex items-center gap-1 bg-green-500/10 px-2 rounded-full border border-green-500/20">
                                <span className="material-icons text-[10px]">check_circle</span> Cuenta saldada
                            </p>
                        )}
                    </div>
                </div>

                <div className={`flex-1 px-6 pb-2 overflow-y-auto custom-scrollbar transition-all duration-300 ${totalSelectedToPay > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                    
                    <div className="bg-black/30 p-1 rounded-xl flex mb-4 border border-white/5">
                        {['tarjeta', 'efectivo', 'transferencia'].map(m => (
                            <button
                                key={m}
                                onClick={() => setPaymentMethod(m as any)}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5
                                    ${paymentMethod === m 
                                        ? 'bg-white text-gray-900 shadow-md' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                <span className="material-icons text-sm">
                                    {m === 'tarjeta' ? 'credit_card' : m === 'efectivo' ? 'payments' : 'account_balance'}
                                </span>
                                <span className="hidden sm:inline">{m}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {(paymentMethod === 'efectivo' || isTransfer) && (
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 animate-in fade-in zoom-in-95">
                                <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    <span>{isTransfer ? 'Monto Confirmado' : 'Efectivo Recibido'}</span>
                                    {!isTransfer && (
                                        <span className={parseFloat(cashTendered || '0') >= totalSelectedToPay ? 'text-green-400' : ''}>
                                            Cambio: ${Math.max(0, parseFloat(cashTendered || '0') - totalSelectedToPay).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">$</span>
                                    <input 
                                        type="number"
                                        value={cashTendered}
                                        onChange={e => setCashTendered(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-xl font-mono font-bold text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all text-right shadow-inner"
                                    />
                                </div>
                            </div>
                        )}

                        {(paymentMethod === 'tarjeta' || isTransfer) && (
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 animate-in fade-in zoom-in-95">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{referenceLabel}</label>
                                {isTransfer ? (
                                    <textarea 
                                        rows={3}
                                        value={currentRefValue}
                                        onChange={e => handleReferenceChange(e.target.value)}
                                        placeholder={referencePlaceholder}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-sm font-medium text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all shadow-inner resize-none leading-snug"
                                    />
                                ) : (
                                    <input 
                                        type="text"
                                        value={currentRefValue}
                                        onChange={e => handleReferenceChange(e.target.value)}
                                        placeholder={referencePlaceholder}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-3 px-3 text-base font-mono text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all uppercase tracking-wide text-center shadow-inner"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 mt-auto">
                    <button 
                        onClick={handleConfirmPayment}
                        disabled={
                            isProcessing || 
                            totalSelectedToPay <= 0 || 
                            (paymentMethod === 'efectivo' && parseFloat(cashTendered || '0') < totalSelectedToPay) ||
                            (paymentMethod === 'tarjeta' && reference.trim().length < 4) ||
                            (isTransfer && reference.trim().length === 0)
                        }
                        className={`group w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-white/5 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 overflow-hidden relative
                            ${isTransfer 
                                ? 'bg-orange-600 hover:bg-orange-500 text-white disabled:bg-gray-800 disabled:text-gray-500' 
                                : 'bg-white text-gray-900 hover:bg-gray-100 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed'}
                        `}
                    >
                        {!isTransfer && <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gray-200 to-transparent -translate-x-full group-hover:animate-shimmer opacity-20"></div>}
                        {isProcessing ? (
                            <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>{isTransfer ? 'Registrar Transferencia' : 'Confirmar Cobro'}</span>
                                <span className="material-icons text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* --- COMPLETE INVOICE MANAGEMENT MODAL --- */}
            {isManageModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Gestión de Facturación</h3>
                                <p className="text-xs text-gray-500">Administra las facturas vinculadas a la cita.</p>
                            </div>
                            <button onClick={() => setIsManageModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-400">
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                            
                            {/* SECTION 1: ACTIVE INVOICES */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="material-icons text-sm">link</span> Facturas Asociadas (Actuales)
                                </h4>
                                {activeInvoices.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-center">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay facturas vinculadas actualmente.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activeInvoices.map(inv => (
                                            <div key={inv.id} className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 
                                                        ${inv.status === 'Pagada' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        <span className="material-icons text-sm">{inv.status === 'Pagada' ? 'check' : 'receipt'}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900 dark:text-white text-sm">{inv.idDisplay}</span>
                                                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${inv.status === 'Pagada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                {inv.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5">Total: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">${inv.amount.toFixed(2)}</span> • {inv.items.length} items</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Unlink Action */}
                                                {(inv.status === 'Pendiente' || inv.status === 'Parcial') && (
                                                    <button 
                                                        onClick={() => handleUnlinkClick(inv.id, inv.status)}
                                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors flex items-center gap-1 group/btn"
                                                        title="Desvincular y Anular"
                                                    >
                                                        <span className="text-[10px] font-bold opacity-0 group-hover/btn:opacity-100 transition-opacity">Desvincular</span>
                                                        <span className="material-icons text-lg">link_off</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* SECTION 2: AVAILABLE INVOICES */}
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-icons text-sm">search</span> Disponibles para Vincular
                                    </h4>
                                </div>
                                
                                <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="relative mb-4">
                                        <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-sm">search</span>
                                        <input 
                                            type="text" 
                                            placeholder="Buscar factura por ID, monto o servicio..." 
                                            value={linkSearchTerm}
                                            onChange={e => setLinkSearchTerm(e.target.value)}
                                            className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                        />
                                    </div>

                                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-2">
                                        {availableInvoices.length === 0 ? (
                                            <div className="text-center py-6 text-gray-400 text-xs italic">
                                                {linkSearchTerm ? 'No se encontraron facturas coincidentes.' : 'No hay otras facturas pendientes disponibles para este cliente.'}
                                            </div>
                                        ) : (
                                            availableInvoices.map(inv => (
                                                <div key={inv.id} className="flex justify-between items-center p-3 bg-white dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors group">
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{inv.idDisplay}</p>
                                                        <p className="text-xs text-gray-500">{inv.date} • {inv.service}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono font-bold text-sm text-gray-800 dark:text-gray-200">${inv.amount.toFixed(2)}</span>
                                                        <button 
                                                            onClick={() => handleLinkInvoice(inv.id)}
                                                            className="bg-primary/10 hover:bg-primary hover:text-white text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                                        >
                                                            <span className="material-icons text-xs">add_link</span> Vincular
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                        
                        <div className="p-4 bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                            <button onClick={() => setIsManageModalOpen(false)} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-colors shadow-sm">
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- UNLINK CONFIRM MODAL --- */}
            {unlinkConfirmId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            <span className="material-icons text-2xl">link_off</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">¿Desvincular Factura?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            Al desvincular esta factura de la cita actual, su estado cambiará permanentemente a <strong className="text-red-600 dark:text-red-400">ANULADA</strong> y desaparecerá de la lista activa. ¿Estás seguro?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setUnlinkConfirmId(null)} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancelar</button>
                            <button onClick={confirmUnlink} className="px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm bg-red-600 hover:bg-red-700 transition-colors">Sí, Anular</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentFinance;
