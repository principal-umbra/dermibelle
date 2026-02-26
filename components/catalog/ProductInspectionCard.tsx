import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AppointmentItem } from '../../types';

interface ProductInspectionCardProps {
    item: AppointmentItem;
    anchorEl: HTMLElement | null;
    isOpen: boolean;
}

const ProductInspectionCard: React.FC<ProductInspectionCardProps> = ({ item, anchorEl, isOpen }) => {
    const [position, setPosition] = useState<{ top: number, left: number, align: 'left' | 'right' }>({ top: 0, left: 0, align: 'left' });
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && anchorEl && cardRef.current) {
            const rect = anchorEl.getBoundingClientRect();
            const cardRect = cardRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let top = rect.bottom + 10;
            let left = rect.left;
            let align: 'left' | 'right' = 'left';

            // Vertical adjustment
            if (top + cardRect.height > viewportHeight) {
                top = rect.top - cardRect.height - 10;
            }

            // Horizontal adjustment
            if (left + cardRect.width > viewportWidth - 20) {
                left = rect.right - cardRect.width;
                align = 'right';
            }

            // Ensure it doesn't go off-screen left
            if (left < 20) left = 20;

            setPosition({ top, left, align });
        }
    }, [isOpen, anchorEl]);

    if (!isOpen || !anchorEl) return null;

    // --- DATA PREPARATION ---
    const info = item.packageInfo || {};
    const isPack = (info.unitsPerPackage || 1) > 1;
    const unitCost = item.cost || 0;
    const price = item.price || 0;
    const margin = unitCost > 0 ? ((price - unitCost) / unitCost) * 100 : 0;
    
    // Stock Distribution
    const totalStock = item.stock || 0;
    const retailRatio = item.stockConfig?.retailRatio || 0.5;
    const isMix = item.subtype === 'both';
    const retailStock = item.subtype === 'retail' ? totalStock : (isMix ? Math.floor(totalStock * retailRatio) : 0);
    const internalStock = totalStock - retailStock;

    // KPIs
    const totalInvestment = totalStock * unitCost;
    const projectedSales = retailStock * price;

    return createPortal(
        <div 
            ref={cardRef}
            style={{ 
                top: position.top, 
                left: position.left,
                position: 'fixed',
                zIndex: 9999
            }}
            className="w-[800px] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
        >
            {/* Header */}
            <div className="bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="material-icons text-gray-400 text-sm">info</span>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Resumen Rápido</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span className="font-mono font-bold bg-gray-200 dark:bg-white/10 px-1.5 rounded text-gray-600 dark:text-gray-300">{item.sku || 'SIN SKU'}</span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{item.supplierId ? 'Proveedor Asignado' : 'Sin Proveedor'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.subtype === 'retail' ? 'bg-orange-100 text-orange-700' : item.subtype === 'consumable' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {item.subtype === 'retail' ? 'Solo Venta' : item.subtype === 'consumable' ? 'Solo Consumo' : 'Mixto'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700">
                
                {/* COL 1: DEFINICIÓN (BLUE) */}
                <div className="p-4 bg-blue-50/30 dark:bg-blue-900/5 flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="material-icons text-[12px]">shopping_bag</span> Definición
                    </h4>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-medium">Formato Compra:</span>
                            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{isPack ? 'Caja / Pack' : 'Por Unidad'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-medium">Empaque:</span>
                            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{info.purchaseUnit || 'Unidad'}</span>
                        </div>
                        {isPack && (
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-500 font-medium">Contenido Pack:</span>
                                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{info.unitsPerPackage} unids.</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-blue-100 dark:border-blue-800/30">
                            <span className="text-[10px] text-gray-500 font-bold">Costo Adquisición:</span>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">${(item.packageCost || item.cost || 0).toFixed(2)}</span>
                        </div>
                        {isPack && (
                            <div className="text-[9px] text-gray-400 text-right">
                                (Costo Unitario: <span className="font-bold text-gray-600">${unitCost.toFixed(2)}</span>)
                            </div>
                        )}
                    </div>
                </div>

                {/* COL 2: INVENTARIO (PURPLE) */}
                <div className="p-4 bg-purple-50/30 dark:bg-purple-900/5 flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="material-icons text-[12px]">inventory_2</span> Inventario
                    </h4>

                    <div className="flex gap-3 mb-1">
                        <div className="flex-1 bg-white dark:bg-black/20 rounded-lg p-2 border border-purple-100 dark:border-purple-800/30 text-center">
                            <span className="block text-[9px] text-gray-400 uppercase font-bold">Stock Físico</span>
                            <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{totalStock}</span>
                        </div>
                        <div className="flex-1 bg-white dark:bg-black/20 rounded-lg p-2 border border-purple-100 dark:border-purple-800/30 text-center">
                            <span className="block text-[9px] text-gray-400 uppercase font-bold">Alerta Mín.</span>
                            <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{item.minStock || 0}</span>
                        </div>
                    </div>

                    {info.requiresBatch && (
                        <div className="flex justify-between items-center bg-white dark:bg-black/20 px-2 py-1 rounded border border-purple-100 dark:border-purple-800/30">
                            <span className="text-[9px] text-gray-500 font-bold">Lote Activo:</span>
                            <span className="text-[9px] font-mono text-purple-700 dark:text-purple-400">{info.currentBatch || 'N/A'}</span>
                        </div>
                    )}

                    {isMix && (
                        <div className="bg-white dark:bg-black/20 rounded-lg p-2 border border-purple-100 dark:border-purple-800/30 mt-1">
                            <div className="flex h-1.5 rounded-full overflow-hidden mb-1">
                                <div style={{ width: `${(1-retailRatio)*100}%` }} className="bg-purple-400"></div>
                                <div style={{ width: `${retailRatio*100}%` }} className="bg-orange-400"></div>
                            </div>
                            <div className="flex justify-between text-[8px] font-bold uppercase">
                                <span className="text-purple-600">Uso: {internalStock}</span>
                                <span className="text-orange-600">Venta: {retailStock}</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="text-[9px] text-gray-500 mt-auto pt-2 border-t border-purple-100 dark:border-purple-800/30">
                        <span className="font-bold text-purple-700">Modo:</span> {info.usageType === 'bulk' ? `Granel (${info.contentPerUnit} ${info.consumptionUnit})` : 'Por Pieza (Unidad)'}
                    </div>
                </div>

                {/* COL 3: PRECIOS (GREEN) */}
                <div className="p-4 bg-green-50/30 dark:bg-green-900/5 flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="material-icons text-[12px]">monetization_on</span> Finanzas
                    </h4>

                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="block text-[9px] text-gray-400 uppercase font-bold">Precio Venta</span>
                            <span className="text-xl font-bold text-green-600 dark:text-green-400">${price.toFixed(2)}</span>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded-lg text-center">
                            <span className="block text-[8px] text-green-700 dark:text-green-300 uppercase font-bold">Margen</span>
                            <span className="text-xs font-bold text-green-800 dark:text-green-200">{Math.round(margin)}%</span>
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-green-100 dark:border-green-800/30">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] text-gray-500 font-medium">Inversión Total:</span>
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">${totalInvestment.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] text-gray-500 font-medium">Venta Proyectada:</span>
                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400">${projectedSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] text-gray-500 font-medium">Pto. Equilibrio:</span>
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{price > 0 ? Math.ceil(totalInvestment / price) : 0} unids.</span>
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Arrow Pointer (Visual only) */}
            <div 
                style={{ 
                    position: 'absolute',
                    top: position.align === 'left' ? 20 : 'auto',
                    bottom: position.align === 'left' ? 'auto' : 20,
                    left: -6,
                    width: 12,
                    height: 12,
                    transform: 'rotate(45deg)',
                    backgroundColor: 'white',
                    borderLeft: '1px solid #e5e7eb',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'none' // Hidden for now as positioning logic is complex
                }}
            ></div>
        </div>,
        document.body
    );
};

export default ProductInspectionCard;
