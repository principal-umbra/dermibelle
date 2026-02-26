import React from 'react';
import { Supplier } from '../../context/DataContext';

interface PortalHeroProps {
    date: string;
    total: number;
    supplier: Supplier;
    notes?: string;
}

const PortalHero: React.FC<PortalHeroProps> = ({ date, total, supplier, notes }) => {
    return (
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Solicitud de Pedido</h2>
                    <p className="text-sm text-gray-400">Fecha de Emisión: {new Date(date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Estimado</p>
                    <p className="text-3xl font-display font-bold text-primary">${total.toFixed(2)}</p>
                </div>
            </div>
            
            <div className="pt-6 border-t border-gray-700 relative z-10 flex flex-col lg:flex-row gap-6 flex-1">
                
                <div className="flex flex-col gap-6 shrink-0 lg:w-[240px] xl:w-[280px]">
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Facturar A (Cliente)</h4>
                        <div className="text-sm text-gray-300 space-y-0.5">
                            <p className="font-bold text-white">Dermibelle Studio LLC</p>
                            <p>123 Beauty Lane</p>
                            <p>Port Charlotte, FL 33952</p>
                            <p className="text-blue-400">billing@dermibelle.com</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Proveedor (Vendedor)</h4>
                        <div className="text-sm text-gray-300 space-y-0.5">
                            <p className="font-bold text-white">{supplier.companyName}</p>
                            <p>{supplier.address || 'Dirección no registrada'}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                <span className="material-icons text-[10px]">person</span> {supplier.contactPerson}
                            </div>
                            <p className="text-blue-400">{supplier.email}</p>
                            <p className="text-xs text-gray-500">{supplier.phone}</p>
                        </div>
                    </div>
                </div>

                <div className="lg:border-l lg:border-gray-700 lg:pl-6 flex flex-col flex-1 min-w-0">
                     <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Notas de la Orden</h4>
                     <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 flex-1 max-h-[180px] overflow-y-auto custom-scrollbar shadow-inner">
                        <div className="flex items-start gap-3">
                             <span className="material-icons text-gray-500 text-sm mt-0.5 shrink-0">sticky_note_2</span>
                             <p className="text-sm text-gray-300 italic leading-relaxed whitespace-pre-line w-full">
                                {notes || 'Sin instrucciones adicionales para esta orden.'}
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortalHero;