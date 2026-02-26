
import React from 'react';

interface OrderFooterProps {
    shippingMethodId: string;
    setShippingMethodId: (id: string) => void;
    paymentTerm: string;
    setPaymentTerm: (term: string) => void;
    isCreditExceeded: boolean;
    initialStatus: string;
    setInitialStatus: (status: string) => void;
    allowPartialDelivery: boolean;
    setAllowPartialDelivery: (allow: boolean) => void;
    postAction: string;
    setPostAction: (action: string) => void;
    notesInternal: string;
    setNotesInternal: (notes: string) => void;
    noteType: string;
    setNoteType: (type: string) => void;
    itemsTotal: number;
    shippingCost: number;
    setShippingCost: (cost: number) => void;
    taxRate: number;
    taxAmount: number;
    manualAdjustment: number;
    setManualAdjustment: (adj: number) => void;
    globalDiscount: number;
    setGlobalDiscount: (disc: number) => void;
    totalOrder: number;
    showAdvancedTotals: boolean;
    setShowAdvancedTotals: (show: boolean) => void;
    isAtypicalOrder: boolean;
    validationErrors: string[];
    onClose: () => void;
    onConfirm: () => void;
    expectedDate: string;
    // Constants injected from parent - Updated type to allow cost
    SHIPPING_OPTIONS: { id: string, label: string, cost?: number }[];
    NOTE_ROLES: string[];
    ORDER_STATUSES: string[];
}

// Internal Helper for Tooltips
const FooterLabelWithTooltip = ({ label, tooltip }: { label: string, tooltip: string }) => (
    <div className="group relative flex items-center gap-1.5 cursor-help w-fit">
        <span className="border-b border-dotted border-gray-400/50 hover:border-gray-400 transition-colors">{label}</span>
        <span className="material-icons text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">help</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2.5 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 text-center leading-relaxed font-medium shadow-xl transform translate-y-2 group-hover:translate-y-0">
            {tooltip}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
    </div>
);

