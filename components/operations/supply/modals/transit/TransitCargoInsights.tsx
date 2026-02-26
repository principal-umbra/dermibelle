
import React, { useMemo } from 'react';
import { Order } from '../../../../../context/DataContext';

export const TransitCargoInsights: React.FC<{ order: Order }> = ({ order }) => {
    
    // Derived Analytics from Order Lines (assuming order.lines exists and is populated)
    const insights = useMemo(() => {
        const lines = order.lines || [];
        const totalItems = lines.reduce((acc, l) => acc + l.qty, 0);
        const totalValue = order.total;
        
        // Mock Categories based on keywords if not available
        let fragileCount = 0;
        let chemicalCount = 0;
        let boxCount = 0; // Estimation

        lines.forEach(l => {
            const title = l.title.toLowerCase();
            if (title.includes('serum') || title.includes('acido') || title.includes('acid')) chemicalCount++;
            if (title.includes('vidrio') || title.includes('ampolla') || title.includes('botella')) fragileCount++;
            boxCount += Math.ceil(l.qty / 12); // Rough estimation: 12 units per box
        });

        // Ensure at least 1 box if there are items
        if (totalItems > 0 && boxCount === 0) boxCount = 1;

        return { totalItems, totalValue, fragileCount, chemicalCount, boxCount };
    }, [order]);

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[1.5rem] p-6 text-white shadow-lg relative overflow-hidden h-full">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                <span className="material-icons text-sm">inventory_2</span> Análisis de Carga
            </h3>

            <div className="grid grid-cols-2 gap-6 relative z-10">
                <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Volumen Est.</span>
                    <p className="text-2xl font-display font-bold">{insights.boxCount} <span className="text-sm font-normal text-slate-500">Cajas</span></p>
                </div>
                <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Valor Asegurado</span>
                    <p className="text-2xl font-display font-bold text-emerald-400">${insights.totalValue.toLocaleString()}</p>
                </div>
            </div>

            <div className="mt-6 space-y-2 relative z-10">
                {insights.fragileCount > 0 && (
                    <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/5">
                        <span className="material-icons text-amber-400 text-sm">broken_image</span>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-white">Carga Frágil Detectada</p>
                            <p className="text-[10px] text-slate-400">{insights.fragileCount} items requieren manejo especial.</p>
                        </div>
                    </div>
                )}
                {insights.chemicalCount > 0 && (
                    <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/5">
                        <span className="material-icons text-purple-400 text-sm">science</span>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-white">Contiene Químicos</p>
                            <p className="text-[10px] text-slate-400">Verificar temperatura de almacenaje.</p>
                        </div>
                    </div>
                )}
                {insights.fragileCount === 0 && insights.chemicalCount === 0 && (
                    <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5 opacity-70">
                        <span className="material-icons text-green-400 text-sm">check_box</span>
                        <p className="text-xs font-bold text-slate-300">Carga Estándar</p>
                    </div>
                )}
            </div>
        </div>
    );
};
