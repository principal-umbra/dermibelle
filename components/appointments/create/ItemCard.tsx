
import React from 'react';
import { AppointmentItem, OpenStockItem } from '../../../context/DataContext';

interface RankedItem extends AppointmentItem {
    _usageCount?: number;
}

interface ItemCardProps {
    item: RankedItem;
    onAdd: (item: AppointmentItem) => void;
    isAvailable: boolean;
    openStock?: OpenStockItem[];
}

const ItemCard: React.FC<ItemCardProps> = React.memo(({ item, onAdd, isAvailable, openStock }) => {
    const stockDisplay = item.type === 'service' ? null : (item.stock || 0) - (item.reserved || 0);
    const isFractional = item.allowFractionalSale && item.fractionalPrice && item.fractionalPrice > 0;

    // Open Stock Logic
    const openItem = openStock?.find(o => o.productId === item.id);
    const openStockQty = openItem ? openItem.remaining : 0;

    if (isFractional) {
        return (
            <div className={`flex flex-col w-full bg-white dark:bg-surface-dark border rounded-lg transition-all overflow-hidden relative
                ${!isAvailable 
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/10' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-primary hover:shadow-sm'
                }
            `}>
                {/* Header Info */}
                <div className="flex items-center gap-2 p-2 pb-0">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300`}>
                        <span className="material-icons text-base">inventory_2</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-[10px] truncate leading-tight text-gray-800 dark:text-gray-200">{item.title}</p>
                        <div className="flex items-center gap-1">
                            <span className="text-[8px] px-1 rounded font-bold leading-none py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                Fraccionable
                            </span>
                            {isAvailable && (
                                <span className="text-[8px] text-gray-400">{stockDisplay} Disp.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 p-2 pt-1.5">
                    <button 
                        onClick={() => onAdd({ ...item, saleUnit: 'pack' })}
                        className="flex-1 flex flex-col items-center justify-center py-1.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-gray-700 rounded text-center transition-colors group/btn"
                    >
                        <span className="text-[8px] font-bold text-gray-500 uppercase">Caja</span>
                        <span className="font-mono font-bold text-xs text-gray-900 dark:text-white group-hover/btn:text-primary">${item.price}</span>
                    </button>
                    <button 
                        onClick={() => onAdd({ 
                            ...item, 
                            saleUnit: 'unit', 
                            price: item.fractionalPrice || 0,
                            title: `${item.title} (Unidad)`
                        })}
                        className={`flex-1 flex flex-col items-center justify-center py-1.5 border rounded text-center transition-colors group/btn
                            ${openStockQty > 0 
                                ? 'bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 border-green-100 dark:border-green-800/30' 
                                : 'bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 border-orange-100 dark:border-orange-800/30'
                            }
                        `}
                    >
                        <span className={`text-[8px] font-bold uppercase ${openStockQty > 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {openStockQty > 0 ? `Unidad (${openStockQty} Disp.)` : 'Unidad (Abrir Caja)'}
                        </span>
                        <span className={`font-mono font-bold text-xs ${openStockQty > 0 ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'} group-hover/btn:opacity-80`}>
                            ${item.fractionalPrice}
                        </span>
                    </button>
                </div>
            </div>
        );
    }
    
    return (
    <button 
        onClick={() => onAdd(item)}
        className={`flex items-center gap-2 p-2 w-full bg-white dark:bg-surface-dark border rounded-lg transition-all group h-12 overflow-hidden text-left relative
            ${!isAvailable 
                ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/10' 
                : 'border-gray-100 dark:border-gray-700 hover:border-primary hover:shadow-sm'
            }
        `}
    >
        {/* Availability Marker */}
        {!isAvailable && (
            <div className="absolute top-0 right-0 w-3 h-3 bg-amber-500 rounded-bl-lg z-10 flex items-center justify-center">
               <span className="material-icons text-[6px] text-white">warning</span>
            </div>
        )}

        {/* Icon Box */}
        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors 
            ${!isAvailable 
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' 
                : (item.type === 'service' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 group-hover:bg-purple-100' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300 group-hover:bg-orange-100')}
        `}>
            <span className="material-icons text-base">{item.type === 'service' ? 'spa' : 'inventory_2'}</span>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className={`font-bold text-[11px] truncate leading-tight transition-colors ${!isAvailable ? 'text-amber-800 dark:text-amber-200' : 'text-gray-800 dark:text-gray-200 group-hover:text-primary'}`}>
                {item.title}
            </p>
            <div className="flex items-center gap-1.5">
                <p className="text-[9px] text-gray-400 capitalize truncate max-w-[80px]">{item.category || item.type}</p>
                {!isAvailable && (
                    <span className="text-[8px] px-1 rounded font-bold leading-none py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {item.type === 'service' ? 'Insumos Agotados' : 'Sin Stock'}
                    </span>
                )}
                {isAvailable && item.type === 'product' && (
                    <span className="text-[8px] px-1 rounded font-bold leading-none py-0.5 bg-gray-100 text-gray-600">
                        {stockDisplay} Disp.
                    </span>
                )}
            </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0 pl-1 border-l border-gray-100 dark:border-gray-700/50">
            <span className="font-mono font-bold text-xs text-gray-900 dark:text-white block">${item.price}</span>
        </div>
    </button>
)});

export default ItemCard;
