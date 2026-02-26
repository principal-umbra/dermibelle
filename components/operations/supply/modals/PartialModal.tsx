
import React, { useState, useMemo } from 'react';
import { OrderModalProps } from './OrderModalTypes';

export const PartialModal: React.FC<OrderModalProps> = ({ order, supplier, onClose, onOpenReception, onUpdateStatus, updateOrderCtx, addToast }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    // --- Cálculos de Progreso ---
    const stats = useMemo(() => {
        const lines = order.lines || [];
        const totalQty = lines.reduce((acc, l) => acc + l.qty, 0);
        const totalReceived = lines.reduce((acc, l) => acc + (l.receivedQty || 0), 0);
        const pendingQty = totalQty - totalReceived;
        const percent = totalQty > 0 ? Math.round((totalReceived / totalQty) * 100) : 0;
        
        // Calcular valor pendiente (dinero estancado)
        const pendingValue = lines.reduce((acc, l) => {
            const missing = l.qty - (l.receivedQty || 0);
            return acc + (missing * l.price);
        }, 0);

        const pendingItems = lines.filter(l => (l.receivedQty || 0) < l.qty);

        return { totalQty, totalReceived, pendingQty, percent, pendingValue, pendingItems };
    }, [order]);

    // --- Acciones ---
    const handleForceClose = () => {
        setShowConfirm(true);
    };

    const confirmForceClose = () => {
        // Ajustar cantidades solicitadas a lo recibido (Cancelando el remanente)
        const updatedLines = order.lines?.map(line => ({
            ...line,
            qty: line.receivedQty || 0 // Ajuste de saldo: Cantidad Solicitada = Cantidad Recibida
        })) || [];

        updateOrderCtx(order.id, {
            lines: updatedLines,
            status: 'Delivered',
            notes: (order.notes || '') + ' [SHORTAGE_CLOSED]' // Marca para identificar cierre forzoso
        });

        addToast('success', 'Orden cerrada. Saldos ajustados a lo recibido.');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={onClose}>
            <div className="bg-[#F8F9FB] dark:bg-surface-dark w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
                
                {/* Confirmation Overlay */}
                {showConfirm && (
                    <div className="absolute inset-0 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in">
                        <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-4">
                                <span className="material-icons text-3xl">warning</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">¿Confirmar Cierre?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                                Se cancelarán las <strong>{stats.pendingQty} unidades pendientes</strong> y la orden se marcará como completada. Esta acción es irreversible.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={confirmForceClose}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 transition-colors"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors z-10"
                >
                    <span className="material-icons text-lg">close</span>
                </button>

                {/* HEADER SECTION */}
                <div className="bg-white dark:bg-black/20 px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-6">
                        {/* Circular Progress */}
                        <div className="relative w-20 h-20 shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100 dark:text-gray-700" />
                                <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={264} strokeDashoffset={264 - (264 * stats.percent) / 100} strokeLinecap="round" className="text-amber-400 transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-display font-bold text-gray-900 dark:text-white leading-none">{stats.percent}%</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Recibido</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white tracking-tight">Recepción Parcial</h2>
                                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-500 flex items-center justify-center">
                                    <span className="material-icons text-sm">warning</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 font-mono font-bold text-xs">#{order.idDisplay}</span>
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Proveedor: <span className="text-gray-900 dark:text-white font-bold">{supplier.companyName}</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BODY CONTENT */}
                <div className="p-8 bg-[#F8F9FB] dark:bg-transparent space-y-6">
                    
                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                            <span className="material-icons">info</span>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">Estado de Abastecimiento</h4>
                            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                Faltan <span className="font-bold underline decoration-blue-400">{stats.pendingQty} unidades</span>. Valor estimado de la pérdida en inventario: <span className="font-mono font-bold">${stats.pendingValue.toFixed(2)}</span>.
                            </p>
                        </div>
                    </div>

                    {/* Missing Items List */}
                    <div>
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manifiesto de Faltantes</h4>
                            <span className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-lg text-[10px] font-bold text-gray-500">
                                {stats.totalReceived} / {stats.totalQty} Recibidos
                            </span>
                        </div>
                        
                        <div className="space-y-3 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                            {stats.pendingItems.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                                            <span className="material-icons text-lg">inventory_2</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                                            <p className="text-xs text-gray-400 font-mono">SKU: {item.itemId || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Faltan</span>
                                        <span className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-xs min-w-[30px] text-center">
                                            -{item.qty - (item.receivedQty || 0)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button 
                            onClick={() => { onClose(); onOpenReception(); }}
                            className="bg-[#105D37] hover:bg-[#0c4a2b] text-white p-6 rounded-3xl shadow-lg shadow-green-900/20 flex flex-col items-center justify-center gap-3 group transition-all hover:-translate-y-1"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-icons text-xl">download</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-lg font-bold">Recibir Restante</span>
                                <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Continuar registro hoy</span>
                            </div>
                        </button>

                        <button 
                            onClick={handleForceClose}
                            className="bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 p-6 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-3 group transition-all hover:-translate-y-1"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform">
                                <span className="material-icons text-xl">fact_check</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-lg font-bold">Cerrar con Faltantes</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ajustar saldo y finalizar</span>
                            </div>
                        </button>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="px-8 py-4 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-sm">auto_awesome</span>
                        Se notificará a administración sobre el cierre con discrepancias.
                    </div>
                    <div className="flex gap-4 font-bold">
                        <button className="flex items-center gap-1 hover:text-green-600 transition-colors">
                            <span className="material-icons text-sm">mail</span> Email Proveedor
                        </button>
                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                            <span className="material-icons text-sm">history</span> Ver Historial
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
