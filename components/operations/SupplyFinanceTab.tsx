
import React, { useState, useMemo, useEffect } from 'react';
import { useData, SupplierInvoice } from '../../context/DataContext';
import PaymentModal, { PaymentData } from './PaymentModal';

const SupplyFinanceTab: React.FC = () => {
    const { supplierInvoices, addSupplierInvoice, updateSupplierInvoice, addToast, orders, suppliers } = useData();
    
    // UI States
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'attention' | 'approved' | 'paid'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = viewMode === 'grid' ? 9 : 10;

    // New Invoice Form State
    const [newInv, setNewInv] = useState({
        supplierId: '',
        displayId: '',
        date: new Date().toLocaleDateString('en-CA'),
        dueDate: '',
        amount: '',
        description: '',
        linkedOrderId: '',
        // Enhanced Fields
        subtotal: '',
        taxAmount: '',
        shippingCost: '',
        notes: '',
        category: 'Inventory',
        paymentMethod: 'Transfer'
    });

    // --- DATA PROCESSING ---

    // 1. Enrich & Sort
    const enrichedInvoices = useMemo(() => {
        return supplierInvoices.map(inv => {
            const supplier = suppliers.find(s => s.id === inv.supplierId);
            const linkedOrder = orders.find(o => o.id === inv.linkedOrderId);
            const isOverdue = inv.status !== 'Paid' && new Date(inv.dueDate) < new Date();
            
            // Auto-Calculate Match Diff
            let diff = 0;
            if (linkedOrder) {
                diff = inv.amount - linkedOrder.total;
            }

            return { 
                ...inv, 
                supplier, 
                linkedOrder, 
                isOverdue,
                diff,
                supplierInitials: supplier?.companyName ? supplier.companyName.substring(0,2).toUpperCase() : 'UNK'
            };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [supplierInvoices, suppliers, orders]);

    // 2. Filter Logic
    const filteredInvoices = useMemo(() => {
        return enrichedInvoices.filter(inv => {
            if (filterStatus === 'all') return true;
            if (filterStatus === 'attention') return ['Draft', 'Disputed', 'Overdue'].includes(inv.status) || inv.isOverdue || inv.matchStatus === 'Discrepancy';
            if (filterStatus === 'approved') return inv.status === 'Approved' || inv.status === 'Pending Approval';
            if (filterStatus === 'paid') return inv.status === 'Paid';
            return true;
        });
    }, [enrichedInvoices, filterStatus]);

    // Pagination Logic
    const paginatedInvoices = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredInvoices, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus]);

    // 3. Stats Calculation
    const stats = useMemo(() => {
        const totalPayable = enrichedInvoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + i.amount, 0);
        const criticalCount = enrichedInvoices.filter(i => i.isOverdue || i.matchStatus === 'Discrepancy').length;
        const approvedAmount = enrichedInvoices.filter(i => i.status === 'Approved').reduce((acc, i) => acc + i.amount, 0);
        return { totalPayable, criticalCount, approvedAmount };
    }, [enrichedInvoices]);

    const selectedInvoice = useMemo(() => 
        enrichedInvoices.find(i => i.id === selectedInvoiceId), 
    [enrichedInvoices, selectedInvoiceId]);

    // Is current selection a Purchase Order (Draft/Active) or a Real Invoice?
    // User Mapping: Placed -> Pending Approval, In Transit -> Approved.
    // These statuses must be treated as POs.
    const PO_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'In Transit', 'Disputed'];
    const isPurchaseOrder = selectedInvoice && PO_STATUSES.includes(selectedInvoice.status);
    const isCancelled = selectedInvoice?.status === 'Cancelled';

    // Available Orders for Linking
    const availableOrders = useMemo(() => {
        if (!newInv.supplierId) return [];
        const sup = suppliers.find(s => s.id === newInv.supplierId);
        if (!sup) return [];
        // Show orders that match the supplier name/ID
        return orders.filter(o => 
            (o.supplierId === newInv.supplierId || o.clientName === sup.companyName) && 
            o.status !== 'Draft' && 
            o.status !== 'Cancelled'
        );
    }, [orders, newInv.supplierId, suppliers]);


    // --- EFFECTS ---
    
    // Sync Invoice Status with Order Status
    useEffect(() => {
        supplierInvoices.forEach(inv => {
            if (inv.linkedOrderId && inv.status !== 'Paid' && inv.status !== 'Cancelled') {
                const order = orders.find(o => o.id === inv.linkedOrderId);
                if (order) {
                    let newStatus: SupplierInvoice['status'] | undefined;
                    
                    // Mapping:
                    // Order: Delivered/Completed -> Invoice: Sent (Becomes Invoice)
                    // Order: In Transit -> Invoice: Approved (PO Approved)
                    // Order: Placed/Pending -> Invoice: Pending Approval (PO Pending)
                    
                    if (['Delivered', 'Completed'].includes(order.status)) {
                        if (inv.status !== 'Sent' && inv.status !== 'Scheduled' && inv.status !== 'Overdue') {
                            newStatus = 'Sent';
                        }
                    } else if (['In Transit', 'Shipped'].includes(order.status)) {
                        if (inv.status !== 'Approved') newStatus = 'Approved';
                    } else if (['Placed', 'Pending Approval'].includes(order.status)) {
                        if (inv.status !== 'Pending Approval') newStatus = 'Pending Approval';
                    }

                    if (newStatus) {
                        updateSupplierInvoice(inv.id, { status: newStatus });
                    }
                }
            }
        });
    }, [orders, supplierInvoices, updateSupplierInvoice]);

    // Auto-set Due Date based on Supplier Terms
    useEffect(() => {
        if (newInv.supplierId && newInv.date) {
            const supplier = suppliers.find(s => s.id === newInv.supplierId);
            if (supplier?.paymentTerms) {
                const daysMatch = supplier.paymentTerms.match(/\d+/);
                if (daysMatch) {
                    const days = parseInt(daysMatch[0]);
                    const date = new Date(newInv.date);
                    date.setDate(date.getDate() + days);
                    setNewInv(prev => ({ ...prev, dueDate: date.toISOString().split('T')[0] }));
                }
            }
        }
    }, [newInv.supplierId, newInv.date, suppliers]);

    const selectedLinkedOrder = useMemo(() => orders.find(o => o.id === newInv.linkedOrderId), [orders, newInv.linkedOrderId]);

    // --- HANDLERS ---

    const handleRegister = () => {
        if (!newInv.supplierId || !newInv.amount || !newInv.displayId) {
            addToast('error', 'Faltan campos obligatorios');
            return;
        }

        const finalAmount = parseFloat(newInv.amount);
        let matchStatus: SupplierInvoice['matchStatus'] = 'Unlinked';
        let discrepancyNote = undefined;
        
        // Logic: 3-Way Match Check
        if (newInv.linkedOrderId) {
            const order = orders.find(o => o.id === newInv.linkedOrderId);
            if (order) {
                // Tolerance of $1
                const diff = finalAmount - order.total;
                if (Math.abs(diff) < 1.00) {
                    matchStatus = 'Matched';
                } else {
                    matchStatus = 'Discrepancy';
                    discrepancyNote = `Diferencia de monto: $${diff.toFixed(2)} vs Orden #${order.idDisplay}`;
                }
            }
        }

        // Determine initial status based on Linked Order Status
        let initialStatus: SupplierInvoice['status'] = 'Draft';
        if (newInv.linkedOrderId) {
            const order = orders.find(o => o.id === newInv.linkedOrderId);
            if (order) {
                if (['Delivered', 'Completed'].includes(order.status)) {
                    initialStatus = 'Sent'; // Becomes Invoice
                } else if (['In Transit', 'Shipped'].includes(order.status)) {
                    initialStatus = 'Approved'; // PO Approved
                } else if (['Placed', 'Pending Approval'].includes(order.status)) {
                    initialStatus = 'Pending Approval'; // PO Pending
                } else if (['Partially Received'].includes(order.status)) {
                    initialStatus = 'Partially Received';
                } else {
                    initialStatus = 'Draft';
                }
            }
        } else {
             // Manual entry without order is typically a direct invoice or draft PO
             initialStatus = 'Pending Approval';
        }

        if (matchStatus === 'Discrepancy') {
            initialStatus = 'Disputed';
        }

        const newInvoiceData: SupplierInvoice = {
            id: `SUP-INV-${Date.now()}`,
            supplierId: newInv.supplierId,
            supplierName: suppliers.find(s => s.id === newInv.supplierId)?.companyName || 'Desconocido',
            displayId: newInv.displayId,
            date: newInv.date,
            dueDate: newInv.dueDate || newInv.date,
            amount: finalAmount,
            status: initialStatus,
            itemsDescription: newInv.description || 'Gastos operativos',
            linkedOrderId: newInv.linkedOrderId || undefined,
            matchStatus: matchStatus,
            discrepancyNotes: discrepancyNote,
            history: [{ date: new Date().toISOString(), action: 'Created', user: 'Admin', note: 'Registro Manual' }],
            
            // Enhanced Fields
            subtotal: newInv.subtotal ? parseFloat(newInv.subtotal) : finalAmount,
            taxAmount: newInv.taxAmount ? parseFloat(newInv.taxAmount) : 0,
            shippingCost: newInv.shippingCost ? parseFloat(newInv.shippingCost) : 0,
            notes: newInv.notes,
            category: newInv.category,
            paymentMethod: newInv.paymentMethod
        };

        addSupplierInvoice(newInvoiceData);
        
        if (matchStatus === 'Discrepancy') {
            addToast('info', 'Documento creado con discrepancia. Requiere revisión.');
        } else if (matchStatus === 'Matched') {
            addToast('success', 'Documento conciliado correctamente.');
        } else {
            addToast('success', 'Documento registrado exitosamente.');
        }
        
        setIsRegisterOpen(false);
        setNewInv({ 
            supplierId: '', displayId: '', date: new Date().toLocaleDateString('en-CA'), dueDate: '', amount: '', description: '', linkedOrderId: '',
            subtotal: '', taxAmount: '', shippingCost: '', notes: '', category: 'Inventory', paymentMethod: 'Transfer'
        });
    };

    const handleUpdateStatus = (id: string, status: SupplierInvoice['status']) => {
        const updates: Partial<SupplierInvoice> = { status };
        if (status === 'Paid') {
            // Open Payment Modal instead of direct update
            setIsPaymentModalOpen(true);
            return;
        }
        updateSupplierInvoice(id, updates);
        addToast('success', `Estado actualizado a: ${status}`);
        if (status === 'Cancelled') setSelectedInvoiceId(null);
    };

    const handleProcessPayment = (data: PaymentData) => {
        if (!selectedInvoiceId) return;

        updateSupplierInvoice(selectedInvoiceId, {
            status: 'Paid',
            paymentDate: data.date,
            paymentMethod: data.method,
            transactionReference: data.reference,
            notes: data.notes ? `${selectedInvoice?.notes || ''}\n[Pago]: ${data.notes}` : selectedInvoice?.notes
        });

        addToast('success', 'Pago registrado correctamente');
        setIsPaymentModalOpen(false);
        // Keep the invoice view open to show the updated status
    };

    const handleManualConvert = (id: string) => {
        const invoice = supplierInvoices.find(i => i.id === id);
        if (!invoice) return;
        
        let updates: Partial<SupplierInvoice> = { status: 'Pending Approval' };
        
        // Fix data if missing (Subtotal/Shipping)
        if (invoice.linkedOrderId && (!invoice.subtotal || invoice.subtotal === invoice.amount)) {
             const order = orders.find(o => o.id === invoice.linkedOrderId);
             if (order && order.lines) {
                 const subtotal = order.lines.reduce((acc, line) => acc + (line.price * line.qty), 0);
                 // Try to get shipping from order, or infer from difference
                 const shipping = (order.shippingCost !== undefined) 
                    ? order.shippingCost 
                    : (invoice.amount - subtotal - (invoice.taxAmount || 0));
                 
                 updates = {
                     ...updates,
                     subtotal: subtotal,
                     shippingCost: Math.max(0, shipping)
                 };
             }
        }

        updateSupplierInvoice(id, updates);
        addToast('success', 'Orden convertida a Factura (Pendiente de Pago).');
    };

    // --- VISUAL HELPERS ---
    const getStatusColor = (status: string, isOverdue: boolean) => {
        if (status === 'Cancelled') return 'bg-gray-100 text-gray-400 border-gray-200 line-through';
        if (isOverdue) return 'bg-red-100 text-red-700 border-red-200';
        
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Approved': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Pending Approval': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            
            // PO Statuses
            case 'Draft': return 'bg-gray-100 text-gray-600 border-gray-200 dashed';
            case 'Sent': return 'bg-sky-100 text-sky-700 border-sky-200';
            case 'In Transit': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'Partially Received': return 'bg-orange-50 text-orange-700 border-orange-200';
            
            case 'Disputed': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-background-dark relative overflow-hidden">
            
            {/* 1. HERO HEADER (Fintech Style) */}
            <div className="bg-[#1e1b4b] dark:bg-black p-8 pb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shrink-0">
                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">Cuentas por Pagar</h1>
                    <p className="text-indigo-200 text-sm">Gestión centralizada de facturación de proveedores.</p>
                </div>

                <button 
                    onClick={() => setIsRegisterOpen(true)}
                    className="relative z-10 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95"
                >
                    <span className="material-icons text-sm">add</span> Registrar Factura
                </button>
            </div>

            {/* 2. FLOATING STATS DECK */}
            <div className="px-6 -mt-10 relative z-20 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pendiente</span>
                    <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white">${stats.totalPayable.toLocaleString()}</span>
                </div>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 flex flex-col relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-blue-500/10 rounded-bl-full"></div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Aprobado (Listo Pago)</span>
                    <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">${stats.approvedAmount.toLocaleString()}</span>
                </div>
                <div className={`p-4 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border flex flex-col relative overflow-hidden ${stats.criticalCount > 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-700'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${stats.criticalCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>Atención Requerida</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-2xl font-mono font-bold ${stats.criticalCount > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{stats.criticalCount}</span>
                        <span className="text-xs text-gray-500">docs</span>
                    </div>
                </div>
            </div>

            {/* 3. FILTER TABS & VIEW TOGGLE */}
            <div className="px-6 mt-6 mb-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
                    {[
                        { id: 'all', label: 'Todas' },
                        { id: 'attention', label: 'Requiere Atención', icon: 'error' },
                        { id: 'approved', label: 'Por Pagar' },
                        { id: 'paid', label: 'Historial Pagos' }
                    ].map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2
                                ${filterStatus === tab.id 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                    : 'bg-white dark:bg-surface-dark text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-50'}
                            `}
                        >
                            {tab.icon && <span className="material-icons text-[14px]">{tab.icon}</span>}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {/* Mini Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center bg-white dark:bg-surface-dark rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500"
                            >
                                <span className="material-icons text-sm">chevron_left</span>
                            </button>
                            <span className="text-[10px] font-bold text-gray-500 px-2 min-w-[40px] text-center">
                                {currentPage} / {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500"
                            >
                                <span className="material-icons text-sm">chevron_right</span>
                            </button>
                        </div>
                    )}

                    {/* View Toggle */}
                    <div className="flex bg-white dark:bg-surface-dark rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                         <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Vista Cuadrícula"
                        >
                             <span className="material-icons text-lg">grid_view</span>
                         </button>
                         <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Vista Lista"
                        >
                             <span className="material-icons text-lg">view_list</span>
                         </button>
                    </div>
                </div>
            </div>

            {/* 4. MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
                {filteredInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <span className="material-icons text-5xl mb-2 opacity-30">filter_none</span>
                        <p className="text-sm font-medium">No hay facturas en esta vista.</p>
                    </div>
                ) : (
                    <>
                    {viewMode === 'grid' ? (
                        /* --- GRID VIEW --- */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {paginatedInvoices.map(inv => (
                                <div 
                                    key={inv.id} 
                                    onClick={() => setSelectedInvoiceId(inv.id)}
                                    className={`bg-white dark:bg-surface-dark rounded-2xl p-4 border transition-all cursor-pointer relative group hover:shadow-md
                                        ${selectedInvoiceId === inv.id ? 'ring-2 ring-indigo-500 border-transparent' : 'border-gray-100 dark:border-gray-700 hover:border-indigo-200'}
                                        ${inv.status === 'Draft' ? 'border-dashed border-gray-300 bg-gray-50/50' : ''}
                                    `}
                                >
                                    {/* Top Row */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                                {inv.supplierInitials}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[120px]" title={inv.supplierName}>{inv.supplierName}</h3>
                                                <p className="text-[10px] text-gray-500 font-mono">{inv.displayId}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">${inv.amount.toLocaleString()}</p>
                                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusColor(inv.status, inv.isOverdue)}`}>
                                                {inv.status === 'Draft' ? 'ORDEN COMPRA' : 
                                                 inv.status === 'Sent' ? 'POR PAGAR' :
                                                 inv.status === 'Partially Received' ? 'PARCIAL' :
                                                 inv.status === 'Pending Approval' ? 'POR APROBAR' :
                                                 inv.status === 'Approved' ? 'APROBADA' :
                                                 inv.status === 'Paid' ? 'PAGADA' :
                                                 (inv.isOverdue ? 'Vencida' : inv.status)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle Row: Match Status */}
                                    <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-2.5 mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-icons text-sm ${inv.matchStatus === 'Matched' ? 'text-green-500' : inv.matchStatus === 'Discrepancy' ? 'text-red-500' : 'text-gray-400'}`}>
                                                {inv.matchStatus === 'Matched' ? 'link' : inv.matchStatus === 'Discrepancy' ? 'link_off' : 'link'}
                                            </span>
                                            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
                                                {inv.linkedOrder ? `Orden #${inv.linkedOrder.idDisplay}` : 'Sin Orden'}
                                            </span>
                                        </div>
                                        {inv.matchStatus === 'Discrepancy' && (
                                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                                                Dif: ${inv.diff?.toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Bottom Row: Date & Action Hint */}
                                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                                        <span>Vence: {new Date(inv.dueDate).toLocaleDateString()}</span>
                                        <span className="group-hover:text-indigo-500 transition-colors flex items-center gap-1">
                                            Ver Detalle <span className="material-icons text-[10px]">arrow_forward</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* --- LIST VIEW --- */
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-gray-700 text-[10px] uppercase font-bold text-gray-400">
                                    <tr>
                                        <th className="px-6 py-3">Estado</th>
                                        <th className="px-6 py-3">ID Documento</th>
                                        <th className="px-6 py-3">Proveedor</th>
                                        <th className="px-6 py-3">Vencimiento</th>
                                        <th className="px-6 py-3">Conciliación</th>
                                        <th className="px-6 py-3 text-right">Monto</th>
                                        <th className="px-6 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                    {paginatedInvoices.map(inv => (
                                        <tr 
                                            key={inv.id} 
                                            onClick={() => setSelectedInvoiceId(inv.id)}
                                            className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group ${selectedInvoiceId === inv.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                        >
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(inv.status, inv.isOverdue)}`}>
                                                    {inv.status === 'Draft' ? 'ORDEN COMPRA' : 
                                                     inv.status === 'Sent' ? 'POR PAGAR' :
                                                     inv.status === 'Partially Received' ? 'PARCIAL' :
                                                     inv.status === 'Pending Approval' ? 'POR APROBAR' :
                                                     inv.status === 'Approved' ? 'APROBADA' :
                                                     inv.status === 'Paid' ? 'PAGADA' :
                                                     (inv.isOverdue ? 'Vencida' : inv.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 font-mono font-bold text-gray-700 dark:text-gray-300">
                                                {inv.displayId}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                        {inv.supplierInitials}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{inv.supplierName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-gray-500">
                                                {new Date(inv.dueDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`material-icons text-sm ${inv.matchStatus === 'Matched' ? 'text-green-500' : inv.matchStatus === 'Discrepancy' ? 'text-red-500' : 'text-gray-400'}`}>
                                                        {inv.matchStatus === 'Matched' ? 'link' : inv.matchStatus === 'Discrepancy' ? 'link_off' : 'link'}
                                                    </span>
                                                    {inv.matchStatus === 'Discrepancy' ? (
                                                        <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 rounded">Dif: ${inv.diff?.toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">{inv.linkedOrder ? `#${inv.linkedOrder.idDisplay}` : '-'}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                                                ${inv.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3 text-right text-gray-400">
                                                <span className="material-icons text-sm opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                    }
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Mostrando <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredInvoices.length)}</span> de <span className="font-bold">{filteredInvoices.length}</span> facturas
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-icons text-gray-600 dark:text-gray-300">chevron_left</span>
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum = i + 1;
                                        if (totalPages > 5) {
                                            if (currentPage > 3) {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            if (pageNum > totalPages) {
                                                pageNum = totalPages - (4 - i);
                                            }
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                                    currentPage === pageNum 
                                                        ? 'bg-indigo-600 text-white shadow-md' 
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-icons text-gray-600 dark:text-gray-300">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                    </>
                )}
            </div>

            {/* 5. SLIDE-OVER DRAWER (Detail View) - ESTILO ADAPTATIVO */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[850px] bg-[#f8fafc] dark:bg-[#0f1115] shadow-2xl transform transition-transform duration-300 ease-out z-[60] border-l border-gray-100 dark:border-gray-800 ${selectedInvoice ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedInvoice && (
                    <div className="h-full flex flex-col">
                        
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-surface-dark">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {isPurchaseOrder ? 'SOLICITUD INTERNA' : 'VISOR DE FACTURA'}
                                </p>
                            </div>
                            <button onClick={() => setSelectedInvoiceId(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="material-icons text-lg">close</span>
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-100 dark:bg-black/20">
                            
                            {/* --- CONDITIONAL RENDER: PURCHASE ORDER vs INVOICE --- */}
                            
                            {isPurchaseOrder ? (
                                /* DISEÑO: ORDEN DE COMPRA DETALLADA (Estilo Corporativo/Requisición) */
                                <div className="bg-white text-gray-800 rounded-sm shadow-xl relative overflow-hidden border border-gray-300">
                                    {/* Top Stripe */}
                                    <div className="h-3 w-full bg-slate-800"></div>
                                    
                                    <div className="p-8">
                                        {/* PO Header */}
                                        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-800">
                                            <div className="flex flex-col">
                                                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Orden de Compra</h1>
                                                <span className="text-xs font-bold text-slate-500 uppercase mt-1 tracking-widest">Documento Oficial</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Número de Orden</span>
                                                    <span className="text-2xl font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded">
                                                        #{selectedInvoice.linkedOrder ? selectedInvoice.linkedOrder.idDisplay : selectedInvoice.displayId}
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-xs font-medium text-slate-500">
                                                    Fecha: {new Date(selectedInvoice.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* PO Logistics Grid */}
                                        {/* Detailed Supplier & Buyer Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                            <div>
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1 flex items-center gap-2">
                                                    <span className="material-icons text-sm">storefront</span> Proveedor (Vendedor)
                                                </h3>
                                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-full">
                                                    <p className="font-bold text-lg text-slate-900 mb-3">{selectedInvoice.supplierName}</p>
                                                    <div className="space-y-2.5 text-sm text-slate-600">
                                                        <div className="flex items-start gap-3">
                                                            <span className="material-icons text-slate-400 text-[16px] mt-0.5">place</span>
                                                            <span className="leading-tight">{selectedInvoice.supplier?.address || 'Dirección no registrada en el sistema'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-icons text-slate-400 text-[16px]">email</span>
                                                            <span>{selectedInvoice.supplier?.email || 'Email no disponible'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-icons text-slate-400 text-[16px]">phone</span>
                                                            <span>{selectedInvoice.supplier?.phone || 'Teléfono no disponible'}</span>
                                                        </div>
                                                        {selectedInvoice.supplier?.taxId && (
                                                            <div className="flex items-center gap-3">
                                                                <span className="material-icons text-slate-400 text-[16px]">badge</span>
                                                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">ID Fiscal: {selectedInvoice.supplier.taxId}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1 flex items-center gap-2">
                                                    <span className="material-icons text-sm">business</span> Enviar A (Comprador)
                                                </h3>
                                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-full">
                                                    <p className="font-bold text-lg text-slate-900 mb-3">Dermibelle Studio</p>
                                                    <div className="space-y-2.5 text-sm text-slate-600">
                                                        <div className="flex items-start gap-3">
                                                            <span className="material-icons text-slate-400 text-[16px] mt-0.5">place</span>
                                                            <div className="leading-tight">
                                                                <p>123 Beauty Lane, Suite 400</p>
                                                                <p>Miami, FL 33130</p>
                                                                <p className="text-xs text-slate-400 mt-1">Estados Unidos</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-icons text-slate-400 text-[16px]">person</span>
                                                            <span>Attn: Departamento de Compras</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-icons text-slate-400 text-[16px]">email</span>
                                                            <span>compras@dermibelle.com</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comprehensive Order Info Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            {/* Column 1: Dates & Status */}
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Detalles del Documento</h4>
                                                <div>
                                                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Fecha de Emisión</span>
                                                    <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                        <span className="material-icons text-xs text-slate-400">calendar_today</span>
                                                        {new Date(selectedInvoice.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Fecha Requerida / ETA</span>
                                                    <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                        <span className="material-icons text-xs text-slate-400">event</span>
                                                        {selectedInvoice.linkedOrder?.eta ? new Date(selectedInvoice.linkedOrder.eta).toLocaleDateString() : (selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'No especificada')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Estado Actual</span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(selectedInvoice.status, selectedInvoice.isOverdue)}`}>
                                                        {selectedInvoice.status === 'Draft' ? 'BORRADOR' : selectedInvoice.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Column 2: Logistics */}
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Logística y Envío</h4>
                                                <div>
                                                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Método de Envío</span>
                                                    <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                        <span className="material-icons text-xs text-slate-400">local_shipping</span>
                                                        {selectedInvoice.linkedOrder?.carrier || selectedInvoice.linkedOrder?.shippingMethod || 'Envío Estándar'}
                                                    </span>
                                                </div>
                                                {selectedInvoice.linkedOrder?.trackingNumber ? (
                                                    <div>
                                                        <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Número de Rastreo</span>
                                                        <span className="text-sm font-mono text-blue-600 bg-blue-50 px-1 rounded">{selectedInvoice.linkedOrder.trackingNumber}</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Rastreo</span>
                                                        <span className="text-xs text-slate-400 italic">Pendiente de asignación</span>
                                                    </div>
                                                )}
                                                {selectedInvoice.linkedOrder?.driverName && (
                                                    <div>
                                                        <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Conductor</span>
                                                        <span className="text-sm font-medium text-slate-900">{selectedInvoice.linkedOrder.driverName}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Column 3: Financials */}
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Condiciones Financieras</h4>
                                                <div>
                                                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Términos de Pago</span>
                                                    <span className="text-sm font-medium text-slate-900">{selectedInvoice.supplier?.paymentTerms || 'Contado / Net 30'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Moneda</span>
                                                    <span className="text-sm font-medium text-slate-900">USD - Dólar Estadounidense</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Referencia Interna</span>
                                                    <span className="text-sm font-mono text-slate-600">{selectedInvoice.displayId}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detailed Items Table */}
                                        <div className="mb-8">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
                                                        <th className="py-3 px-4 rounded-l-md font-bold w-16 text-center">Cant.</th>
                                                        <th className="py-3 px-4 font-bold">Descripción / Ítem</th>
                                                        <th className="py-3 px-4 font-bold text-right w-32">Precio Unit.</th>
                                                        <th className="py-3 px-4 rounded-r-md font-bold text-right w-32">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedInvoice.linkedOrder && selectedInvoice.linkedOrder.lines && selectedInvoice.linkedOrder.lines.length > 0 ? (
                                                        selectedInvoice.linkedOrder.lines.map((line, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                                <td className="py-3 px-4 text-center font-bold text-slate-700">{line.qty}</td>
                                                                <td className="py-3 px-4">
                                                                    <p className="font-bold text-slate-800">{line.title}</p>
                                                                    {line.itemId && <p className="text-[10px] text-slate-400 font-mono">SKU: {line.itemId}</p>}
                                                                </td>
                                                                <td className="py-3 px-4 text-right font-mono text-slate-600">${line.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${(line.qty * line.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        /* Fallback if no lines data */
                                                        <tr>
                                                            <td className="py-3 px-4 text-center font-bold text-slate-700">1</td>
                                                            <td className="py-3 px-4">
                                                                <p className="font-bold text-slate-800">{selectedInvoice.itemsDescription}</p>
                                                                <p className="text-xs text-slate-500 italic">Detalle de ítems no disponible en vista previa.</p>
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-mono text-slate-600">${selectedInvoice.amount.toLocaleString()}</td>
                                                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${selectedInvoice.amount.toLocaleString()}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Summary & Totals */}
                                        <div className="flex justify-start mb-12 mt-6">
                                            <div className="w-full bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-3">
                                                        <span className="font-medium">Subtotal</span>
                                                        <span className="font-mono">${(selectedInvoice.subtotal || selectedInvoice.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-3">
                                                        <span className="font-medium">Impuestos / Tasas</span>
                                                        <span className="font-mono">${(selectedInvoice.taxAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-3">
                                                        <span className="font-medium">Envío</span>
                                                        <span className="font-mono">$0.00</span>
                                                    </div>
                                                    <div className="flex justify-between text-xl font-black text-slate-900 pt-2">
                                                        <span>TOTAL</span>
                                                        <span>${selectedInvoice.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* PO Footer / Approval */}
                                        <div className="mt-8 pt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-12">
                                            <div>
                                                <div className="h-16 border-b border-slate-400 mb-2"></div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Firma Autorizada</p>
                                                <p className="text-xs text-slate-500 mt-1">Aprobado por: Gerencia de Compras</p>
                                            </div>
                                            <div className="text-xs text-slate-500 text-right">
                                                <p className="font-bold text-slate-700 mb-1">Notas / Instrucciones:</p>
                                                <p className="italic">{selectedInvoice.notes || 'Por favor incluir el número de PO en la factura final.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Watermark */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 text-slate-200 text-8xl font-black opacity-20 pointer-events-none whitespace-nowrap border-8 border-slate-200 p-8 rounded-3xl">
                                        ORDEN DE COMPRA
                                    </div>
                                </div>
                            ) : (
                                /* DISEÑO: FACTURA (Estilo Unificado con Orden de Compra) */
                                <div className="bg-white text-slate-800 p-12 rounded-sm shadow-xl relative overflow-hidden min-h-[800px] border border-slate-200">
                                    
                                    {/* Header Section */}
                                    <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-8">
                                        <div>
                                            {/* Company Logo Placeholder */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-2xl tracking-tighter">DS</div>
                                                <div>
                                                    <h1 className="font-black text-2xl text-slate-900 tracking-tight uppercase">Dermibelle Studio</h1>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professional Supplies</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <h2 className="text-5xl font-black text-slate-200 tracking-tighter uppercase mb-2">FACTURA</h2>
                                            <div className="inline-flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Número de Factura</span>
                                                <span className="text-2xl font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">#{selectedInvoice.displayId}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Supplier & Buyer Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1 flex items-center gap-2">
                                                <span className="material-icons text-sm">storefront</span> Proveedor (Emisor)
                                            </h3>
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-full">
                                                <p className="font-bold text-lg text-slate-900 mb-3">{selectedInvoice.supplierName}</p>
                                                <div className="space-y-2.5 text-sm text-slate-600">
                                                    <div className="flex items-start gap-3">
                                                        <span className="material-icons text-slate-400 text-[16px] mt-0.5">place</span>
                                                        <span className="leading-tight">{selectedInvoice.supplier?.address || 'Dirección no registrada en el sistema'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-icons text-slate-400 text-[16px]">email</span>
                                                        <span>{selectedInvoice.supplier?.email || 'Email no disponible'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-icons text-slate-400 text-[16px]">phone</span>
                                                        <span>{selectedInvoice.supplier?.phone || 'Teléfono no disponible'}</span>
                                                    </div>
                                                    {selectedInvoice.supplier?.taxId && (
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-icons text-slate-400 text-[16px]">badge</span>
                                                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">ID Fiscal: {selectedInvoice.supplier.taxId}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1 flex items-center gap-2">
                                                <span className="material-icons text-sm">business</span> Facturar A (Receptor)
                                            </h3>
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-full">
                                                <p className="font-bold text-lg text-slate-900 mb-3">Dermibelle Studio</p>
                                                <div className="space-y-2.5 text-sm text-slate-600">
                                                    <div className="flex items-start gap-3">
                                                        <span className="material-icons text-slate-400 text-[16px] mt-0.5">place</span>
                                                        <div className="leading-tight">
                                                            <p>123 Beauty Lane, Suite 400</p>
                                                            <p>Miami, FL 33130</p>
                                                            <p className="text-xs text-slate-400 mt-1">Estados Unidos</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-icons text-slate-400 text-[16px]">person</span>
                                                        <span>Attn: Departamento de Finanzas</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-icons text-slate-400 text-[16px]">email</span>
                                                        <span>finanzas@dermibelle.com</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comprehensive Invoice Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
                                        {/* Column 1: Dates & Status */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Detalles del Documento</h4>
                                            <div>
                                                <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Fecha de Emisión</span>
                                                <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                    <span className="material-icons text-xs text-slate-400">calendar_today</span>
                                                    {new Date(selectedInvoice.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Fecha de Vencimiento</span>
                                                <span className={`text-sm font-medium flex items-center gap-2 ${selectedInvoice.isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                                                    <span className="material-icons text-xs text-slate-400">event_busy</span>
                                                    {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Estado Actual</span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(selectedInvoice.status, selectedInvoice.isOverdue)}`}>
                                                    {selectedInvoice.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Column 2: Payment Details */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Detalles de Pago</h4>
                                            <div>
                                                <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Método de Pago</span>
                                                <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                    <span className="material-icons text-xs text-slate-400">payments</span>
                                                    {selectedInvoice.paymentMethod || 'Transferencia'}
                                                </span>
                                            </div>
                                            {selectedInvoice.transactionReference ? (
                                                <div>
                                                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Referencia / Transacción</span>
                                                    <span className="text-sm font-mono text-blue-600 bg-blue-50 px-1 rounded">{selectedInvoice.transactionReference}</span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Referencia</span>
                                                    <span className="text-xs text-slate-400 italic">Pendiente de pago</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Categoría</span>
                                                <span className="text-sm font-medium text-slate-900">{selectedInvoice.category || 'General'}</span>
                                            </div>
                                        </div>

                                        {/* Column 3: Financials */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Condiciones Financieras</h4>
                                            <div>
                                                <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Términos de Pago</span>
                                                <span className="text-sm font-medium text-slate-900">{selectedInvoice.supplier?.paymentTerms || 'Contado / Net 30'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Moneda</span>
                                                <span className="text-sm font-medium text-slate-900">USD - Dólar Estadounidense</span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">Orden Vinculada</span>
                                                <span className="text-sm font-mono text-slate-600">
                                                    {selectedInvoice.linkedOrder ? `#${selectedInvoice.linkedOrder.idDisplay}` : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Items Table */}
                                    <div className="mb-8">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
                                                    <th className="py-3 px-4 rounded-l-md font-bold w-16 text-center">Cant.</th>
                                                    <th className="py-3 px-4 font-bold">Descripción / Ítem</th>
                                                    <th className="py-3 px-4 font-bold text-right w-32">Precio Unit.</th>
                                                    <th className="py-3 px-4 rounded-r-md font-bold text-right w-32">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedInvoice.linkedOrder && selectedInvoice.linkedOrder.lines && selectedInvoice.linkedOrder.lines.length > 0 ? (
                                                    selectedInvoice.linkedOrder.lines.map((line, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="py-3 px-4 text-center font-bold text-slate-700">{line.qty}</td>
                                                            <td className="py-3 px-4">
                                                                <p className="font-bold text-slate-800">{line.title}</p>
                                                                {line.itemId && <p className="text-[10px] text-slate-400 font-mono">SKU: {line.itemId}</p>}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-mono text-slate-600">${line.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${(line.qty * line.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td className="py-3 px-4 text-center font-bold text-slate-700">1</td>
                                                        <td className="py-3 px-4">
                                                            <p className="font-bold text-slate-800">{selectedInvoice.itemsDescription}</p>
                                                            <p className="text-xs text-slate-500 italic">Detalle de ítems manual.</p>
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-mono text-slate-600">${selectedInvoice.amount.toLocaleString()}</td>
                                                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${selectedInvoice.amount.toLocaleString()}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Summary & Totals */}
                                    <div className="flex justify-start mb-12 mt-6">
                                        <div className="w-full bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-3">
                                                    <span className="font-medium">Subtotal</span>
                                                    <span className="font-mono">
                                                        ${(selectedInvoice.subtotal 
                                                            ? selectedInvoice.subtotal 
                                                            : (selectedInvoice.linkedOrder && selectedInvoice.linkedOrder.lines && selectedInvoice.linkedOrder.lines.length > 0)
                                                                ? selectedInvoice.linkedOrder.lines.reduce((acc, line) => acc + (line.price * line.qty), 0)
                                                                : selectedInvoice.amount
                                                          ).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-3">
                                                    <span className="font-medium">Costo de Envío</span>
                                                    <span className="font-mono">
                                                        ${(selectedInvoice.shippingCost !== undefined
                                                            ? selectedInvoice.shippingCost
                                                            : (selectedInvoice.linkedOrder && selectedInvoice.linkedOrder.shippingCost)
                                                                ? selectedInvoice.linkedOrder.shippingCost
                                                                : (selectedInvoice.linkedOrder && selectedInvoice.linkedOrder.lines && selectedInvoice.linkedOrder.lines.length > 0)
                                                                    ? Math.max(0, selectedInvoice.amount - selectedInvoice.linkedOrder.lines.reduce((acc, line) => acc + (line.price * line.qty), 0) - (selectedInvoice.taxAmount || 0))
                                                                    : 0
                                                          ).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-3">
                                                    <span className="font-medium">Impuestos / Tasas</span>
                                                    <span className="font-mono">${(selectedInvoice.taxAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                                </div>
                                                <div className="flex justify-between text-xl font-black text-slate-900 pt-2">
                                                    <span>TOTAL</span>
                                                    <span>${selectedInvoice.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invoice Footer / Approval */}
                                    <div className="mt-8 pt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-12">
                                        <div>
                                            <div className="h-16 border-b border-slate-400 mb-2"></div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Firma Autorizada</p>
                                            <p className="text-xs text-slate-500 mt-1">Aprobado por: Gerencia de Finanzas</p>
                                        </div>
                                        <div className="text-xs text-slate-500 text-right">
                                            <p className="font-bold text-slate-700 mb-1">Notas / Instrucciones:</p>
                                            <p className="italic">{selectedInvoice.notes || 'Sin notas adicionales.'}</p>
                                            {selectedInvoice.attachments && selectedInvoice.attachments.length > 0 && (
                                                <div className="mt-2 flex justify-end gap-2">
                                                    <span className="material-icons text-xs">attach_file</span>
                                                    <span>{selectedInvoice.attachments.length} adjuntos</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Watermark */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 text-slate-200 text-8xl font-black opacity-20 pointer-events-none whitespace-nowrap border-8 border-slate-200 p-8 rounded-3xl">
                                        FACTURA
                                    </div>
                                </div>
                            )}

                            {/* AUDIT / CONTROL SECTION (Outside Paper) */}
                            <div className="mt-6">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-icons text-sm">policy</span> Auditoría de Conciliación (3-Way Match)
                                </h3>
                                
                                {selectedInvoice.linkedOrder ? (
                                    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                        {/* Header Status */}
                                        <div className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center ${
                                            selectedInvoice.matchStatus === 'Matched' ? 'bg-green-50/50' : 'bg-orange-50/50'
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${selectedInvoice.matchStatus === 'Matched' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                                <span className={`text-xs font-bold ${selectedInvoice.matchStatus === 'Matched' ? 'text-green-700' : 'text-orange-700'}`}>
                                                    {selectedInvoice.matchStatus === 'Matched' ? 'Conciliación Exitosa' : 'Discrepancia Detectada'}
                                                </span>
                                            </div>
                                            {selectedInvoice.matchStatus === 'Discrepancy' && (
                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                                    Revisión Manual
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            {/* 3-Way Grid */}
                                            <div className="grid grid-cols-3 gap-4 mb-6 relative">
                                                {/* Connecting Line */}
                                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10 transform -translate-y-1/2"></div>

                                                {/* 1. Purchase Order */}
                                                <div className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center relative z-10">
                                                    <span className="block text-[9px] text-gray-400 uppercase font-bold mb-1">1. Orden Compra</span>
                                                    <div className="text-sm font-bold text-gray-800 mb-0.5">${selectedInvoice.linkedOrder.total.toLocaleString()}</div>
                                                    <div className="text-[10px] text-blue-500 font-mono">#{selectedInvoice.linkedOrder.idDisplay}</div>
                                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-700 text-[9px] px-1.5 rounded-full border border-green-200">
                                                        Autorizada
                                                    </div>
                                                </div>

                                                {/* 2. Receipt (Simulated based on PO status) */}
                                                <div className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center relative z-10">
                                                    <span className="block text-[9px] text-gray-400 uppercase font-bold mb-1">2. Recepción</span>
                                                    <div className="text-sm font-bold text-gray-800 mb-0.5">
                                                        {['Delivered', 'Completed'].includes(selectedInvoice.linkedOrder.status) ? '100%' : 'Pendiente'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 truncate">{selectedInvoice.linkedOrder.status}</div>
                                                    {['Delivered', 'Completed'].includes(selectedInvoice.linkedOrder.status) ? (
                                                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-700 text-[9px] px-1.5 rounded-full border border-green-200">
                                                            Verificada
                                                        </div>
                                                    ) : (
                                                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-700 text-[9px] px-1.5 rounded-full border border-yellow-200">
                                                            En Tránsito
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 3. Invoice */}
                                                <div className={`bg-white dark:bg-surface-dark p-3 rounded-lg border-2 text-center relative z-10 ${
                                                    selectedInvoice.matchStatus === 'Matched' ? 'border-green-100' : 'border-orange-100'
                                                }`}>
                                                    <span className="block text-[9px] text-gray-400 uppercase font-bold mb-1">3. Factura</span>
                                                    <div className={`text-sm font-bold mb-0.5 ${selectedInvoice.matchStatus === 'Matched' ? 'text-green-600' : 'text-orange-600'}`}>
                                                        ${selectedInvoice.amount.toLocaleString()}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{selectedInvoice.displayId}</div>
                                                     <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-[9px] px-1.5 rounded-full border ${
                                                        selectedInvoice.matchStatus === 'Matched' 
                                                            ? 'bg-green-100 text-green-700 border-green-200' 
                                                            : 'bg-orange-100 text-orange-700 border-orange-200'
                                                    }`}>
                                                        {selectedInvoice.matchStatus === 'Matched' ? 'Correcto' : 'Diferencia'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Analysis Footer */}
                                            <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-3 flex justify-between items-center">
                                                <div>
                                                    <span className="block text-[10px] text-gray-400 uppercase font-bold">Análisis de Variación</span>
                                                    {selectedInvoice.matchStatus === 'Matched' ? (
                                                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                            <span className="material-icons text-sm">check_circle</span> Sin variaciones detectadas
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                                            <span className="material-icons text-sm">trending_up</span> Variación: ${(selectedInvoice.amount - selectedInvoice.linkedOrder.total).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                                {selectedInvoice.matchStatus !== 'Matched' && (
                                                    <button className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded shadow-sm hover:bg-gray-50 text-gray-600">
                                                        Ver Detalle
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center text-gray-400">
                                        <span className="material-icons text-2xl mb-1 opacity-50">link_off</span>
                                        <p className="text-xs">Documento sin orden de compra vinculada.</p>
                                        <button className="mt-2 text-xs text-indigo-500 font-bold hover:underline">Vincular Manualmente</button>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Drawer Actions */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                            {isCancelled ? (
                                <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                                    <span className="material-icons text-sm">block</span> Documento Cancelado
                                </div>
                            ) : isPurchaseOrder ? (
                                <>
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedInvoice.id, 'Cancelled')} 
                                        className="py-3 px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-icons text-sm">cancel</span> Cancelar
                                    </button>
                                    <div className="flex-1 text-[10px] text-gray-400 flex items-center justify-center italic text-center px-2">
                                        Esperando confirmación del proveedor o recepción.
                                    </div>
                                    <button 
                                        onClick={() => handleManualConvert(selectedInvoice.id)} 
                                        className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-icons text-sm">transform</span> Convertir a Factura
                                    </button>
                                </>
                            ) : (
                                <>
                                    {(selectedInvoice.status === 'Disputed' || selectedInvoice.status === 'Pending Approval') && (
                                        <>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedInvoice.id, 'Cancelled')} 
                                                className="py-3 px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedInvoice.id, 'Disputed')} 
                                                className="flex-1 py-3 border border-orange-200 text-orange-600 rounded-xl font-bold text-xs hover:bg-orange-50 transition-colors"
                                            >
                                                Disputar
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedInvoice.id, 'Approved')} 
                                                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20 transition-colors"
                                            >
                                                Aprobar para Pago
                                            </button>
                                        </>
                                    )}
                                    {(selectedInvoice.status === 'Approved' || selectedInvoice.status === 'Sent' || selectedInvoice.status === 'Partially Received') && (
                                        <>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedInvoice.id, 'Cancelled')} 
                                                className="py-3 px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setIsPaymentModalOpen(true);
                                                    // Ensure we don't clear selection yet
                                                }} 
                                                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-green-500/20 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span className="material-icons text-sm">check_circle</span> Registrar Pago
                                            </button>
                                        </>
                                    )}
                                    {selectedInvoice.status === 'Paid' && (
                                        <div className="w-full py-3 bg-gray-50 text-green-600 border border-green-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                            <span className="material-icons text-sm">verified</span> Pago Completado el {new Date(selectedInvoice.paymentDate!).toLocaleDateString()}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                    </div>
                )}
            </div>

            {/* REGISTER MODAL (Simplified Overlay) */}
            {isRegisterOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsRegisterOpen(false)}>
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Registrar Factura</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Proveedor</label>
                                <select 
                                    className="w-full p-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors"
                                    value={newInv.supplierId}
                                    onChange={e => setNewInv({...newInv, supplierId: e.target.value})}
                                >
                                    <option value="">Seleccionar...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                                </select>
                            </div>
                            
                            {/* Linking Logic */}
                            {newInv.supplierId && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <label className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase mb-1 flex items-center gap-1">
                                        <span className="material-icons text-xs">link</span> Vincular Orden (Opcional)
                                    </label>
                                    <select 
                                        className="w-full p-2 bg-white dark:bg-black/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                                        value={newInv.linkedOrderId}
                                        onChange={e => {
                                            const orderId = e.target.value;
                                            const order = orders.find(o => o.id === orderId);
                                            
                                            if (!order) {
                                                setNewInv({
                                                    ...newInv,
                                                    linkedOrderId: '',
                                                    subtotal: '',
                                                    shippingCost: '',
                                                    taxAmount: '',
                                                    amount: ''
                                                });
                                                return;
                                            }

                                            // 1. Calculate Subtotal (Lines only)
                                            let subtotal = 0;
                                            if (order.lines && order.lines.length > 0) {
                                                subtotal = order.lines.reduce((acc, line) => acc + (line.qty * line.price), 0);
                                            }

                                            // 2. Get Shipping Cost (Explicit)
                                            let shippingCost = 0;
                                            if (order.shippingCost !== undefined) {
                                                shippingCost = order.shippingCost;
                                            }

                                            // 3. Calculate Tax (Inferred or Explicit)
                                            // If order.total is greater than subtotal + shipping, the rest is tax.
                                            // Or if order has taxAmount, use it.
                                            let taxAmount = 0;
                                            const calculatedBase = subtotal + shippingCost;
                                            
                                            if (order.total > calculatedBase) {
                                                taxAmount = order.total - calculatedBase;
                                            }
                                            
                                            // Rounding
                                            subtotal = Math.round(subtotal * 100) / 100;
                                            shippingCost = Math.round(shippingCost * 100) / 100;
                                            taxAmount = Math.round(taxAmount * 100) / 100;
                                            
                                            const total = subtotal + shippingCost + taxAmount;

                                            setNewInv({
                                                ...newInv, 
                                                linkedOrderId: orderId,
                                                subtotal: subtotal.toFixed(2),
                                                shippingCost: shippingCost.toFixed(2),
                                                taxAmount: taxAmount.toFixed(2),
                                                amount: total.toFixed(2)
                                            });
                                        }}
                                    >
                                        <option value="">-- Sin Vincular --</option>
                                        {availableOrders.map(o => (
                                            <option key={o.id} value={o.id}>
                                                {o.idDisplay} - ${o.total.toFixed(2)} ({o.status})
                                            </option>
                                        ))}
                                    </select>
                                    {newInv.linkedOrderId && <p className="text-[10px] text-blue-500 mt-1 italic">El monto se ha precargado desde la orden.</p>}
                                    {selectedLinkedOrder && !['Delivered', 'Completed', 'Partially Received'].includes(selectedLinkedOrder.status) && (
                                        <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded-lg border border-yellow-200 mt-2 flex items-center gap-2">
                                            <span className="material-icons text-sm">warning</span>
                                            <span>Advertencia: La orden aún no ha sido marcada como "Recibida" en operaciones.</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">N° Factura</label>
                                    <input className="w-full p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700" value={newInv.displayId} onChange={e => setNewInv({...newInv, displayId: e.target.value})} placeholder="A-0001"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoría</label>
                                    <select 
                                        className="w-full p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700"
                                        value={newInv.category}
                                        onChange={e => setNewInv({...newInv, category: e.target.value})}
                                    >
                                        <option value="Inventory">Inventario</option>
                                        <option value="Services">Servicios</option>
                                        <option value="Assets">Activos</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Other">Otros</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subtotal</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input 
                                            type="number" 
                                            className="w-full pl-5 p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700 font-mono" 
                                            value={newInv.subtotal} 
                                            onChange={e => {
                                                const sub = parseFloat(e.target.value) || 0;
                                                const tax = parseFloat(newInv.taxAmount) || 0;
                                                const ship = parseFloat(newInv.shippingCost) || 0;
                                                setNewInv({...newInv, subtotal: e.target.value, amount: (sub + tax + ship).toFixed(2)});
                                            }} 
                                            placeholder="0.00" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Impuestos</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input 
                                            type="number" 
                                            className="w-full pl-5 p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700 font-mono" 
                                            value={newInv.taxAmount} 
                                            onChange={e => {
                                                const tax = parseFloat(e.target.value) || 0;
                                                const sub = parseFloat(newInv.subtotal) || 0;
                                                const ship = parseFloat(newInv.shippingCost) || 0;
                                                setNewInv({...newInv, taxAmount: e.target.value, amount: (sub + tax + ship).toFixed(2)});
                                            }} 
                                            placeholder="0.00" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Costo de Envío</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input 
                                            type="number" 
                                            className="w-full pl-5 p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700 font-mono" 
                                            value={newInv.shippingCost} 
                                            onChange={e => {
                                                const ship = parseFloat(e.target.value) || 0;
                                                const sub = parseFloat(newInv.subtotal) || 0;
                                                const tax = parseFloat(newInv.taxAmount) || 0;
                                                setNewInv({...newInv, shippingCost: e.target.value, amount: (sub + tax + ship).toFixed(2)});
                                            }} 
                                            placeholder="0.00" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Total</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input type="number" className="w-full pl-5 p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700 font-mono font-bold" value={newInv.amount} readOnly placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Fecha Emisión</label>
                                    <input type="date" className="w-full p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700" value={newInv.date} onChange={e => setNewInv({...newInv, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Vencimiento</label>
                                    <input type="date" className="w-full p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700" value={newInv.dueDate} onChange={e => setNewInv({...newInv, dueDate: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Método de Pago</label>
                                    <select 
                                        className="w-full p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700"
                                        value={newInv.paymentMethod}
                                        onChange={e => setNewInv({...newInv, paymentMethod: e.target.value})}
                                    >
                                        <option value="Transfer">Transferencia</option>
                                        <option value="Check">Cheque</option>
                                        <option value="Credit Card">Tarjeta Crédito</option>
                                        <option value="Cash">Efectivo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Adjuntar Factura (PDF/Img)</label>
                                    <div className="w-full p-1.5 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                                            <span className="material-icons text-sm">cloud_upload</span> Subir Archivo
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Notas Internas</label>
                                <textarea 
                                    className="w-full p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700 resize-none h-20" 
                                    value={newInv.notes} 
                                    onChange={e => setNewInv({...newInv, notes: e.target.value})} 
                                    placeholder="Detalles adicionales, condiciones de pago, etc."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => setIsRegisterOpen(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-xs uppercase tracking-wide">Cancelar</button>
                            <button onClick={handleRegister} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md text-xs uppercase tracking-wide transition-all transform hover:-translate-y-0.5">Guardar & Conciliar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. PAYMENT MODAL */}
            {selectedInvoice && (
                <PaymentModal 
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onConfirm={handleProcessPayment}
                    invoice={selectedInvoice}
                    supplier={selectedInvoice.supplier}
                />
            )}

        </div>
    );
};

export default SupplyFinanceTab;
