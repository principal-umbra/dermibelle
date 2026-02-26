
import React from 'react';
import { Supplier } from '../../../context/DataContext';

interface OrderHeaderProps {
    suppliers: Supplier[];
    selectedSupplierId: string;
    setSelectedSupplierId: (id: string) => void;
    cartLength: number;
    daysCovered: number;
    confidenceScore: number;
    totalOrder: number;
    onClose: () => void;
}

const OrderHeader: React.FC<OrderHeaderProps> = ({
    suppliers,
    selectedSupplierId,
    setSelectedSupplierId,
    cartLength,
    daysCovered,
    confidenceScore,
    totalOrder,
    onClose
}) => {
    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

    const getConfidenceColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
        if (score >= 50) return 'text-amber-500 stroke-amber-500';
        return 'text-red-500 stroke-red-500';
    };

    return (
        <div className="bg-white/90 dark:bg-surface-dark/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center shrink-0 z-20 relative">
            <div className="flex items-center gap-6 w-full max-w-6xl">
                
                {/* Supplier Selector - ENHANCED VISIBILITY */}
                <div className={`flex flex-col w-80 shrink-0 group relative z-50 transition-all duration-300 ${!selectedSupplierId ? 'scale-105' : ''}`}>
                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2 ml-1 transition-colors ${!selectedSupplierId ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                        <span className={`material-icons text-base ${!selectedSupplierId ? 'animate-bounce text-indigo-600' : 'text-gray-400'}`}>storefront</span> 
                        {selectedSupplierId ? 'Proveedor Seleccionado' : '1. Selecciona un Proveedor'}
                    </label>
                    <div className="relative">
                        <select 
                            value={selectedSupplierId}
                            onChange={e => setSelectedSupplierId(e.target.value)}
                            className={`w-full h-12 rounded-2xl pl-4 pr-10 text-sm font-bold outline-none appearance-none cursor-pointer transition-all shadow-sm
                                ${!selectedSupplierId 
                                    ? 'bg-white border-2 border-indigo-500 text-indigo-900 shadow-indigo-500/20 ring-4 ring-indigo-500/10 dark:bg-surface-dark dark:text-white' 
                                    : 'bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-white'}
                            `}
                        >
                            <option value="">-- Elegir de la lista --</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                        </select>
                        <span className={`material-icons absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${!selectedSupplierId ? 'text-indigo-600' : 'text-gray-400'}`}>
                            expand_more
                        </span>
                    </div>
                </div>

                {/* Inventory Impact Pill */}
                {cartLength > 0 && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 animate-in fade-in slide-in-from-left-4">
                        <div className="relative w-8 h-8 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path className="text-indigo-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                <path className="text-indigo-600" strokeDasharray={`${Math.min(100, daysCovered * 2)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            </svg>
                            <span className="absolute text-[9px] font-bold text-indigo-700">{daysCovered}d</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 uppercase leading-none mb-0.5">Cobertura</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Inv. Proyectado</span>
                        </div>
                    </div>
                )}

                {/* Confidence Meter */}
                {selectedSupplier && (
                    <div className="hidden xl:flex items-center gap-3 pl-6 border-l border-gray-100 dark:border-gray-800 h-8">
                        <div className="text-right">
                            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide">Indice Confianza</span>
                            <span className={`block text-lg font-display font-bold leading-none ${getConfidenceColor(confidenceScore).split(' ')[0]}`}>
                                {confidenceScore}%
                            </span>
                        </div>
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="20" cy="20" r="16" strokeWidth="3" fill="transparent" className="text-gray-100 dark:text-gray-800 stroke-current" />
                                <circle cx="20" cy="20" r="16" strokeWidth="3" fill="transparent" strokeDasharray={100} strokeDashoffset={100 - confidenceScore} strokeLinecap="round" className={`transition-all duration-1000 ease-out ${getConfidenceColor(confidenceScore).split(' ')[1]}`} />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Total Estimado</span>
                    <span className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400 tracking-tight leading-none">${totalOrder.toLocaleString()}</span>
                </div>
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 transition-all">
                    <span className="material-icons text-lg">close</span>
                </button>
            </div>
        </div>
    );
};

export default OrderHeader;
