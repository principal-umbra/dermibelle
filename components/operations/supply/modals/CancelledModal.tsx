
import React from 'react';
import { OrderModalProps } from './OrderModalTypes';

export const CancelledModal: React.FC<OrderModalProps> = ({ onClose, onUpdateStatus, addToast }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
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