const OrderFooter: React.FC<OrderFooterProps> = ({
    shippingMethodId, setShippingMethodId,
    paymentTerm, setPaymentTerm, isCreditExceeded,
    initialStatus, setInitialStatus,
    allowPartialDelivery, setAllowPartialDelivery,
    postAction, setPostAction,
    notesInternal, setNotesInternal, noteType, setNoteType,
    itemsTotal, shippingCost, setShippingCost,
    taxRate, taxAmount, manualAdjustment, setManualAdjustment,
    globalDiscount, setGlobalDiscount, totalOrder,
    showAdvancedTotals, setShowAdvancedTotals,
    isAtypicalOrder, validationErrors,
    onClose, onConfirm, expectedDate,
    SHIPPING_OPTIONS, NOTE_ROLES, ORDER_STATUSES
}) => {
    return (
        <div className="bg-white dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 p-4 shrink-0 relative z-30 w-full">
            
            {/* Atypical Alert */}
            {isAtypicalOrder && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                    <div className="bg-amber-100 text-amber-800 text-[10px] font-bold px-4 py-1.5 rounded-full shadow-md border border-white flex items-center gap-2 animate-bounce">
                        <span className="material-icons text-sm">warning_amber</span>
                        Alerta: Compra 35% superior al promedio
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4 items-end">
                
                {/* --- COLUMNA 1: ESTRUCTURA FIJA --- */}
                {/* 'self-end' prevents stretching when right column grows */}
                <div className="flex-1 flex flex-col gap-2 w-full self-end">
                    
                    {/* Fila 1: 3 Columnas */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* Envío */}
                        <div className="group">
                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5 ml-1">Envío</label>
                            <div className="relative">
                                <select value={shippingMethodId} onChange={e => setShippingMethodId(e.target.value)} className="w-full bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 px-2 text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500/20 appearance-none cursor-pointer truncate">
                                    {SHIPPING_OPTIONS.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-[9px] text-gray-400 mt-0.5 px-1 truncate">ETA: {expectedDate}</p>
                        </div>
                        
                        {/* Pago */}
                        <div className="group">
                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5 ml-1">Pago</label>
                            <div className="relative">
                                <select value={paymentTerm} onChange={e => setPaymentTerm(e.target.value)} className={`w-full bg-gray-50 dark:bg-surface-dark border rounded-lg py-1.5 px-2 text-xs font-medium outline-none appearance-none cursor-pointer truncate ${isCreditExceeded ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-200 dark:border-gray-700'}`}>
                                    <option>Net 30</option>
                                    <option>Net 15</option>
                                    <option>Contado</option>
                                </select>
                            </div>
                            {isCreditExceeded && <p className="text-[9px] text-red-500 font-bold mt-0.5 px-1 truncate">⚠️ Excede</p>}
                        </div>

                        {/* Estado */}
                        <div className="group">
                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5 ml-1">Estado</label>
                            <div className="relative">
                                <select value={initialStatus} onChange={e => setInitialStatus(e.target.value)} className="w-full bg-blue-50 text-blue-700 border border-blue-100 rounded-lg py-1.5 px-2 text-[10px] font-bold outline-none cursor-pointer appearance-none truncate">
                                    {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Fila 2: 2 Columnas */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Al Finalizar */}
                        <div className="group">
                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5 ml-1">Al Finalizar</label>
                            <div className="relative">
                                <select value={postAction} onChange={e => setPostAction(e.target.value)} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 px-2 text-xs font-bold text-gray-600 dark:text-gray-300 outline-none cursor-pointer appearance-none hover:border-indigo-300 transition-colors truncate">
                                    <option value="close">Cerrar Ventana</option>
                                    <option value="print">Generar PDF</option>
                                    <option value="email">Enviar a Proveedor</option>
                                </select>
                            </div>
                        </div>

                        {/* Parciales Checkbox */}
                        <div className="flex items-end">
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 transition-colors h-[34px] w-full">
                                <input type="checkbox" id="partial" checked={allowPartialDelivery} onChange={e => setAllowPartialDelivery(e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer shrink-0" />
                                <label htmlFor="partial" className="text-[10px] font-medium text-gray-600 dark:text-gray-300 select-none cursor-pointer truncate">Permitir Parciales</label>
                            </div>
                        </div>
                    </div>

                    {/* Fila 3: Notas para el proveedor (Actualizada) */}
                    <div className="group w-full">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5 ml-1">Notas para el proveedor</label>
                        <textarea 
                            value={notesInternal} 
                            onChange={e => setNotesInternal(e.target.value)} 
                            className="w-full h-24 bg-yellow-50/50 border border-yellow-100 rounded-lg py-2 px-3 text-xs outline-none focus:border-yellow-300 placeholder-yellow-700/40 text-yellow-800 resize-none" 
                            placeholder="Instrucciones de entrega, referencias, etc..." 
                        />
                    </div>
                </div>

                {/* --- COLUMNA 2: FINANZAS (Anclada al Fondo, crece hacia arriba) --- */}
                <div className="w-full lg:w-72 shrink-0 flex flex-col justify-end gap-3 self-end">
                    
                    {/* Bloque Finanzas & Acciones */}
                    <div className="bg-gray-50/50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex flex-col justify-end">
                        
                        {/* Detalles Desplegables (Abre hacia ARRIBA por flujo flex al crecer el contenedor) */}
                        {showAdvancedTotals && (
                            <div className="mb-3 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700 space-y-2 animate-in slide-in-from-bottom-2 fade-in">
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <FooterLabelWithTooltip label="Desc. Global" tooltip="Porcentaje de descuento aplicado al subtotal de todos los productos." />
                                    <div className="flex items-center gap-1 bg-white dark:bg-black/20 rounded-md border border-gray-200 dark:border-gray-700 px-1.5 py-0.5">
                                        <input 
                                            type="number" 
                                            value={globalDiscount} 
                                            onChange={e => setGlobalDiscount(parseFloat(e.target.value) || 0)} 
                                            className="w-8 text-right outline-none bg-transparent py-0 font-mono text-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                        />
                                        <span className="text-[9px] font-bold">%</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <FooterLabelWithTooltip label="Envío" tooltip="Costo logístico. Varía automáticamente según el método de entrega seleccionado." />
                                    <div className="flex items-center bg-white dark:bg-black/20 rounded-md border border-gray-200 dark:border-gray-700 px-1.5 py-0.5">
                                        <span className="text-[9px] font-bold mr-0.5">$</span>
                                        <input 
                                            type="number" 
                                            value={shippingCost} 
                                            onChange={e => setShippingCost(parseFloat(e.target.value) || 0)} 
                                            className="w-10 text-right outline-none bg-transparent py-0 font-mono text-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <FooterLabelWithTooltip label={`Impuesto (${taxRate}%)`} tooltip="Tasa impositiva calculada sobre el subtotal tras descuentos. Configurable por proveedor." />
                                    <span className="font-mono text-[10px]">${taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <FooterLabelWithTooltip label="Ajuste Manual" tooltip="Corrección monetaria directa (+/-) para cuadrar diferencias de centavos o cargos extra." />
                                    <div className="flex items-center bg-white dark:bg-black/20 rounded-md border border-gray-200 dark:border-gray-700 px-1.5 py-0.5">
                                        <span className="text-[9px] font-bold mr-0.5">$</span>
                                        <input 
                                            type="number" 
                                            value={manualAdjustment} 
                                            onChange={e => setManualAdjustment(parseFloat(e.target.value) || 0)} 
                                            className="w-10 text-right outline-none bg-transparent py-0 font-mono text-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Subtotal & Toggle */}
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <button 
                                onClick={() => setShowAdvancedTotals(!showAdvancedTotals)}
                                className="flex items-center gap-1 text-gray-400 hover:text-indigo-600 transition-colors border-b border-dashed border-gray-300 hover:border-indigo-400 pb-0.5"
                            >
                                {showAdvancedTotals ? 'Ocultar Desglose' : 'Ver Desglose'} 
                                <span className={`material-icons text-[10px] transform transition-transform ${showAdvancedTotals ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>
                            <span className="font-mono text-gray-900 dark:text-white font-bold">${itemsTotal.toFixed(2)}</span>
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-end mb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">TOTAL</span>
                                <span className="text-[9px] text-gray-400">ETA: {expectedDate}</span>
                            </div>
                            <span className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400">${totalOrder.toFixed(2)}</span>
                        </div>

                        {/* Botones Acción */}
                        <div className="flex gap-2">
                            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-[10px] hover:bg-gray-100 transition-colors uppercase">
                                Cancelar
                            </button>
                            <button 
                                onClick={onConfirm} 
                                disabled={validationErrors.length > 0}
                                title={validationErrors.join(', ')}
                                className="flex-[2] py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-[10px] shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 uppercase"
                            >
                                <span className="material-icons text-sm">send</span> Confirmar
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OrderFooter;
