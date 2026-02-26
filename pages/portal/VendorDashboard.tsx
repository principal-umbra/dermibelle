
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const VendorDashboard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { orders, suppliers, supplierInvoices } = useData();

    // Get Supplier
    const supplier = useMemo(() => suppliers.find(s => s.id === id), [suppliers, id]);

    // Get Data (Filtered: Only visible orders)
    const myOrders = useMemo(() => {
        if (!supplier) return [];
        return orders
            .filter(o => 
                (o.supplierId === id || o.clientName === supplier.companyName) && 
                o.status !== 'Draft' && 
                o.status !== 'Pending Approval' // Filter out internal states
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, id, supplier]);

    // Stats
    const stats = useMemo(() => {
        // Pending includes: Placed (New) and Placed (Approved Negotiation)
        const pending = myOrders.filter(o => o.status === 'Placed' && !((o as any).inDispute)).length;
        const inTransit = myOrders.filter(o => o.status === 'In Transit').length;
        const disputed = myOrders.filter(o => (o as any).inDispute).length;
        
        // Calculate pending payments based on linked invoices
        const unpaidAmount = supplierInvoices
            .filter(i => i.supplierId === id && i.status !== 'Paid')
            .reduce((sum, i) => sum + i.amount, 0);

        return { pending, inTransit, disputed, unpaidAmount };
    }, [myOrders, supplierInvoices, id]);

    if (!supplier) return <div className="text-white p-10 bg-gray-900 h-screen flex items-center justify-center">Proveedor no encontrado.</div>;

    const getStatusBadge = (order: any) => {
        // 1. DISPUTE: Priority State
        if (order.inDispute) {
            return <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold uppercase flex items-center gap-1 w-fit shadow-lg shadow-amber-500/20"><span className="material-icons text-sm">gavel</span> En Disputa</span>;
        }

        switch (order.status) {
            case 'Placed': 
                // 2. APPROVED NEGOTIATION vs NEW ORDER
                // Logic Fix: Only show "Accepted" if it differs from the Initial V1.0 Order
                const isModifiedFromInitial = order.initialLines && order.originalLines 
                    ? JSON.stringify(order.initialLines) !== JSON.stringify(order.originalLines)
                    : false;

                if (isModifiedFromInitial) {
                    return (
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold uppercase flex items-center gap-1 w-fit shadow-lg shadow-emerald-500/20 border border-emerald-400">
                            <span className="material-icons text-sm">check_circle</span> Propuesta Aceptada
                        </span>
                    );
                }
                return <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase flex items-center gap-1"><span className="material-icons text-[10px]">new_releases</span> Nueva Orden</span>;
            
            case 'Revision Sent': return <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold uppercase flex items-center gap-1"><span className="material-icons text-[10px]">update</span> Modificada</span>;
            case 'In Transit': return <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold uppercase">En Camino</span>;
            case 'Delivered': return <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold uppercase">Completada</span>;
            case 'Partially Received': return <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold uppercase">Parcial / Issue</span>;
            case 'Cancelled': return <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase">Cancelada</span>;
            default: return <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30 text-xs font-bold uppercase">{order.status}</span>;
        }
    };

    const getPaymentStatus = (orderId: string) => {
        const inv = supplierInvoices.find(i => i.linkedOrderId === orderId);
        if (!inv) return <span className="text-gray-500 italic text-xs">Sin Factura</span>;
        
        if (inv.status === 'Paid') return <span className="text-green-400 font-bold text-xs flex items-center gap-1"><span className="material-icons text-[10px]">check</span> Pagado</span>;
        if (inv.status === 'Scheduled') return <span className="text-purple-400 font-bold text-xs">Programado {inv.scheduledDate}</span>;
        if (inv.status === 'Approved') return <span className="text-blue-400 font-bold text-xs">Aprobado (Por Pagar)</span>;
        return <span className="text-yellow-500 font-bold text-xs">Pendiente</span>;
    };

    const getReceivedStatus = (order: any) => {
        if (order.status === 'Placed') return <span className="text-gray-500 text-xs">-</span>;
        if (order.status === 'In Transit') return <span className="text-orange-400 text-xs">En Tránsito</span>;
        
        const total = order.lines?.reduce((acc:number, l:any) => acc + l.qty, 0) || 0;
        const received = order.lines?.reduce((acc:number, l:any) => acc + (l.receivedQty || 0), 0) || 0;
        
        if (received === 0) return <span className="text-gray-500 text-xs">0%</span>;
        if (received >= total) return <span className="text-green-400 text-xs font-bold">100% Recibido</span>;
        return <span className="text-yellow-400 text-xs font-bold">Parcial ({received}/{total})</span>;
    };

    return (
        <div className="min-h-screen bg-gray-900 font-body text-gray-200">
            
            {/* Navbar */}
            <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-icons">spa</span>
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-xl tracking-tight text-white">Dermibelle</h1>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Portal Proveedores</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white">{supplier.companyName}</p>
                            <p className="text-xs text-gray-500">{supplier.email}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-700 mx-2"></div>
                        <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase flex items-center gap-2">
                            <span className="material-icons text-sm">logout</span> Salir
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-10">
                
                {/* Header Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-display font-bold text-white mb-2">Panel de Gestión</h2>
                    <p className="text-gray-400">Resumen de operaciones y estado de cuenta.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                             <span className="material-icons text-6xl text-blue-500">assignment_turned_in</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Nuevas Órdenes</p>
                        <p className="text-3xl font-bold text-white">{stats.pending}</p>
                        <p className="text-[10px] text-blue-400 mt-1 font-bold">Requieren atención</p>
                    </div>

                    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                             <span className="material-icons text-6xl text-orange-500">local_shipping</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">En Tránsito</p>
                        <p className="text-3xl font-bold text-white">{stats.inTransit}</p>
                        <p className="text-[10px] text-orange-400 mt-1 font-bold">En camino</p>
                    </div>

                    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                             <span className="material-icons text-6xl text-amber-500">gavel</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">En Disputa</p>
                        <p className="text-3xl font-bold text-white">{stats.disputed}</p>
                        <p className="text-[10px] text-amber-400 mt-1 font-bold">Cambios propuestos</p>
                    </div>

                    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                             <span className="material-icons text-6xl text-green-500">payments</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Por Cobrar</p>
                        <p className="text-3xl font-bold text-green-400">${stats.unpaidAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Facturas pendientes</p>
                    </div>
                </div>

                {/* Orders List */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/30">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wide">Historial de Órdenes</h3>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500 block"></span>
                            <span className="text-[10px] text-gray-400 uppercase">Activas</span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-700">
                                <tr>
                                    <th className="px-6 py-3">ID Orden</th>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Estado Orden</th>
                                    <th className="px-6 py-3">Estado Pago</th>
                                    <th className="px-6 py-3">Recepción</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 text-sm">
                                {myOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-700/30 transition-colors group cursor-pointer" onClick={() => navigate(`/portal/order/${order.id}`)}>
                                        <td className="px-6 py-4 font-mono font-bold text-blue-400 group-hover:underline">{order.idDisplay}</td>
                                        <td className="px-6 py-4 text-gray-300">{new Date(order.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{getStatusBadge(order)}</td>
                                        <td className="px-6 py-4">{getPaymentStatus(order.id)}</td>
                                        <td className="px-6 py-4">{getReceivedStatus(order)}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-200">${order.total.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="material-icons text-gray-500 text-lg group-hover:text-white transition-colors">chevron_right</span>
                                        </td>
                                    </tr>
                                ))}
                                {myOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-gray-500 italic">No hay órdenes registradas.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default VendorDashboard;
