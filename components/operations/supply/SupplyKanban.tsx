
import React from 'react';
import { Order } from '../../../context/DataContext';

interface SupplyKanbanProps {
    orders: Order[];
    onOpenReception: (orderId: string) => void;
    onOrderClick: (orderId: string) => void; // New Prop
}

const SupplyKanban: React.FC<SupplyKanbanProps> = ({ orders, onOpenReception, onOrderClick }) => {
    
    // Helper: Get orders for column
    const getOrdersByStatus = (statusColumnId: string) => {
        const activeOrders = orders.filter(o => !o.isArchived);

        // Draft Column now includes 'Scheduled'
        if (statusColumnId === 'Draft') return activeOrders.filter(o => o.status === 'Draft' || o.status === 'Pending Approval' || o.status === 'Scheduled');
        // Placed Column now includes 'Revision Sent' so orders waiting for vendor response stay here
        if (statusColumnId === 'Placed') return activeOrders.filter(o => o.status === 'Placed' || o.status === 'Revision Sent');
        if (statusColumnId === 'In Transit') return activeOrders.filter(o => o.status === 'In Transit'); 
        if (statusColumnId === 'Partially Received') return activeOrders.filter(o => o.status === 'Partially Received');
        if (statusColumnId === 'Delivered') return activeOrders.filter(o => o.status === 'Delivered' || (o.status as string) === 'Completed');
        if (statusColumnId === 'Cancelled') return activeOrders.filter(o => o.status === 'Cancelled');
        return [];
    };

    // Kanban Columns Configuration
    const orderColumns = [
        { id: 'Draft', title: 'Borrador / Programado', color: 'bg-gray-100 text-gray-600' },
        { id: 'Placed', title: 'Enviadas', color: 'bg-blue-100 text-blue-700' },
        { id: 'In Transit', title: 'En Tránsito', color: 'bg-orange-100 text-orange-700' },
        { id: 'Partially Received', title: 'Parcial', color: 'bg-yellow-100 text-yellow-700' },
        { id: 'Delivered', title: 'Completadas', color: 'bg-green-100 text-green-700' },
        { id: 'Cancelled', title: 'Canceladas', color: 'bg-red-100 text-red-700' } // New Column
    ];

    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4">
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex gap-4 h-full min-w-[1500px]"> {/* Increased min-width for extra column */}
                    {orderColumns.map(col => {
                        const colOrders = getOrdersByStatus(col.id);
                        
                        return (
                            <div key={col.id} className="w-80 flex flex-col bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-gray-700 h-full">
                                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-100/50 dark:bg-white/5 rounded-t-2xl">
                                    <h4 className="font-bold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide">{col.title}</h4>
                                    <span className="bg-white dark:bg-black/40 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700">
                                        {colOrders.length}
                                    </span>
                                </div>
                                
                                <div className="p-2 flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                    {colOrders.map(order => (
                                        <div 
                                            key={order.id} 
                                            onClick={() => onOrderClick(order.id)} // Click Handler
                                            className={`bg-white dark:bg-surface-dark p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden
                                                ${order.status === 'Cancelled' ? 'opacity-70 grayscale-[0.5]' : ''}
                                                ${order.status === 'Scheduled' ? 'border-l-4 border-l-purple-500' : ''}
                                            `}
                                        >
                                            {/* Priority Stripe */}
                                            {order.total > 500 && order.status !== 'Cancelled' && order.status !== 'Scheduled' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>}
                                            
                                            {/* Status Badges */}
                                            <div className="absolute top-0 right-0 flex flex-col items-end">
                                                {/* @ts-ignore */}
                                                {order.inDispute && order.status === 'Placed' && (
                                                    <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-bl-lg flex items-center gap-1 border-l border-b border-amber-200">
                                                        <span className="material-icons text-[10px]">gavel</span> En Disputa
                                                    </span>
                                                )}

                                                {/* Revision Sent Badge */}
                                                {order.status === 'Revision Sent' && (
                                                    <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-bl-lg flex items-center gap-1 border-l border-b border-indigo-200">
                                                        <span className="material-icons text-[10px]">update</span> Revisión Enviada
                                                    </span>
                                                )}
                                                
                                                {/* Scheduled Badge */}
                                                {order.status === 'Scheduled' && (
                                                     <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-bl-lg flex items-center gap-1 border-l border-b border-purple-200">
                                                        <span className="material-icons text-[10px]">schedule</span> Programado
                                                    </span>
                                                )}
                                            </div>

                                            <div className="pl-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-mono text-[10px] font-bold text-gray-400">{order.idDisplay}</span>
                                                    <span className="text-[10px] text-gray-400">{new Date(order.date).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})}</span>
                                                </div>
                                                <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-1 truncate">{order.clientName}</h5>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{order.items}</p>
                                                
                                                <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
                                                    <span className="font-mono font-bold text-sm text-gray-800 dark:text-gray-200">${order.total.toFixed(2)}</span>
                                                    {(col.id === 'In Transit' || col.id === 'Partially Received') && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onOpenReception(order.id); }}
                                                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded text-[10px] font-bold transition-colors"
                                                        >
                                                            Recibir
                                                        </button>
                                                    )}
                                                    {col.id === 'Draft' && order.status !== 'Scheduled' && (
                                                        <span className="text-[10px] text-gray-400 flex items-center gap-1 group-hover:text-primary transition-colors">
                                                            Editar <span className="material-icons text-[10px]">edit</span>
                                                        </span>
                                                    )}
                                                    {order.status === 'Scheduled' && (
                                                        <span className="text-[10px] text-purple-400 flex items-center gap-1 group-hover:text-purple-600 transition-colors">
                                                            Ver <span className="material-icons text-[10px]">visibility</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SupplyKanban;
