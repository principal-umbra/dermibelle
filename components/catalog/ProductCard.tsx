
import React from 'react';
import { AppointmentItem, GlobalInventorySettings } from '../../types';

interface ProductCardProps {
    item: AppointmentItem;
    context: 'retail' | 'consumable';
    globalSettings: GlobalInventorySettings;
    onView: (item: AppointmentItem) => void;
    onEdit: (item: AppointmentItem) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, context, globalSettings, onView, onEdit }) => {
    const stock = item.stock || 0;
    const min = item.minStock || 0;
    
    // Status Logic
    let statusColor = stock === 0 ? 'bg-red-500' : stock <= min ? 'bg-orange-500' : 'bg-green-500';
    
    // Special Logic for Damaged/Expired/Finished Items
    const isProblematic = item.qualityStatus === 'damaged' || item.qualityStatus === 'expired' || item.qualityStatus === 'finished';
    
    if (isProblematic) {
        if (item.qualityStatus === 'finished') {
            statusColor = 'bg-blue-600';
        } else {
            statusColor = item.qualityStatus === 'expired' ? 'bg-orange-500' : 'bg-red-600';
        }
    }

    const margin = item.price - (item.cost || 0);
    const marginPercent = item.price > 0 ? (margin / item.price) * 100 : 0;
    
    const isMixed = item.subtype === 'both';
    
    // Allocation Logic
    const allocation = isMixed 
        ? (item.stockConfig?.isCustom ? item.stockConfig.retailRatio : globalSettings.defaultRetailRatio)
        : (item.subtype === 'retail' ? 1 : 0);
    
    const retailStock = Math.floor(stock * allocation);
    const consumableStock = stock - retailStock;
    
    // Fix: If item is problematic (archived), show full stock regardless of context to avoid hiding retail items in consumable views
    const displayedStock = isProblematic 
        ? stock 
        : (context === 'retail' ? retailStock : Math.floor(consumableStock));

    // Check if truly out of stock in this context (and not just damaged goods)
    const isOutOfStock = displayedStock <= 0 && !isProblematic;

    // Calculate Total Loss Value for Problematic items
    const totalLossValue = isProblematic ? (item.cost || 0) * stock : 0;

    // Badge Config
    const getBadgeConfig = () => {
        if (item.qualityStatus === 'finished') return { text: 'Terminado', color: 'bg-blue-600' };
        if (item.qualityStatus === 'expired') return { text: 'Vencido', color: 'bg-orange-500' };
        return { text: 'Dañado', color: 'bg-red-600' };
    };
    const badge = getBadgeConfig();

    return (
        <div className={`flex flex-col justify-between h-full relative overflow-hidden transition-all group rounded-2xl p-4
            ${isProblematic 
                ? (item.qualityStatus === 'finished' ? 'bg-blue-50/50 border border-blue-200 dark:border-blue-900/30' : 'bg-red-50/50 border border-red-200 dark:border-red-900/30')
                : isOutOfStock 
                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500 shadow-md shadow-red-100 dark:shadow-none scale-[1.01]' 
                    : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
            }
        `}>
            {isMixed && !isProblematic && <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-indigo-500 to-purple-500 rounded-bl-xl text-white flex items-center justify-center shadow-sm" title="Producto Mixto"><span className="material-icons text-xs">compare_arrows</span></div>}
            
            {/* PROBLEM BADGE */}
            {isProblematic && (
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-white uppercase tracking-wider shadow-sm ${badge.color}`}>
                    {badge.text}
                </div>
            )}

            {/* OUT OF STOCK BADGE */}
            {isOutOfStock && (
                <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-white uppercase tracking-wider shadow-sm bg-red-500">
                    AGOTADO
                </div>
            )}

            <div onClick={() => onView(item)} className="cursor-pointer">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex flex-wrap gap-1">
                        {/* NEW: Origin Badge for Problematic Items */}
                        {isProblematic && (
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border 
                                ${item.subtype === 'retail' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300' : 
                                item.subtype === 'consumable' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300' : 
                                'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                                {item.subtype === 'retail' ? 'RETAIL' : item.subtype === 'consumable' ? 'CABINA' : 'MIXTO'}
                            </span>
                        )}
                        
                        {/* Existing Scope/Type Badge */}
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border 
                            ${isProblematic 
                                ? (item.qualityStatus === 'finished' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300')
                                : isOutOfStock ? 'bg-white/80 text-red-600 border-red-200' 
                                : item.subtype === 'retail' ? 'bg-orange-50 text-orange-700 border-orange-100' 
                                : item.subtype === 'consumable' ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                            {isProblematic 
                                ? (stock > 1 ? 'Lote Completo' : 'Unidad Única') 
                                : (item.subtype === 'both' ? 'Mixto' : (item.subtype === 'retail' ? 'Venta' : 'Cabina'))
                            }
                        </div>
                    </div>
                    {!isProblematic && !isOutOfStock && <div className={`w-2 h-2 rounded-full ${statusColor} shadow-sm ${isMixed ? 'mr-10' : ''}`}></div>}
                </div>
                
                <h4 className={`font-bold text-sm leading-snug mb-1 line-clamp-2 transition-colors ${isOutOfStock ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white group-hover:text-indigo-600'}`}>
                    {item.title}
                </h4>
                <p className={`text-[10px] font-mono mb-3 ${isOutOfStock ? 'text-red-400' : 'text-gray-400'}`}>
                    {item.sku || 'SIN-SKU'}
                </p>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className={`p-2 rounded-lg text-center 
                        ${isProblematic 
                            ? (item.qualityStatus === 'finished' ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-red-50 dark:bg-red-900/10') 
                            : isOutOfStock ? 'bg-white dark:bg-black/20 border border-red-100 dark:border-red-900/30' : 'bg-gray-50 dark:bg-black/20'}`}>
                        <span className={`block text-[9px] uppercase font-bold ${isProblematic ? (item.qualityStatus === 'finished' ? 'text-blue-500' : 'text-red-500') : isOutOfStock ? 'text-red-500' : 'text-gray-400'}`}>
                            {isProblematic ? (item.qualityStatus === 'finished' ? 'Consumido' : 'Pérdida') : (isOutOfStock ? 'STOCK' : (isMixed ? `Stock (${context === 'retail' ? 'Vta' : 'Uso'})` : 'Stock Total'))}
                        </span>
                        <span className={`block font-mono font-bold ${isProblematic ? (item.qualityStatus === 'finished' ? 'text-blue-600 dark:text-blue-400 text-lg' : 'text-red-600 dark:text-red-400 text-lg') : displayedStock <= min ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
                            {displayedStock}
                        </span>
                    </div>
                    <div className={`p-2 rounded-lg text-center ${isOutOfStock ? 'bg-white dark:bg-black/20 border border-red-100 dark:border-red-900/30' : 'bg-gray-50 dark:bg-black/20'}`}>
                        <span className={`block text-[9px] uppercase font-bold ${isOutOfStock ? 'text-red-400' : 'text-gray-400'}`}>{context === 'retail' && !isProblematic ? 'P. Venta' : 'Costo Unit.'}</span>
                        <span className={`block font-mono font-bold ${isOutOfStock ? 'text-red-800 dark:text-red-200' : 'text-gray-800 dark:text-gray-200'}`}>
                            ${context === 'retail' && !isProblematic ? item.price : item.cost}
                        </span>
                    </div>
                </div>
            </div>

            <div className={`pt-3 border-t border-dashed flex justify-between items-center ${isOutOfStock ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'}`}>
                {isProblematic ? (
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${item.qualityStatus === 'finished' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                        <span className="material-icons text-[12px]">{item.qualityStatus === 'finished' ? 'check_circle' : 'money_off'}</span> {item.qualityStatus === 'finished' ? 'Uso Completo' : `-$${totalLossValue.toFixed(2)}`}
                    </span>
                ) : context === 'retail' ? (
                    <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                        Margen: {marginPercent.toFixed(0)}%
                    </span>
                ) : (
                    <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-red-400' : 'text-gray-400'}`}>Min: {min}</span>
                )}
                
                <div className="flex gap-1">
                    <button onClick={() => onView(item)} className={`p-1.5 rounded transition-colors ${isOutOfStock ? 'text-red-400 hover:bg-red-100 hover:text-red-700' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-indigo-600'}`} title="Ver Detalle">
                        <span className="material-icons text-sm">visibility</span>
                    </button>
                    {!isProblematic && (
                        <button onClick={() => onEdit(item)} className={`p-1.5 rounded transition-colors ${isOutOfStock ? 'text-red-400 hover:bg-red-100 hover:text-red-700' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-blue-600'}`} title="Editar">
                            <span className="material-icons text-sm">edit</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
