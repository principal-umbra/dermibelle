import React, { useState, useMemo } from 'react';
import { Order } from '../../../types';
import { useData } from '../../../context/DataContext';

interface SupplyArchiveProps {
    orders: Order[];
    onOrderClick: (orderId: string) => void;
}

const SupplyArchive: React.FC<SupplyArchiveProps> = ({ orders, onOrderClick }) => {
    const { reactivateArchivedOrder } = useData();
    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal States
    const [tempOrder, setTempOrder] = useState<Partial<Order>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reactivationReason, setReactivationReason] = useState('');

    // --- KPI Logic ---
    const stats = useMemo(() => {
        const completed = orders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length;
        const cancelled = orders.filter(o => o.status === 'Cancelled').length;
        const totalSpend = orders
            .filter(o => o.status === 'Completed' || o.status === 'Delivered')
            .reduce((sum, o) => sum + o.total, 0);
        return { completed, cancelled, totalSpend };
    }, [orders]);

    // Filter Logic for Table View
    const archivedOrders = useMemo(() => {
        return orders
            .filter(o => o.isArchived)
            .filter(o => {
                const matchesSearch = 
                    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    o.idDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    o.items.toLowerCase().includes(searchTerm.toLowerCase());
                
                const matchesStatus = filterStatus === 'all' 
                    ? true 
                    : o.status === filterStatus;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, searchTerm, filterStatus]);

    // Pagination Logic
    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return archivedOrders.slice(startIndex, startIndex + itemsPerPage);
    }, [archivedOrders, currentPage]);

    const totalPages = Math.ceil(archivedOrders.length / itemsPerPage);

    // Reset page on filter change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, searchTerm]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'Delivered': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Completed': return 'Completada';
            case 'Delivered': return 'Entregada';
            case 'Cancelled': return 'Cancelada';
            default: return status;
        }
    };

    const handleOpenReactivate = (order: Order) => {
        setTempOrder({ ...order });
        setReactivationReason('');
        setIsModalOpen(true);
    };

    const confirmReactivation = () => {
        if (tempOrder.id) {
            reactivateArchivedOrder(tempOrder.id, reactivationReason || 'Reactivación manual');
            setIsModalOpen(false);
            setReactivationReason('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-background-dark p-6 rounded-2xl">
            <div className="mb-6 flex-shrink-0 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Archivo de Órdenes</h1>
                    <p className="text-sm text-gray-500">Historial de compras y órdenes finalizadas.</p>
                </div>
            </div>

            {/* --- Operational Indicators --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 flex-shrink-0">
                {/* Card 1: Completed */}
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completadas</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{stats.completed}</h3>
                            <span className="text-[10px] text-gray-400">órdenes</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                        <span className="material-icons text-xl">task_alt</span>
                    </div>
                </div>

                {/* Card 2: Cancelled */}
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Canceladas</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{stats.cancelled}</h3>
                            <span className="text-[10px] text-gray-400">órdenes</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">
                        <span className="material-icons text-xl">delete_outline</span>
                    </div>
                </div>

                {/* Card 3: Total Spend */}
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm flex items-center justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Gasto Histórico</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-2xl font-display font-bold text-blue-900 dark:text-white">${stats.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                        </div>
                    </div>
                    <div className="relative z-10 w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full shadow-sm">
                        <span className="material-icons text-xl">payments</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col flex-1 min-h-0">
                
                {/* Filters Toolbar */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 flex flex-col sm:flex-row gap-4 justify-between items-center flex-shrink-0">
                    <div className="relative w-full sm:max-w-xs">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar proveedor, ID o items..." 
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-gray-900 dark:text-white"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Mini Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center bg-white dark:bg-surface-dark rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm mr-2">
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

                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer font-medium"
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="Completed">Completadas</option>
                            <option value="Delivered">Entregadas</option>
                            <option value="Cancelled">Canceladas</option>
                        </select>
                        
                        {(searchTerm || filterStatus !== 'all') && (
                            <button 
                                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                title="Limpiar filtros"
                            >
                                <span className="material-icons text-xl">filter_alt_off</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-white/5 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Proveedor</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {paginatedOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onOrderClick(order.id)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{order.date}</span>
                                            <span className="text-xs text-gray-400">{order.idDisplay}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {order.clientName.charAt(0)}
                                            </div>
                                            <span className="font-medium">{order.clientName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                        {order.items}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                        ${order.total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenReactivate(order); }}
                                            className="text-primary hover:text-green-900 hover:underline font-bold text-xs bg-primary/10 px-3 py-1 rounded-full"
                                        >
                                            Reactivar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {archivedOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <span className="material-icons text-4xl text-gray-300 mb-2">inventory_2</span>
                                            <p>No se encontraron órdenes en el archivo.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mostrando <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, archivedOrders.length)}</span> de <span className="font-bold">{archivedOrders.length}</span> órdenes
                    </p>
                    
                    {totalPages > 1 && (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-icons text-gray-600 dark:text-gray-300 text-sm">chevron_left</span>
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
                                            className={`w-6 h-6 rounded-md text-[10px] font-bold transition-colors ${
                                                currentPage === pageNum 
                                                    ? 'bg-white shadow-sm text-primary' 
                                                    : 'text-gray-500 hover:bg-white/50'
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
                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-icons text-gray-600 dark:text-gray-300 text-sm">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Reactivation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                <span className="material-icons text-xl">restore</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reactivar Orden</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    La orden <strong>{tempOrder.idDisplay}</strong> volverá al tablero principal.
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Motivo de Reactivación</label>
                                <textarea 
                                    value={reactivationReason}
                                    onChange={e => setReactivationReason(e.target.value)}
                                    placeholder="Ej: Error al archivar, revisión necesaria..."
                                    className="w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-sm dark:bg-black/20 outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] resize-none"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">Cancelar</button>
                            <button 
                                onClick={confirmReactivation} 
                                disabled={!reactivationReason.trim()}
                                className={`px-6 py-2 text-white text-sm font-bold rounded-lg shadow-lg transition-all 
                                    ${!reactivationReason.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-green-800 shadow-primary/20'}`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplyArchive;
