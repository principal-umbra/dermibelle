
import React, { useState, useMemo } from 'react';
import { useData, SupplierInvoice, Order, InvoiceHistoryEvent } from '../../context/DataContext';

interface SupplierInvoicesTabProps {
    supplierId: string;
}

const SupplierInvoicesTab: React.FC<SupplierInvoicesTabProps> = ({ supplierId }) => {
    const { supplierInvoices, addSupplierInvoice, updateSupplierInvoice, addToast, orders, updateCatalogItem, catalog, suppliers } = useData();
    
    // States
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false); // Point 4: Schedule Modal
    
    const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]); 
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
    
    // Schedule Date State
    const [scheduleDate, setScheduleDate] = useState('');

    // Form Data for New Bill
    const [newBill, setNewBill] = useState({
        displayId: '',
        date: new Date().toLocaleDateString('en-CA'),
        dueDate: '',
        amount: '',
        description: '',
        linkedOrderId: ''
    });

    const currentSupplier = suppliers.find(s => s.id === supplierId);

    // Filter invoices
    const invoices = supplierInvoices
        .filter(inv => inv.supplierId === supplierId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // --- AGING LOGIC ---
    const agingStats = useMemo(() => {
        const now = new Date();
        const stats = {
            current: 0,
            days30: 0,
            days60: 0,
            days90: 0,
            totalDue: 0
        };

        invoices.forEach(inv => {
            if (inv.status === 'Paid' || inv.status === 'Draft' || inv.status === 'Disputed') return;
            
            const due = new Date(inv.dueDate);
            const diffTime = now.getTime() - due.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            stats.totalDue += inv.amount;

            if (diffDays <= 0) stats.current += inv.amount;
            else if (diffDays <= 30) stats.days30 += inv.amount;
            else if (diffDays <= 60) stats.days60 += inv.amount;
            else stats.days90 += inv.amount;
        });
        return stats;
    }, [invoices]);

    const availableOrders = useMemo(() => {
        return orders.filter(o => 
            (o.supplierId === supplierId || o.clientName) && 
            (o.status === 'Placed' || o.status === 'In Transit' || o.status === 'Delivered' || o.status === 'Partially Received')
        );
    }, [orders, supplierId]);

    const addHistoryEvent = (inv: SupplierInvoice, action: string, note?: string): InvoiceHistoryEvent[] => {
        const newEvent: InvoiceHistoryEvent = {
            date: new Date().toISOString(),
            action,
            user: 'Elena G.', 
            note
        };
        return [newEvent, ...(inv.history || [])];
    };

    // --- Actions ---
    const handleRegisterBill = () => {
        if (!newBill.displayId || !newBill.amount || !newBill.dueDate) {
            addToast('error', 'Complete los campos obligatorios (*)');
            return;
        }

        const amountFloat = parseFloat(newBill.amount);
        let matchStatus: SupplierInvoice['matchStatus'] = 'Unlinked';
        let linkedOrder: Order | undefined;

        if (newBill.linkedOrderId) {
            linkedOrder = orders.find(o => o.id === newBill.linkedOrderId);
            if (linkedOrder) {
                if (Math.abs(linkedOrder.total - amountFloat) < 1.00) {
                    matchStatus = 'Matched';
                } else {
                    matchStatus = 'Discrepancy';
                }
            }
        }

        const initialStatus = matchStatus === 'Matched' ? 'Pending Approval' : (matchStatus === 'Discrepancy' ? 'Disputed' : 'Draft');

        const newInv: SupplierInvoice = {
            id: `SUP-INV-${Date.now()}`,
            supplierId,
            supplierName: linkedOrder?.clientName || 'Proveedor',
            displayId: newBill.displayId,
            date: newBill.date,
            dueDate: newBill.dueDate,
            amount: amountFloat,
            status: initialStatus,
            itemsDescription: newBill.description || (linkedOrder ? `Vinculada a ${linkedOrder.idDisplay}` : 'Gastos Varios'),
            linkedOrderId: newBill.linkedOrderId || undefined,
            matchStatus: matchStatus,
            discrepancyNotes: matchStatus === 'Discrepancy' ? `Monto factura ($${amountFloat}) difiere de Orden ($${linkedOrder?.total})` : undefined,
            history: [{ 
                date: new Date().toISOString(), 
                action: 'Created', 
                user: 'Elena G.', 
                note: `Creación inicial. Estado: ${initialStatus}` 
            }]
        };

        addSupplierInvoice(newInv);
        
        if (matchStatus === 'Matched') {
            addToast('success', 'Factura conciliada automáticamente (Matched).');
        } else if (matchStatus === 'Discrepancy') {
            addToast('info', 'Discrepancia detectada en montos.');
        } else {
            addToast('success', 'Factura borrador creada.');
        }

        setIsRegisterOpen(false);
        setNewBill({ displayId: '', date: new Date().toLocaleDateString('en-CA'), dueDate: '', amount: '', description: '', linkedOrderId: '' });
    };

    const handleApprove = (inv: SupplierInvoice) => {
        updateSupplierInvoice(inv.id, { 
            status: 'Approved',
            history: addHistoryEvent(inv, 'Approved', 'Aprobado para pago por Finanzas')
        });
        addToast('success', 'Factura aprobada.');
    };

    const handleDispute = (inv: SupplierInvoice) => {
        updateSupplierInvoice(inv.id, { 
            status: 'Disputed',
            history: addHistoryEvent(inv, 'Disputed', 'Marcado para revisión manual')
        });
        addToast('info', 'Factura en disputa.');
    };

    // Point 4: Schedule Payment Logic
    const handleSchedule = () => {
        if (selectedInvoice && scheduleDate) {
            updateSupplierInvoice(selectedInvoice.id, {
                status: 'Scheduled',
                scheduledDate: scheduleDate,
                history: addHistoryEvent(selectedInvoice, 'Scheduled', `Pago programado para ${scheduleDate}`)
            });
            addToast('success', `Pago programado para ${scheduleDate}`);
            setIsScheduleOpen(false);
            setSelectedInvoice(null);
            setScheduleDate('');
        }
    };

    const handlePayBill = () => {
        if (selectedInvoice) {
            updateSupplierInvoice(selectedInvoice.id, { 
                status: 'Paid',
                history: addHistoryEvent(selectedInvoice, 'Paid', 'Pago registrado manualmente')
            });
            
            if (selectedInvoice.linkedOrderId) {
                const order = orders.find(o => o.id === selectedInvoice.linkedOrderId);
                if (order && order.lines) {
                    order.lines.forEach(line => {
                        const product = catalog.find(p => p.id === line.itemId);
                        if (product && line.price > 0) {
                            updateCatalogItem(product.id, { cost: line.price });
                        }
                    });
                    addToast('success', 'Costos de inventario actualizados.');
                }
            } else {
                addToast('success', 'Pago registrado.');
            }

            setIsPayOpen(false);
            setSelectedInvoice(null);
        }
    };

    const isOverdue = (dateStr: string) => new Date(dateStr) < new Date();

    // Bulk Actions
    const handleSelectAll = () => {
        if (selectedIds.length === invoices.length) setSelectedIds([]);
        else setSelectedIds(invoices.map(i => i.id));
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(x => x !== id));
        else setSelectedIds(prev => [...prev, id]);
    };

    const handleBulkApprove = () => {
        const toApprove = invoices.filter(i => selectedIds.includes(i.id) && (i.status === 'Draft' || i.status === 'Pending Approval'));
        if (toApprove.length === 0) {
            addToast('info', 'No hay facturas elegibles.');
            return;
        }
        toApprove.forEach(inv => handleApprove(inv));
        setSelectedIds([]);
        addToast('success', `${toApprove.length} facturas aprobadas.`);
    };

    const handleExportStatement = () => {
        addToast('success', 'Estado de Cuenta descargado.');
    };

    // Point 11: Smart Suggestion Logic
    const getSmartSuggestion = (inv: SupplierInvoice) => {
        // Mock Logic: If terms are Net 30, suggest 2% discount if paid within 10 days
        const hasTerms = currentSupplier?.paymentTerms?.includes('Net');
        if (hasTerms && inv.status === 'Approved') {
            return (
                <div className="mt-2 bg-indigo-50 border border-indigo-100 p-2 rounded-lg flex items-center gap-2 animate-in fade-in">
                    <span className="material-icons text-indigo-600 text-sm">lightbulb</span>
                    <p className="text-[10px] text-indigo-800">
                        <strong>Smart Tip:</strong> Pagar antes del {new Date(new Date(inv.date).setDate(new Date(inv.date).getDate() + 10)).toLocaleDateString('es-ES', {month:'short', day:'numeric'})} para posible 2% descuento.
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-20">
            {/* AGING DASHBOARD */}
            <div className="grid grid-cols-4 gap-4 mb-2">
                <div className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Corriente</p>
                    <p className="text-xl font-mono font-bold text-green-600">${agingStats.current.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">1-30 Días</p>
                    <p className={`text-xl font-mono font-bold ${agingStats.days30 > 0 ? 'text-yellow-600' : 'text-gray-700'}`}>${agingStats.days30.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">31-60 Días</p>
                    <p className={`text-xl font-mono font-bold ${agingStats.days60 > 0 ? 'text-orange-600' : 'text-gray-700'}`}>${agingStats.days60.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">60+ Días</p>
                    <p className={`text-xl font-mono font-bold ${agingStats.days90 > 0 ? 'text-red-600' : 'text-gray-700'}`}>${agingStats.days90.toLocaleString()}</p>
                </div>
            </div>

            <div className="flex justify-between items-center bg-gray-50 dark:bg-black/20 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 pl-2">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.length === invoices.length && invoices.length > 0} 
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer w-4 h-4"
                        />
                        <span className="text-xs font-bold text-gray-500">Todo</span>
                    </div>
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <button onClick={handleBulkApprove} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold hover:bg-blue-200 transition-colors">
                                Aprobar ({selectedIds.length})
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleExportStatement}
                        className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 transition-all hover:bg-gray-50 text-xs font-bold"
                    >
                        <span className="material-icons text-sm">download</span>
                        Estado Cuenta
                    </button>
                    <button 
                        onClick={() => setIsRegisterOpen(true)}
                        className="bg-primary hover:bg-green-800 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-primary/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 text-xs font-bold"
                    >
                        <span className="material-icons text-sm">post_add</span>
                        Registrar
                    </button>
                </div>
            </div>

            {invoices.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons text-3xl text-gray-300">receipt_long</span>
                    </div>
                    <p className="text-gray-500 font-bold text-sm mb-2">No hay facturas pendientes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {invoices.map(inv => {
                        const overdue = (inv.status === 'Pending Approval' || inv.status === 'Approved') && isOverdue(inv.dueDate);
                        const isExpanded = expandedHistoryId === inv.id;
                        
                        return (
                            <div key={inv.id} className={`relative bg-white dark:bg-surface-dark rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all group flex flex-col ${selectedIds.includes(inv.id) ? 'border-primary ring-1 ring-primary' : 'border-gray-100 dark:border-gray-700'}`}>
                                
                                <div className="flex flex-col sm:flex-row p-4 items-center gap-4 relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0 z-10" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(inv.id)} 
                                            onChange={() => toggleSelect(inv.id)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer w-4 h-4"
                                        />
                                    </div>

                                    {/* Status Strip */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                        inv.status === 'Paid' ? 'bg-green-500' : 
                                        inv.status === 'Scheduled' ? 'bg-purple-500' :
                                        inv.status === 'Disputed' ? 'bg-red-500' :
                                        inv.status === 'Approved' ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}></div>

                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ml-6 sm:ml-0
                                        ${inv.status === 'Paid' ? 'bg-green-50 border-green-100 text-green-600' : 
                                        inv.status === 'Scheduled' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                                        inv.status === 'Disputed' ? 'bg-red-50 border-red-100 text-red-600' :
                                        inv.matchStatus === 'Matched' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                        'bg-gray-50 border-gray-100 text-gray-500'}
                                    `}>
                                        <span className="material-icons text-lg">
                                            {inv.status === 'Paid' ? 'check' : 
                                             inv.status === 'Scheduled' ? 'event' :
                                             inv.status === 'Disputed' ? 'gavel' : 
                                             inv.matchStatus === 'Matched' ? 'link' : 'description'}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0 text-center sm:text-left pl-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                            <h4 className="font-mono font-bold text-sm text-gray-900 dark:text-white">{inv.displayId}</h4>
                                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase w-fit mx-auto sm:mx-0 border ${
                                                inv.status === 'Approved' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                inv.status === 'Scheduled' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                inv.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' :
                                                inv.status === 'Disputed' ? 'bg-red-100 text-red-700 border-red-200' :
                                                'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}>
                                                {inv.status}
                                            </span>
                                            {inv.linkedOrderId && (
                                                <span className="text-[9px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold uppercase w-fit border border-purple-100 flex items-center gap-1">
                                                    <span className="material-icons text-[10px]">link</span> {orders.find(o=>o.id===inv.linkedOrderId)?.idDisplay || 'PO'}
                                                </span>
                                            )}
                                            {overdue && inv.status !== 'Paid' && <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold uppercase border border-red-100">Vencida</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{inv.itemsDescription}</p>
                                        
                                        {/* Point 11: Smart Tip */}
                                        {getSmartSuggestion(inv)}

                                        {/* Point 4: Scheduled Date Display */}
                                        {inv.status === 'Scheduled' && inv.scheduledDate && (
                                            <p className="text-[10px] text-purple-600 font-bold mt-1 bg-purple-50 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-purple-100">
                                                <span className="material-icons text-[10px]">event</span> Programado: {inv.scheduledDate}
                                            </p>
                                        )}
                                        
                                        {inv.discrepancyNotes && (
                                            <p className="text-[10px] text-red-500 font-bold mt-1 bg-red-50 inline-block px-1 rounded">{inv.discrepancyNotes}</p>
                                        )}
                                    </div>

                                    <div className="text-right flex flex-col items-end gap-2">
                                        <p className="font-mono font-bold text-lg text-gray-900 dark:text-white">${inv.amount.toFixed(2)}</p>
                                        
                                        <div className="flex gap-2">
                                            {(inv.status === 'Draft' || inv.status === 'Pending Approval') && (
                                                <>
                                                    <button onClick={() => handleDispute(inv)} className="text-[10px] px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100 transition-colors">Disputar</button>
                                                    <button onClick={() => handleApprove(inv)} className="text-[10px] px-3 py-1 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 transition-colors">Aprobar</button>
                                                </>
                                            )}
                                            
                                            {/* Point 4: Schedule Button */}
                                            {inv.status === 'Approved' && (
                                                <button 
                                                    onClick={() => { setSelectedInvoice(inv); setIsScheduleOpen(true); }}
                                                    className="text-[10px] px-2 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded hover:bg-purple-100 transition-colors flex items-center gap-1"
                                                >
                                                    <span className="material-icons text-[10px]">event</span> Programar
                                                </button>
                                            )}

                                            {(inv.status === 'Approved' || inv.status === 'Scheduled') && (
                                                <button 
                                                    onClick={() => { setSelectedInvoice(inv); setIsPayOpen(true); }}
                                                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-1"
                                                >
                                                    <span className="material-icons text-[12px]">payments</span> Pagar
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => setExpandedHistoryId(isExpanded ? null : inv.id)} 
                                                className={`p-1 rounded hover:bg-gray-100 transition-colors ${isExpanded ? 'text-primary bg-primary/5' : 'text-gray-400'}`}
                                                title="Ver Historial"
                                            >
                                                <span className="material-icons text-lg">history</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Audit Trail */}
                                {isExpanded && (
                                    <div className="bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 p-4 animate-in slide-in-from-top-2">
                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                            <span className="material-icons text-[12px]">history_edu</span> Historial de Auditoría
                                        </h5>
                                        <div className="space-y-3 pl-2 border-l border-gray-200 dark:border-gray-700 ml-1">
                                            {inv.history && inv.history.length > 0 ? (
                                                inv.history.map((evt, idx) => (
                                                    <div key={idx} className="relative pl-4">
                                                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{evt.action}</p>
                                                                {evt.note && <p className="text-[10px] text-gray-500 italic">"{evt.note}"</p>}
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] text-gray-400 font-mono">
                                                                    {new Date(evt.date).toLocaleDateString()} {new Date(evt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                </p>
                                                                <p className="text-[9px] text-gray-400 font-bold">{evt.user}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-400 italic pl-4">Sin registro histórico disponible.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* REGISTER MODAL */}
            {isRegisterOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsRegisterOpen(false)}>
                    <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Registrar Factura Proveedor</h3>
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
                                <label className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-1 block">Vincular Orden de Compra (Opcional)</label>
                                <select 
                                    className="w-full border border-blue-200 dark:border-blue-700 rounded-lg p-2 text-sm bg-white dark:bg-black/20"
                                    value={newBill.linkedOrderId}
                                    onChange={e => {
                                        const order = orders.find(o => o.id === e.target.value);
                                        setNewBill({
                                            ...newBill, 
                                            linkedOrderId: e.target.value,
                                            amount: order ? order.total.toString() : newBill.amount
                                        });
                                    }}
                                >
                                    <option value="">-- Selección Manual (Sin Orden) --</option>
                                    {availableOrders.map(order => (
                                        <option key={order.id} value={order.id}>
                                            {order.idDisplay} - ${order.total.toFixed(2)} ({order.status})
                                        </option>
                                    ))}
                                </select>
                                {newBill.linkedOrderId && (
                                    <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                                        <span className="material-icons text-[10px]">check_circle</span> 
                                        Se realizará validación automática de montos.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">N° Factura *</label>
                                <input className="w-full border rounded-lg p-2 text-sm dark:bg-black/20 dark:border-gray-600" value={newBill.displayId} onChange={e => setNewBill({...newBill, displayId: e.target.value})} placeholder="Ej: A-000123"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Fecha Emisión</label>
                                    <input type="date" className="w-full border rounded-lg p-2 text-sm dark:bg-black/20 dark:border-gray-600" value={newBill.date} onChange={e => setNewBill({...newBill, date: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Vencimiento *</label>
                                    <input type="date" className="w-full border rounded-lg p-2 text-sm dark:bg-black/20 dark:border-gray-600" value={newBill.dueDate} onChange={e => setNewBill({...newBill, dueDate: e.target.value})}/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Monto Total *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input type="number" step="0.01" className="w-full border rounded-lg pl-7 p-2 text-sm dark:bg-black/20 dark:border-gray-600 font-mono" value={newBill.amount} onChange={e => setNewBill({...newBill, amount: e.target.value})} placeholder="0.00"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Concepto / Notas</label>
                                <textarea className="w-full border rounded-lg p-2 text-sm dark:bg-black/20 dark:border-gray-600 h-20 resize-none" value={newBill.description} onChange={e => setNewBill({...newBill, description: e.target.value})} placeholder="Descripción breve..."/>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setIsRegisterOpen(false)} className="flex-1 py-2 text-gray-500 font-bold text-xs hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={handleRegisterBill} className="flex-1 py-2 bg-primary text-white rounded-lg font-bold text-xs hover:bg-green-800 shadow-lg shadow-primary/30">Guardar & Validar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SCHEDULE MODAL (Point 4) */}
            {isScheduleOpen && selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsScheduleOpen(false)}>
                    <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-icons text-3xl text-purple-600">event</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Programar Pago</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Asigna una fecha futura para el pago de <span className="font-bold">{selectedInvoice.displayId}</span>.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Fecha de Pago</label>
                                <input 
                                    type="date" 
                                    value={scheduleDate} 
                                    onChange={(e) => setScheduleDate(e.target.value)} 
                                    className="w-full border rounded-xl p-3 text-sm dark:bg-black/20 dark:border-gray-600"
                                />
                            </div>
                            <button 
                                onClick={handleSchedule} 
                                disabled={!scheduleDate}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Fecha
                            </button>
                        </div>
                        <button onClick={() => setIsScheduleOpen(false)} className="w-full mt-4 text-xs text-gray-400 font-bold hover:text-gray-600">Cancelar</button>
                    </div>
                </div>
            )}

            {/* PAY MODAL */}
            {isPayOpen && selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsPayOpen(false)}>
                    <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-icons text-3xl text-blue-600">payments</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirmar Pago</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Factura <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{selectedInvoice.displayId}</span>
                            </p>
                            <p className="text-2xl font-display font-bold text-primary mt-2">${selectedInvoice.amount.toFixed(2)}</p>
                            
                            {selectedInvoice.linkedOrderId && (
                                <p className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded mt-2 inline-block font-bold">
                                    <span className="material-icons text-[10px] align-middle">inventory</span> Actualizará Costos de Inventario
                                </p>
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            <button onClick={handlePayBill} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition-all">
                                Registrar Transferencia
                            </button>
                            <button onClick={handlePayBill} className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all dark:bg-transparent dark:border-gray-600 dark:text-gray-300">
                                Registrar Efectivo / Cheque
                            </button>
                        </div>
                        <button onClick={() => setIsPayOpen(false)} className="w-full mt-4 text-xs text-gray-400 font-bold hover:text-gray-600">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierInvoicesTab;
