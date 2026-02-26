
import React, { useMemo } from 'react';
import { Appointment, AppointmentItem } from '../../types';

interface OperationsViewProps {
    appointments: Appointment[];
    allProducts: AppointmentItem[];
    searchTerm: string;
}

const OperationsView: React.FC<OperationsViewProps> = ({ appointments, allProducts, searchTerm }) => {
    const operationsView = useMemo(() => {
        // Find all active appointments (Confirmed or In Progress) that have reservations
        const activeAppts = appointments.filter(a => a.status === 'Confirmed' || a.status === 'In Progress');
        
        const reservedItemsMap = new Map<string, { item: AppointmentItem, totalReserved: number, breakdown: { apptId: string, client: string, qty: number, type: string }[] }>();

        activeAppts.forEach(appt => {
            appt.items.forEach(apptItem => {
                // 1. Direct Product Usage (Retail sale in appointment)
                if (apptItem.type === 'product') {
                    const key = String(apptItem.id);
                    // Use a more robust item retrieval (fallback to catalog if apptItem is incomplete)
                    const fullItem = allProducts.find(p => p.id === apptItem.id) || apptItem;
                    
                    const current = reservedItemsMap.get(key) || { item: fullItem, totalReserved: 0, breakdown: [] };
                    const qty = apptItem.quantity || 1;
                    
                    current.totalReserved += qty;
                    current.breakdown.push({ apptId: appt.id, client: appt.clientName, qty, type: 'Venta Directa' });
                    reservedItemsMap.set(key, current);
                }
                // 2. Service Consumption (Recipe)
                else if (apptItem.type === 'service' && apptItem.recipe) {
                    apptItem.recipe.forEach(ingredient => {
                        const product = allProducts.find(p => p.id === ingredient.id);
                        if (product) {
                            const key = String(product.id);
                            const current = reservedItemsMap.get(key) || { item: product, totalReserved: 0, breakdown: [] };
                            const qtyUsed = ingredient.qty; 
                            
                            current.totalReserved += qtyUsed;
                            current.breakdown.push({ apptId: appt.id, client: appt.clientName, qty: qtyUsed, type: `Insumo (${apptItem.title})` });
                            reservedItemsMap.set(key, current);
                        }
                    });
                }
            });
        });

        return Array.from(reservedItemsMap.values());
    }, [appointments, allProducts]);

    const filteredOperations = useMemo(() => {
        return operationsView.filter(op => op.item.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [operationsView, searchTerm]);

    if (filteredOperations.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <span className="material-icons text-4xl mb-2 opacity-50">event_available</span>
                <p>No hay productos en operación activa actualmente.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
            {filteredOperations.map((op: any) => (
                <div key={op.item.id} className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${op.item.type === 'product' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                                <span className="material-icons">{op.item.type === 'product' ? 'inventory_2' : 'spa'}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{op.item.title}</h4>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">SKU: {op.item.sku || '-'}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400">{op.totalReserved}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Reservados</span>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Detalle de Asignación</p>
                        {op.breakdown.map((b: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-100 dark:border-gray-700 last:border-0 pb-1 last:pb-0">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">{b.client}</span>
                                    <span className="text-[10px] text-gray-500 italic">{b.type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-white dark:bg-white/10 px-2 py-0.5 rounded text-[10px] font-mono border border-gray-200 dark:border-gray-600">x{b.qty}</span>
                                    <span className="text-[10px] text-indigo-500 font-bold">Cita #{b.apptId.split('-')[1]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OperationsView;
