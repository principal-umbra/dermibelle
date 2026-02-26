
import React from 'react';
import { AppointmentItem, Supplier } from '../../../context/DataContext';

interface SmartCatalogProps {
    catalog: AppointmentItem[];
    selectedSupplierId: string;
    suppliers: Supplier[];
    cart: any[];
    onAddToCart: (item: AppointmentItem) => void;
    onUpdateQuantity?: (itemId: string | number, delta: number) => void; // Nuevo prop opcional
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectionMode: 'product' | 'need';
    setSelectionMode: (mode: 'product' | 'need') => void;
    showTemplates: boolean;
    setShowTemplates: (show: boolean) => void;
    onLoadTemplate: (id: string) => void;
    onFastMode: () => void;
    availableProducts: AppointmentItem[];
    templates: { id: string; name: string }[];
}

const SmartCatalog: React.FC<SmartCatalogProps> = ({
    selectedSupplierId,
    cart,
    onAddToCart,
    onUpdateQuantity,
    searchTerm,
    setSearchTerm,
    selectionMode,
    setSelectionMode,
    showTemplates,
    setShowTemplates,
    onLoadTemplate,
    onFastMode,
    availableProducts,
    templates
}) => {
    return (
        <div className="flex flex-col h-full bg-white/50 dark:bg-transparent backdrop-blur-sm">
            {/* Smart Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                {/* Toggle Pills */}
                <div className="bg-gray-100/80 dark:bg-black/30 p-1 rounded-xl flex shadow-inner">
                    <button 
                        onClick={() => setSelectionMode('product')} 
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1 ${selectionMode === 'product' ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
                    >
                        <span className="material-icons text-xs">grid_view</span> Catálogo
                    </button>
                    <button 
                        onClick={() => setSelectionMode('need')} 
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1 ${selectionMode === 'need' ? 'bg-white dark:bg-surface-dark shadow-sm text-indigo-600' : 'text-gray-500'}`}
                    >
                        <span className="material-icons text-xs">warning</span> Críticos
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base group-focus-within:text-indigo-500 transition-colors">search</span>
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar..." 
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={onFastMode}
                        disabled={!selectedSupplierId}
                        className="px-3 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group/fast"
                        title="Modo Rápido"
                    >
                        <span className="material-icons text-lg group-hover/fast:rotate-12 transition-transform">bolt</span>
                    </button>
                    <div className="relative">
                            <button 
                            onClick={() => setShowTemplates(!showTemplates)} 
                            className="h-full px-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm flex items-center"
                        >
                            <span className="material-icons text-lg">assignment</span>
                        </button>
                        {showTemplates && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                {templates.map(t => (
                                    <div key={t.id} onClick={() => onLoadTemplate(t.id)} className="px-4 py-3 text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border-b border-gray-50 last:border-0">{t.name}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {!selectedSupplierId ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <span className="material-icons text-4xl mb-2">store</span>
                        <p className="text-xs font-medium">Selecciona un proveedor</p>
                    </div>
                ) : availableProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <span className="material-icons text-4xl mb-2">inventory_2</span>
                        <p className="text-xs font-medium">No hay items disponibles</p>
                    </div>
                ) : (
                    availableProducts.map(item => {
                        const stock = item.stock || 0;
                        const min = item.minStock || 5;
                        const isLow = stock <= min;
                        
                        // Buscar si el item está en el carrito
                        const cartItem = cart.find(c => c.item.id === item.id);
                        const qtyInCart = cartItem ? (cartItem.quantity || cartItem.qty || 0) : 0;
                        const inCart = qtyInCart > 0;
                        
                        return (
                            <div 
                                key={item.id} 
                                className={`group relative p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                                    ${inCart 
                                        ? 'bg-indigo-50/40 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-900/30 ring-1 ring-indigo-500/20' 
                                        : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-700 hover:border-indigo-200'}
                                `}
                                onClick={() => !inCart && onAddToCart(item)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className={`text-xs font-bold line-clamp-1 transition-colors ${inCart ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-100 group-hover:text-indigo-600'}`}>
                                        {item.title}
                                    </h4>
                                    {inCart && <span className="material-icons text-xs text-indigo-600 bg-white rounded-full">check_circle</span>}
                                </div>
                                
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-gray-400 font-mono">{item.sku}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-1.5 rounded inline-block">
                                                ${(item.packageCost || item.cost || item.price * 0.4).toFixed(0)}
                                            </span>
                                            <span className={`text-[9px] px-1 rounded border ${isLow ? 'text-red-500 border-red-100 bg-red-50' : 'text-gray-400 border-gray-100'}`}>
                                                Stock: {stock}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CONTROLES DE CANTIDAD O BOTÓN AGREGAR */}
                                    <div onClick={e => e.stopPropagation()}>
                                        {inCart && onUpdateQuantity ? (
                                            <div className="flex items-center bg-white dark:bg-black/20 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm p-0.5">
                                                <button 
                                                    onClick={() => onUpdateQuantity(item.id, -1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-red-500 transition-colors"
                                                >
                                                    <span className="material-icons text-[10px]">remove</span>
                                                </button>
                                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 w-6 text-center">{qtyInCart}</span>
                                                <button 
                                                    onClick={() => onUpdateQuantity(item.id, 1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-green-500 transition-colors"
                                                >
                                                    <span className="material-icons text-[10px]">add</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => onAddToCart(item)}
                                                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                                            >
                                                <span className="material-icons text-sm">add</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default SmartCatalog;
