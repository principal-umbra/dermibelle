
import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';

interface SupplierTimelineProps {
    supplierId: string;
}

const TimelineItem: React.FC<{ event: any }> = ({ event }) => {
    const isOrder = event.type === 'order';
    const isLog = event.type === 'log';
    
    // Style config
    let icon = 'circle';
    let colorClass = 'bg-gray-100 text-gray-500 border-gray-200';
    
    if (isOrder) {
        icon = 'inventory_2';
        if (event.status === 'Delivered') colorClass = 'bg-green-100 text-green-600 border-green-200';
        else if (event.status === 'Processing') colorClass = 'bg-blue-100 text-blue-600 border-blue-200';
        else colorClass = 'bg-orange-100 text-orange-600 border-orange-200';
    } else if (isLog) {
        if (event.action === 'whatsapp') { icon = 'chat'; colorClass = 'bg-green-50 text-green-600 border-green-100'; }
        else if (event.action === 'email') { icon = 'mail'; colorClass = 'bg-orange-50 text-orange-600 border-orange-100'; }
        else if (event.action === 'call') { icon = 'call'; colorClass = 'bg-blue-50 text-blue-600 border-blue-100'; }
        else if (event.action === 'edit_profile') { icon = 'edit_note'; colorClass = 'bg-indigo-50 text-indigo-600 border-indigo-100'; }
        else if (event.action === 'manual_note') { icon = 'sticky_note_2'; colorClass = 'bg-yellow-50 text-yellow-600 border-yellow-100'; }
    }

    return (
        <div className="flex gap-4 relative group pb-8 last:pb-0">
            {/* Line */}
            <div className="absolute top-8 bottom-0 left-[15px] w-px bg-gray-200 dark:bg-gray-700 group-last:hidden"></div>
            
            {/* Icon */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm shrink-0 ${colorClass} dark:bg-opacity-10 dark:border-opacity-30`}>
                <span className="material-icons text-sm">{icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {event.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded">
                        {event.dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {event.dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {isOrder ? (
                    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm mt-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-mono font-bold text-gray-500">{event.idDisplay}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${event.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {event.status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{event.items}</p>
                        <div className="flex justify-end border-t border-gray-100 dark:border-gray-800 pt-2">
                            <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">${event.total.toFixed(2)}</span>
                        </div>
                    </div>
                ) : (
                    <div className={`text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed ${event.action === 'manual_note' ? 'italic bg-yellow-50/50 p-2 rounded-lg border border-yellow-100' : ''}`}>
                        {event.details}
                    </div>
                )}
            </div>
        </div>
    );
};

const SupplierTimeline: React.FC<SupplierTimelineProps> = ({ supplierId }) => {
    const { clientLogs, orders, suppliers } = useData();
    const supplier = suppliers.find(s => s.id === supplierId);

    const timelineEvents = useMemo(() => {
        if (!supplier) return [];

        const logs = clientLogs.filter(l => l.clientId === supplierId).map(l => ({
            id: l.id,
            type: 'log',
            title: l.action === 'whatsapp' ? 'WhatsApp' : l.action === 'edit_profile' ? 'Actualización' : 'Nota',
            details: l.description,
            dateObj: new Date(l.timestamp),
            action: l.action
        }));

        const supplierOrders = orders.filter(o => o.clientName === supplier.companyName).map(o => ({
            id: o.id,
            idDisplay: o.idDisplay,
            type: 'order',
            title: 'Orden de Compra',
            status: o.status,
            items: o.items,
            total: o.total,
            dateObj: new Date(o.date)
        }));

        return [...logs, ...supplierOrders].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    }, [clientLogs, orders, supplier, supplierId]);

    return (
        <div className="py-2">
            {timelineEvents.length === 0 ? (
                <div className="text-center py-12 opacity-50">
                    <span className="material-icons text-4xl text-gray-300 mb-2">history</span>
                    <p className="text-sm text-gray-500">No hay historial registrado.</p>
                </div>
            ) : (
                <div className="pl-2">
                    {timelineEvents.map((evt, idx) => (
                        <TimelineItem key={`${evt.type}-${evt.id}-${idx}`} event={evt} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SupplierTimeline;
