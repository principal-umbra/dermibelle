
import React from 'react';
import { OpenStockItem } from '../../../../types';

interface AuditViewProps {
    item: OpenStockItem;
    inventoryInsights: any;
    adjustedValue: number;
    setAdjustedValue: (val: number) => void;
    isDirty: boolean;
    setIsDirty: (val: boolean) => void;
    onSaveAdjustment: () => void;
    onDiscardRequest: () => void;
}

const AuditView: React.FC<AuditViewProps> = ({
    item,
    inventoryInsights,
    adjustedValue,
    setAdjustedValue,
    isDirty,
    setIsDirty,
    onSaveAdjustment,
    onDiscardRequest
}) => {
    
    const percentage = (item.remaining / item.total) * 100;
    
    // Status Logic for Pie Chart
    let statusColor = 'text-teal-600 bg-teal-50 border-teal-100';
    let statusLabel = 'Saludable';
    let ringColor = 'text-teal-500';

    if (percentage < 15) {
        statusColor = 'text-red-600 bg-red-50 border-red-100';
        statusLabel = 'Crítico';
        ringColor = 'text-red-500';
    } else if (percentage < 40) {
        statusColor = 'text-amber-600 bg-amber-50 border-amber-100';
        statusLabel = 'Bajo';
        ringColor = 'text-amber-500';
    }

    return (
        <>
            {/* STATS GRID */}
            <div className="grid grid-cols-2 gap-4 mb-4 animate-in fade-in zoom-in-95">
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="relative w-20 h-20">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                            <circle 
                                cx="50%" cy="50%" r="40%" 
                                stroke="currentColor" strokeWidth="8" fill="transparent" 
                                strokeDasharray={251} 
                                strokeDashoffset={251 - (251 * percentage) / 100} 
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ${ringColor}`} 
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</span>
                        </div>
                    </div>
                    <span className={`absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${statusColor}`}>
                        {statusLabel}
                    </span>
                </div>
                
                <div className="flex flex-col gap-2">
                    <div className="flex-1 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Inicial</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{item.total} <span className="text-xs text-gray-400 font-normal">{item.unit}</span></span>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Consumido</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{(item.total - item.remaining).toFixed(2)} <span className="text-xs text-gray-400 font-normal">{item.unit}</span></span>
                    </div>
                </div>
            </div>

            {/* SMART INVENTORY INSIGHTS */}
            {inventoryInsights && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Expiration Card */}
                    <div className={`p-3 rounded-xl border flex flex-col justify-between ${inventoryInsights.expiryStatus.color}`}>
                        <div className="flex justify-between items-start">
                             <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">Vencimiento</span>
                             <span className="material-icons text-sm">{inventoryInsights.expiryStatus.icon}</span>
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-tight mt-1">{inventoryInsights.expiryStatus.label}</p>
                            {inventoryInsights.expiryDateStr && (
                                <p className="text-xs font-semibold mt-1">
                                    {inventoryInsights.expiryStatus.days < 0 
                                        ? `Hace ${Math.abs(inventoryInsights.expiryStatus.days)} días` 
                                        : `${inventoryInsights.expiryStatus.days} días restantes`}
                                    <span className="opacity-75 font-normal ml-1 text-[10px]">
                                        ({new Date(inventoryInsights.expiryDateStr).toLocaleDateString('es-ES', {month:'short', day:'numeric'})})
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Warehouse Stock Card */}
                    <div className={`p-3 rounded-xl border flex flex-col justify-between ${inventoryInsights.stockStatus.color}`}>
                        <div className="flex justify-between items-start">
                             <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">Bodega</span>
                             <span className="material-icons text-sm">{inventoryInsights.stockStatus.icon}</span>
                        </div>
                        <div>
                             <p className="font-bold text-sm leading-tight mt-1">{inventoryInsights.stock} unids cerradas</p>
                             <div className="flex items-center justify-between mt-0.5">
                                 <p className="text-[9px] opacity-90">{inventoryInsights.stockStatus.label}</p>
                                 {inventoryInsights.stockStatus.action && (
                                     <span className="text-[8px] font-bold bg-white/30 px-1.5 rounded uppercase">{inventoryInsights.stockStatus.action}</span>
                                 )}
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADJUSTMENT SECTION */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase flex items-center gap-2">
                        <span className="material-icons text-sm">tune</span> Auditoría de Stock
                    </h3>
                    {isDirty && <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full animate-pulse">Modificado</span>}
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => { setAdjustedValue(Math.max(0, adjustedValue - 1)); setIsDirty(true); }}
                            className="w-8 h-8 rounded-lg bg-white border border-blue-200 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-colors"
                        >
                            <span className="material-icons text-sm">remove</span>
                        </button>
                        
                        <div className="text-center">
                            <span className="text-3xl font-mono font-bold text-blue-700 dark:text-blue-400">{adjustedValue.toFixed(2)}</span>
                            <span className="text-xs font-bold text-blue-400 ml-1">{item.unit}</span>
                        </div>

                        <button 
                            onClick={() => { setAdjustedValue(Math.min(item.total, adjustedValue + 1)); setIsDirty(true); }}
                            className="w-8 h-8 rounded-lg bg-white border border-blue-200 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-colors"
                        >
                            <span className="material-icons text-sm">add</span>
                        </button>
                    </div>

                    <input 
                        type="range" 
                        min="0" 
                        max={item.total} 
                        step={item.total > 50 ? 1 : 0.1}
                        value={adjustedValue} 
                        onChange={(e) => { setAdjustedValue(parseFloat(e.target.value)); setIsDirty(true); }}
                        className="w-full h-2 bg-blue-200 dark:bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    
                    <p className="text-[10px] text-center text-blue-400 leading-snug">
                        Ajusta este valor si el contenido visual del envase no coincide con el cálculo del sistema.
                    </p>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={onDiscardRequest}
                    className="py-3 bg-white border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 group"
                >
                    <span className="material-icons text-sm group-hover:shake">delete_outline</span> Agotado / Cerrar
                </button>
                
                <button 
                    onClick={onSaveAdjustment}
                    disabled={!isDirty}
                    className={`py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm
                        ${isDirty 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 transform hover:-translate-y-0.5' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                    `}
                >
                    <span className="material-icons text-sm">save</span> Guardar Ajuste
                </button>
            </div>
        </>
    );
};

export default AuditView;
