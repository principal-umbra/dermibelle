
import React, { useState } from 'react';
import { AppointmentItem, useData } from '../../../context/DataContext';
import ProductOrderHistoryDrawer from './ProductOrderHistoryDrawer';

interface MixedProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: AppointmentItem | null;
    onEdit: (item: AppointmentItem) => void;
}

const MixedProductModal: React.FC<MixedProductModalProps> = ({ isOpen, onClose, item, onEdit }) => {
    const { orders, stockLogs } = useData();
    const [viewMode, setViewMode] = useState<'dashboard'>('dashboard');
    const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

    if (!isOpen || !item) return null;

    const retailRatio = item.stockConfig?.retailRatio || 0.5;
    const retailStock = Math.floor((item.stock || 0) * retailRatio);
    const cabinStock = (item.stock || 0) - retailStock;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/20" onClick={e => e.stopPropagation()}>
                
                {/* HEADER - PURPLE THEME */}
                <div className="relative bg-gradient-to-br from-purple-600 to-fuchsia-600 p-6 pb-8">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">Mixto</span>
                            <span className="px-3 py-1 bg-black/20 rounded-full text-[10px] font-bold text-white/80 font-mono">{item.sku}</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowHistoryDrawer(true)}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                title="Ver Historial"
                            >
                                <span className="material-icons text-lg">history</span>
                            </button>
                            <button onClick={() => { onClose(); onEdit(item); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><span className="material-icons text-lg">edit</span></button>
                            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><span className="material-icons text-lg">close</span></button>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white border border-white/20 shadow-inner">
                            <span className="material-icons text-2xl">compare_arrows</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold text-white leading-tight">{item.title}</h1>
                            <p className="text-white/80 text-xs mt-0.5">Stock Total: {item.stock} • {item.category}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#FAFAFA] dark:bg-black/20 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    
                    {/* SPLIT CARD */}
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative -mt-12 z-20">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-4">Distribución de Inventario</p>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 text-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800">
                                <p className="text-xs text-orange-600 font-bold uppercase mb-1">Retail (Venta)</p>
                                <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">{retailStock}</p>
                                <p className="text-[10px] text-orange-500 font-mono mt-1">${item.price?.toFixed(2)} c/u</p>
                            </div>
                            <span className="material-icons text-gray-300">swap_horiz</span>
                            <div className="flex-1 text-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                                <p className="text-xs text-blue-600 font-bold uppercase mb-1">Cabina (Uso)</p>
                                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{cabinStock}</p>
                                <p className="text-[10px] text-blue-500 font-mono mt-1">Costo: ${item.cost?.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                            <span className="text-xs text-gray-500">Configuración: <strong>{retailRatio * 100}% Retail</strong> / <strong>{(1 - retailRatio) * 100}% Cabina</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            <ProductOrderHistoryDrawer 
                isOpen={showHistoryDrawer}
                onClose={() => setShowHistoryDrawer(false)}
                item={item}
                orders={orders}
                stockLogs={stockLogs}
            />
        </div>
    );
};

export default MixedProductModal;
