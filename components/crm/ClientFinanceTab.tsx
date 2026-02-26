
import React, { useMemo, useState } from 'react';
import { useData, Invoice } from '../../context/DataContext';
import { InvoiceDetailModal, PaymentModal, ConfirmTransferModal } from '../invoices/InvoiceModals';

interface ClientFinanceTabProps {
    clientId: string;
}

const ClientFinanceTab: React.FC<ClientFinanceTabProps> = ({ clientId }) => {
    const { invoices, payInvoice, confirmInTransitInvoice, rejectInTransitInvoice } = useData();
    
    // Modal States
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false); // For transfers

    const [filter, setFilter] = useState<'all' | 'pending' | 'transit' | 'paid' | 'quote'>('all');

    // 1. Get Valid Client Invoices (Exclude Voided)
    const clientInvoices = useMemo(() => 
        invoices.filter(i => i.clientId === clientId && i.status !== 'Anulada')
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [invoices, clientId]);

    // 2. Precise Financial Stats Calculation
    const stats = useMemo(() => {
        let paid = 0;
        let inTransit = 0;
        let pending = 0;

        clientInvoices.forEach(inv => {
            // Ignore Quotes for financial totals
            if (inv.status === 'Cotización') return;

            if (inv.status === 'Pagada') {
                paid += inv.amount;
            } else if (inv.status === 'En Tránsito') {
                inTransit += inv.amount;
            } else {
                // Handle Partial or Pending
                if (inv.paymentBreakdown) {
                    // Logic: If specific part is NOT paid, add to pending
                    if (!inv.paymentBreakdown.servicesPaid) pending += inv.paymentBreakdown.servicesTotal;
                    if (!inv.paymentBreakdown.productsPaid) pending += inv.paymentBreakdown.productsTotal;
                } else {
                    // Fallback for simple invoices
                    pending += inv.amount;
                }
            }
        });

        return { paid, inTransit, pending };
    }, [clientInvoices]);

    // 3. Filtering Logic
    const filteredInvoices = useMemo(() => {
        switch (filter) {
            case 'pending': return clientInvoices.filter(i => i.status === 'Pendiente' || i.status === 'Parcial');
            case 'transit': return clientInvoices.filter(i => i.status === 'En Tránsito');
            case 'paid': return clientInvoices.filter(i => i.status === 'Pagada');
            case 'quote': return clientInvoices.filter(i => i.status === 'Cotización');
            default: return clientInvoices;
        }
    }, [clientInvoices, filter]);

    // Handlers
    const handleOpenDetail = (inv: Invoice) => {
        setSelectedInvoice(inv);
        setIsDetailOpen(true);
    };

    const handleOpenAction = (e: React.MouseEvent, inv: Invoice) => {
        e.stopPropagation();
        setSelectedInvoice(inv);
        if (inv.status === 'En Tránsito') {
            setIsConfirmOpen(true);
        } else {
            setIsPaymentOpen(true);
        }
    };

    return (
        <>
            <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
                {/* Stats Deck */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Card 1: Real Revenue (Paid) */}
                    <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ingresos Reales</p>
                            <p className="text-2xl font-display font-bold text-green-600 dark:text-green-400">${stats.paid.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400">Confirmado en caja</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                            <span className="material-icons">savings</span>
                        </div>
                    </div>

                    {/* Card 2: In Transit (Transfers) */}
                    <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-colors ${stats.inTransit > 0 ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800' : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-700'}`}>
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${stats.inTransit > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>En Tránsito</p>
                            <p className={`text-2xl font-display font-bold ${stats.inTransit > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>${stats.inTransit.toLocaleString()}</p>
                            <p className={`text-[10px] ${stats.inTransit > 0 ? 'text-orange-500' : 'text-gray-400'}`}>Pendiente verificación</p>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.inTransit > 0 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-gray-50 dark:bg-white/10 text-gray-300'}`}>
                            <span className="material-icons">sync_alt</span>
                        </div>
                    </div>

                    {/* Card 3: Debt (Pending) */}
                    <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Por Cobrar</p>
                            <p className={`text-2xl font-display font-bold ${stats.pending > 0 ? 'text-gray-800 dark:text-white' : 'text-gray-300'}`}>${stats.pending.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400">Saldo pendiente</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                            <span className="material-icons">pending_actions</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto no-scrollbar">
                    <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'all' ? 'bg-gray-800 text-white dark:bg-white dark:text-black' : 'bg-white border border-gray-200 text-gray-500 dark:bg-white/5 dark:border-gray-700 dark:text-gray-400'}`}>Todos</button>
                    <button onClick={() => setFilter('pending')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 dark:bg-white/5 dark:border-gray-700 dark:text-gray-400'}`}>Por Cobrar</button>
                    {stats.inTransit > 0 && (
                        <button onClick={() => setFilter('transit')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${filter === 'transit' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-orange-600 dark:bg-white/5 dark:border-gray-700'}`}>
                            En Tránsito <span className="bg-white/20 px-1.5 rounded-full text-[9px]">{clientInvoices.filter(i => i.status === 'En Tránsito').length}</span>
                        </button>
                    )}
                    <button onClick={() => setFilter('paid')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'paid' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-500 dark:bg-white/5 dark:border-gray-700 dark:text-gray-400'}`}>Pagados</button>
                    <button onClick={() => setFilter('quote')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'quote' ? 'bg-indigo-500 text-white' : 'bg-white border border-gray-200 text-gray-500 dark:bg-white/5 dark:border-gray-700 dark:text-gray-400'}`}>Cotizaciones</button>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {filteredInvoices.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-12 h-12 bg-gray-50 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-icons text-2xl text-gray-300">receipt_long</span>
                            </div>
                            <p className="text-gray-400 font-bold text-xs">No hay documentos en esta vista.</p>
                        </div>
                    ) : (
                        filteredInvoices.map(inv => {
                            const isTransit = inv.status === 'En Tránsito';
                            const isPending = inv.status === 'Pendiente' || inv.status === 'Parcial';
                            
                            return (
                                <div 
                                    key={inv.id} 
                                    onClick={() => handleOpenDetail(inv)}
                                    className={`group bg-white dark:bg-surface-dark border rounded-xl p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col sm:flex-row gap-4 sm:items-center
                                        ${isTransit 
                                            ? 'border-orange-200 dark:border-orange-900/30 shadow-md shadow-orange-500/5' 
                                            : 'border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary/30'}
                                    `}
                                >
                                    {/* Status Stripe */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                        inv.status === 'Pagada' ? 'bg-green-500' :
                                        isPending ? 'bg-blue-500' :
                                        isTransit ? 'bg-orange-500' :
                                        'bg-indigo-500'
                                    }`}></div>

                                    {/* Date & ID */}
                                    <div className="flex items-center gap-4 pl-3 min-w-[160px]">
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-white/5 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-600">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(inv.date).toLocaleString('es-ES', { month: 'short' })}</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-none">{new Date(inv.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{inv.idDisplay}</span>
                                                {isTransit && (
                                                    <span className="material-icons text-orange-500 text-xs animate-pulse" title="Requiere Acción">warning</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">{inv.time || '09:00 AM'}</p>
                                        </div>
                                    </div>

                                    {/* Description & Status Pill */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                                                inv.status === 'Pagada' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300' :
                                                isPending ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300' :
                                                isTransit ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300' :
                                                'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300'
                                            }`}>
                                                {inv.status}
                                            </span>
                                            {inv.transactionReference && (
                                                <span className="text-[9px] font-mono text-gray-400 border border-gray-100 dark:border-gray-700 px-1.5 rounded bg-gray-50 dark:bg-white/5 truncate max-w-[100px]">
                                                    {inv.transactionReference}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[250px]">{inv.service}</p>
                                    </div>

                                    {/* Amount & Actions */}
                                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:min-w-[180px]">
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Monto</p>
                                            <p className={`font-mono text-lg font-bold ${
                                                inv.status === 'Pagada' ? 'text-gray-900 dark:text-white' : 
                                                isTransit ? 'text-orange-600' : 'text-blue-600'
                                            }`}>
                                                ${inv.amount.toFixed(2)}
                                            </p>
                                        </div>
                                        
                                        <div className="w-24 flex justify-end">
                                            {isPending ? (
                                                <button 
                                                    onClick={(e) => handleOpenAction(e, inv)}
                                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1 z-10"
                                                >
                                                    <span className="material-icons text-xs">payments</span> Cobrar
                                                </button>
                                            ) : isTransit ? (
                                                <button 
                                                    onClick={(e) => handleOpenAction(e, inv)}
                                                    className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1 z-10 animate-pulse"
                                                >
                                                    <span className="material-icons text-xs">verified</span> Verificar
                                                </button>
                                            ) : (
                                                <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-300 dark:text-gray-600 transition-colors">
                                                    <span className="material-icons text-lg">chevron_right</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <InvoiceDetailModal 
                isOpen={isDetailOpen} 
                onClose={() => { setIsDetailOpen(false); setSelectedInvoice(null); }} 
                invoice={selectedInvoice} 
            />
            
            <PaymentModal 
                isOpen={isPaymentOpen}
                onClose={() => { setIsPaymentOpen(false); setSelectedInvoice(null); }}
                invoice={selectedInvoice}
                onConfirm={payInvoice}
            />

            <ConfirmTransferModal
                isOpen={isConfirmOpen}
                onClose={() => { setIsConfirmOpen(false); setSelectedInvoice(null); }}
                invoice={selectedInvoice}
                onConfirm={confirmInTransitInvoice}
                onReject={rejectInTransitInvoice}
            />
        </>
    );
};

export default ClientFinanceTab;
