import React, { useState, useMemo, useEffect } from 'react';
import { OrderModalProps } from './OrderModalTypes';

export const ScheduledModal: React.FC<OrderModalProps> = ({ order, supplier, onClose, updateOrderCtx, addToast }) => {
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [newDate, setNewDate] = useState(order.date);
    const [now, setNow] = useState(new Date());

    // --- CRONÓMETRO: Update every second ---
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- CÁLCULO DE TIEMPO ---
    const timeStats = useMemo(() => {
        const scheduledTimeStr = `${order.date}T${order.scheduledTime || '09:00'}:00`;
        const scheduledDate = new Date(scheduledTimeStr);
        
        // Ensure valid date, fallback if invalid
        if (isNaN(scheduledDate.getTime())) {
            return { diffDays: 0, statusLabel: 'Error Fecha', statusColor: 'bg-gray-500', countdown: '00:00:00', scheduledDate: new Date() };
        }

        const diffTime = scheduledDate.getTime() - now.getTime();
        
        // Time components
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);
        
        let statusLabel = '';
        let statusColor = '';

        if (diffTime <= 0) {
            statusLabel = 'Enviando...';
            statusColor = 'bg-green-500 text-white';
        } else if (days > 1) {
            statusLabel = `En ${days} días`;
            statusColor = 'bg-indigo-500 text-white';
        } else if (days === 1) {
            statusLabel = 'Mañana';
            statusColor = 'bg-purple-500 text-white';
        } else {
            statusLabel = `Hoy a las ${order.scheduledTime || '09:00'}`;
            statusColor = 'bg-blue-500 text-white';
        }

        const pad = (n: number) => n.toString().padStart(2, '0');
        const countdown = diffTime > 0 ? `${days > 0 ? days + 'd ' : ''}${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s` : '00:00:00';

        return { diffDays: days, statusLabel, statusColor, scheduledDate, countdown };
    }, [order.date, order.scheduledTime, now]);

    // --- HANDLERS ---

    const handleSendNow = () => {
        if (confirm('¿Deseas omitir la espera y enviar esta orden inmediatamente?')) {
            updateOrderCtx(order.id, { status: 'Placed', date: new Date().toLocaleDateString('en-CA') });
            addToast('success', 'Orden enviada manualmente al proveedor.');
            onClose();
        }
    };

    const handleEditDraft = () => {
        updateOrderCtx(order.id, { status: 'Draft' });
        addToast('info', 'Orden revertida a borrador para edición.');
    };

    const handleCancel = () => {
        if (confirm('¿Cancelar esta programación? La orden pasará a estado Cancelado.')) {
            updateOrderCtx(order.id, { status: 'Cancelled' });
            addToast('info', 'Programación cancelada.');
            onClose();
        }
    };

    const saveReschedule = () => {
        if (!newDate) return;
        
        // Prevent past dates
        const selected = new Date(newDate + 'T' + (order.scheduledTime || '09:00'));
        if (selected < new Date()) {
             addToast('error', 'No puedes reprogramar para una fecha pasada.');
             return;
        }

        updateOrderCtx(order.id, { date: newDate });
        addToast('success', `Reprogramada para el ${newDate}`);
        setIsRescheduling(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-[#F8F9FC] dark:bg-surface-dark w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-gray-700 overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
                
                {/* 1. HERO HEADER: COUNTDOWN */}
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-8 pb-10 text-white text-center overflow-hidden shrink-0">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest mb-4 shadow-sm">
                            <span className="material-icons text-xs animate-pulse">schedule</span>
                            Envío Automático
                        </div>

                        <h2 className="text-5xl font-mono font-bold tracking-tight drop-shadow-md mb-2 tabular-nums">
                            {timeStats.countdown}
                        </h2>
                        <p className="text-indigo-200 text-sm font-medium">
                            Programado: {timeStats.scheduledDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {order.scheduledTime || '09:00'}
                        </p>
                    </div>
                </div>

                {/* 2. BODY: INFO & ACTIONS */}
                <div className="flex-1 p-6 relative -mt-6">
                    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                        
                        {/* Summary Grid */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shrink-0">
                                    <span className="material-icons">store</span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Proveedor</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{supplier.companyName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center shrink-0">
                                    <span className="material-icons">receipt_long</span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight font-mono">${order.total.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-800 w-full mb-6"></div>

                        {/* Dynamic Action Area */}
                        {isRescheduling ? (
                            <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2">
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Nueva Fecha de Envío</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="date" 
                                        value={newDate} 
                                        onChange={(e) => setNewDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="flex-1 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button 
                                        onClick={saveReschedule}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-indigo-700 transition-colors"
                                    >
                                        Guardar
                                    </button>
                                    <button 
                                        onClick={() => setIsRescheduling(false)}
                                        className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg font-bold text-xs hover:bg-gray-300 transition-colors"
                                    >
                                        <span className="material-icons text-sm">close</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleSendNow}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                                >
                                    <span className="material-icons text-sm">send</span> Enviar Ahora (Manual)
                                </button>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setIsRescheduling(true)}
                                        className="py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons text-sm">edit_calendar</span> Reprogramar
                                    </button>
                                    <button 
                                        onClick={handleEditDraft}
                                        className="py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons text-sm">edit</span> Editar Contenido
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <button onClick={handleCancel} className="text-[10px] font-bold text-red-400 hover:text-red-600 hover:underline transition-colors">
                                Cancelar Programación
                            </button>
                        </div>
                    </div>
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-1 rounded-full backdrop-blur-md">
                    <span className="material-icons">close</span>
                </button>
            </div>
        </div>
    );
};