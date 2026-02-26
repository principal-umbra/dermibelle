import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppointmentItem, Order, StockLog } from '../../../types';

interface ProductOrderHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    item: AppointmentItem;
    orders: Order[];
    stockLogs?: StockLog[];
}

type AuditEvent = {
    id: string;
    date: string;
    type: 'order' | 'movement';
    data: any;
};

const translateStatus = (status: string) => {
    const map: Record<string, string> = {
        'Draft': 'Borrador',
        'Placed': 'Enviada',
        'In Transit': 'En Tránsito',
        'Delivered': 'Entregada',
        'Partially Received': 'Recibida Parcial',
        'Pending Approval': 'Pendiente Aprobación',
        'Completed': 'Completada',
        'Cancelled': 'Cancelada',
        'Scheduled': 'Programada',
        'Revision Sent': 'Revisión Enviada'
    };
    return map[status] || status;
};

const translateReason = (reason: string) => {
    const map: Record<string, string> = {
        'manual_correction': 'Corrección Manual',
        'finished': 'Agotado',
        'expired': 'Expirado',
        'damaged': 'Dañado',
        'quality': 'Control Calidad',
        'Adjustment': 'Ajuste',
        'Discard': 'Descarte'
    };
    return map[reason] || reason;
};

const ProductOrderHistoryDrawer: React.FC<ProductOrderHistoryDrawerProps> = ({ isOpen, onClose, item, orders, stockLogs = [] }) => {
    const [filterType, setFilterType] = useState<'all' | 'anomalies'>('all');

    // --- UNIFIED AUDIT TRAIL ---
    const auditTrail = useMemo(() => {
        const events: AuditEvent[] = [];

        // Add Orders
        orders.filter(o => o.lines?.some(l => l.itemId === item.id)).forEach(o => {
            const line = o.lines?.find(l => l.itemId === item.id);
            events.push({
                id: `order-${o.id}`,
                date: line?.receptionDate || o.date,
                type: 'order',
                data: o
            });
        });

        // Add Stock Logs
        stockLogs.filter(log => String(log.itemId) === String(item.id)).forEach(log => {
            events.push({
                id: `log-${log.id}`,
                date: log.date,
                type: 'movement',
                data: log
            });
        });

        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, stockLogs, item.id]);

    // --- INTELLIGENT ANALYTICS ---
    const analytics = useMemo(() => {
        const orderLines = orders
            .map(o => o.lines?.find(l => l.itemId === item.id))
            .filter(Boolean) as any[];

        const totalOrders = orderLines.length;
        const discrepancies = orderLines.filter(l => l.receivedQty !== undefined && l.receivedQty !== l.qty).length;
        const unitChanges = orderLines.filter(l => l.unitAtReception && l.unitAtOrder && l.unitAtReception !== l.unitAtOrder).length;
        const priceShifts = orderLines.filter(l => l.priceAtReception !== undefined && l.price !== undefined && Math.abs(l.priceAtReception - l.price) > 0.01).length;
        
        // Reliability Score (0-100)
        const penalty = (discrepancies * 15) + (unitChanges * 10) + (priceShifts * 5);
        const score = Math.max(0, 100 - (totalOrders > 0 ? penalty / totalOrders : 0));

        return {
            score,
            discrepancies,
            unitChanges,
            priceShifts,
            totalOrders,
            status: score > 90 ? 'Excelente' : score > 70 ? 'Estable' : 'Crítico'
        };
    }, [orders, item.id]);

    const filteredEvents = useMemo(() => {
        if (filterType === 'all') return auditTrail;
        return auditTrail.filter(event => {
            if (event.type === 'order') {
                const line = (event.data as Order).lines?.find(l => l.itemId === item.id);
                if (!line) return false;
                const hasQtyDiff = line.receivedQty !== undefined && line.receivedQty !== line.qty;
                const hasUnitDiff = line.unitAtReception && line.unitAtOrder && line.unitAtReception !== line.unitAtOrder;
                const hasPriceDiff = line.priceAtReception !== undefined && line.price !== undefined && Math.abs(line.priceAtReception - line.price) > 0.01;
                return hasQtyDiff || hasUnitDiff || hasPriceDiff;
            }
            return (event.data as StockLog).reasonCategory === 'damaged' || (event.data as StockLog).reasonCategory === 'expired';
        });
    }, [auditTrail, filterType, item.id]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]"
                    />
                    
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 35, stiffness: 350 }}
                        className="fixed top-0 right-0 h-full w-full max-w-lg bg-white text-slate-900 shadow-2xl z-[120] flex flex-col border-l border-slate-200"
                    >
                        {/* HEADER: CLEAN LIGHT STYLE */}
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                                            Auditoría de Producto
                                        </div>
                                        <span className="text-slate-400 font-mono text-[10px] tracking-widest">
                                            v2.5.0-STABLE
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                        {item.title}
                                    </h2>
                                    <p className="text-slate-500 font-mono text-[10px] mt-1 uppercase tracking-widest">
                                        SKU: {item.sku || 'N/A'} • ID: {item.id}
                                    </p>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            {/* INTELLIGENT KPI GRID */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Confiabilidad</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-slate-900">{Math.round(analytics.score)}%</span>
                                        <span className={`text-[9px] font-bold uppercase ${analytics.score > 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {analytics.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Anomalías</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-slate-900">{analytics.discrepancies + analytics.unitChanges + analytics.priceShifts}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Detectadas</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cambios Precio</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-slate-900">{analytics.priceShifts}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Eventos</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FILTER BAR */}
                        <div className="px-8 py-3 flex gap-6 border-b border-slate-100 bg-white">
                            <button 
                                onClick={() => setFilterType('all')}
                                className={`text-[10px] font-bold uppercase tracking-widest transition-all relative py-1 ${filterType === 'all' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Todos los Eventos
                                {filterType === 'all' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                            </button>
                            <button 
                                onClick={() => setFilterType('anomalies')}
                                className={`text-[10px] font-bold uppercase tracking-widest transition-all relative py-1 ${filterType === 'anomalies' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Solo Anomalías
                                {filterType === 'anomalies' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />}
                            </button>
                        </div>

                        {/* UNIFIED TIMELINE CONTENT */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10 bg-slate-50/30">
                            {filteredEvents.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                    <span className="material-icons text-6xl mb-4">history</span>
                                    <p className="text-xs font-bold uppercase tracking-widest">Sin Datos Registrados</p>
                                </div>
                            ) : (
                                filteredEvents.map((event, idx) => (
                                    <div key={event.id} className="relative pl-8 border-l border-slate-200">
                                        {/* Timeline Node */}
                                        <div className={`absolute -left-[5px] top-0 w-[9px] h-[9px] rounded-full border-2 border-white shadow-sm ${event.type === 'order' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                                        
                                        {/* Date Header */}
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(event.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <div className="h-px flex-1 bg-slate-100" />
                                            <span className="text-[10px] text-slate-300 font-mono">
                                                {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {event.type === 'order' ? (
                                            <OrderEventCard order={event.data} itemId={item.id} item={item} />
                                        ) : (
                                            <MovementEventCard log={event.data} />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* FOOTER */}
                        <div className="p-6 border-t border-slate-100 bg-white">
                            <button 
                                onClick={onClose}
                                className="w-full py-3.5 bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                            >
                                Cerrar Auditoría
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// --- SUB-COMPONENTS FOR CLEAN DESIGN ---

const OrderEventCard: React.FC<{ order: Order; itemId: string | number; item: AppointmentItem }> = ({ order, itemId, item }) => {
    const line = order.lines?.find(l => l.itemId === itemId);
    if (!line) return null;

    const hasQtyDiff = line.receivedQty !== undefined && line.receivedQty !== line.qty;
    const hasUnitDiff = line.unitAtReception && line.unitAtOrder && line.unitAtReception !== line.unitAtOrder;
    
    // Smart Price Logic:
    // If we have a stored priceAtReception, use it.
    // BUT, if the stored price is suspiciously low (e.g. < 50% of PO price) AND the units match (case-insensitive),
    // it might be a legacy data error where unit cost was stored instead of package cost.
    // In that case, we can try to infer the correct "Current" price from the catalog item if available.
    
    let displayCurrentPrice = line.priceAtReception || line.price;
    
    // Check for potential unit cost vs package cost mismatch in legacy data
    if (line.priceAtReception && line.priceAtReception < (line.price * 0.5)) {
        const orderUnit = line.unitAtOrder?.toLowerCase() || '';
        const packageUnit = item.packageInfo?.purchaseUnit?.toLowerCase() || '';
        
        // If units match, but price is way off, it's likely the bug we just fixed.
        // Show the package cost from the item if available as a better reference for "Current"
        if (orderUnit === packageUnit && item.packageCost) {
             // Only override if the item.packageCost is closer to line.price (e.g. within 50%)
             // or if we just want to show the current catalog price as "ACT"
             displayCurrentPrice = item.packageCost;
        }
    }

    const hasPriceDiff = displayCurrentPrice !== undefined && line.price !== undefined && Math.abs(displayCurrentPrice - line.price) > 0.01;

    return (
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-5">
                <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">Recepción de Orden</h4>
                    <p className="text-xs font-bold text-slate-900">{order.idDisplay} <span className="text-slate-400 font-normal mx-1">•</span> <span className="text-slate-500 font-medium">{translateStatus(order.status)}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">Stock al Ordenar</p>
                    <p className="text-lg font-bold text-slate-900 leading-none">{line.stockAtOrder ?? '??'}</p>
                </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-3 gap-4">
                {/* Quantity Comparison */}
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cantidad</p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[7px] text-slate-400 uppercase font-bold">Ped</p>
                            <p className="text-sm font-bold text-slate-900">{line.qty}</p>
                        </div>
                        <span className="material-icons text-slate-200 text-sm">arrow_forward</span>
                        <div>
                            <p className="text-[7px] text-slate-400 uppercase font-bold">Rec</p>
                            <p className={`text-sm font-bold ${hasQtyDiff ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {line.receivedQty ?? 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Unit Comparison */}
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Unidad</p>
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <p className="text-[7px] text-slate-400 uppercase font-bold">Ord</p>
                            <p className="text-[10px] font-bold text-slate-900 truncate uppercase">{line.unitAtOrder || 'unid'}</p>
                        </div>
                        <span className="material-icons text-slate-200 text-sm mx-1">swap_horiz</span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[7px] text-slate-400 uppercase font-bold">Act</p>
                            <p className={`text-[10px] font-bold truncate uppercase ${hasUnitDiff ? 'text-amber-600' : 'text-slate-600'}`}>
                                {line.unitAtReception || line.unitAtOrder || 'unid'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Price Comparison */}
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Precio</p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[7px] text-slate-400 uppercase font-bold">OC</p>
                            <p className="text-[10px] font-bold text-slate-900">${line.price.toFixed(2)}</p>
                        </div>
                        <span className="material-icons text-slate-200 text-sm">payments</span>
                        <div>
                            <p className="text-[7px] text-slate-400 uppercase font-bold">Act</p>
                            <p className={`text-[10px] font-bold ${hasPriceDiff ? 'text-rose-600' : 'text-slate-600'}`}>
                                ${displayCurrentPrice.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Anomalies Footer */}
            {(hasQtyDiff || hasUnitDiff || hasPriceDiff) && (
                <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap gap-2">
                    {hasQtyDiff && (
                        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                            <span className="material-icons text-[10px]">warning</span>
                            Dif. Cantidad: {line.qty - (line.receivedQty || 0)}
                        </div>
                    )}
                    {hasUnitDiff && (
                        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                            <span className="material-icons text-[10px]">rule</span>
                            Cambio Unidad
                        </div>
                    )}
                    {hasPriceDiff && (
                        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                            <span className="material-icons text-[10px]">trending_up</span>
                            Var. Precio: {((((displayCurrentPrice || 0) - line.price) / line.price) * 100).toFixed(1)}%
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MovementEventCard: React.FC<{ log: StockLog }> = ({ log }) => {
    const isPositive = log.quantityChange > 0;
    
    return (
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isPositive ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-rose-100 bg-rose-50 text-rose-600'}`}>
                        <span className="material-icons">{isPositive ? 'add' : 'remove'}</span>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Movimiento de Stock</h4>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">{translateReason(log.action)} <span className="text-slate-300 font-normal mx-1">•</span> {translateReason(log.reasonCategory)}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? '+' : ''}{log.quantityChange.toFixed(1)}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{log.unit}</p>
                </div>
            </div>
            {log.notes && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border-l-2 border-slate-200">
                    <p className="text-[10px] text-slate-500 italic leading-relaxed">"{log.notes}"</p>
                </div>
            )}
        </div>
    );
};

export default ProductOrderHistoryDrawer;
