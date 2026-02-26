
import React, { useMemo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Appointment, useData } from '../../context/DataContext';

interface AppointmentCardProps {
    apt: Appointment;
    index: number;
    onClick: (apt: Appointment) => void;
    onPay?: (apt: Appointment) => void;
    hasPendingBalance?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ apt, index, onClick, onPay, hasPendingBalance = false }) => {
    const { catalog } = useData();

    // Check for stock issues (Products with 0 stock or Services with missing ingredients)
    const hasStockIssues = useMemo(() => {
        if (apt.status === 'Finalized' || apt.status === 'Cancelled') return false;

        return apt.items.some(apptItem => {
             const catalogItem = catalog.find(i => i.id === apptItem.id);
             if (!catalogItem) return false;

             if (catalogItem.type === 'product') {
                 // Check physical stock
                 return (catalogItem.stock || 0) <= 0;
             }
             
             if (catalogItem.type === 'service' && catalogItem.recipe) {
                 // Check if ANY ingredient is out of stock
                 return catalogItem.recipe.some(ing => {
                     const product = catalog.find(p => p.id === ing.id);
                     return product ? (product.stock || 0) <= 0 : false;
                 });
             }
             return false;
        });
    }, [catalog, apt.items, apt.status]);

    return (
        <Draggable 
            key={apt.id} 
            draggableId={apt.id} 
            index={index} 
            // Allow dragging Pending/Confirmed/In Progress (Validation happens on drop)
            isDragDisabled={apt.status === 'Finalized' || apt.status === 'Cancelled'}
        >
            {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={(e) => { e.stopPropagation(); onClick(apt); }} 
                 className={`bg-white dark:bg-surface-dark rounded-3xl p-3.5 shadow-sm border transition-all cursor-pointer group relative flex flex-col gap-2
                    ${snapshot.isDragging ? 'rotate-2 z-50 ring-2 ring-primary shadow-2xl' : ''}
                    ${hasStockIssues 
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10 ring-1 ring-amber-400/30' 
                        : 'border-gray-100 dark:border-gray-700 hover:shadow-lg'
                    }
                    ${apt.status === 'Finalized' ? 'opacity-75 grayscale-[0.3] border-t-2 border-t-purple-400' : ''}
                    ${apt.status === 'In Progress' && !hasStockIssues ? 'border-t-2 border-t-blue-500 shadow-blue-500/5' : ''}
                    ${apt.status === 'Pending' && !hasStockIssues ? 'border-t-2 border-t-yellow-400' : ''}
                 `}
                 style={provided.draggableProps.style}
            >
                {/* Embedded Warning Banner - Prevents Overlap */}
                {hasStockIssues && (
                    <div className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center justify-center gap-1.5 border border-amber-200 mb-1">
                        <span className="material-icons text-sm">warning</span>
                        <span>FALTA STOCK / INSUMOS</span>
                    </div>
                )}

                <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border 
                            ${hasStockIssues 
                                ? 'bg-amber-200/50 text-amber-700 border-amber-200' 
                                : 'bg-gray-50 dark:bg-white/5 text-gray-400 border-gray-100 dark:border-gray-700'
                            }`}>
                            <span className="material-icons text-lg">calendar_today</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-gray-900 dark:text-white text-[11px]">{apt.id}</span>
                                <span className={`px-1.5 py-0 rounded text-[8px] font-bold uppercase tracking-wide border
                                    ${apt.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' : 
                                      apt.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                                      apt.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 
                                      apt.status === 'Finalized' ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' :
                                      'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                                    {apt.status === 'In Progress' ? 'IN PROGRESS' : apt.status.toUpperCase()}
                                </span>
                            </div>
                            <span className="text-[8px] text-gray-400 block font-medium">
                                Creada: {new Date(apt.createdAt || 0).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <span className="font-display font-bold text-lg text-[#166534] dark:text-green-400">
                        ${apt.total}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {apt.clientAvatar ? (
                        <img src={apt.clientAvatar} className="w-8 h-8 rounded-full object-cover shadow-sm" alt=""/>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-[10px] text-gray-500">
                            {apt.clientName.substring(0,2)}
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight mb-0">{apt.clientName}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <span className="material-icons text-[10px] opacity-70">face</span> {apt.specialistName}
                        </p>
                    </div>
                </div>

                <div className={`rounded-xl p-2 border ${hasStockIssues ? 'bg-amber-100/50 border-amber-200' : 'bg-[#F8F9FA] dark:bg-white/5 border-gray-100 dark:border-gray-800'}`}>
                    <p className={`text-[11px] font-bold truncate ${hasStockIssues ? 'text-amber-800' : 'text-gray-700 dark:text-gray-300'}`}>
                        {apt.items?.[0]?.title || 'Sin servicios'}
                    </p>
                    {apt.items && apt.items.length > 1 && (
                        <p className={`text-[9px] font-medium mt-0.5 ${hasStockIssues ? 'text-amber-600' : 'text-gray-400'}`}>
                            +{apt.items.length - 1} servicios adicionales
                        </p>
                    )}
                </div>

                <div className="">
                    <p className="text-[10px] font-bold text-gray-900 dark:text-gray-300 capitalize">
                        {new Date(apt.date + 'T' + apt.time).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} | {apt.time}
                    </p>
                </div>

                {apt.status === 'In Progress' && hasPendingBalance && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onPay) onPay(apt);
                        }}
                        className="w-full py-2 bg-[#166534] hover:bg-[#14532d] text-white rounded-b-xl rounded-t-lg text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all mt-0.5 -mb-1"
                    >
                        <span className="material-icons text-sm">payments</span> Pagar & Finalizar
                    </button>
                )}
            </div>
            )}
        </Draggable>
    );
};

export default AppointmentCard;
