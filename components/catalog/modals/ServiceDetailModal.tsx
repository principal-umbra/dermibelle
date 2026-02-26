
import React from 'react';
import { AppointmentItem, Supplier, OpenStockItem } from '../../../types';

interface ServiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: AppointmentItem | null;
    onEdit: (item: AppointmentItem) => void;
    suppliers: Supplier[];
    allProducts: AppointmentItem[];
    openStock: OpenStockItem[];
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ 
    isOpen, onClose, item, onEdit, suppliers, allProducts, openStock 
}) => {
    if (!isOpen || !item) return null;

    // --- CÁLCULOS ---
    const calculateRecipeCost = () => {
        if (!item.recipe) return 0;
        return item.recipe.reduce((total, ingredient) => {
            const product = allProducts.find(p => p.id === ingredient.id);
            if (!product) return total;
            
            const purchaseCost = product.cost || 0;
            const pkg = product.packageInfo || { unitsPerPackage: 1, contentPerUnit: 1, usageType: 'whole' };
            const mode = ingredient.consumptionMode || 'unit';
            
            let ingredientCost = 0;
            if (pkg.usageType === 'whole') {
                 ingredientCost = purchaseCost * ingredient.qty;
            } else {
                const totalContent = (pkg.unitsPerPackage || 1) * (pkg.contentPerUnit || 1);
                const costPerMeasure = totalContent > 0 ? purchaseCost / totalContent : 0;
                let consumedAmount = ingredient.qty;
                // Simplificación para visualización
                if (mode === 'unit') consumedAmount = ingredient.qty * (pkg.contentPerUnit || 1);
                ingredientCost = costPerMeasure * consumedAmount;
            }
            return total + ingredientCost;
        }, 0);
    };

    const cost = calculateRecipeCost();
    const price = item.price || 0;
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            {/* MODAL MÁS ANCHO Y ALTO (max-w-5xl y h-[85vh]) */}
            <div className="bg-white dark:bg-surface-dark w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 relative" onClick={e => e.stopPropagation()}>
                
                {/* HERO HEADER - VIOLET THEME */}
                <div className="relative bg-gradient-to-br from-violet-600 to-indigo-700 p-8 shrink-0">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/10 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                Servicio Activo
                            </span>
                            <span className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white/80 font-mono border border-white/5 tracking-widest">{item.sku || 'SIN-CODIGO'}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { onClose(); onEdit(item); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md border border-white/10"><span className="material-icons text-lg">edit</span></button>
                            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md border border-white/10"><span className="material-icons text-lg">close</span></button>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border border-white/20 text-white transform rotate-3">
                                <span className="material-icons text-4xl drop-shadow-md">spa</span>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight tracking-tight drop-shadow-sm">{item.title}</h1>
                                <p className="text-indigo-100 text-sm mt-1 font-medium bg-indigo-800/30 inline-block px-3 py-1 rounded-lg border border-indigo-400/30">{item.category}</p>
                            </div>
                        </div>
                        <div className="text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Precio al Público</p>
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-sm font-medium text-white/70 align-top">$</span>
                                <span className="text-5xl font-display font-bold text-white tracking-tighter shadow-black drop-shadow-sm">{price.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT AREA - RESTRUCTURED GRID */}
                <div className="flex-1 overflow-y-auto bg-[#F8F9FC] dark:bg-black/20 custom-scrollbar">
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* COLUMN 1: FINANCIALS (Left - 3 Cols) - UNCHANGED */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-icons text-gray-300 text-sm">analytics</span>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Finanzas</h3>
                            </div>
                            
                            <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="p-5 border-b border-dashed border-gray-100 dark:border-gray-700">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Costo Operativo</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-gray-800 dark:text-white font-mono">${cost.toFixed(2)}</span>
                                        <span className="text-[10px] text-gray-400">/ sesión</span>
                                    </div>
                                </div>
                                <div className="p-5 border-b border-dashed border-gray-100 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/5">
                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 block mb-1">Utilidad Neta</span>
                                    <span className="text-2xl font-bold text-green-700 dark:text-green-300 font-mono">+${profit.toFixed(2)}</span>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Margen</span>
                                        <span className={`text-xl font-bold ${margin > 50 ? 'text-indigo-600' : 'text-amber-500'}`}>{margin.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${margin > 60 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-800">
                                <h4 className="text-blue-800 dark:text-blue-300 font-bold text-sm mb-2 flex items-center gap-2">
                                    <span className="material-icons text-sm">trending_up</span> Proyección
                                </h4>
                                <p className="text-xs text-blue-600/80 dark:text-blue-400 mb-3">Con 20 citas al mes:</p>
                                <p className="text-xl font-bold text-blue-700 dark:text-blue-200 font-mono">${(profit * 20).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* COLUMN 2 & 3 Combined Wrapper (Span 9) */}
                        <div className="lg:col-span-9 flex flex-col gap-6">
                            
                            {/* TOP ROW: Description (5) + Time Card (4) */}
                            <div className="grid grid-cols-1 lg:grid-cols-9 gap-8">
                                
                                {/* Description Box (Takes 5/9 of this section) */}
                                <div className="lg:col-span-5 bg-white dark:bg-surface-dark rounded-[1.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="material-icons text-sm text-gray-300">subject</span> Ficha Técnica
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed mb-6">
                                        "{item.description || 'Sin descripción detallada del servicio.'}"
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Frecuencia</span>
                                            <span className="text-xs font-bold text-gray-800 dark:text-white">Cada 3-4 semanas</span>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Objetivo</span>
                                            <span className="text-xs font-bold text-gray-800 dark:text-white">Renovación Celular</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Time Card (Takes 4/9 of this section) */}
                                <div className="lg:col-span-4 bg-white dark:bg-surface-dark rounded-[1.5rem] p-5 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="material-icons text-sm text-gray-300">schedule</span> Tiempos
                                    </h3>
                                    <div className="flex gap-4 flex-1 items-center">
                                        <div className="flex-1 flex flex-col items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 h-full">
                                            <span className="material-icons text-indigo-500 mb-1">hourglass_top</span>
                                            <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{(item as any).duration || 60}m</span>
                                            <span className="text-[10px] text-indigo-400 uppercase font-bold">Duración</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-gray-700 h-full">
                                            <span className="material-icons text-gray-400 mb-1">cleaning_services</span>
                                            <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{(item as any).bufferTime || 15}m</span>
                                            <span className="text-[10px] text-gray-400 uppercase font-bold">Limpieza</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM ROW: RECIPE (Spans Full Width of Right Section) - ENHANCED */}
                            <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-icons text-sm text-gray-300">science</span> Receta & Disponibilidad
                                    </h3>
                                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {item.recipe?.length || 0} Insumos
                                    </span>
                                </div>
                                
                                <div className="space-y-2">
                                    {(!item.recipe || item.recipe.length === 0) ? (
                                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-400 text-xs italic">
                                            Sin receta configurada.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {item.recipe.map((ing, idx) => {
                                                const prod = allProducts.find(p => p.id === ing.id);
                                                const openUnit = openStock.find(os => os.productId === ing.id);
                                                
                                                // Stock Logic
                                                const warehouseStock = prod?.stock || 0;
                                                const hasOpenUnit = !!openUnit;
                                                const openPercentage = openUnit ? (openUnit.remaining / openUnit.total) * 100 : 0;
                                                
                                                // Alert if no stock at all
                                                const isCritical = warehouseStock === 0 && !hasOpenUnit;

                                                return (
                                                    <div key={idx} className={`relative flex flex-col p-3 rounded-xl border transition-all hover:shadow-md group ${isCritical ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900' : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-700 hover:border-indigo-200'}`}>
                                                        {/* Header: Name & Qty */}
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${isCritical ? 'bg-red-400' : 'bg-indigo-500'}`}></div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={prod?.title}>
                                                                        {prod?.title || 'Item desconocido'}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                                        {prod?.sku || 'NO-SKU'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-lg text-right shrink-0">
                                                                <span className="block text-xs font-bold text-gray-800 dark:text-white leading-none">{ing.qty}</span>
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">
                                                                    {ing.consumptionMode === 'measurement' ? (prod?.packageInfo?.consumptionUnit || 'ud') : 'u'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Footer: Stock & Open Status */}
                                                        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-50 dark:border-gray-800">
                                                            {/* Warehouse Stock */}
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="material-icons text-gray-300 text-[12px]">inventory_2</span>
                                                                <span className={`text-[10px] font-bold ${warehouseStock === 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                                                                    {warehouseStock} en Bodega
                                                                </span>
                                                            </div>

                                                            {/* Open Unit Status */}
                                                            {hasOpenUnit ? (
                                                                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md border border-green-100 dark:border-green-900/30">
                                                                    <span className="relative flex h-2 w-2">
                                                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                                    </span>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[9px] font-bold text-green-700 dark:text-green-400 leading-none">En Uso ({Math.round(openPercentage)}%)</span>
                                                                        <div className="w-12 h-1 bg-green-200 dark:bg-green-900 rounded-full mt-0.5 overflow-hidden">
                                                                            <div className="h-full bg-green-500" style={{ width: `${openPercentage}%` }}></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[9px] text-gray-400 italic">Sin abrir</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 text-center border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark relative z-10 shrink-0 flex justify-between items-center px-8">
                     <span className="text-[10px] text-gray-400 font-mono tracking-widest">ID SISTEMA: {item.id}</span>
                     <span className="text-[10px] text-gray-400 font-bold uppercase">Ultima Edición: Hoy</span>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailModal;
