
import React, { useState, useEffect } from 'react';

// --- WIDGET: PAYMENT INFO ---
export const TransitPaymentInfo: React.FC<{ finance: any }> = ({ finance }) => {
    return (
        <div className="bg-[#F0FDF4] dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-3 -top-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-icons text-6xl text-green-600">payments</span>
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="text-[10px] font-bold text-green-800 dark:text-green-400 uppercase tracking-widest">Info. Pago</span>
                    </div>
                    <div className="text-xs font-bold text-gray-800 dark:text-white">
                        {finance.status === 'Pagado' ? 'Totalmente Pagado' : `Condición: Net 30`}
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 block uppercase">Vencimiento</span>
                    <span className="text-xs font-bold text-green-700 dark:text-green-300 font-mono">
                        21 mar 2026
                    </span>
                </div>
            </div>
        </div>
    );
};

// --- WIDGET: FINANCIAL SUMMARY ---
export const TransitFinancialSummary: React.FC<{ total: number }> = ({ total }) => {
    const subtotal = total / 1.18; 
    
    return (
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resumen Financiero</h4>
                <span className="material-icons text-gray-300 text-xs">receipt_long</span>
            </div>
            
            <div className="flex justify-between items-end">
                <div className="text-xs text-gray-500">
                    <p>Subtotal: ${subtotal.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                    <p>Impuestos: $0.00</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Total Orden</span>
                    <span className="text-xl font-display font-bold text-blue-600 dark:text-blue-400 leading-none">
                        ${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                </div>
            </div>
        </div>
    );
};

// --- WIDGET: NOTES ---
export const TransitNotes: React.FC<{ notes: string; onSave: (val: string) => void }> = ({ notes, onSave }) => {
    const [val, setVal] = useState(notes || '');
    
    useEffect(() => {
        setVal(notes || '');
    }, [notes]);

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm h-full flex flex-col overflow-hidden">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2 shrink-0">
                <span className="material-icons text-sm text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 p-0.5 rounded">sticky_note_2</span> Notas de Seguimiento
            </h3>
            <textarea 
                className="flex-1 w-full bg-yellow-50/30 dark:bg-yellow-900/5 border border-yellow-100 dark:border-yellow-900/20 rounded-xl p-4 text-xs leading-relaxed text-gray-700 dark:text-gray-300 resize-none outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all placeholder-gray-400"
                placeholder="Bitácora de incidencias, comentarios del transportista o detalles de entrega..."
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={() => onSave(val)}
            />
        </div>
    );
};
