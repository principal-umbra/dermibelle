
import React, { useState, useMemo } from 'react';
import { AppointmentItem, ProductConsumable } from '../../../../types';
import { useData } from '../../../../context/DataContext';

interface ServiceRecipeManagerProps {
    tempRecipe: ProductConsumable[];
    allProducts: AppointmentItem[];
    addIngredient: (id: string) => void;
    removeIngredient: (index: number) => void;
    updateIngredient: (index: number, updates: Partial<ProductConsumable>) => void;
    getIngredientCost: (prod: AppointmentItem, qty: number, mode: any, waste?: number) => number;
    totalRecipeCost: number;
}

const ServiceRecipeManager: React.FC<ServiceRecipeManagerProps> = ({
    tempRecipe, allProducts, addIngredient, removeIngredient, updateIngredient, getIngredientCost, totalRecipeCost
}) => {
    const { globalInventorySettings } = useData(); // Access global settings for stock calculation
    const [recipeSearch, setRecipeSearch] = useState('');
    // State to track which cards are expanded
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    
    // Filter logic: Exclude items already in recipe AND items that are purely Retail
    const filteredProducts = useMemo(() => {
        if (!recipeSearch) return [];
        return allProducts.filter(p => 
            p.title.toLowerCase().includes(recipeSearch.toLowerCase()) &&
            !tempRecipe.some(r => r.id === p.id) &&
            p.subtype !== 'retail' // EXCLUDE RETAIL ONLY PRODUCTS
        ).slice(0, 5);
    }, [allProducts, recipeSearch, tempRecipe]);

    const handleAdd = (id: string) => {
        addIngredient(id);
        setRecipeSearch('');
        // No auto-expand needed per user request
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => 
            prev.includes(id) 
                ? prev.filter(itemId => itemId !== id) 
                : [...prev, id]
        );
    };

    // Helper to calculate Available Internal Stock for display
    const getDisplayStock = (p: AppointmentItem) => {
        const total = p.stock || 0;
        
        // If strictly consumable or asset, use full stock
        if (p.subtype === 'consumable' || p.subtype === 'asset') return total;

        // If Mixed ('both'), calculate internal portion
        if (p.subtype === 'both') {
            const ratio = p.stockConfig?.isCustom
                ? p.stockConfig.retailRatio
                : (globalInventorySettings?.defaultRetailRatio || 0.5);

            // Logic matches ProductCard: Retail gets the floor, Internal gets the rest
            const retailStock = Math.floor(total * ratio);
            return Number((total - retailStock).toFixed(2));
        }

        return 0; // Should not happen due to filter, but safe fallback
    };

    return (
        <div className="flex flex-col h-full relative bg-gray-50/50 dark:bg-black/10">
            
            {/* 1. Header Fijo - Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark z-20 shrink-0">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                        <span className="material-icons text-orange-500 text-lg">science</span> Receta Inteligente
                    </h3>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 dark:bg-white/5 dark:border-gray-700 dark:text-gray-300">
                        {tempRecipe.length} items
                    </span>
                </div>
                
                <div className="relative group">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors text-lg">search</span>
                    <input 
                        type="text" 
                        value={recipeSearch} 
                        onChange={e => setRecipeSearch(e.target.value)} 
                        placeholder="Buscar insumo..." 
                        className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                    />
                    
                    {/* Dropdown de Resultados */}
                    {recipeSearch && filteredProducts.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1E1E1E] shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                            {filteredProducts.map(p => {
                                const internalStock = getDisplayStock(p);
                                return (
                                    <button key={p.id} onClick={() => handleAdd(p.id as string)} className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-white/5 flex justify-between items-center border-b border-gray-50 dark:border-gray-800 last:border-0 group transition-colors">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-gray-800 dark:text-white truncate group-hover:text-orange-600">{p.title}</p>
                                                {p.subtype === 'both' && (
                                                    <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 rounded font-bold uppercase">Mixto</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400">Disp. Uso Interno: <span className="font-bold">{internalStock}</span></p>
                                        </div>
                                        <span className="material-icons text-orange-400 opacity-0 group-hover:opacity-100 text-sm bg-orange-100 p-1 rounded-full">add</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Lista Scrollable - Tarjetas Consolidadas */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                {tempRecipe.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 py-10">
                        <div className="w-16 h-16 rounded-full bg-gray-200/50 flex items-center justify-center mb-3">
                            <span className="material-icons text-3xl text-gray-300">playlist_add</span>
                        </div>
                        <p className="text-sm font-bold text-gray-500">Receta vacía</p>
                        <p className="text-[10px] text-center max-w-[150px] leading-relaxed mt-1">Busca arriba para agregar insumos.</p>
                    </div>
                ) : (
                    tempRecipe.map((ing, idx) => {
                        const prod = allProducts.find(p => p.id === ing.id);
                        const pkg = prod?.packageInfo || { purchaseUnit: 'Unidad', unitsPerPackage: 1, consumptionUnit: 'unid', contentPerUnit: 1, usageType: 'whole' };
                        const isWhole = pkg.usageType === 'whole';
                        const waste = (ing as any).waste || 0;
                        
                        // Calculate Allocated Stock (Consumable Portion)
                        const currentStock = prod ? getDisplayStock(prod) : 0;
                        
                        const totalContentReal = (pkg.unitsPerPackage || 1) * (pkg.contentPerUnit || 1);
                        
                        // Cost Calculation
                        const finalCost = getIngredientCost(prod!, ing.qty, ing.consumptionMode || 'unit', waste); 
                        const mode = ing.consumptionMode || 'unit';

                        // Logic for Metrics
                        let usedInPurchaseUnits = 0;
                        if (mode === 'unit') usedInPurchaseUnits = ing.qty;
                        else if (mode === 'measurement') usedInPurchaseUnits = ing.qty / totalContentReal;
                        else if (mode === 'percentage') usedInPurchaseUnits = (ing.qty / 100);
                        else if (mode === 'yield') usedInPurchaseUnits = ing.qty > 0 ? 1 / ing.qty : 0;

                        // Stock Check
                        const isExceedingStock = usedInPurchaseUnits > currentStock;

                        // 1. Consumption % (Of a single package/unit)
                        let consumptionPercent = 0;
                        if (mode === 'unit') consumptionPercent = 100;
                        else if (mode === 'measurement') consumptionPercent = (ing.qty / totalContentReal) * 100;
                        else if (mode === 'percentage') consumptionPercent = ing.qty;
                        else if (mode === 'yield') consumptionPercent = ing.qty > 0 ? (1 / ing.qty) * 100 : 0;

                        // 2. Impact Stock % (Of allocated stock)
                        const stockImpactPercent = currentStock > 0 ? (usedInPurchaseUnits / currentStock) * 100 : 100;

                        // Conversion Text
                        let conversionText = '';
                        if (mode === 'unit') {
                             const totalUnits = ing.qty * totalContentReal;
                             conversionText = `= ${totalUnits} ${pkg.consumptionUnit}`;
                        } else if (mode === 'measurement') {
                             conversionText = `= ${usedInPurchaseUnits.toFixed(2)} ${pkg.purchaseUnit}`;
                        } else if (mode === 'yield') {
                             conversionText = `1 uso de ${ing.qty} por ${pkg.purchaseUnit}`;
                        }

                        // Expansion State
                        const isExpanded = expandedIds.includes(ing.id);
                        
                        // Summary Text for Collapsed View
                        const summaryUnit = mode === 'measurement' ? pkg.consumptionUnit : (mode === 'percentage' ? '%' : (mode === 'yield' ? 'r. usos' : pkg.purchaseUnit));

                        return (
                            <div key={idx} className={`bg-white dark:bg-surface-dark border rounded-2xl shadow-sm relative group transition-all duration-300 overflow-hidden ${isExceedingStock ? 'border-red-200 dark:border-red-900/50' : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'}`}>
                                
                                {/* A. Header: Icono, Nombre, Costo y Delete - Clickable to Toggle */}
                                <div 
                                    className="flex justify-between items-center p-3 cursor-pointer select-none bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" 
                                    onClick={() => toggleExpand(ing.id)}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white dark:border-surface-dark shadow-sm transition-colors ${isExceedingStock ? 'bg-red-50 text-red-500' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'}`}>
                                            <span className="material-icons text-sm">{isExceedingStock ? 'warning' : (isWhole ? 'inventory_2' : 'science')}</span>
                                        </div>
                                        
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight truncate pr-2" title={prod?.title}>{prod?.title}</p>
                                                <div className="flex items-center gap-3">
                                                    {/* Collapsed Summary Badge */}
                                                    {!isExpanded && (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isExceedingStock ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'}`}>
                                                            {ing.qty} {summaryUnit}
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-white leading-none">${finalCost.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Subtitle / Stock Status */}
                                            {isExpanded && (
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 font-bold uppercase">{pkg.purchaseUnit} ({pkg.contentPerUnit} {pkg.consumptionUnit})</span>
                                                    <span className={`text-[9px] font-medium ${isExceedingStock ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                        {prod?.subtype === 'both' ? 'Stock Uso:' : 'Stock:'} {currentStock} {pkg.purchaseUnit}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 ml-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeIngredient(idx); }} 
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Eliminar"
                                        >
                                            <span className="material-icons text-base">close</span>
                                        </button>
                                        <span className={`material-icons text-gray-300 text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                                    </div>
                                </div>

                                {/* B. Expandable Body */}
                                {isExpanded && (
                                    <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-1 duration-200">
                                        
                                        {/* Divider */}
                                        <div className="h-px bg-gray-100 dark:bg-gray-700/50 mb-3"></div>

                                        {/* Main Input Block */}
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2">
                                                {/* Left: Mode Selector (Dropdown) */}
                                                <div className="relative w-1/2">
                                                    <select 
                                                        value={mode}
                                                        onChange={e => updateIngredient(idx, { consumptionMode: e.target.value as any })}
                                                        className="w-full appearance-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-3 pr-8 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide cursor-pointer outline-none focus:border-orange-400 hover:bg-gray-100 transition-all h-[34px]"
                                                    >
                                                        <option value="unit"># Unidades ({pkg.purchaseUnit})</option>
                                                        <option value="measurement"># Medida ({pkg.consumptionUnit})</option>
                                                        {!isWhole && <option value="percentage"># Porcentaje (%)</option>}
                                                        <option value="yield"># Rendimiento (Usos)</option>
                                                    </select>
                                                    <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[14px] text-gray-400 pointer-events-none">expand_more</span>
                                                </div>
                                                
                                                {/* Right: Quantity Input or Slider */}
                                                <div className="relative flex-1">
                                                    {mode === 'percentage' ? (
                                                        <div className={`flex items-center h-[34px] bg-white dark:bg-surface-dark border rounded-lg px-2 gap-2 shadow-sm ${isExceedingStock ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'}`}>
                                                            <input 
                                                                type="range" 
                                                                min="0" 
                                                                max="100" 
                                                                step="1"
                                                                value={ing.qty || 0} 
                                                                onChange={e => updateIngredient(idx, { qty: parseFloat(e.target.value) })}
                                                                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${isExceedingStock ? 'bg-red-200 accent-red-500' : 'bg-gray-200 accent-orange-500'}`}
                                                            />
                                                            <div className={`flex items-center justify-center rounded px-1.5 h-6 min-w-[36px] ${isExceedingStock ? 'bg-red-50 text-red-600' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200'}`}>
                                                                <span className="text-[10px] font-bold">{ing.qty}%</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <input 
                                                                type="number"
                                                                min="0"
                                                                step={mode === 'measurement' ? 0.01 : 1}
                                                                value={ing.qty}
                                                                onChange={e => updateIngredient(idx, { qty: parseFloat(e.target.value) })}
                                                                className={`w-full h-[34px] bg-white dark:bg-surface-dark border rounded-lg pl-3 pr-14 text-sm font-bold outline-none shadow-sm transition-all text-left appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none
                                                                    ${isExceedingStock 
                                                                        ? 'border-red-300 text-red-600 focus:border-red-500 focus:ring-1 focus:ring-red-200' 
                                                                        : 'border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20'}`}
                                                                placeholder={mode === 'yield' ? "Ej: 50" : "Cant."}
                                                            />
                                                            <div className={`absolute right-1 top-1 bottom-1 flex items-center px-2 rounded-md pointer-events-none ${isExceedingStock ? 'bg-red-50' : 'bg-gray-100 dark:bg-white/10'}`}>
                                                                <span className={`text-[9px] font-bold uppercase ${isExceedingStock ? 'text-red-500' : 'text-gray-500'}`}>
                                                                    {mode === 'measurement' ? pkg.consumptionUnit : (mode === 'yield' ? 'Servicios' : pkg.purchaseUnit)}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Conversion Helper */}
                                            {conversionText && (
                                                <div className="text-right mt-1">
                                                    <span className={`text-[9px] font-mono px-1.5 rounded ${isExceedingStock ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50 dark:bg-white/5'}`}>
                                                        {conversionText}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* C. Sliders & Metrics */}
                                        <div className="pt-1">
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* 1. Consumo Unitario */}
                                                <div>
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase truncate pr-1" title={`Consumo Unitario (${pkg.purchaseUnit})`}>Consumo ({pkg.purchaseUnit})</span>
                                                        <span className="text-[8px] font-bold text-gray-500">{consumptionPercent.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gray-400 rounded-full" style={{width: `${Math.min(100, consumptionPercent)}%`}}></div>
                                                    </div>
                                                </div>

                                                {/* 2. Impacto Stock */}
                                                <div>
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <span className={`text-[8px] font-bold uppercase truncate pr-1 ${isExceedingStock ? 'text-red-400' : 'text-gray-400'}`} title={`Impacto Stock (${Math.round(currentStock)})`}>Imp. Stock ({Math.round(currentStock)})</span>
                                                        <span className={`text-[8px] font-bold ${isExceedingStock ? 'text-red-600' : 'text-blue-600'}`}>{stockImpactPercent.toFixed(1)}%</span>
                                                    </div>
                                                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isExceedingStock ? 'bg-red-100' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                        <div className={`h-full rounded-full ${isExceedingStock ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${Math.min(100, stockImpactPercent)}%`}}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* 3. Footer Fijo - Total */}
            <div className="p-4 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Insumos</p>
                        <p className="text-[10px] text-gray-500">{tempRecipe.length} items</p>
                    </div>
                    <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white">${totalRecipeCost.toFixed(2)}</span>
                </div>
            </div>

        </div>
    );
};

export default ServiceRecipeManager;
