
import React, { useState, useMemo } from 'react';
import { Order, Supplier, useData } from '../../../../context/DataContext';

interface ModalProps {
    order: Order;
    supplier: Supplier;
    onClose: () => void;
    onUpdateStatus: (status: Order['status']) => void;
    onOpenReception: () => void;
    updateOrderCtx: (id: string, data: Partial<Order>) => void;
    addToast: (type: any, msg: string) => void;
}

// --- 4. PARTIAL MODAL (REMASTERIZADO: INTELIGENTE, EFICIENTE Y MODERNO) ---
export const PartialModal: React.FC<ModalProps> = ({ order, onClose, onOpenReception, onUpdateStatus, addToast }) => {
    const { appointments } = useData();

    // --- LÓGICA INTELIGENTE: Análisis de Impacto ---
    const analysis = useMemo(() => {
        const lines = order.lines || [];
        const itemsWithDiscrepancy = lines.filter(l => (l.receivedQty || 0) < l.qty);
        
        const totalOrdered = lines.reduce((acc, l) => acc + l.qty, 0);
        const totalReceived = lines.reduce((acc, l) => acc + (l.receivedQty || 0), 0);
        const percent = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

        // Calculamos el valor monetario del faltante
        const missingValue = itemsWithDiscrepancy.reduce((acc, l) => acc + (l.price * (l.qty - (l.receivedQty || 0))), 0);

        // Cruce con agenda: ¿Afecta citas próximas?
        const affectedApptsCount = appointments.filter(appt => 
            (appt.status === 'Confirmed' || appt.status === 'In Progress') &&
            appt.items.some(apptItem => itemsWithDiscrepancy.some(disc => disc.itemId === apptItem.id))
        ).length;

        return {
            percent,
            totalOrdered,
            totalReceived,
            missingCount: totalOrdered - totalReceived,
            missingValue,
            itemsWithDiscrepancy,
            affectedApptsCount,
            isCritical: affectedApptsCount > 0 || (totalOrdered - totalReceived) > (totalOrdered * 0.5)
        };
    }, [order.lines, appointments]);

    const handleCloseWithGap = () => {
        if(confirm('¿Confirmas el cierre de la orden? Los faltantes se registrarán como incumplimiento del proveedor para ajustar el balance contable.')) {
            onUpdateStatus('Delivered');
            addToast('info', 'Orden cerrada. Discrepancia reportada a finanzas.');
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose}>
            <div className="bg-[#F8F9FA] dark:bg-surface-dark w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] border border-white/20 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                
                {/* 1. HEADER: Identidad y Progreso Visual */}
                <div className="bg-white dark:bg-black/20 p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <div className="flex gap-6 items-center relative z-10">
                        {/* Indicador Circular Moderno */}
                        <div className="relative w-24 h-24 shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                                <circle 
                                    cx="50%" cy="50%" r="42%" 
                                    stroke="currentColor" strokeWidth="8" fill="transparent" 
                                    strokeDasharray={264} 
                                    strokeDashoffset={264 - (264 * analysis.percent) / 100} 
                                    strokeLinecap="round" 
                                    className="text-yellow-500 transition-all duration-[1.5s] ease-out drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" 
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                <span className="text-2xl font-display font-black text-gray-900 dark:text-white">{analysis.percent}%</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase mt-1">Recibido</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-3xl font-display font-extrabold text-gray-900 dark:text-white tracking-tight">Recepción Parcial</h2>
                                <span className="bg-yellow-500 text-white p-1 rounded-lg animate-pulse shadow-lg shadow-yellow-500/20">
                                    <span className="material-icons text-base block">warning</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full font-mono text-xs font-bold text-gray-600 dark:text-gray-300">#{order.idDisplay}</span>
                                <span className="text-sm text-gray-500 font-medium">Proveedor: <strong className="text-gray-800 dark:text-gray-200">{order.clientName}</strong></span>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-all shrink-0">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* 2. BODY: Inteligencia de Datos */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-gray-50/30 dark:bg-transparent">
                    
                    {/* Sección: Alerta de Impacto Operativo (Criterio Inteligente) */}
                    <div className={`p-5 rounded-3xl border flex items-start gap-5 transition-all duration-500 ${analysis.isCritical ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${analysis.isCritical ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <span className="material-icons text-2xl">{analysis.isCritical ? 'priority_high' : 'info'}</span>
                        </div>
                        <div>
                            <h4 className={`text-sm font-bold uppercase tracking-wider mb-1 ${analysis.isCritical ? 'text-red-800 dark:text-red-200' : 'text-blue-800 dark:text-blue-200'}`}>
                                {analysis.isCritical ? 'Riesgo Operativo Detectado' : 'Estado de Abastecimiento'}
                            </h4>
                            <p className={`text-sm leading-relaxed ${analysis.isCritical ? 'text-red-600 dark:text-red-300/80' : 'text-blue-600 dark:text-blue-300/80'}`}>
                                {analysis.affectedApptsCount > 0 
                                    ? `Atención: Los insumos faltantes comprometen la realización de ` 
                                    : `Faltan `}
                                <strong className="font-black underline decoration-2">{analysis.affectedApptsCount > 0 ? `${analysis.affectedApptsCount} citas programadas` : `${analysis.missingCount} unidades`}</strong>. 
                                Valor estimado de la pérdida en inventario: <strong className="font-mono">${analysis.missingValue.toFixed(2)}</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Desglose Detallado de Discrepancias (Criterio Eficiente) */}
                    <div>
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Manifiesto de Faltantes</h3>
                            <div className="flex gap-2">
                                <span className="bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500">
                                    {analysis.totalReceived} / {analysis.totalOrdered} Recibidos
                                </span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {analysis.itemsWithDiscrepancy.map((line, idx) => (
                                <div key={idx} className="group flex items-center justify-between p-4 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md hover:border-yellow-200 dark:hover:border-yellow-900/50 transition-all duration-300">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-black/20 flex items-center justify-center text-gray-400 group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors">
                                            <span className="material-icons">inventory_2</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">{line.title}</p>
                                            <p className="text-[10px] text-gray-400 font-mono mt-1">SKU: {line.itemId}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6 pl-4 border-l border-gray-50 dark:border-gray-800">
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 mb-1 justify-end">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Faltan</span>
                                                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-lg text-xs font-black">
                                                    -{line.qty - (line.receivedQty || 0)}
                                                </span>
                                            </div>
                                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-yellow-500 transition-all duration-1000" 
                                                    style={{ width: `${((line.receivedQty || 0) / line.qty) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions Island (Criterio Intuitivo) */}
                    <div className="bg-white dark:bg-black/30 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-surface-dark px-6 py-1 border border-gray-100 dark:border-gray-800 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest z-10">
                            Resolución de Orden
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            {/* Acción Primaria: Continuar */}
                            <button 
                                onClick={onOpenReception}
                                className="group relative p-6 bg-primary hover:bg-green-800 text-white rounded-[2rem] shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95 flex flex-col items-center text-center gap-3 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-1 transition-transform group-hover:scale-110">
                                    <span className="material-symbols-outlined text-3xl font-bold">move_to_inbox</span>
                                </div>
                                <div>
                                    <span className="font-display font-black text-lg block mb-0.5">Recibir Restante</span>
                                    <span className="text-[10px] font-medium opacity-70 uppercase tracking-widest">Continuar registro hoy</span>
                                </div>
                            </button>

                            {/* Acción Secundaria: Cerrar con discrepancia */}
                            <button 
                                onClick={handleCloseWithGap}
                                className="group relative p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-900/50 text-gray-700 dark:text-gray-200 rounded-[2rem] transition-all hover:-translate-y-1 active:scale-95 flex flex-col items-center text-center gap-3"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/10 flex items-center justify-center mb-1 group-hover:text-red-500 transition-colors">
                                    <span className="material-symbols-outlined text-3xl">fact_check</span>
                                </div>
                                <div>
                                    <span className="font-display font-black text-lg block mb-0.5">Cerrar con Faltantes</span>
                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Ajustar saldo y finalizar</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. FINAL FOOTER: Enlaces de Apoyo */}
                <div className="px-8 py-5 bg-white dark:bg-black/40 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3 text-gray-400 italic text-[11px] font-medium">
                        <span className="material-icons text-sm">auto_awesome</span>
                        <span>Se notificará a administración sobre el cierre con discrepancias.</span>
                    </div>
                    <div className="flex gap-4">
                        <button className="text-xs font-black text-primary hover:text-green-700 flex items-center gap-2 transition-colors">
                            <span className="material-icons text-sm">mail</span> Email Proveedor
                        </button>
                        <button className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-2 transition-colors">
                            <span className="material-icons text-sm">history</span> Ver Historial
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 6. CANCELLED MODAL ---
export const CancelledModal: React.FC<ModalProps> = ({ onClose, onUpdateStatus, addToast }) => {
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-[3rem] shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 text-center" onClick={e => e.stopPropagation()}>
                <div className="bg-red-50 dark:bg-red-900/10 p-6 flex items-center gap-4 border-b border-red-100 dark:border-red-900/30">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0">
                        <span className="material-icons text-2xl">block</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-red-900 dark:text-red-100">Orden Cancelada</h2>
                        <p className="text-xs text-red-700 dark:text-red-300">Esta orden está inactiva.</p>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        Puedes reactivar esta orden para convertirla nuevamente en un <strong>Borrador</strong> y editarla.
                    </p>

                    <button 
                        onClick={() => { onUpdateStatus('Draft'); addToast('success', 'Orden reactivada a Borrador'); }}
                        className="w-full py-3 bg-white border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group"
                    >
                        <span className="material-icons group-hover:rotate-180 transition-transform">restore</span> Reactivar Orden
                    </button>
                    
                    <button onClick={onClose} className="w-full mt-3 py-2 text-xs text-gray-400 font-bold hover:text-gray-600">Cerrar</button>
                </div>
            </div>
        </div>
    );
};
