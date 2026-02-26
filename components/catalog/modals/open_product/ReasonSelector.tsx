
import React from 'react';

type DiscardReason = 'finished' | 'expired' | 'damaged' | 'quality';

interface ReasonSelectorProps {
    onSelectReason: (reason: DiscardReason) => void;
    onCancel: () => void;
    hasExpiryDate?: boolean;
}

const ReasonSelector: React.FC<ReasonSelectorProps> = ({ onSelectReason, onCancel, hasExpiryDate = false }) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-center text-sm font-bold text-gray-800 dark:text-white mb-4">
                ¿Por qué cerramos este producto?
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <button 
                    onClick={() => onSelectReason('finished')}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group text-left relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-icons text-4xl text-green-500">check_circle</span>
                    </div>
                    <span className="material-icons text-green-500 mb-2">done_all</span>
                    <p className="font-bold text-gray-800 dark:text-white text-xs">Terminado</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-1">Consumo normal completo.</p>
                </button>

                <button 
                    onClick={() => hasExpiryDate && onSelectReason('expired')}
                    disabled={!hasExpiryDate}
                    className={`p-4 rounded-2xl border transition-all group text-left relative overflow-hidden flex flex-col justify-between
                        ${!hasExpiryDate 
                            ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/5 opacity-50 cursor-not-allowed' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer'
                        }
                    `}
                >
                    <div className={`absolute top-0 right-0 p-2 transition-opacity ${!hasExpiryDate ? 'opacity-5' : 'opacity-10 group-hover:opacity-20'}`}>
                        <span className={`material-icons text-4xl ${!hasExpiryDate ? 'text-gray-300' : 'text-orange-500'}`}>event_busy</span>
                    </div>
                    <span className={`material-icons mb-2 ${!hasExpiryDate ? 'text-gray-300' : 'text-orange-500'}`}>history_toggle_off</span>
                    <div>
                        <p className={`font-bold text-xs ${!hasExpiryDate ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>Vencido</p>
                        <p className="text-[10px] text-gray-500 leading-tight mt-1">
                            {hasExpiryDate ? 'Fecha de expiración alcanzada.' : 'No configurada.'}
                        </p>
                    </div>
                </button>

                <button 
                    onClick={() => onSelectReason('damaged')}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group text-left relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-icons text-4xl text-red-500">broken_image</span>
                    </div>
                    <span className="material-icons text-red-500 mb-2">delete_forever</span>
                    <p className="font-bold text-gray-800 dark:text-white text-xs">Dañado / Accidente</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-1">Rotura, derrame o contaminación.</p>
                </button>

                <button 
                    onClick={() => onSelectReason('quality')}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group text-left relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-icons text-4xl text-purple-500">thumb_down</span>
                    </div>
                    <span className="material-icons text-purple-500 mb-2">feedback</span>
                    <p className="font-bold text-gray-800 dark:text-white text-xs">Mala Calidad</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-1">Defecto de fábrica o rendimiento.</p>
                </button>
            </div>
            <button 
                onClick={onCancel}
                className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
                Cancelar
            </button>
        </div>
    );
};

export default ReasonSelector;
