
import React, { useState, useRef, useEffect } from 'react';
import { AppointmentItem } from '../../../../types';

interface ProductInventoryProps {
    editingItem: Partial<AppointmentItem>;
    setEditingItem: (item: Partial<AppointmentItem>) => void;
    // States for Logic
    isMix: boolean;
    isConsumable: boolean;
    // Logic internal states mapped from Parent
    usageMode: 'piece' | 'bulk';
    setUsageMode: (m: 'piece' | 'bulk') => void;
    netContent: number;
    setNetContent: (v: number) => void;
    measureUnit: string;
    setMeasureUnit: (v: string) => void;
    trackBatch: boolean;
    setTrackBatch: (v: boolean) => void;
    expiryDate: string;
    setExpiryDate: (v: string) => void;
    currentBatch: string;
    setCurrentBatch: (v: string) => void;
    retailRatio: number;
    setRetailRatio: (v: number) => void;
    distributionMode: 'ratio' | 'manual';
    setDistributionMode: (v: 'ratio' | 'manual') => void;
    internalStock: number;
    retailStock: number;
    unitCost: number;
    handleManualInternalChange: (v: number) => void;
    handleManualRetailChange: (v: number) => void;
    isStockReadOnly?: boolean;
    isRetail?: boolean;
    allowFractionalSale?: boolean;
    setAllowFractionalSale?: (v: boolean) => void;
}

const UNIT_CATEGORIES: Record<string, { label: string, icon: string, units: string[] }> = {
    'volume': { label: 'Volumen', icon: 'water_drop', units: ['ml', 'l', 'fl oz', 'gal'] },
    'weight': { label: 'Peso', icon: 'scale', units: ['g', 'kg', 'oz', 'lb'] },
    'length': { label: 'Largo', icon: 'straighten', units: ['cm', 'm', 'in'] },
    'unit': { label: 'Unidad', icon: 'apps', units: ['unid', 'pza', 'par'] }
};

