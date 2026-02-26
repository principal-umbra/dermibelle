
import React from 'react';
import { AppointmentItem } from '../../../../types';

interface ProductPricingProps {
    editingItem: Partial<AppointmentItem>;
    setEditingItem: (item: Partial<AppointmentItem>) => void;
    purchaseMode: 'unit' | 'pack';
    boxPrice: number;
    handleBoxPriceChange: (v: number) => void;
    marginPercent: number;
    displayProfit: number;
    unitCost: number;
    unitsPerPack: number;
    applyMarkup: (pct: number) => void;
    acquisitionCost: number;
    isRetail: boolean;
    // Strategic KPIs
    breakEvenUnits: number;
    investmentEfficiency: number;
    retailStock: number;
}

// Compact Tooltip Helper
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative inline-block ml-1 align-middle z-10">
        <span className="material-icons text-gray-300 text-[10px] cursor-help hover:text-primary transition-colors">help_outline</span>
        <div className="absolute bottom-full right-0 mb-2 w-40 bg-gray-900 text-white text-[9px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50 text-center leading-tight font-normal">
            {text}
        </div>
    </div>
);

const ProductPricing: React.FC<ProductPricingProps> = (props) => {
    const { editingItem, setEditingItem, purchaseMode, boxPrice, marginPercent, unitCost, unitsPerPack, displayProfit, isRetail, acquisitionCost } = props;

    const sellingPrice = editingItem.price || 0;
    
    // Alert logic: If break even units > available retail stock, it's high risk
    const isHighRisk = props.breakEvenUnits > props.retailStock;
    const efficiencyColor = props.investmentEfficiency < 1 
        ? 'text-red-500' 
        : props.investmentEfficiency < 1.5 
            ? 'text-orange-500' 
            : 'text-blue-600 dark:text-blue-400';

    // Financial Projections (FIXED LOGIC)
    
    // 1. Costo Stock: Inversión Total Real
    // Se calcula usando el Costo de Adquisición (Precio Caja o Precio Unidad según modo de compra)
    // Multiplicado por la cantidad física de esos paquetes/unidades que hay en stock.
    const totalPhysicalStock = editingItem.stock || 0;
    const stockCostValue = totalPhysicalStock * acquisitionCost;

    // 2. Proyección Venta: Retorno Total Esperado
    // Se calcula expandiendo el stock retail a unidades de venta individuales (si aplica)
    // Multiplicado por el precio de venta unitario.
    const multiplier = purchaseMode === 'pack' ? unitsPerPack : 1;
    // Cantidad total de unidades vendibles (ej: 5 Cajas * 10 unids = 50 unidades)
    const totalRetailUnits = props.retailStock * multiplier;
    
    const projectedRevenue = totalRetailUnits * sellingPrice;

    return (
        <div className={`bg-[#F0FDF4] dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-3xl p-4 shadow-sm flex flex-col gap-3 relative overflow-y-auto custom-scrollbar h-full ${!isRetail ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            {!isRetail && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center font-bold text-sm text-gray-500">Solo Uso Interno</div>}
            
            <div className="flex items-center gap-2 border-b border-green-100 dark:border-green-800 pb-2 shrink-0">
                <span className="font-bold text-green-800 dark:text-green-400 text-xs uppercase tracking-widest">4. Estrategia de Precios</span>
            </div>

            {/* 1. Price Input & Margin Display */}
            <div className="shrink-0">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">
                    {purchaseMode === 'pack' ? 'Precio Venta (Pack)' : 'Precio Venta (Unitario)'}
                </label>
                <div className="flex gap-3">
                    <div className="flex-1 relative group/price">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 font-bold text-xl">$</span>
                        <input 
                            type="number" 
                            value={purchaseMode === 'pack' ? (boxPrice || '') : (editingItem.price || '')} 
                            onChange={e => purchaseMode === 'pack' ? props.handleBoxPriceChange(parseFloat(e.target.value)) : setEditingItem({...editingItem, price: parseFloat(e.target.value)})} 
                            className="w-full pl-8 pr-4 py-3 bg-white border-2 border-green-100 dark:border-green-800 rounded-xl text-3xl font-bold text-green-500 outline-none focus:border-green-400 transition-all placeholder-green-100/50" 
                            placeholder="0.00"
                        />
                    </div>
                    <div className="w-1/3 bg-white dark:bg-surface-dark border-2 border-green-50 dark:border-green-900/30 rounded-xl flex flex-col items-center justify-center p-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Margen</span>
                        <span className={`text-lg font-bold ${marginPercent >= 50 ? 'text-green-600' : marginPercent >= 30 ? 'text-blue-500' : 'text-orange-500'}`}>
                            {Number.isFinite(marginPercent) ? marginPercent.toFixed(0) : 0}%
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Unit Price Calculation & Markup Buttons */}
            <div className="flex items-center justify-between gap-2 shrink-0">
                <div className="bg-green-50/50 dark:bg-green-900/20 rounded-lg px-3 py-2 flex-1 border border-green-100 dark:border-green-800/30">
                    <span className="text-[9px] font-bold text-green-700 dark:text-green-300 uppercase block mb-0.5">Precio Unit. Calc.</span>
                    <span className="font-mono font-bold text-xs text-green-800 dark:text-white">
                        ${(purchaseMode === 'pack' ? (boxPrice / (unitsPerPack || 1)) : (editingItem.price || 0)).toFixed(2)}
                    </span>
                </div>
                <div className="flex gap-1">
                    {[30, 50, 100].map(pct => (
                        <button key={pct} onClick={() => props.applyMarkup(pct)} className="px-2 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 hover:border-green-400 hover:text-green-600 text-gray-500 rounded-lg text-[9px] font-bold transition-all shadow-sm">
                            +{pct}%
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Fractional Sale Configuration */}
            {purchaseMode === 'pack' && (
                <div className="mt-3 pt-3 border-t border-green-100 dark:border-green-800/50">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                            <span className="material-icons text-[12px]">content_cut</span> Venta Fraccionada
                        </label>
                        <div className="relative inline-block w-8 h-4 align-middle select-none transition duration-200 ease-in">
                            <input 
                                type="checkbox" 
                                name="toggle" 
                                id="fractional-toggle" 
                                checked={editingItem.allowFractionalSale || false}
                                onChange={e => setEditingItem({...editingItem, allowFractionalSale: e.target.checked})}
                                className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-green-500"
                            />
                            <label htmlFor="fractional-toggle" className={`toggle-label block overflow-hidden h-4 rounded-full cursor-pointer ${editingItem.allowFractionalSale ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                        </div>
                    </div>
                    
                    {editingItem.allowFractionalSale && (
                        <div className="bg-white dark:bg-black/20 rounded-xl p-2 border border-green-100 dark:border-green-900/30">
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Precio por Unidad</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-green-600 font-bold text-xs">$</span>
                                        <input 
                                            type="number" 
                                            value={editingItem.fractionalPrice || ''}
                                            onChange={e => setEditingItem({...editingItem, fractionalPrice: parseFloat(e.target.value)})}
                                            className="w-full pl-5 pr-2 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-green-500 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Margen Unit.</span>
                                    <span className="text-xs font-bold text-green-600">
                                        {editingItem.fractionalPrice && unitCost > 0 
                                            ? `${(((editingItem.fractionalPrice - unitCost) / unitCost) * 100).toFixed(0)}%` 
                                            : '0%'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[9px] text-gray-400 mt-1.5 leading-tight">
                                Permite vender unidades sueltas abriendo una caja del stock.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* 3. Visualizer */}
            <div className="mt-1 shrink-0">
                <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase mb-1">
                    <span>Costo Base</span>
                    <span>Utilidad</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                    <div className="h-full bg-gray-400" style={{ width: `${Math.min(100, (unitCost / (sellingPrice || 1)) * 100)}%` }}></div>
                    <div className="h-full bg-green-500" style={{ width: `${Math.min(100, 100 - (unitCost / (sellingPrice || 1)) * 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold mt-1">
                    <span className="text-gray-600 dark:text-gray-300">${unitCost.toFixed(2)}</span>
                    <span className="text-green-600">+${displayProfit.toFixed(2)}</span>
                </div>
            </div>
            
            {/* 4. Pack Cost Footer */}
            {purchaseMode === 'pack' && (
                <div className="pt-2 border-t border-green-100 dark:border-green-800 flex justify-between items-center text-[10px] text-gray-400 shrink-0">
                        <span>Costo Pack: <strong>${acquisitionCost.toFixed(2)}</strong></span>
                        <span>({unitsPerPack} un/pack)</span>
                </div>
            )}

            {/* 5. STRATEGIC INDICATORS */}
            <div className="mt-auto pt-2 border-t border-green-100 dark:border-green-800/50">
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className={`bg-white/60 dark:bg-black/10 rounded-xl p-2 border text-center hover:bg-white transition-colors flex flex-col justify-center ${isHighRisk ? 'border-red-200 bg-red-50/50' : 'border-green-100 dark:border-green-900/30'}`}>
                        <div className="flex justify-center items-center gap-1 mb-0.5">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">Pto. Equilibrio</span>
                            <InfoTooltip text="Unidades que debes vender para recuperar el 100% del costo del lote comprado." />
                        </div>
                        <span className={`text-sm font-bold font-mono ${isHighRisk ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>
                            {props.breakEvenUnits.toFixed(0)} <span className="text-[10px] font-normal text-gray-400">unid.</span>
                        </span>
                        {isHighRisk && <span className="text-[8px] text-red-500 font-bold leading-none">¡Riesgo Alto!</span>}
                    </div>
                    
                    <div className="bg-white/60 dark:bg-black/10 rounded-xl p-2 border border-green-100 dark:border-green-900/30 text-center hover:bg-white transition-colors flex flex-col justify-center">
                        <div className="flex justify-center items-center gap-1 mb-0.5">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">Eficiencia Inv.</span>
                            <InfoTooltip text="Multiplicador de dinero. Por cada $1 invertido en este lote, obtendrás $X de regreso al vender la parte Retail." />
                        </div>
                        <span className={`text-sm font-bold font-mono ${efficiencyColor}`}>
                            {props.investmentEfficiency.toFixed(2)}x
                        </span>
                        <span className="text-[8px] text-gray-400 font-medium leading-none">Retorno sobre costo</span>
                    </div>
                </div>

                {/* 6. Monetary Projections Footer */}
                <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20 flex justify-between items-center">
                    <div>
                        <span className="text-[9px] font-bold text-green-700 dark:text-green-300 uppercase block mb-0.5">Costo Stock ({totalPhysicalStock})</span>
                        <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200">
                            ${stockCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-bold text-green-700 dark:text-green-300 uppercase block mb-0.5">Proyección Venta</span>
                        <span className="text-sm font-mono font-bold text-green-600 dark:text-green-400">
                            ${projectedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPricing;
