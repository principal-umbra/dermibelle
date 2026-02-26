
import React, { useMemo } from 'react';
import { AppointmentItem, Supplier, GlobalInventorySettings, ProductConsumable } from '../../types';
import CatalogBasicInfo from './modal/CatalogBasicInfo';
import CatalogProductDetails from './modal/CatalogProductDetails';
import CatalogServiceDetails from './modal/CatalogServiceDetails';

interface CatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingItem: Partial<AppointmentItem>;
    setEditingItem: (item: Partial<AppointmentItem>) => void;
    onSave: () => void;
    tempRecipe: ProductConsumable[];
    setTempRecipe: (recipe: ProductConsumable[]) => void;
    allProducts: AppointmentItem[];
    suppliers: Supplier[];
    calculateServiceCost: (recipe: any[]) => number;
    globalSettings: GlobalInventorySettings;
}

// Tooltip Component
const IndicatorTooltip = ({ text }: { text: string }) => (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-2.5 bg-gray-900 text-white text-[10px] font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 text-center leading-relaxed tracking-wide transform translate-y-2 group-hover:translate-y-0">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
);

const CatalogModal: React.FC<CatalogModalProps> = ({ 
    isOpen, onClose, editingItem, setEditingItem, onSave, 
    tempRecipe, setTempRecipe, allProducts, suppliers, calculateServiceCost, globalSettings 
}) => {
    
    if (!isOpen) return null;

    const handleReset = () => {
        const baseConfig = {
            stockConfig: { isCustom: false, retailRatio: globalSettings.defaultRetailRatio },
            title: '',
            sku: '',
            category: '',
            price: undefined,
            cost: undefined,
            supplierId: undefined
        };

        if (editingItem.type === 'service') {
            setEditingItem({ ...baseConfig, type: 'service' });
            setTempRecipe([]);
        } else {
            setEditingItem({ ...baseConfig, type: 'product', subtype: 'consumable' });
        }
    };

    // --- SMART INDICATORS LOGIC ---
    
    // 1. Predictive Expiry Risk
    const getExpiryRisk = () => {
        if (editingItem.type === 'service') return null;
        const expDate = editingItem.packageInfo?.expiryDate;
        
        if (!expDate) return { 
            main: 'Sin Vencimiento', 
            sub: 'Riesgo bajo', 
            color: 'text-gray-500 bg-gray-50 border-gray-100 dark:bg-white/5 dark:border-gray-700 dark:text-gray-400', 
            icon: 'verified_user',
            tooltip: 'No se ha configurado fecha de caducidad. Se asume que el producto no perece.'
        };
        
        const days = Math.ceil((new Date(expDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        
        if (days < 0) return { 
            main: 'Vencido', 
            sub: 'Acción inmediata', 
            color: 'text-red-700 bg-red-50 border-red-100', 
            icon: 'warning',
            tooltip: `El producto expiró hace ${Math.abs(days)} días. Debe ser retirado del inventario.`
        };
        if (days < 60) return { 
            main: `${days} Días`, 
            sub: 'Rotación lenta', 
            color: 'text-orange-700 bg-orange-50 border-orange-100', 
            icon: 'priority_high',
            tooltip: `Quedan ${days} días de vida útil. Priorizar uso antes de vencimiento.`
        };
        return { 
            main: 'Vigente', 
            sub: `${Math.floor(days/30)} meses`, 
            color: 'text-green-700 bg-green-50 border-green-100', 
            icon: 'event_available',
            tooltip: 'Producto dentro de su vida útil óptima.'
        };
    };

    // 2. Max Waste Target (Merma Inteligente)
    const getWasteTarget = () => {
        if (editingItem.type === 'service') return null;
        const isBulk = editingItem.packageInfo?.usageType === 'bulk';
        const content = editingItem.packageInfo?.contentPerUnit || 0;
        const unit = editingItem.packageInfo?.consumptionUnit || '';

        if (isBulk) {
            // Granel: 15% Standard
            const wasteAmount = content > 0 ? (content * 0.15) : 0;
            const amountDisplay = Number(wasteAmount.toFixed(2));
            const detailText = amountDisplay > 0 ? `${amountDisplay} ${unit}` : 'Estándar';
            
            return { 
                main: 'Máx. 15%', 
                sub: `Tolerancia: ${detailText}`, 
                color: 'text-blue-700 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300', 
                icon: 'opacity',
                tooltip: `Tolerancia de pérdida calculada sobre el contenido total (${content}${unit}). Representa residuos en envase o evaporación.`
            };
        } else {
            // Pieza: 3% Standard
            return { 
                main: 'Máx. 3%', 
                sub: 'Rotura / Defecto', 
                color: 'text-purple-700 bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300', 
                icon: 'check_circle_outline',
                tooltip: 'Porcentaje máximo aceptable de unidades dañadas o defectuosas en un lote de compra.'
            };
        }
    };

    // 3. Financial Target (Proyección basada en Lote Completo)
    const getProfitProjection = () => {
        const cost = editingItem.cost || 0;
        const price = editingItem.price || 0;
        const stock = editingItem.stock || 0; 
        
        // SERVICES
        if (editingItem.type === 'service') {
             const profit = price - cost;
             const margin = price > 0 ? Math.round((profit / price) * 100) : 0;
             return { 
                 main: `$${profit.toFixed(2)}`, 
                 sub: `Margen Neto (${margin}%)`, 
                 color: 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400', 
                 icon: 'savings',
                 tooltip: 'Ganancia neta calculada por cada servicio realizado (Precio Venta - Costo Receta - Comisiones).'
             };
        }

        // PRODUCTS
        const isRetailOnly = editingItem.subtype === 'retail';
        
        if (isRetailOnly) {
            // Caso Retail Puro: Ganancia sobre venta total
            const profitPerUnit = price - cost;
            const totalProjectedProfit = profitPerUnit * stock;
            
            return { 
                main: `$${totalProjectedProfit.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`, 
                sub: 'Utilidad Proyectada (Total)', 
                color: 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400', 
                icon: 'monetization_on',
                tooltip: 'Ganancia total estimada si se vende el 100% del stock físico actual al precio público establecido.'
             };
        } else {
            // Caso Consumo o Mixto: Enfocado en el valor del insumo interno
            let internalRatio = 1;
            if (editingItem.subtype === 'both') {
                const ratio = editingItem.stockConfig?.isCustom 
                    ? editingItem.stockConfig.retailRatio 
                    : globalSettings.defaultRetailRatio;
                internalRatio = 1 - ratio;
            }
            
            const internalStock = Math.floor(stock * internalRatio);

            const minVal = internalStock * cost;
            const recVal = minVal * 1.30;
            
            const unitLabel = editingItem.packageInfo?.purchaseUnit || 'unid';

            return { 
                main: `$${minVal.toLocaleString('en-US', {maximumFractionDigits:0})} - $${recVal.toLocaleString('en-US', {maximumFractionDigits:0})}`, 
                sub: `Valor Operativo (${internalStock} ${unitLabel})`, 
                color: 'text-indigo-700 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300', 
                icon: 'trending_up',
                tooltip: 'Valor monetario del stock inmovilizado para uso interno. (Rango: Costo Real vs Costo Reposición).'
            };
        }
    };

    const expiryInfo = getExpiryRisk();
    const wasteInfo = getWasteTarget();
    const profitInfo = getProfitProjection();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            {/* Contenedor Principal */}
            <div className="bg-[#F8F9FA] dark:bg-surface-dark w-full max-w-[95vw] xl:max-w-7xl rounded-[2rem] shadow-2xl shadow-black/20 border border-white/50 dark:border-gray-700 overflow-hidden flex flex-col h-[90vh] relative" onClick={e => e.stopPropagation()}>
                
                {/* 1. HEADER COMPACTO CON ALINEACIÓN CENTRAL */}
                <div className="px-6 py-3 border-b border-gray-200/60 dark:border-gray-700 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md flex justify-between items-center shrink-0 z-20 relative h-16">
                    
                    {/* Left: Title */}
                    <div className="flex items-center gap-3 w-1/4">
                        <div className={`p-1.5 rounded-lg shadow-sm ${editingItem.type === 'service' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            <span className="material-icons text-xl">{editingItem.type === 'service' ? 'spa' : 'inventory_2'}</span>
                        </div>
                        <div>
                            <h2 className="text-base font-display font-bold text-gray-900 dark:text-white leading-none">
                                {editingItem.id ? 'Editar Item' : 'Nuevo Item'}
                            </h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide opacity-80">
                                {editingItem.type === 'service' ? 'Diseño de Servicio' : 'Gestión de Producto'}
                            </p>
                        </div>
                    </div>

                    {/* Center: Switcher (Absolute Positioning for perfect symmetry) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="bg-gray-100/80 dark:bg-black/40 p-0.5 rounded-lg flex shadow-inner border border-gray-200/50 dark:border-gray-700">
                            <button 
                                onClick={() => setEditingItem({...editingItem, type: 'service', subtype: undefined})}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${editingItem.type === 'service' ? 'bg-white dark:bg-surface-dark text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <span className="material-icons text-sm">spa</span> Servicio
                            </button>
                            <button 
                                onClick={() => setEditingItem({...editingItem, type: 'product', subtype: 'consumable'})}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${editingItem.type === 'product' ? 'bg-white dark:bg-surface-dark text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <span className="material-icons text-sm">inventory_2</span> Producto
                            </button>
                        </div>
                    </div>

                    {/* Right: Close */}
                    <div className="flex justify-end w-1/4">
                        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors">
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                {/* 2. WORKSPACE */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-[#F3F4F6] dark:bg-black/20">
                    <div className="flex-1 p-4 min-h-0 overflow-hidden relative">
                        {editingItem.type === 'product' && (
                            <CatalogProductDetails 
                                editingItem={editingItem} 
                                setEditingItem={setEditingItem}
                                suppliers={suppliers} 
                            />
                        )}

                        {editingItem.type === 'service' && (
                            <CatalogServiceDetails 
                                editingItem={editingItem}
                                setEditingItem={setEditingItem}
                                tempRecipe={tempRecipe}
                                setTempRecipe={setTempRecipe}
                                allProducts={allProducts}
                                calculateServiceCost={calculateServiceCost}
                                sellingPrice={editingItem.price || 0}
                                suppliers={suppliers}
                                globalSettings={globalSettings}
                            />
                        )}
                    </div>
                </div>

                {/* 3. FOOTER COMPACTO CON ALINEACIÓN CENTRAL */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark flex justify-between items-center shrink-0 z-20 relative h-16">
                    
                    {/* Left: Reset */}
                    <div className="w-1/4">
                        <button onClick={handleReset} className="text-gray-400 hover:text-red-500 text-xs font-bold flex items-center gap-1 min-w-[80px]">
                            <span className="material-icons text-sm">restart_alt</span> Resetear
                        </button>
                    </div>

                    {/* Center: Indicators (Absolute Positioning for perfect symmetry) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-6">
                        {expiryInfo && (
                            <div className={`group relative flex items-center gap-3 px-4 py-2 rounded-xl border ${expiryInfo.color} bg-opacity-50 cursor-help`}>
                                <span className="material-icons text-lg">{expiryInfo.icon}</span>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold leading-none mb-0.5">{expiryInfo.main}</span>
                                    <span className="text-[9px] font-medium opacity-80 leading-none uppercase tracking-wide">{expiryInfo.sub}</span>
                                </div>
                                <IndicatorTooltip text={expiryInfo.tooltip} />
                            </div>
                        )}
                        
                        {wasteInfo && (
                            <div className={`group relative flex items-center gap-3 px-4 py-2 rounded-xl border ${wasteInfo.color} bg-opacity-50 cursor-help`}>
                                <span className="material-icons text-lg">{wasteInfo.icon}</span>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold leading-none mb-0.5">{wasteInfo.main}</span>
                                    <span className="text-[9px] font-medium opacity-80 leading-none uppercase tracking-wide">{wasteInfo.sub}</span>
                                </div>
                                <IndicatorTooltip text={wasteInfo.tooltip} />
                            </div>
                        )}

                        {profitInfo && (
                            <div className={`group relative flex items-center gap-3 px-4 py-2 rounded-xl border ${profitInfo.color} bg-opacity-50 shadow-sm cursor-help`}>
                                <span className="material-icons text-lg">{profitInfo.icon}</span>
                                <div className="flex flex-col">
                                    <span className="text-[12px] font-display font-bold leading-none mb-0.5">{profitInfo.main}</span>
                                    <span className="text-[9px] font-medium opacity-80 leading-none uppercase tracking-wide">{profitInfo.sub}</span>
                                </div>
                                <IndicatorTooltip text={profitInfo.tooltip} />
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex gap-3 justify-end w-1/4">
                        <button onClick={onClose} className="px-5 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                            Cancelar
                        </button>
                        <button onClick={onSave} className={`px-8 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 hover:scale-105 transition-transform ${editingItem.type === 'service' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            <span className="material-icons text-sm">save</span> Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CatalogModal;
