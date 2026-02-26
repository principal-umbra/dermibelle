
import React, { useState, useMemo } from 'react';
import { Order, useData } from '../../../../../context/DataContext';

interface TransitItemsListProps {
    order: Order;
    onBack: () => void;
}

export const TransitItemsList: React.FC<TransitItemsListProps> = ({ order, onBack }) => {
    const { catalog } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'title', direction: 'asc' });

    // 1. Enriquecer y Calcular Datos
    const items = useMemo(() => {
        if (!order.lines) return [];
        return order.lines.map(line => {
            const product = catalog.find(p => p.id === line.itemId);
            const currentStock = product?.stock || 0;
            const incomingQty = line.qty;
            const projectedStock = currentStock + incomingQty;
            const lineTotal = line.price * line.qty;
            
            // Detección de Tags Especiales (Simulada por keywords)
            const tags = [];
            const titleLower = line.title.toLowerCase();
            if (titleLower.includes('serum') || titleLower.includes('toxina')) tags.push({ label: 'Fragile', color: 'text-amber-600 bg-amber-50 border-amber-100' });
            if (titleLower.includes('quimico') || titleLower.includes('acid')) tags.push({ label: 'HazMat', color: 'text-purple-600 bg-purple-50 border-purple-100' });

            return {
                ...line,
                sku: product?.sku || '---',
                category: product?.category || 'General',
                currentStock,
                projectedStock,
                lineTotal,
                tags
            };
        });
    }, [order.lines, catalog]);

    // 2. Filtrar y Ordenar
    const processedItems = useMemo(() => {
        let data = [...items];

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(i => 
                i.title.toLowerCase().includes(lower) || 
                i.sku.toLowerCase().includes(lower)
            );
        }

        data.sort((a, b) => {
            // @ts-ignore
            const aValue = a[sortConfig.key];
            // @ts-ignore
            const bValue = b[sortConfig.key];
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [items, searchTerm, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-right-4">
            {/* Header: Controls & Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={onBack}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <span className="material-icons text-sm">arrow_back</span>
                    </button>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Manifiesto de Carga</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-mono">Ref: {order.idDisplay}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>{items.length} SKUs</span>
                        </div>
                    </div>
                </div>

                <div className="relative w-full sm:max-w-xs group">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors text-lg">search</span>
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por SKU o nombre..." 
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Smart Table Container */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col flex-1 min-h-0 shadow-sm relative">
                
                {/* Table Header */}
                <div className="bg-gray-50 dark:bg-black/10 border-b border-gray-100 dark:border-gray-700 p-3 shrink-0 grid grid-cols-12 gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                    <div className="col-span-2 cursor-pointer hover:text-indigo-500 flex items-center gap-1" onClick={() => handleSort('sku')}>
                        SKU {sortConfig.key === 'sku' && <span className="material-icons text-[10px]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                    </div>
                    <div className="col-span-4 cursor-pointer hover:text-indigo-500 flex items-center gap-1" onClick={() => handleSort('title')}>
                        Producto {sortConfig.key === 'title' && <span className="material-icons text-[10px]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                    </div>
                    <div className="col-span-2 hidden md:block">Categoría</div>
                    <div className="col-span-2 text-center cursor-pointer hover:text-indigo-500" onClick={() => handleSort('currentStock')}>
                        Proyección Stock
                    </div>
                    <div className="col-span-1 text-center cursor-pointer hover:text-indigo-500" onClick={() => handleSort('qty')}>
                        Cant.
                    </div>
                    <div className="col-span-1 text-right cursor-pointer hover:text-indigo-500" onClick={() => handleSort('lineTotal')}>
                        Total
                    </div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white dark:bg-surface-dark">
                    {processedItems.length > 0 ? (
                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            {processedItems.map((line, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                    
                                    {/* SKU */}
                                    <div className="col-span-2">
                                        <span className="font-mono text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 truncate block w-fit">
                                            {line.sku}
                                        </span>
                                    </div>

                                    {/* Name & Tags */}
                                    <div className="col-span-4 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate" title={line.title}>
                                            {line.title}
                                        </p>
                                        {line.tags.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {line.tags.map((tag, i) => (
                                                    <span key={i} className={`text-[8px] px-1.5 rounded border uppercase font-bold ${tag.color}`}>
                                                        {tag.label}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div className="col-span-2 hidden md:block">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                                            {line.category}
                                        </span>
                                    </div>

                                    {/* Smart Stock Projection */}
                                    <div className="col-span-2 text-center">
                                        <div className="flex items-center justify-center gap-1 bg-gray-50 dark:bg-black/20 rounded-lg py-1 border border-gray-100 dark:border-gray-800 w-fit mx-auto px-2">
                                            <span className="text-xs text-gray-400 font-medium">{line.currentStock}</span>
                                            <span className="material-icons text-[10px] text-green-500">arrow_forward</span>
                                            <span className="text-xs font-bold text-green-600 dark:text-green-400">{line.projectedStock}</span>
                                        </div>
                                    </div>

                                    {/* Qty */}
                                    <div className="col-span-1 flex justify-center">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800">
                                            {line.qty}
                                        </span>
                                    </div>

                                    {/* Total */}
                                    <div className="col-span-1 text-right">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                            ${line.lineTotal.toFixed(0)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 italic">
                            <span className="material-icons text-4xl mb-2 opacity-20">search_off</span>
                            <p>No se encontraron items.</p>
                        </div>
                    )}
                </div>

                {/* Footer Totals */}
                <div className="bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shrink-0">
                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
                        <span className="material-icons text-sm">print</span> Imprimir Manifiesto
                    </button>
                    
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className="block text-[9px] font-bold text-gray-400 uppercase">Volumen</span>
                            <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                {items.reduce((acc, l) => acc + l.qty, 0)} unids.
                            </span>
                        </div>
                        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                        <div className="text-right">
                            <span className="block text-[9px] font-bold text-gray-400 uppercase">Valor Declarado</span>
                            <span className="block text-xl font-display font-bold text-gray-900 dark:text-white">
                                ${order.total.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default TransitItemsList;
