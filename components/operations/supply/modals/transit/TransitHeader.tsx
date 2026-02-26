
import React from 'react';
import { Order, Supplier } from '../../../../../context/DataContext';

interface TransitHeaderProps {
    order: Order;
    supplier: Supplier;
    isPickup: boolean;
    onClose: () => void;
    onAction: (action: 'report' | 'manifest') => void;
    onOpenReception: () => void; 
}

export const TransitHeader: React.FC<TransitHeaderProps> = ({ order, supplier, isPickup, onClose, onAction, onOpenReception }) => {
    return (
        <div className="bg-white dark:bg-black/20 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex flex-col lg:flex-row px-7 py-5 gap-3 items-center">
                
                {/* Left Side: Aligns with Hero Column (58%) */}
                <div className="w-full lg:w-[58%] flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-sm bg-orange-50 border-orange-100 text-orange-600`}>
                        <span className="material-icons text-2xl">{isPickup ? 'storefront' : 'local_shipping'}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-0.5">
                            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Orden {order.idDisplay}</h2>
                            <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-orange-100 text-orange-700 border-orange-200`}>
                                {isPickup ? 'Listo para Recoger' : 'En Tránsito'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className="material-icons text-xs opacity-70">business</span> {supplier.companyName}
                        </p>
                    </div>
                </div>
                
                {/* Right Side: Aligns with Side Column (42%) */}
                <div className="w-full lg:w-[42%] flex items-center justify-between lg:justify-end gap-3 pl-1">
                    
                    <button 
                        onClick={onOpenReception}
                        className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 transform hover:-translate-y-0.5"
                    >
                        <span className="material-icons text-sm">inventory_2</span>
                        Registrar Recepción
                    </button>

                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden lg:block"></div>

                    <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors shrink-0">
                        <span className="material-icons text-lg">close</span>
                    </button>
                </div>

            </div>
        </div>
    );
};
