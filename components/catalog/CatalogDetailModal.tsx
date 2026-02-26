
import React from 'react';
import { AppointmentItem, Supplier, GlobalInventorySettings } from '../../types';

interface CatalogDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: AppointmentItem | null;
    onEdit: (item: AppointmentItem) => void;
    suppliers: Supplier[];
    allProducts: AppointmentItem[];
    globalSettings: GlobalInventorySettings;
}

const CatalogDetailModal: React.FC<CatalogDetailModalProps> = ({ 
    isOpen, onClose, item, onEdit, suppliers, allProducts, globalSettings 
}) => {
    if (!isOpen || !item) return null;

    const supplier = suppliers.find(s => s.id === item.supplierId);
    
    // --- CÁLCULOS (FIXED) ---
    const calculateRecipeCost = () => {
        if (item.type !== 'service' || !item.recipe) return 0;
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
                
                let consumedAmount = 0;
                if (mode === 'measurement') consumedAmount = ingredient.qty; 
                else if (mode === 'unit') consumedAmount = ingredient.qty * (pkg.contentPerUnit || 1);
                else if (mode === 'percentage') consumedAmount = totalContent * (ingredient.qty / 100);
                else if (mode === 'yield') consumedAmount = ingredient.qty > 0 ? totalContent / ingredient.qty : 0;
                else consumedAmount = ingredient.qty;
                
                ingredientCost = costPerMeasure * consumedAmount;
            }
            
            return total + ingredientCost;
        }, 0);
    };

    // Prioritize recalculation for services to fix potentially bad saved data
    const cost = item.type === 'service' ? calculateRecipeCost() : (item.cost || 0);
    const price = item.price || 0;
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;

    // --- TEMAS VISUALES ---
    const theme = item.type === 'service' 
        ? { 
            gradient: 'from-violet-600 to-indigo-600', 
            light: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
            border: 'border-indigo-100 dark:border-indigo-800',
            icon: 'spa',
            accent: 'text-indigo-600'
          }
        : { 
            gradient: 'from-orange-500 to-amber-500', 
            light: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
            border: 'border-orange-100 dark:border-orange-800',
            icon: item.subtype === 'consumable' ? 'science' : 'inventory_2',
            accent: 'text-orange-600'
          };

    // Helper para Stock
    const getStockStatus = (current: number, min: number) => {
        if (current === 0) return { color: 'bg-red-500', text: 'text-red-600', label: 'Agotado' };
        if (current <= min) return { color: 'bg-amber-500', text: 'text-amber-600', label: 'Bajo Stock' };
        return { color: 'bg-green-500', text: 'text-green-600', label: 'Saludable' };
    };
    const stockInfo = getStockStatus(item.stock || 0, item.minStock || 0);
    
    // Fix Visual Capacity for bar
    const minStock = item.minStock || 0;
    const stock = item.stock || 0;
    const visualCapacity = Math.max(stock, (minStock * 4));
    const stockPercent = visualCapacity > 0 ? (stock / visualCapacity) * 100 : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20" onClick={e => e.stopPropagation()}>
                
                {/* 1. HERO HEADER */}
                <div className={`relative bg-gradient-to-br ${theme.gradient} p-8 pb-12 shrink-0`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    {/* Navbar Actions */}
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                                {item.type === 'service' ? 'Servicio' : item.subtype === 'retail' ? 'Retail' : 'Consumo'}
                            </span>
                            <span className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white/80 font-mono border border-white/5">
                                {item.sku || 'SIN-CODIGO'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { onClose(); onEdit(item); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md">
                                <span className="material-icons text-lg">edit</span>
                            </button>
                            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md">
                                <span className="material-icons text-lg">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Title & Price */}
                    <div className="mt-6 flex flex-col md:flex-row justify-between items-end gap-4 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20 text-white">
                                <span className="material-icons text-3xl">{theme.icon}</span>
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">{item.title}</h1>
                                <p className="text-white/70 text-sm mt-1 font-medium">{item.category}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Precio Venta</p>
                            <p className="text-4xl font-display font-bold text-white tracking-tight">${price.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* 2. CONTENT AREA */}
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black/20 relative -mt-6 rounded-t-[2rem] px-6 pt-8 pb-8 custom-scrollbar">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* COLUMN 1: FINANCIALS (Left) */}
                        <div className="lg:col-span-1 space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Rentabilidad</h3>
                            
                            <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Costo Base</span>
                                        <span className="text-base font-mono font-bold text-gray-900 dark:text-white">${cost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Utilidad</span>
                                        <span className={`text-base font-mono font-bold ${margin > 50 ? 'text-green-600' : 'text-amber-500'}`}>${profit.toFixed(2)}</span>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Margen</span>
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{margin.toFixed(0)}<span className="text-sm">%</span></span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${margin > 60 ? 'bg-green-500' : margin > 30 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                                style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Supplier Card */}
                            {supplier && (
                                <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                                        <span className="material-icons text-lg">storefront</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Proveedor</p>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{supplier.companyName}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* COLUMN 2: TECHNICAL DETAILS & RECIPE (Center - 5 Cols) */}
                        <div className="lg:col-span-5 space-y-8">
                            
                            {/* Description Box */}
                            <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
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

                            {/* RECIPE / INGREDIENTS - MOVED HERE */}
                            <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-icons text-sm text-gray-300">science</span> Receta / Insumos
                                    </h3>
                                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {item.recipe?.length || 0} Items
                                    </span>
                                </div>
                                
                                <div className="space-y-2">
                                    {(!item.recipe || item.recipe.length === 0) ? (
                                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-400 text-xs italic">
                                            Sin receta configurada.
                                        </div>
                                    ) : (
                                        item.recipe.map((ing, idx) => {
                                            const prod = allProducts.find(p => p.id === ing.id);
                                            return (
                                                <div key={idx} className="flex items-center p-3 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:border-indigo-200 transition-all hover:shadow-md group">
                                                    {/* Vertical Accent Bar */}
                                                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full mr-3 shrink-0 group-hover:bg-indigo-400 transition-colors"></div>

                                                    {/* Text Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                            {prod?.title || 'Item desconocido'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                            {prod?.sku || 'NO-SKU'}
                                                        </p>
                                                    </div>

                                                    {/* Quantity Pill */}
                                                    <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center gap-1 shrink-0 ml-3 border border-indigo-100 dark:border-indigo-900/30">
                                                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                                            {ing.qty}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-indigo-400 uppercase">
                                                            {ing.consumptionMode === 'measurement' ? (prod?.packageInfo?.consumptionUnit || 'ud') : 'u'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 3: LOGISTICS (Right - 4 Cols) */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            
                            {/* Time Card */}
                            <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="material-icons text-sm text-gray-300">schedule</span> Tiempos
                                </h3>
                                <div className="flex gap-4">
                                    <div className="flex-1 flex flex-col items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                        <span className="material-icons text-indigo-500 mb-1">hourglass_top</span>
                                        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{(item as any).duration || 60}m</span>
                                        <span className="text-[10px] text-indigo-400 uppercase font-bold">Duración</span>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <span className="material-icons text-gray-400 mb-1">cleaning_services</span>
                                        <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{(item as any).bufferTime || 15}m</span>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Limpieza</span>
                                    </div>
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

export default CatalogDetailModal;
