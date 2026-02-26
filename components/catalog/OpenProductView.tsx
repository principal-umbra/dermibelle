
import React, { useState, useEffect } from 'react';
import OpenProductDetailModal from './modals/OpenProductDetailModal';
import { useData, OpenStockItem } from '../../context/DataContext';

const OpenProductView: React.FC = () => {
    const { openStock, updateOpenStockItem, deleteOpenStockItem, addToast } = useData();
    const [selectedItem, setSelectedItem] = useState<OpenStockItem | null>(null);

    // Filter out items with 0 or less remaining (should be cleaned up, but just in case)
    const activeProducts = openStock.filter(item => item.remaining > 0);

    const handleConfirmEmpty = (id: string) => {
        deleteOpenStockItem(id);
        addToast('info', 'Producto marcado como agotado y eliminado de la lista activa.');
    };

    const handleAdjust = (id: string, newVal: number) => {
        // Prevent setting below 0
        const safeVal = Math.max(0, newVal);
        updateOpenStockItem(id, { remaining: safeVal });
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10 animate-in fade-in slide-in-from-bottom-4">
                {activeProducts.map(item => {
                    const percentage = (item.remaining / item.total) * 100;
                    const statusColor = percentage < 10 ? 'bg-red-500' : percentage < 40 ? 'bg-amber-500' : 'bg-green-500';
                    
                    return (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedItem(item)}
                            className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer"
                        >
                            
                            {/* Progress Bar Background */}
                            <div className="absolute bottom-0 left-0 h-1 bg-gray-100 dark:bg-gray-700 w-full">
                                <div className={`h-full ${statusColor} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                            </div>

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{item.productName}</h4>
                                    <p className="text-[10px] text-gray-500 mt-1">Abierto el: {item.openedDate}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-mono font-bold text-xl text-gray-800 dark:text-gray-200">{Math.round(percentage)}%</span>
                                    <span className="text-[9px] text-gray-400 uppercase">Restante</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                    <span className="font-bold">{Number(item.remaining).toFixed(2)}</span> / {item.total} {item.unit}
                                </div>
                                {percentage <= 10 && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleConfirmEmpty(item.id); }}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-100 transition-colors animate-pulse"
                                    >
                                        Confirmar Agotado
                                    </button>
                                )}
                            </div>

                            {/* Hover Overlay hint */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-icons text-gray-400 text-sm">edit</span>
                            </div>
                        </div>
                    );
                })}
                
                {activeProducts.length === 0 && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-white/5">
                        <span className="material-icons text-4xl mb-2 opacity-30">science_off</span>
                        <p className="text-sm font-medium">No hay productos abiertos en uso activo.</p>
                    </div>
                )}
            </div>

            <OpenProductDetailModal 
                isOpen={!!selectedItem} 
                onClose={() => setSelectedItem(null)} 
                item={selectedItem}
                onUpdate={handleAdjust}
                onDiscard={handleConfirmEmpty}
            />
        </>
    );
};

export default OpenProductView;