const ProductInventory: React.FC<ProductInventoryProps> = (props) => {
    const { editingItem, setEditingItem, isMix, isConsumable, unitCost, isStockReadOnly = false, isRetail, allowFractionalSale, setAllowFractionalSale } = props;
    
    // UI State for Custom Unit Selector
    const [showUnitMenu, setShowUnitMenu] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('volume');
    const unitMenuRef = useRef<HTMLDivElement>(null);

    // Sync local state 'usageMode' with item.packageInfo.usageType
    const usageType = editingItem.packageInfo?.usageType || 'whole';
    
    // Helper to switch usage type
    const handleUsageTypeChange = (type: 'whole' | 'bulk') => {
        setEditingItem({
            ...editingItem,
            packageInfo: { ...editingItem.packageInfo, usageType: type } as any
        });
        props.setUsageMode(type === 'whole' ? 'piece' : 'bulk');
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (unitMenuRef.current && !unitMenuRef.current.contains(event.target as Node)) {
                setShowUnitMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-detect category based on current unit
    useEffect(() => {
        if (showUnitMenu) {
            const currentUnit = props.measureUnit;
            const foundCat = Object.keys(UNIT_CATEGORIES).find(key => 
                UNIT_CATEGORIES[key].units.includes(currentUnit)
            );
            if (foundCat) setActiveCategory(foundCat);
        }
    }, [showUnitMenu, props.measureUnit]);

    const isPackPurchase = (editingItem.packageInfo?.unitsPerPackage || 1) > 1;
    const unitsPerPack = editingItem.packageInfo?.unitsPerPackage || 1;
    const isEProduct = editingItem.isEProduct;

    return (
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-3xl p-4 shadow-sm flex flex-col gap-4 overflow-y-auto custom-scrollbar h-full">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2 shrink-0">
                <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold">3</span>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Control & Inventario</h3>
            </div>

            <div className={`grid grid-cols-2 gap-4 shrink-0 ${isEProduct ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Stock Físico ({isPackPurchase ? 'Cajas' : 'Unidades'})</label>
                    <div className="relative">
                        <input 
                            type={isEProduct ? "text" : "number"}
                            value={isEProduct ? "∞" : (editingItem.stock || '')} 
                            readOnly={isStockReadOnly || isEProduct}
                            onChange={(e) => !isStockReadOnly && !isEProduct && setEditingItem({...editingItem, stock: parseFloat(e.target.value)})}
                            className={`w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold outline-none transition-all ${isStockReadOnly || isEProduct ? 'bg-gray-100 dark:bg-black/20 text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-black/20 focus:border-purple-500'}`}
                            placeholder="0" 
                        />
                        {(isStockReadOnly || isEProduct) && <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">lock</span>}
                    </div>
                </div>
                <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Alerta Mín.</label>
                    <input 
                        type="number" 
                        value={editingItem.minStock || ''} 
                        readOnly={isEProduct}
                        onChange={e => setEditingItem({...editingItem, minStock: parseFloat(e.target.value)})} 
                        className={`w-full px-3 py-2 bg-gray-50 dark:bg-black/10 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold outline-none focus:border-purple-500 ${isEProduct ? 'cursor-not-allowed' : ''}`} 
                        placeholder="5" 
                    />
                </div>
            </div>

            {/* Venta Fraccionada (Retail + Pack) */}
            {isRetail && isPackPurchase && setAllowFractionalSale && (
                <div className={`bg-orange-50/50 dark:bg-orange-900/10 p-3.5 rounded-xl border border-orange-100 dark:border-orange-800/30 shrink-0 ${isEProduct ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-[9px] font-bold text-orange-700 dark:text-orange-300 uppercase">Definición de Venta</label>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${allowFractionalSale ? 'bg-orange-500' : 'bg-gray-300'}`} onClick={() => setAllowFractionalSale(!allowFractionalSale)}>
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${allowFractionalSale ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2.5 border border-dashed border-orange-200">
                        {allowFractionalSale ? (
                            <div>
                                <p className="text-[10px] text-gray-500 leading-snug mb-2">
                                    <span className="font-bold text-orange-700">Venta Fraccionada:</span> Se permite abrir cajas para vender unidades sueltas.
                                </p>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-black/20 p-2 rounded border border-orange-100 dark:border-orange-800/30">
                                    <span className="material-icons text-orange-500 text-sm">inventory_2</span>
                                    <span>1 Caja</span>
                                    <span className="material-icons text-gray-400 text-[10px]">arrow_forward</span>
                                    <span className="material-icons text-orange-500 text-sm">apps</span>
                                    <span>{unitsPerPack} Unidades Sueltas</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[10px] text-gray-500 leading-snug">
                                <span className="font-bold text-orange-700">Solo Caja Cerrada:</span> El producto se vende exclusivamente por caja completa. No se permite fraccionar.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {isMix && (
                <div className={`bg-[#F8F5FF] dark:bg-purple-900/10 p-3.5 rounded-xl border border-purple-100 dark:border-purple-800/30 shrink-0 ${isEProduct ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[9px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide flex items-center gap-1">
                            <span className="material-icons text-[10px]">alt_route</span> Distribución
                        </h4>
                        <div className="flex bg-white dark:bg-black/20 rounded p-0.5 border border-purple-100 dark:border-purple-800/50">
                            <button onClick={() => props.setDistributionMode('ratio')} className={`px-2 py-0.5 rounded text-[8px] font-bold ${props.distributionMode === 'ratio' ? 'bg-[#9333ea] text-white' : 'text-gray-400'}`}>%</button>
                            <button onClick={() => props.setDistributionMode('manual')} className={`px-2 py-0.5 rounded text-[8px] font-bold ${props.distributionMode === 'manual' ? 'bg-[#9333ea] text-white' : 'text-gray-400'}`}>#</button>
                        </div>
                    </div>

                    {props.distributionMode === 'ratio' ? (
                        <div className="px-1">
                            <input type="range" min="0" max="1" step="0.05" value={props.retailRatio} onChange={(e) => props.setRetailRatio(parseFloat(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#9333ea] mb-2"/>
                            <div className="flex justify-between text-[9px] font-bold leading-none">
                                <span className="text-blue-600">Uso: {Math.round((1-props.retailRatio)*100)}% ({props.internalStock})</span>
                                <span className="text-orange-600">Venta: {Math.round(props.retailRatio*100)}% ({props.retailStock})</span>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase block mb-1">Uso Interno</label>
                                <input type="number" value={props.internalStock} onChange={(e) => props.handleManualInternalChange(parseFloat(e.target.value) || 0)} className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-xs font-bold text-center focus:border-blue-500 outline-none" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-orange-600 dark:text-orange-400 uppercase block mb-1">Para Venta</label>
                                <input type="number" value={props.retailStock} onChange={(e) => props.handleManualRetailChange(parseFloat(e.target.value) || 0)} className="w-full bg-white border border-orange-200 rounded px-2 py-1.5 text-xs font-bold text-center focus:border-orange-500 outline-none" placeholder="0" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isConsumable && (
                <div className={`bg-purple-50/50 dark:bg-purple-900/10 p-3.5 rounded-xl border border-purple-100 dark:border-purple-800/30 shrink-0 ${isEProduct ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <div className="flex justify-between items-center mb-3">
                        <label className="text-[9px] font-bold text-purple-700 dark:text-purple-300 uppercase">Definición de Uso</label>
                    </div>
                    
                    <div className="flex bg-white/50 dark:bg-black/20 rounded-lg p-1 border border-purple-100 dark:border-purple-800/50 mb-3">
                        <button 
                            onClick={() => handleUsageTypeChange('whole')} 
                            className={`flex-1 px-2 py-1.5 rounded-md text-[9px] font-bold transition-all ${usageType === 'whole' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-400 hover:bg-white/50'}`}
                        >
                            Por Pieza {isPackPurchase ? '(Caja)' : '(Unidad)'}
                        </button>
                        <button 
                            onClick={() => handleUsageTypeChange('bulk')} 
                            className={`flex-1 px-2 py-1.5 rounded-md text-[9px] font-bold transition-all ${usageType === 'bulk' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-400 hover:bg-white/50'}`}
                        >
                            Granel {isPackPurchase ? '(Interno)' : '(Fracc.)'}
                        </button>
                    </div>

                    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2.5 border border-dashed border-purple-200">
                        {usageType === 'whole' ? (
                            <div>
                                <p className="text-[10px] text-gray-500 leading-snug mb-1">
                                    <span className="font-bold text-purple-700">Modo Pieza:</span> Se descontará <strong>1 {isPackPurchase ? 'Caja/Pack' : 'Unidad de Compra'}</strong> entera cada vez que se use en un servicio.
                                </p>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-100/50">
                                    <span className="text-[9px] text-gray-400">Costo directo por uso:</span>
                                    <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">${unitCost.toFixed(2)}</span>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-[10px] text-gray-500 leading-snug mb-3">
                                    <span className="font-bold text-purple-700">Modo Granel:</span> El stock se descontará según el contenido {isPackPurchase ? 'interno de la caja' : 'del envase'}.
                                </p>
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1 relative">
                                        <input type="number" value={props.netContent} onChange={e => props.setNetContent(parseFloat(e.target.value))} className="w-full pl-2 pr-8 py-1.5 bg-white border border-purple-200 rounded text-xs font-bold outline-none focus:border-purple-500" placeholder="Cont."/>
                                        <span className="absolute right-2 top-1.5 text-[9px] text-gray-400 font-bold">{props.measureUnit}</span>
                                    </div>
                                    
                                    {/* CUSTOM UNIT SELECTOR */}
                                    <div className="relative w-24" ref={unitMenuRef}>
                                        <button 
                                            onClick={() => setShowUnitMenu(!showUnitMenu)}
                                            className="w-full py-1.5 px-2 bg-white border border-purple-200 rounded flex items-center justify-between text-[10px] font-bold text-gray-700 hover:border-purple-400 transition-colors"
                                        >
                                            {props.measureUnit}
                                            <span className="material-icons text-[14px] text-gray-400">expand_more</span>
                                        </button>

                                        {/* DROPDOWN MENU */}
                                        {showUnitMenu && (
                                            <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom-right">
                                                {/* Header Tabs */}
                                                <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
                                                    {Object.keys(UNIT_CATEGORIES).map(catKey => (
                                                        <button 
                                                            key={catKey}
                                                            onClick={() => setActiveCategory(catKey)}
                                                            className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors ${activeCategory === catKey ? 'bg-white dark:bg-[#1e1e1e] text-purple-600 border-t-2 border-t-purple-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}`}
                                                        >
                                                            <span className="material-icons text-[14px]">{UNIT_CATEGORIES[catKey].icon}</span>
                                                            <span className="text-[8px] font-bold uppercase">{UNIT_CATEGORIES[catKey].label}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Units Grid */}
                                                <div className="p-3 grid grid-cols-3 gap-2">
                                                    {UNIT_CATEGORIES[activeCategory].units.map(unit => (
                                                        <button 
                                                            key={unit}
                                                            onClick={() => { props.setMeasureUnit(unit); setShowUnitMenu(false); }}
                                                            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${props.measureUnit === unit ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'}`}
                                                        >
                                                            {unit}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right mt-2">
                                    <span className="block text-[8px] text-gray-400">Costo/{props.measureUnit}</span>
                                    <span className="font-mono text-[10px] font-bold text-purple-700">${(unitCost / (props.netContent || 1)).toFixed(4)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={`rounded-xl border transition-all overflow-hidden shrink-0 ${props.trackBatch ? 'bg-amber-50/30 border-amber-200' : 'bg-gray-50 border-gray-100'} ${isEProduct ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => !isEProduct && props.setTrackBatch(!props.trackBatch)}>
                    <div className="flex items-center gap-2">
                        <span className={`material-icons text-sm ${props.trackBatch ? 'text-amber-500' : 'text-gray-400'}`}>qr_code_2</span>
                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Rastreo Lotes</span>
                    </div>
                    <div className={`w-6 h-3 rounded-full p-0.5 transition-colors ${props.trackBatch ? 'bg-amber-500' : 'bg-gray-300'}`}>
                        <div className={`w-2 h-2 bg-white rounded-full shadow-sm transition-transform ${props.trackBatch ? 'translate-x-3' : 'translate-x-0'}`}></div>
                    </div>
                </div>
                {props.trackBatch && (
                    <div className="px-3 pb-3 pt-0 grid grid-cols-2 gap-3 animate-in slide-in-from-top-1">
                        <input type="text" value={props.currentBatch} onChange={e => props.setCurrentBatch(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded text-[10px] uppercase" placeholder="LOTE-001" />
                        <input type="date" value={props.expiryDate} onChange={e => props.setExpiryDate(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded text-[10px]" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductInventory;
