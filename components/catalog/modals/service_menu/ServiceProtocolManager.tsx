
import React from 'react';

interface ServiceProtocolManagerProps {
    protocolSteps: string[];
    addProtocolStep: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    removeProtocolStep: (idx: number) => void;
}

const ServiceProtocolManager: React.FC<ServiceProtocolManagerProps> = ({
    protocolSteps, addProtocolStep, removeProtocolStep
}) => {
    return (
        <div className="bg-white dark:bg-surface-dark p-5 rounded-[1.5rem] border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full overflow-hidden relative">
             
             {/* Header */}
             <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-sm">
                        <span className="material-icons text-xl">format_list_numbered</span>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">Protocolo</h4>
                        <p className="text-[10px] text-gray-500">Pasos para estandarizar el servicio.</p>
                    </div>
                </div>
                <span className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 px-2.5 py-1 rounded-lg font-bold border border-purple-100 dark:border-purple-800">
                    {protocolSteps.length} Pasos
                </span>
            </div>

            <div className="flex flex-col flex-1 min-h-0 bg-gray-50/50 dark:bg-black/10 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                
                {/* List Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {protocolSteps.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <span className="material-icons text-3xl mb-2">playlist_add</span>
                            <p className="text-xs font-medium">Lista vacía. Agrega el primer paso.</p>
                        </div>
                    ) : (
                        protocolSteps.map((step, idx) => (
                            <div key={idx} className="group flex items-start gap-3 p-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:border-purple-300 dark:hover:border-purple-700/50 transition-all animate-in slide-in-from-bottom-2 fade-in">
                                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                    {idx + 1}
                                </span>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug flex-1">{step}</p>
                                <button 
                                    onClick={() => removeProtocolStep(idx)} 
                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 rounded-lg"
                                    title="Eliminar paso"
                                >
                                    <span className="material-icons text-sm">close</span>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area (Sticky Bottom) */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark z-10">
                    <div className="relative group">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors text-lg">add_circle</span>
                        <input 
                            type="text" 
                            placeholder="Escribe un paso y presiona Enter..."
                            onKeyDown={addProtocolStep}
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceProtocolManager;
