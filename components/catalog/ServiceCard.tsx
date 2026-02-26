
import React from 'react';
import { AppointmentItem } from '../../types';

interface ServiceCardProps {
    item: AppointmentItem;
    onView: (item: AppointmentItem) => void;
    onEdit: (item: AppointmentItem) => void;
    onDelete: (id: string | number) => void;
    calculateCost: (recipe: any[]) => number;
    checkAvailability?: (item: AppointmentItem) => boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ item, onView, onEdit, onDelete, calculateCost, checkAvailability }) => {
    const calculatedCost = calculateCost(item.recipe || []);
    const margin = item.price - calculatedCost;
    const marginPercent = item.price > 0 ? (margin / item.price) * 100 : 0;
    
    // Determine availability (default to true if checker not provided)
    const isAvailable = checkAvailability ? checkAvailability(item) : true;

    return (
        <div 
            className={`rounded-2xl p-5 hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer flex flex-col justify-between h-full
                ${!isAvailable 
                    ? 'bg-red-50 dark:bg-red-900/10 border-2 border-red-500 shadow-md shadow-red-100 dark:shadow-none' 
                    : 'bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800'
                }
            `}
            onClick={() => onView(item)}
        >
            {/* Availability Badge */}
            {!isAvailable && (
                <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-white uppercase tracking-wider shadow-sm bg-red-500 z-10">
                    INSUMOS INSUFICIENTES
                </div>
            )}

            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
                        ${!isAvailable ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300'}`}>
                        <span className="material-icons">{!isAvailable ? 'production_quantity_limits' : 'spa'}</span>
                    </div>
                    <div>
                        <h4 className={`font-bold leading-tight transition-colors ${!isAvailable ? 'text-red-900 dark:text-red-200' : 'text-gray-900 dark:text-white group-hover:text-purple-600'}`}>{item.title}</h4>
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full mt-1 inline-block ${!isAvailable ? 'text-red-600 bg-red-100/50' : 'text-gray-500 bg-gray-100 dark:bg-white/5'}`}>{item.category}</span>
                    </div>
                </div>
                <div className="text-right mt-1">
                    <span className={`block font-display font-bold text-xl ${!isAvailable ? 'text-red-800 dark:text-red-200' : 'text-gray-900 dark:text-white'}`}>${item.price}</span>
                </div>
            </div>

            {/* Recipe / Cost Micro-Dashboard */}
            <div className={`rounded-xl p-3 border mb-3 ${!isAvailable ? 'bg-white dark:bg-black/20 border-red-200 dark:border-red-900/30' : 'bg-gray-50/50 dark:bg-black/20 border-gray-100 dark:border-gray-800/50'}`}>
                <div className="flex justify-between items-end mb-1">
                    <span className={`text-[10px] font-bold uppercase ${!isAvailable ? 'text-red-400' : 'text-gray-400'}`}>Costo Receta</span>
                    <span className={`text-xs font-mono font-bold ${!isAvailable ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>${calculatedCost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mb-1">
                    <div className={`h-full ${!isAvailable ? 'bg-red-400' : marginPercent > 70 ? 'bg-green-500' : marginPercent > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${100 - marginPercent}%` }}></div>
                </div>
                <div className="flex justify-between items-center">
                    <span className={`text-[9px] ${!isAvailable ? 'text-red-400' : 'text-gray-400'}`}>{item.recipe?.length || 0} ingredientes</span>
                    <span className={`text-[10px] font-bold ${!isAvailable ? 'text-red-500' : (marginPercent > 70 ? 'text-green-600' : 'text-orange-500')}`}>Margen: {marginPercent.toFixed(0)}%</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-auto">
                <button 
                    onClick={(e) => { e.stopPropagation(); onView(item); }} 
                    className={`p-2 rounded-lg transition-colors ${!isAvailable ? 'text-red-400 hover:bg-red-100 hover:text-red-700' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`} 
                    title="Ver Detalle"
                >
                    <span className="material-icons text-sm">visibility</span>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
                    className={`p-2 rounded-lg transition-colors ${!isAvailable ? 'text-red-400 hover:bg-red-100 hover:text-red-700' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`} 
                    title="Editar"
                >
                    <span className="material-icons text-sm">edit</span>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
                    className={`p-2 rounded-lg transition-colors ${!isAvailable ? 'text-red-400 hover:bg-red-100 hover:text-red-700' : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`} 
                    title="Eliminar"
                >
                    <span className="material-icons text-sm">delete</span>
                </button>
            </div>
        </div>
    );
};

export default ServiceCard;
