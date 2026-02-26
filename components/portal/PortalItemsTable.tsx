
import React from 'react';

interface PortalItemsTableProps {
    localLines: any[];
    originalLines: any[];
    onQtyChange: (idx: number, val: number) => void;
    onPriceChange: (idx: number, val: number) => void;
    onDiscountValChange: (idx: number, val: number) => void;
    onToggleDiscountType: (idx: number) => void;
    onMarkUnavailable: (idx: number) => void;
    onRestoreItem: (idx: number) => void;
    onToggleLineConfirmation: (idx: number) => void;
    onToggleAllConfirmation: () => void;
    calculateLineTotal: (line: any) => number;
    calculateTotal: () => number;
    allConfirmed: boolean;
    readOnly?: boolean;
    acceptedItemIds?: string[];
    separateAcceptedItems?: boolean;
}

const PortalItemsTable: React.FC<PortalItemsTableProps> = ({
    localLines,
    originalLines,
    onQtyChange,
    onPriceChange,
    onDiscountValChange,
    onToggleDiscountType,
    onMarkUnavailable,
    onRestoreItem,
    onToggleLineConfirmation,
    onToggleAllConfirmation,
    calculateLineTotal,
    calculateTotal,
    allConfirmed,
    readOnly = false,
    acceptedItemIds = [],
    separateAcceptedItems = false
}) => {
    
    // --- SMART INDICATORS CALCULATION ---
    
    // 1. Tasa de Surtido
    const totalUnitsReq = originalLines.reduce((acc, l) => acc + (Number(l.qty) || 0), 0);
    const totalUnitsConf = localLines.reduce((acc, l) => acc + (Number(l.qty) || 0), 0);
    const rawRate = totalUnitsReq > 0 ? (totalUnitsConf / totalUnitsReq) * 100 : 0;
    const fulfillmentRate = Math.min(100, Math.max(0, rawRate)); // Clamp between 0-100 for visual bar
    
    // 2. Contadores de Estado
    const unavailableCount = localLines.filter(l => l.qty === 0).length;
    const modificationsCount = localLines.filter(l => {
        const orig = originalLines.find(o => o.itemId === l.itemId);
        return orig && l.qty > 0 && (l.qty !== orig.qty || l.price !== orig.price);
    }).length;

    // 3. Variación Financiera
    const totalRequested = originalLines.reduce((acc, l) => acc + ((Number(l.qty) || 0) * (Number(l.price) || 0)), 0);
    const currentItemsSubtotal = localLines.reduce((acc, line) => acc + calculateLineTotal(line), 0);
    const variation = currentItemsSubtotal - totalRequested;
    const grandTotal = calculateTotal();

    // --- HEALTH BAR LOGIC ---
    let healthColor = 'from-green-500 to-emerald-400';
    let shadowColor = 'shadow-green-500/50';
    let pulseEffect = '';

    if (fulfillmentRate < 100) {
        healthColor = 'from-blue-500 to-cyan-400';
        shadowColor = 'shadow-blue-500/50';
    }
    if (fulfillmentRate < 80) {
        healthColor = 'from-yellow-500 to-orange-500';
        shadowColor = 'shadow-yellow-500/50';
    }
    if (fulfillmentRate < 50) {
        healthColor = 'from-red-600 to-red-500';
        shadowColor = 'shadow-red-600/50';
        pulseEffect = 'animate-pulse';
    }

    // Helper function to render rows (NOT A COMPONENT to prevent unmounting/focus loss)
    const renderRows = (lines: any[], isReadOnlySection: boolean = false) => {
        return lines.map((line) => {
            // Find global index to update correctly
            const globalIdx = localLines.findIndex(l => l.itemId === line.itemId);
            const originalLine = originalLines?.find(l => l.itemId === line.itemId) || line;
            const isZeroQty = line.qty === 0;
            const isConfirmedLine = line.confirmed;
            const lineTotal = calculateLineTotal(line);
            
            // Allow editing even in "accepted" section if not globally locked
            const isDisabled = isZeroQty || readOnly;
            
            return (
                <tr key={line.itemId} className={`transition-all group hover:bg-[#1e2024] ${isZeroQty ? 'bg-red-900/5 opacity-60' : ''} ${isReadOnlySection ? 'opacity-80' : ''}`}>
                    <td className="px-6 py-5">
                        <p className={`font-bold text-sm ${isConfirmedLine && !isReadOnlySection ? 'text-green-400' : 'text-white'}`}>{line.title}</p>
                        <p className="text-[11px] text-gray-500 font-mono mt-1">{line.itemId}</p>
                    </td>
                    
                    <td className="px-4 py-5 text-center bg-[#1e2024]/50">
                        <span className="text-gray-500 font-mono font-bold text-sm">{originalLine.qty}</span>
                    </td>

                    <td className="px-4 py-5 text-right bg-[#1e2024]/50">
                        <span className="text-gray-500 font-mono font-medium">${(Number(originalLine.price) || 0).toFixed(2)}</span>
                    </td>

                    <td className="px-4 py-5 text-center border-l border-gray-800 border-dashed">
                        <input 
                            type="number" 
                            value={line.qty.toString()} // Force string to prevent leading zero issues
                            onChange={(e) => {
                                const valStr = e.target.value;
                                let val = valStr === '' ? 0 : parseInt(valStr);
                                if (isNaN(val)) val = 0;
                                // Removed max limit check to allow free editing as requested, user can check original
                                if (val < 0) val = 0;
                                onQtyChange(globalIdx, val);
                            }}
                            className={`w-14 bg-[#0f1012] border border-gray-700 text-center font-bold text-white rounded-lg py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${line.qty !== originalLine.qty ? 'border-yellow-600 text-yellow-400' : ''}`}
                            disabled={isDisabled}
                        />
                    </td>

                    <td className="px-4 py-5 text-right">
                        <div className="relative">
                            <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                            <input 
                                type="number"
                                value={line.price.toString()}
                                onChange={(e) => {
                                    const valStr = e.target.value;
                                    const val = valStr === '' ? 0 : parseFloat(valStr);
                                    onPriceChange(globalIdx, val);
                                }}
                                className="w-20 bg-[#0f1012] border border-gray-700 text-right font-mono text-white rounded-lg py-1.5 px-2 text-sm focus:border-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                disabled={isDisabled}
                            />
                        </div>
                    </td>

                    <td className="px-4 py-5 text-center">
                        <div className="flex items-center bg-[#0f1012] border border-gray-700 rounded-lg overflow-hidden w-24 mx-auto">
                            <input 
                                type="number"
                                value={line.discountValue.toString()}
                                onChange={(e) => {
                                    const valStr = e.target.value;
                                    const val = valStr === '' ? 0 : parseFloat(valStr);
                                    onDiscountValChange(globalIdx, val);
                                }}
                                className="w-full bg-transparent text-center font-mono text-xs text-white outline-none py-1.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0"
                                disabled={isDisabled}
                            />
                            <button 
                                onClick={() => onToggleDiscountType(globalIdx)}
                                className="bg-gray-800 px-2 py-1.5 text-[10px] font-bold text-gray-400 hover:text-white border-l border-gray-700"
                                disabled={isDisabled}
                            >
                                {line.discountType === 'percent' ? '%' : '$'}
                            </button>
                        </div>
                    </td>

                    <td className="px-4 py-5 text-right">
                        <span className={`font-mono font-bold text-base ${isZeroQty ? 'text-gray-600 line-through' : 'text-green-500'}`}>
                            ${(Number(lineTotal) || 0).toFixed(2)}
                        </span>
                    </td>

                    <td className="px-4 py-5 text-center">
                        {!readOnly && (
                            <div className="flex items-center justify-center gap-3">
                                <button 
                                    onClick={() => !isZeroQty && onToggleLineConfirmation(globalIdx)} 
                                    disabled={isZeroQty}
                                    className={`relative group flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300
                                        ${line.confirmed 
                                            ? 'bg-green-500 text-white shadow-[0_0_15px_-3px_rgba(34,197,94,0.6)] translate-y-[-1px]' 
                                            : isZeroQty 
                                                ? 'bg-[#1a1d21] text-gray-700 border border-gray-800 cursor-not-allowed opacity-50' 
                                                : 'bg-[#1a1d21] text-gray-500 border border-gray-700 hover:border-green-500/50 hover:text-green-400 hover:bg-green-900/10'
                                        }`}
                                    title={isZeroQty ? 'No disponible' : (line.confirmed ? 'Confirmado' : 'Confirmar Item')}
                                >
                                    <span className="material-icons text-lg">check</span>
                                </button>
                                
                                <button 
                                    onClick={() => isZeroQty ? onRestoreItem(globalIdx) : onMarkUnavailable(globalIdx)} 
                                    className={`relative group flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300
                                        ${isZeroQty 
                                            ? 'bg-red-600 text-white shadow-[0_0_15px_-3px_rgba(220,38,38,0.6)] translate-y-[-1px]' 
                                            : 'bg-[#1a1d21] text-gray-500 border border-gray-700 hover:border-red-500/50 hover:text-red-400 hover:bg-red-900/10'
                                        }`}
                                    title={isZeroQty ? 'Restaurar (Hacer disponible)' : 'Marcar No Disponible (Cantidad 0)'}
                                >
                                    <span className="material-icons text-lg">{isZeroQty ? 'undo' : 'block'}</span>
                                </button>
                            </div>
                        )}
                        {readOnly && (
                            <span className="text-[10px] text-gray-500 italic flex items-center justify-center gap-1">
                                <span className="material-icons text-[12px]">lock</span> Aceptado
                            </span>
                        )}
                    </td>
                </tr>
            );
        });
    };

    // Split logic
    const acceptedLines = separateAcceptedItems ? localLines.filter(l => acceptedItemIds.includes(l.itemId)) : [];
    const modifiedLines = separateAcceptedItems ? localLines.filter(l => !acceptedItemIds.includes(l.itemId)) : localLines;

    return (
        <div className={`bg-[#1e2024] rounded-2xl shadow-lg border border-gray-800 overflow-hidden h-full flex flex-col ${readOnly ? 'opacity-90' : ''}`}>
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-800 bg-[#1e2024] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-white text-lg">Detalle de Productos</h3>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="material-icons text-[10px]">inventory_2</span>
                        {localLines.length} Items
                    </span>
                </div>
                
                {!readOnly && !separateAcceptedItems && (
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onToggleAllConfirmation}
                            className={`text-[11px] font-bold px-4 py-2 rounded-lg border flex items-center gap-2 transition-all
                                ${allConfirmed 
                                    ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50' 
                                    : 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50'}`}
                        >
                            <span className="material-icons text-sm">{allConfirmed ? 'edit' : 'done_all'}</span>
                            {allConfirmed ? 'Habilitar Edición' : 'Confirmar Todos'}
                        </button>
                        <span className="hidden md:inline-block text-[10px] bg-yellow-900/20 text-yellow-600 px-3 py-1.5 rounded-lg border border-yellow-900/50 font-bold uppercase tracking-wide">EDICIÓN HABILITADA</span>
                    </div>
                )}
            </div>
            
            {/* Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#16181c] max-h-[500px]">
                <table className="w-full text-left text-sm relative">
                    <thead className="bg-[#1e2024] text-gray-500 font-bold uppercase text-[10px] border-b border-gray-800 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 w-1/4">ITEM / DESCRIPCIÓN</th>
                            <th className="px-4 py-4 text-center bg-[#25282e]">CANT.<br/>SOL.</th>
                            <th className="px-4 py-4 text-right bg-[#25282e]">PRECIO<br/>REG.</th>
                            <th className="px-4 py-4 text-center border-l border-gray-800 border-dashed w-24">CANT.<br/>CONF.</th>
                            <th className="px-4 py-4 text-right w-28">PRECIO<br/>CONF.</th>
                            <th className="px-4 py-4 text-center w-28">DESC.</th>
                            <th className="px-4 py-4 text-right">TOTAL</th>
                            <th className="px-4 py-4 text-center w-28">ACCIÓN</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {separateAcceptedItems ? (
                            <>
                                {/* Section 1: Accepted Items */}
                                {acceptedLines.length > 0 && (
                                    <>
                                        <tr className="bg-[#1a1d21]">
                                            <td colSpan={8} className="px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800 flex items-center gap-2">
                                                <span className="material-icons text-sm text-green-500">lock</span> Items Acordados / Sin Cambios
                                            </td>
                                        </tr>
                                        {/* Pass readOnly state for these items but don't force it to true, use global readOnly prop */}
                                        {renderRows(acceptedLines, readOnly)}
                                    </>
                                )}

                                {/* Section 2: Modified Items */}
                                {modifiedLines.length > 0 && (
                                    <>
                                        <tr className="bg-blue-900/10">
                                            <td colSpan={8} className="px-6 py-2 text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-gray-800 border-t border-gray-800 flex items-center gap-2">
                                                <span className="material-icons text-sm text-blue-500">edit_note</span> Cambios Propuestos por Admin
                                            </td>
                                        </tr>
                                        {renderRows(modifiedLines, false)}
                                    </>
                                )}
                            </>
                        ) : (
                            renderRows(localLines, false)
                        )}
                    </tbody>
                </table>
            </div>

            {/* Smart Footer - INDICADORES INTELIGENTES */}
            <div className="bg-[#111316] relative shrink-0">
                {/* Order Health Bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-800">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out relative bg-gradient-to-r ${healthColor} shadow-[0_0_15px_-2px] ${shadowColor} ${pulseEffect}`}
                        style={{ width: `${fulfillmentRate}%` }}
                    >
                         <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-50 blur-[1px]"></div>
                    </div>
                </div>
                
                <div className="p-5 flex flex-col lg:flex-row items-center justify-between gap-6 pt-7">
                    
                    {/* LEFT: Surtido & Cambios */}
                    <div className="flex items-start gap-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TASA DE SURTIDO (UNIDADES)</p>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${fulfillmentRate === 100 ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-yellow-500 text-black'}`}>
                                    {fulfillmentRate.toFixed(0)}% {fulfillmentRate === 100 ? 'Óptimo' : 'Parcial'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 bg-red-900/20 border border-red-900/50 px-3 py-1.5 rounded-lg text-red-500">
                                    <span className="material-icons text-[12px]">remove_shopping_cart</span>
                                    <span className="text-[10px] font-bold">{unavailableCount} NO DISPONIBLES</span>
                                </div>
                                <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-900/50 px-3 py-1.5 rounded-lg text-blue-400">
                                    <span className="material-icons text-[12px]">tune</span>
                                    <span className="text-[10px] font-bold">{modificationsCount} MODIFICACIONES</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE: Variación Financiera */}
                    <div className="flex flex-col items-center pl-6 border-l border-gray-800">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">ANÁLISIS DE VARIACIÓN FINANCIERA</p>
                        <div className="flex items-center gap-4 text-sm font-mono">
                            <div className="text-center">
                                <span className="text-[9px] text-gray-600 uppercase font-bold block">SOLICITADO</span>
                                <span className="text-gray-400 line-through decoration-gray-600">${totalRequested.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex flex-col items-center px-4 relative">
                                <div className="h-px w-16 bg-gray-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                <span className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full border ${variation > 0 ? 'bg-red-900/30 text-red-400 border-red-900' : variation < 0 ? 'bg-green-900/30 text-green-400 border-green-900' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                                    {variation > 0 ? '↑' : variation < 0 ? '↓' : ''} ${Math.abs(variation).toFixed(2)}
                                </span>
                            </div>

                            <div className="text-center">
                                <span className="text-[9px] text-gray-600 uppercase font-bold block">FINAL (NETO)</span>
                                <span className="text-white font-bold">${currentItemsSubtotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Grand Total Box */}
                    <div className="bg-black/40 rounded-xl px-6 py-3 border border-gray-800 text-right min-w-[200px]">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-0.5">SUBTOTAL ACTUALIZADO</p>
                        <p className="text-3xl font-display font-bold text-white tracking-tight leading-none">${grandTotal.toFixed(2)}</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PortalItemsTable;
