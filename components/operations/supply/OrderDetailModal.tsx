

import React, { useMemo, useState } from 'react';
import { useData, Order, Supplier } from '../../../context/DataContext';

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string | null;
    onOpenReception: (id: string) => void;
    onUpdateStatus: (id: string, status: Order['status']) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ 
    isOpen, onClose, orderId, onOpenReception, onUpdateStatus 
}) => {
    const { orders, suppliers, updateOrder, addToast } = useData();
    const [isCancelling, setIsCancelling] = useState(false);

    const order = useMemo(() => orders.find(o => o.id === orderId), [orders, orderId]);
    
    if (!isOpen || !order) return null;

    const supplier = suppliers.find(s => s.id === order.supplierId) || { 
        id: 'unknown',
        initials: 'UNK',
        companyName: order.clientName, 
        contactPerson: 'Contacto General', 
        email: 'N/A', 
        phone: 'N/A',
        address: 'N/A',
        status: 'Active',
    } as Supplier;

    // --- Status Logic ---
    const steps = [
        { id: 'Draft', label: 'Borrador', icon: 'edit_note' },
        { id: 'Placed', label: 'Enviada', icon: 'send' },
        { id: 'In Transit', label: 'En Tránsito', icon: 'local_shipping' },
        { id: 'Delivered', label: 'Recibida', icon: 'inventory_2' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === order.status) === -1 
        ? (order.status === 'Partially Received' ? 2 : (order.status === 'Cancelled' ? -1 : 0))
        : steps.findIndex(s => s.id === order.status);

    const isCancelled = order.status === 'Cancelled';
    const isCompleted = order.status === 'Delivered';

    // --- Handlers ---
    const handleSendOrder = () => {
        onUpdateStatus(order.id, 'Placed');
        addToast('success', `Orden ${order.idDisplay} enviada al proveedor ${supplier.companyName}`);
        onClose();
    };

    const handleMarkInTransit = () => {
        onUpdateStatus(order.id, 'In Transit');
        addToast('success', `Orden ${order.idDisplay} marcada en camino.`);
        onClose();
    };

    const handleReceiveClick = () => {
        onClose(); // Close detail
        onOpenReception(order.id); // Open reception modal
    };

    const handleCancelOrder = () => {
        if (confirm('¿Estás seguro de cancelar esta orden? Esta acción no se puede deshacer.')) {
            onUpdateStatus(order.id, 'Cancelled');
            addToast('info', 'Orden cancelada.');
            onClose();
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'Placed': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'In Transit': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'Partially Received': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
            case 'Delivered': return 'bg-green-50 text-green-600 border-green-200';
            case 'Cancelled': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[85vh] max-h-[800px]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${isCancelled ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-200 text-primary'}`}>
                            <span className="material-icons">{isCancelled ? 'block' : 'assignment'}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">{order.idDisplay}</h2>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStatusBadgeColor(order.status)}`}>
                                    {order.status === 'Pending Approval' ? 'Pendiente' : order.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">Creada: {new Date(order.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400">
                        <span className="material-icons text-xl">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    
                    {/* Progress Bar (Stepper) - Hide if Cancelled */}
                    {!isCancelled && (
                        <div className="mb-8 px-4">
                            <div className="relative flex items-center justify-between">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 dark:bg-gray-800 -z-10"></div>
                                <div 
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 transition-all duration-500 -z-10" 
                                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                                ></div>

                                {steps.map((step, idx) => {
                                    const isCompleted = idx <= currentStepIndex;
                                    const isCurrent = idx === currentStepIndex;
                                    return (
                                        <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-surface-dark px-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all 
                                                ${isCompleted 
                                                    ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/30' 
                                                    : 'bg-white dark:bg-surface-dark border-gray-300 dark:border-gray-600 text-gray-300'}`}
                                            >
                                                <span className="material-icons text-sm">{step.icon}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-green-600 dark:text-green-400' : isCompleted ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left Column: Info */}
                        <div className="lg:col-span-1 space-y-6">
                            
                            {/* Supplier Card */}
                            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Proveedor</h4>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100 dark:border-indigo-800">
                                        {supplier.initials || supplier.companyName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{supplier.companyName}</p>
                                        <p className="text-[10px] text-gray-500">ID: {supplier.id}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <span className="material-icons text-[14px] text-gray-400">person</span>
                                        {supplier.contactPerson}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <span className="material-icons text-[14px] text-gray-400">email</span>
                                        {supplier.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <span className="material-icons text-[14px] text-gray-400">phone</span>
                                        {supplier.phone}
                                    </div>
                                </div>
                            </div>

                            {/* Logistics Card */}
                            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Logística</h4>
                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Fecha Orden</span>
                                        <span className="font-medium text-gray-800 dark:text-white">{new Date(order.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Estimado</span>
                                        <span className="font-medium text-gray-800 dark:text-white">--</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Método</span>
                                        <span className="font-medium text-gray-800 dark:text-white capitalize">{order.type === 'physical' ? 'Físico' : 'Digital'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Total Estimado</h4>
                                <div className="space-y-2 text-xs mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="text-gray-800 dark:text-gray-200">${order.total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Envío</span>
                                        <span className="text-gray-800 dark:text-gray-200">$0.00</span>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <span className="font-bold text-sm text-gray-900 dark:text-white">TOTAL</span>
                                    <span className="font-mono text-xl font-bold text-primary">${order.total.toFixed(2)}</span>
                                </div>
                            </div>

                        </div>

                        {/* Right Column: Items Table */}
                        <div className="lg:col-span-2">
                             <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
                                <div className="px-4 py-3 bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Items Solicitados</h4>
                                    <span className="text-[10px] bg-white dark:bg-black/20 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-500">
                                        {order.lines?.length || 0} productos
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto max-h-[400px]">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-black/20 text-xs font-bold text-gray-400 uppercase">
                                            <tr>
                                                <th className="px-4 py-2 w-10">#</th>
                                                <th className="px-4 py-2">Producto</th>
                                                <th className="px-4 py-2 text-center">Cant.</th>
                                                <th className="px-4 py-2 text-center">Recibido</th>
                                                <th className="px-4 py-2 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {order.lines?.map((line, idx) => {
                                                const isFullyReceived = (line.receivedQty || 0) >= line.qty;
                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <p className="font-bold text-gray-800 dark:text-white text-xs">{line.title}</p>
                                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {line.itemId}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-mono font-bold text-gray-700 dark:text-gray-300">
                                                            {line.qty}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                                isFullyReceived 
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                                    : (line.receivedQty || 0) > 0 
                                                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                        : 'text-gray-400'
                                                            }`}>
                                                                {line.receivedQty || 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                                                            ${(line.price * line.qty).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                             </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                {!isCancelled && !isCompleted && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 flex justify-between items-center shrink-0">
                        <button 
                            onClick={handleCancelOrder}
                            className="text-red-500 hover:text-red-700 text-xs font-bold px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <span className="material-icons text-sm">block</span> Cancelar Orden
                        </button>

                        <div className="flex gap-3">
                            {order.status === 'Draft' && (
                                <button onClick={handleSendOrder} className="bg-primary hover:bg-green-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all">
                                    <span className="material-icons text-sm">send</span> Confirmar & Enviar
                                </button>
                            )}
                            
                            {order.status === 'Placed' && (
                                <button onClick={handleMarkInTransit} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all">
                                    <span className="material-icons text-sm">local_shipping</span> Marcar En Camino
                                </button>
                            )}
                            
                            {(order.status === 'In Transit' || order.status === 'Partially Received') && (
                                <button onClick={handleReceiveClick} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all">
                                    <span className="material-icons text-sm">inventory</span> Recibir Mercancía
                                </button>
                            )}
                        </div>
                    </div>
                )}
                
                {isCancelled && (
                     <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 flex justify-center shrink-0">
                         <p className="text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                             <span className="material-icons text-sm">info</span> Esta orden fue cancelada y no admite más acciones.
                         </p>
                     </div>
                )}
                 
                 {isCompleted && (
                     <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-green-50 dark:bg-green-900/10 flex justify-center shrink-0">
                         <p className="text-green-600 dark:text-green-400 text-xs font-bold flex items-center gap-2">
                             <span className="material-icons text-sm">check_circle</span> Orden completada y cerrada.
                         </p>
                     </div>
                )}

            </div>
        </div>
    );
};

export default OrderDetailModal;