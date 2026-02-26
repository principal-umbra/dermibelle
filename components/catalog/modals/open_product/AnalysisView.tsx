
import React, { useState } from 'react';
import { OpenStockItem } from '../../../../types';

type DiscardReason = 'finished' | 'expired' | 'damaged' | 'quality';
type YieldRating = 'low' | 'expected' | 'high';
type DiscardScope = 'single' | 'batch';

interface AnalysisViewProps {
    reason: DiscardReason | null;
    item: OpenStockItem;
    inventoryInsights: any;
    yieldRating: YieldRating;
    setYieldRating: (rating: YieldRating) => void;
    onConfirm: (scope?: DiscardScope, notes?: string) => void;
    onUpdateDate: (newDate: string) => void;
    onBack: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({
    reason,
    item,
    inventoryInsights,
    yieldRating,
    setYieldRating,
    onConfirm,
    onUpdateDate,
    onBack
}) => {
    // Local state for scope selection (used in 'expired' and 'damaged')
    const [scope, setScope] = useState<DiscardScope>('single');
    const [unitIdentifier, setUnitIdentifier] = useState('');
    
    // Correction Mode State
    const [isCorrectingDate, setIsCorrectingDate] = useState(false);
    const [newExpiryDate, setNewExpiryDate] = useState('');

    // Common Calcs
    const lostValue = ((item.remaining / item.total) * 100).toFixed(0);
    const lostAmount = item.remaining.toFixed(2);
    const lostUnit = item.unit;
    const stockInWarehouse = inventoryInsights?.stock || 0;

    // 1. HAPPY PATH (Terminado) - Intacto
    if (reason === 'finished') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="material-icons">query_stats</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Califica el Rendimiento</h3>
                    <p className="text-[11px] text-gray-500 mb-6 px-4">
                        ¿El envase duró la cantidad de servicios esperada según el estándar?
                    </p>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button onClick={() => setYieldRating('low')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${yieldRating === 'low' ? 'border-red-400 bg-red-50 text-red-600 shadow-sm' : 'border-gray-200 hover:border-red-200 text-gray-400'}`}>
                            <span className="material-icons text-xl">trending_down</span><span className="text-[10px] font-bold">Menos</span>
                        </button>
                        <button onClick={() => setYieldRating('expected')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${yieldRating === 'expected' ? 'border-green-400 bg-green-50 text-green-600 shadow-sm' : 'border-gray-200 hover:border-green-200 text-gray-400'}`}>
                            <span className="material-icons text-xl">check</span><span className="text-[10px] font-bold">Exacto</span>
                        </button>
                        <button onClick={() => setYieldRating('high')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${yieldRating === 'high' ? 'border-blue-400 bg-blue-50 text-blue-600 shadow-sm' : 'border-gray-200 hover:border-blue-200 text-gray-400'}`}>
                            <span className="material-icons text-xl">trending_up</span><span className="text-[10px] font-bold">Más</span>
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={onBack} className="flex-1 py-3 text-xs font-bold text-gray-400 hover:bg-gray-50 rounded-xl">Atrás</button>
                        <button onClick={() => onConfirm('single')} className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-green-500/30 transition-all transform hover:-translate-y-0.5">Confirmar Cierre</button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. EXPIRED PATH (Vencido)
    if (reason === 'expired') {
        const daysRemaining = inventoryInsights?.expiryStatus.days ?? 999;
        const expiryDateStr = inventoryInsights?.expiryDateStr;
        const formattedDate = expiryDateStr ? new Date(expiryDateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha';
        
        // --- CORRECTION MODE VIEW ---
        if (isCorrectingDate) {
            return (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="material-icons text-xl">edit_calendar</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Corregir Fecha</h3>
                        <p className="text-[11px] text-gray-500 px-4 mt-1">
                            Actualiza la fecha de vencimiento del lote para corregir el estado del producto.
                        </p>
                    </div>

                    <div className="mx-4 mb-6">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-left mb-2">Nueva Fecha de Vencimiento</label>
                        <input 
                            type="date" 
                            value={newExpiryDate}
                            onChange={(e) => setNewExpiryDate(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="flex gap-3 px-4">
                        <button 
                            onClick={() => setIsCorrectingDate(false)} 
                            className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={() => newExpiryDate && onUpdateDate(newExpiryDate)}
                            disabled={!newExpiryDate}
                            className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 transition-all"
                        >
                            Guardar Corrección
                        </button>
                    </div>
                </div>
            );
        }

        // --- NORMAL DISCARD VIEW ---
        let statusConfig = {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-800 dark:text-blue-300',
            icon: 'help_outline',
            title: 'Verificación Requerida',
            desc: 'El sistema indica que este producto aún es vigente. ¿Confirmas el descarte?',
            btnText: 'Forzar Baja'
        };

        if (daysRemaining < 0) {
            statusConfig = {
                bg: 'bg-red-50 dark:bg-red-900/20',
                border: 'border-red-200 dark:border-red-800',
                text: 'text-red-800 dark:text-red-300',
                icon: 'event_busy',
                title: 'Producto Vencido',
                desc: `Expiró hace ${Math.abs(daysRemaining)} días (${formattedDate}). Se requiere descarte.`,
                btnText: 'Confirmar Baja'
            };
        } else if (daysRemaining <= 30) {
            statusConfig = {
                bg: 'bg-orange-50 dark:bg-orange-900/20',
                border: 'border-orange-200 dark:border-orange-800',
                text: 'text-orange-800 dark:text-orange-300',
                icon: 'history_toggle_off',
                title: 'Vence Próximamente',
                desc: `Quedan solo ${daysRemaining} días de vida útil (${formattedDate}). Descarte anticipado.`,
                btnText: 'Confirmar Baja'
            };
        }

        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-surface-dark shadow-sm ${statusConfig.bg} ${statusConfig.text}`}>
                        <span className="material-icons text-2xl">{statusConfig.icon}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Registro de Vencimiento</h3>
                    
                    {/* Context Card (Inteligente) */}
                    <div className={`mx-4 mb-4 p-3 rounded-xl border text-left flex items-start gap-3 ${statusConfig.bg} ${statusConfig.border}`}>
                        <div className={`mt-0.5 ${statusConfig.text}`}>
                            <span className="material-icons text-sm">info</span>
                        </div>
                        <div className="flex-1">
                            <p className={`text-xs font-bold ${statusConfig.text} mb-0.5`}>{statusConfig.title}</p>
                            <p className="text-[11px] opacity-80 leading-snug">{statusConfig.desc}</p>
                        </div>
                    </div>

                    {/* Correction Link */}
                    <button 
                        onClick={() => {
                            setNewExpiryDate(inventoryInsights?.expiryDateStr ? new Date(inventoryInsights.expiryDateStr).toISOString().split('T')[0] : '');
                            setIsCorrectingDate(true);
                        }}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center justify-center gap-1 w-full"
                    >
                        <span className="material-icons text-[12px]">edit</span> ¿La fecha es incorrecta? Corregir
                    </button>

                    {/* SCOPE SELECTION (Lote vs Unidad) */}
                    <div className="mx-4 mb-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-left mb-2">Alcance de la Baja</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setScope('single')}
                                className={`p-3 rounded-xl border text-left relative overflow-hidden transition-all ${
                                    scope === 'single' 
                                    ? 'bg-white dark:bg-surface-dark border-blue-500 shadow-md ring-1 ring-blue-500/20' 
                                    : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-white'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="material-icons text-lg text-blue-500">science</span>
                                    {scope === 'single' && <span className="material-icons text-blue-500 text-sm">check_circle</span>}
                                </div>
                                <p className="text-xs font-bold text-gray-800 dark:text-white">Esta Unidad</p>
                                <p className="text-[9px] text-gray-500 leading-tight">Solo el envase abierto actual.</p>
                            </button>

                            <button 
                                onClick={() => setScope('batch')}
                                className={`p-3 rounded-xl border text-left relative overflow-hidden transition-all ${
                                    scope === 'batch' 
                                    ? 'bg-red-50 dark:bg-red-900/10 border-red-500 shadow-md ring-1 ring-red-500/20' 
                                    : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-white'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="material-icons text-lg text-red-500">inventory_2</span>
                                    {scope === 'batch' && <span className="material-icons text-red-500 text-sm">check_circle</span>}
                                </div>
                                <p className="text-xs font-bold text-gray-800 dark:text-white">Todo el Lote</p>
                                <p className="text-[9px] text-gray-500 leading-tight">Incluye {stockInWarehouse} en bodega.</p>
                            </button>
                        </div>

                        {/* SPECIFIC IDENTIFIER FIELD (Only for Single Unit) */}
                        {scope === 'single' && (
                             <div className="mt-3 animate-in slide-in-from-top-2 fade-in">
                                 <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block text-left ml-1">
                                    Identificador / Serial <span className="text-red-500">*</span>
                                 </label>
                                 <div className="flex items-center gap-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 transition-all focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/20">
                                     <span className="material-icons text-gray-400 text-sm">qr_code_2</span>
                                     <input
                                         type="text"
                                         value={unitIdentifier}
                                         onChange={(e) => setUnitIdentifier(e.target.value)}
                                         className="flex-1 bg-transparent text-xs font-medium outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                                         placeholder="Ej: Lote #12345 o Código Específico"
                                     />
                                 </div>
                             </div>
                        )}
                    </div>
                    
                    {/* Summary with Scope Identifier */}
                    <div className="bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800 mb-6 text-left mx-4 shadow-sm relative overflow-hidden">
                        <div className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg text-[9px] font-bold uppercase text-white ${scope === 'batch' ? 'bg-red-500' : 'bg-blue-500'}`}>
                            {scope === 'batch' ? 'Lote Completo' : 'Unidad Única'}
                        </div>

                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 mt-1">Impacto Financiero</p>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Cantidad a descartar:</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                                {scope === 'batch' ? `${(parseFloat(item.remaining.toString()) + (stockInWarehouse * (item.total || 1))).toFixed(2)}` : lostAmount} {lostUnit}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Valor residual perdido:</span>
                            <span className="font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-xs">
                                {scope === 'batch' ? '100% (Total)' : `~${lostValue}%`}
                            </span>
                        </div>
                        {scope === 'batch' && (
                            <p className="text-[9px] text-red-500 mt-2 italic flex items-center gap-1">
                                <span className="material-icons text-[10px]">warning</span> Se enviará todo el stock a "Vencidos".
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 px-4">
                        <button onClick={onBack} className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
                        <button 
                            onClick={() => onConfirm(scope, unitIdentifier)} 
                            disabled={scope === 'single' && !unitIdentifier.trim()}
                            className={`flex-[2] py-3 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2
                                ${scope === 'single' && !unitIdentifier.trim() 
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/30'}
                            `}
                        >
                            <span className="material-icons text-sm">delete</span> 
                            {statusConfig.btnText}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. DAMAGED PATH (Dañado) - ACTUALIZADO CON SELECCION DE ALCANCE
    if (reason === 'damaged') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center">
                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-surface-dark shadow-sm">
                        <span className="material-icons text-2xl">broken_image</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Reporte de Incidente</h3>
                    <p className="text-xs text-gray-500 mb-6 px-6 leading-relaxed">
                        Accidente operativo, rotura o derrame. Esta acción registrará una pérdida inmediata en el sistema.
                    </p>
                    
                    {/* SCOPE SELECTION FOR DAMAGED */}
                    <div className="mx-4 mb-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-left mb-2">Alcance del Daño</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setScope('single')}
                                className={`p-3 rounded-xl border text-left relative overflow-hidden transition-all ${
                                    scope === 'single' 
                                    ? 'bg-white dark:bg-surface-dark border-red-500 shadow-md ring-1 ring-red-500/20' 
                                    : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-white'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="material-icons text-lg text-red-500">science</span>
                                    {scope === 'single' && <span className="material-icons text-red-500 text-sm">check_circle</span>}
                                </div>
                                <p className="text-xs font-bold text-gray-800 dark:text-white">Esta Unidad</p>
                                <p className="text-[9px] text-gray-500 leading-tight">Solo el envase actual.</p>
                            </button>

                            <button 
                                onClick={() => setScope('batch')}
                                className={`p-3 rounded-xl border text-left relative overflow-hidden transition-all ${
                                    scope === 'batch' 
                                    ? 'bg-red-50 dark:bg-red-900/10 border-red-600 shadow-md ring-1 ring-red-600/20' 
                                    : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-white'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="material-icons text-lg text-red-600">inventory_2</span>
                                    {scope === 'batch' && <span className="material-icons text-red-600 text-sm">check_circle</span>}
                                </div>
                                <p className="text-xs font-bold text-gray-800 dark:text-white">Todo el Lote</p>
                                <p className="text-[9px] text-gray-500 leading-tight">Incluye {stockInWarehouse} en bodega.</p>
                            </button>
                        </div>
                        
                         {/* SPECIFIC IDENTIFIER FIELD (Only for Single Unit) */}
                         {scope === 'single' && (
                             <div className="mt-3 animate-in slide-in-from-top-2 fade-in">
                                 <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block text-left ml-1">
                                    Identificador / Serial <span className="text-red-500">*</span>
                                 </label>
                                 <div className="flex items-center gap-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 transition-all focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400/20">
                                     <span className="material-icons text-gray-400 text-sm">qr_code_2</span>
                                     <input
                                         type="text"
                                         value={unitIdentifier}
                                         onChange={(e) => setUnitIdentifier(e.target.value)}
                                         className="flex-1 bg-transparent text-xs font-medium outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                                         placeholder="Ej: Lote #12345 (Dañado)"
                                     />
                                 </div>
                             </div>
                        )}
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-800 mb-6 text-left relative overflow-hidden mx-4">
                        <div className="relative z-10">
                            <div className="flex justify-between items-end border-b border-red-200 dark:border-red-800/50 pb-2 mb-2">
                                <span className="text-xs font-bold text-red-800 dark:text-red-300">Pérdida Total</span>
                                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                                    {scope === 'batch' ? `${(parseFloat(item.remaining.toString()) + (stockInWarehouse * (item.total || 1))).toFixed(2)}` : lostAmount} <span className="text-xs">{lostUnit}</span>
                                </span>
                            </div>
                            <p className="text-[10px] text-red-600/80 dark:text-red-300 italic">
                                "Se recomienda verificar el área de almacenamiento para evitar futuros accidentes."
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 px-4">
                        <button onClick={onBack} className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
                        <button 
                            onClick={() => onConfirm(scope, unitIdentifier)} 
                            disabled={scope === 'single' && !unitIdentifier.trim()}
                            className={`flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2
                                ${scope === 'single' && !unitIdentifier.trim() ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            <span className="material-icons text-sm">warning</span> Registrar Incidente
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 4. QUALITY PATH (Calidad)
    if (reason === 'quality') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center">
                    <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-surface-dark shadow-sm">
                        <span className="material-icons text-2xl">reviews</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Defecto de Calidad</h3>
                    <p className="text-xs text-gray-500 mb-6 px-6 leading-relaxed">
                        Producto en mal estado, separado o con olor inusual. Se marcará para revisión con el proveedor.
                    </p>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-1 rounded-xl border border-purple-200 dark:border-purple-800 mb-6">
                        <div className="bg-white dark:bg-black/20 rounded-lg p-3">
                            <label className="block text-left text-[9px] font-bold text-purple-700 dark:text-purple-300 uppercase mb-1 ml-1">Observaciones</label>
                            <textarea 
                                className="w-full text-xs p-2 bg-transparent border-b border-purple-100 dark:border-purple-800 focus:border-purple-400 outline-none resize-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
                                rows={2}
                                placeholder="Ej: Cambio de color, textura grumosa..."
                            ></textarea>
                        </div>
                        <div className="px-3 py-2 flex justify-between items-center text-xs">
                            <span className="text-gray-500">Cantidad afectada:</span>
                            <span className="font-bold text-purple-700 dark:text-purple-300">{lostAmount} {lostUnit}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onBack} className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
                        <button onClick={() => onConfirm('single')} className="flex-[2] py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2">
                            <span className="material-icons text-sm">flag</span> Reportar Defecto
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return null;
};

export default AnalysisView;
