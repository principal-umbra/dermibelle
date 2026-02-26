
import React, { useState } from 'react';
import { useData, AppointmentItem } from '../../context/DataContext';
import CreateOrderModal from '../operations/CreateOrderModal';
import { useNavigate } from 'react-router-dom';

interface SupplierOrdersTabProps {
    supplierName: string;
    supplierId?: string; // Made optional for backward compat but essential for fix
}

const SupplierOrdersTab: React.FC<SupplierOrdersTabProps> = ({ supplierName, supplierId }) => {
    const { orders, catalog, addToast } = useData();
    const navigate = useNavigate();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Filter orders
    const supplierOrders = orders
        .filter(o => o.clientName === supplierName || o.supplierId === supplierId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Helper to render status badge with dispute support
    const renderStatusBadge = (order: any) => {
        if (order.inDispute) {
            return (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1 w-fit">
                    <span className="material-icons text-[10px]">gavel</span> En Disputa
                </span>
            );
        }

        return (
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                order.status === 'In Transit' ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' :
                'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
            }`}>
                {order.status}
            </span>
        );
    };

    const handleOpenPortal = (orderId: string) => {
        // Open vendor portal link
        window.open(`/#/portal/order/${orderId}`, '_blank');
    };

    const handleOpenDashboard = () => {
         if(supplierId) {
             navigate(`/portal/dashboard/${supplierId}`);
         } else {
             addToast('error', 'ID de proveedor no disponible');
         }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historial de Pedidos</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Gestión de compras y reabastecimiento.</p>
                </div>
                <div className="flex gap-2">
                    {supplierId && (
                        <button 
                            onClick={handleOpenDashboard}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 transition-colors border border-gray-200 dark:border-gray-700"
                        >
                            <span className="material-icons text-sm">visibility</span>
                            Ver Dashboard
                        </button>
                    )}
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary hover:bg-green-800 text-white px-4 py-2 rounded-xl shadow-lg shadow-primary/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 text-xs font-bold"
                    >
                        <span className="material-icons text-sm">add_shopping_cart</span>
                        Nueva Orden
                    </button>
                </div>
            </div>

            {supplierOrders.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons text-3xl text-gray-300">inventory_2</span>
                    </div>
                    <p className="text-gray-500 font-bold text-sm mb-2">No hay órdenes registradas.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="text-primary text-xs font-bold hover:underline">
                        Crear primera orden
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {supplierOrders.map(order => (
                        <div key={order.id} className="relative bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group flex flex-col sm:flex-row">
                            {/* Status Strip */}
                            <div className={`w-1.5 sm:h-auto ${
                                (order as any).inDispute ? 'bg-amber-500' : 
                                order.status === 'Delivered' ? 'bg-green-500' :
                                order.status === 'In Transit' ? 'bg-orange-500' :
                                'bg-yellow-500'
                            }`}></div>
                            
                            <div className="p-4 flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                {/* Date Box */}
                                <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-white/5 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700 shrink-0">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{new Date(order.date).toLocaleString('es-ES', {month: 'short'})}</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">{new Date(order.date).getDate()}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                                            {order.idDisplay}
                                        </h4>
                                        {renderStatusBadge(order)}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {order.items}
                                    </p>
                                </div>

                                {/* Total & Actions */}
                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-gray-700">
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Total</p>
                                        <p className="font-mono font-bold text-base text-gray-900 dark:text-white">${order.total.toFixed(2)}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {/* View Portal Link Action */}
                                        <button 
                                            onClick={() => handleOpenPortal(order.id)}
                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors"
                                            title="Ver como Proveedor"
                                        >
                                            <span className="material-icons text-lg">public</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE ORDER MODAL (Reusable) */}
            <CreateOrderModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                preselectedSupplierId={supplierId} // Pre-fills and locks supplier if passed
            />
        </div>
    );
};

export default SupplierOrdersTab;
