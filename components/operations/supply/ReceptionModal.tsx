
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import CatalogProductConfig from '../../catalog/modal/CatalogProductConfig';
import { AppointmentItem } from '../../../types';

interface ReceptionModalProps {
    orderId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onReceiveLine: (orderId: string, lineItemId: string | number, qty: number, tracking?: { batch?: string; expiry?: string }) => Promise<string | void>;
    onReceiveBatch?: (orderId: string, items: { lineItemId: string | number, qty: number }[]) => Promise<string | void>;
    orders: any[];
}

import ProductInspectionCard from '../../catalog/ProductInspectionCard';

// --- ITEM CARD COMPONENT (REFACTORED) ---
const ReceptionLineItem: React.FC<{ 
    line: any; 
    catalogItem: any;
    globalSettings: any;
    onReceive: (qty: number) => void; 
    onEdit: () => void;
}> = ({ line, catalogItem, globalSettings, onReceive, onEdit }) => {
    
    // Logic: Status
    const pending = line.qty - (line.receivedQty || 0);
    const isCompleted = pending <= 0;
    
    // State
    const [val, setVal] = useState<string>(String(Math.max(0, pending)));
    const [hoverAnchor, setHoverAnchor] = useState<HTMLElement | null>(null);
    const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Update input default when pending changes
    useEffect(() => {
        setVal(String(Math.max(0, pending)));
    }, [pending]);

    const handleReceiveClick = () => {
        const rawVal = parseInt(val);
        if (isNaN(rawVal) || rawVal <= 0) return;
        onReceive(rawVal);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        const target = e.currentTarget;
        hoverTimeoutRef.current = setTimeout(() => {
            setHoverAnchor(target);
        }, 400); // 400ms delay to prevent accidental triggers
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoverAnchor(null);
    };

    // Logic: Distribution (Retail vs Cabin)
    const retailRatio = catalogItem?.stockConfig?.isCustom 
        ? catalogItem.stockConfig.retailRatio 
        : globalSettings.defaultRetailRatio;
    
    const isMixed = catalogItem?.subtype === 'both';
    const isRetail = catalogItem?.subtype === 'retail' || isMixed;

    // Logic: Cost Validation
    const orderCost = line.price || 0;
    const catalogCost = catalogItem?.cost || 0;
    const costDiff = orderCost - catalogCost;
    const hasCostWarning = catalogCost > 0 && Math.abs(costDiff) > 0.01;
    const isCostHigher = costDiff > 0;

    const percentage = Math.min(100, Math.round(((line.receivedQty || 0) / line.qty) * 100));

    return (
        <div className={`relative overflow-hidden rounded-2xl transition-all duration-300 group flex flex-col border h-full
            ${isCompleted 
                ? 'bg-emerald-50/50 border-emerald-100 shadow-none opacity-70' 
                : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50'
            }`}
        >
            <div className="p-4 flex gap-3 items-start flex-1">
                {/* Thumbnail / Icon - Compacto */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors relative shadow-sm
                    ${isCompleted ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-gray-700 text-gray-400'}`}>
                    <span className="material-icons text-lg">{isCompleted ? 'check_circle' : (catalogItem?.type === 'service' ? 'spa' : 'inventory_2')}</span>
                    
                    {/* Badge de Tipo */}
                    {!isCompleted && (
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white dark:border-surface-dark shadow-sm z-10
                            ${isMixed ? 'bg-purple-500' : isRetail ? 'bg-orange-500' : 'bg-blue-500'}`}>
                            {isMixed ? 'M' : isRetail ? 'R' : 'C'}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Title & SKU */}
                    <div className="mb-2">
                        <h4 className={`font-bold text-sm leading-tight mb-1 line-clamp-2 ${isCompleted ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`} title={line.title}>
                            {line.title}
                        </h4>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-slate-800 dark:bg-white px-2.5 py-1 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                                <span className="material-icons text-[10px] text-slate-400 dark:text-slate-500">qr_code_2</span>
                                <span className="font-mono text-xs font-bold text-white dark:text-slate-900 tracking-wider">
                                    {catalogItem?.sku || 'SKU-???'}
                                </span>
                            </div>
                            {/* Cost Check Indicator */}
                            {hasCostWarning && !isCompleted && (
                                <span className={`flex items-center gap-0.5 text-[9px] font-bold px-1 rounded border ${isCostHigher ? 'text-red-600 bg-red-50 border-red-100' : 'text-green-600 bg-green-50 border-green-100'}`}>
                                    <span className="material-icons text-[10px]">{isCostHigher ? 'trending_up' : 'trending_down'}</span>
                                    {isCostHigher ? 'Sube' : 'Baja'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar & Stats */}
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex relative mb-1.5">
                        <div className={`h-full transition-all duration-500 ease-out ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                         <span className={`text-[10px] font-bold uppercase tracking-wide ${isCompleted ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {isCompleted ? 'Completado' : `${pending} Pendientes`}
                         </span>
                         <span className="text-[10px] text-gray-400 font-mono font-medium">{line.receivedQty || 0} / {line.qty}</span>
                    </div>
                </div>
            </div>

            {/* Input & Actions - Compacto */}
            {!isCompleted && (
                <div className="px-4 pb-4 pt-0">
                    <div className="flex gap-2 items-stretch h-9">
                        {/* Config Button (Moved here) */}
                        <button 
                            onClick={onEdit}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-400 transition-colors shrink-0 border border-gray-200 dark:border-gray-700"
                            title="Configurar Producto"
                        >
                            <span className="material-icons text-lg">settings</span>
                        </button>

                        {/* Numeric Input */}
                        <div className="w-16 relative group">
                            <input 
                                type="number" 
                                min="1"
                                value={val}
                                onChange={(e) => setVal(e.target.value)}
                                className="w-full h-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg text-center font-bold text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder-gray-300"
                                placeholder="0"
                            />
                        </div>

                        {/* Action Button */}
                        <button 
                            onClick={handleReceiveClick}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 hover:-translate-y-0.5"
                        >
                            <span className="material-icons text-sm">download</span>
                            Recibir
                        </button>
                    </div>
                </div>
            )}

            {/* INSPECTION CARD PORTAL */}
            {catalogItem && (
                <ProductInspectionCard 
                    item={catalogItem} 
                    anchorEl={hoverAnchor} 
                    isOpen={!!hoverAnchor} 
                />
            )}
        </div>
    );
};

const ReceptionModal: React.FC<ReceptionModalProps> = ({ orderId, isOpen, onClose, onReceiveLine, onReceiveBatch, orders }) => {
    const { catalog, globalInventorySettings, updateCatalogItem, suppliers, addToast } = useData();
    const [localOrder, setLocalOrder] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isReceiving, setIsReceiving] = useState(false);
    const isProcessingRef = React.useRef(false);
    
    // Edit Product State
    const [editingItem, setEditingItem] = useState<Partial<AppointmentItem> | null>(null);

    useEffect(() => {
        if (isOpen && orderId && !isProcessingRef.current) {
            const found = orders.find(o => o.id === orderId);
            if (found) {
                const lines = found.lines || [];
                setLocalOrder({ ...found, lines: JSON.parse(JSON.stringify(lines)) });
            }
        }
    }, [isOpen, orderId, orders]);

    const stats = useMemo(() => {
        if (!localOrder?.lines) return { total: 0, received: 0, percent: 0, pendingLines: 0, valueReceived: 0 };
        const total = localOrder.lines.reduce((acc: number, l: any) => acc + l.qty, 0);
        const received = localOrder.lines.reduce((acc: number, l: any) => acc + (l.receivedQty || 0), 0);
        const valueReceived = localOrder.lines.reduce((acc: number, l: any) => acc + ((l.receivedQty || 0) * l.price), 0);
        const pendingLines = localOrder.lines.filter((l: any) => (l.receivedQty || 0) < l.qty).length;
        const percent = total > 0 ? Math.round((received / total) * 100) : 0;
        return { total, received, percent, pendingLines, valueReceived };
    }, [localOrder]);

    const filteredLines = useMemo(() => {
        if (!localOrder?.lines) return [];
        return localOrder.lines.filter((line: any) => {
            const matchesSearch = line.title.toLowerCase().includes(searchQuery.toLowerCase()) || (line.itemId && line.itemId.toLowerCase().includes(searchQuery.toLowerCase()));
            const isCompleted = (line.receivedQty || 0) >= line.qty;
            const matchesFilter = filter === 'all' || (filter === 'completed' && isCompleted) || (filter === 'pending' && !isCompleted);
            return matchesSearch && matchesFilter;
        });
    }, [localOrder, filter, searchQuery]);

    const handleReceive = async (lineItemId: string, qty: number, tracking?: { batch?: string; expiry?: string }) => {
        if (!localOrder) return;
        
        setLocalOrder((prev: any) => {
            const newLines = prev.lines.map((l: any) => 
                l.itemId === lineItemId ? { ...l, receivedQty: (l.receivedQty || 0) + qty } : l
            );
            return { ...prev, lines: newLines };
        });

        await onReceiveLine(localOrder.id, lineItemId, qty, tracking);
    };

    const handleReceiveAll = async () => {
        if (!localOrder || isReceiving) return;
        
        setIsReceiving(true);
        isProcessingRef.current = true;

        try {
            // Identify pending lines
            const linesToReceive = localOrder.lines.filter((l: any) => (l.qty - (l.receivedQty || 0)) > 0);
            
            if (linesToReceive.length === 0) {
                setIsReceiving(false);
                isProcessingRef.current = false;
                return;
            }

            // Optimistic Update: Mark all as received locally
            setLocalOrder((prev: any) => {
                const newLines = prev.lines.map((l: any) => {
                    const pending = l.qty - (l.receivedQty || 0);
                    return pending > 0 ? { ...l, receivedQty: l.qty } : l;
                });
                return { ...prev, lines: newLines };
            });

            if (onReceiveBatch) {
                // Batch processing
                const itemsToProcess = linesToReceive.map((line: any) => ({
                    lineItemId: line.itemId,
                    qty: line.qty - (line.receivedQty || 0)
                }));
                await onReceiveBatch(localOrder.id, itemsToProcess);
            } else {
                // Fallback to sequential processing
                for (const line of linesToReceive) {
                    const pending = line.qty - (line.receivedQty || 0);
                    if (pending > 0) {
                        await onReceiveLine(localOrder.id, line.itemId, pending);
                    }
                }
            }
            
            addToast('success', 'Orden recibida completamente');

        } catch (error) {
            console.error("Error receiving all:", error);
            addToast('error', 'Hubo un error al procesar algunos items');
            
            // Force sync with source of truth on error
            const found = orders.find(o => o.id === orderId);
            if (found) {
                const lines = found.lines || [];
                setLocalOrder({ ...found, lines: JSON.parse(JSON.stringify(lines)) });
            }
        } finally {
            isProcessingRef.current = false;
            setIsReceiving(false);
        }
    };

    const handleSaveProduct = (item: Partial<AppointmentItem>) => {
        if (item.id) {
            updateCatalogItem(item.id, item);
            addToast('success', 'Producto actualizado correctamente');
            setEditingItem(null);
        }
    };

    if (!isOpen || !localOrder) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-[#F8F9FB] dark:bg-[#0F1115] w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] border border-white/10" onClick={e => e.stopPropagation()}>
                
                {/* HERO HEADER */}
                <div className="bg-slate-900 text-white px-8 py-6 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={onClose}
                                className="mr-2 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white group"
                                title="Regresar"
                            >
                                <span className="material-icons group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                            </button>
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                                <span className="text-2xl font-display font-bold">{Math.round(stats.percent)}%</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-0.5">Recepción de Orden</p>
                                <h2 className="text-2xl font-display font-bold leading-none">{localOrder.idDisplay}</h2>
                                <p className="text-sm text-slate-400 mt-1">{localOrder.clientName}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] text-emerald-400 uppercase font-bold">Valor Recibido</p>
                                <p className="text-xl font-mono font-bold">${stats.valueReceived.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                            </div>
                            <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                            {stats.percent < 100 && (
                                <button 
                                    onClick={handleReceiveAll}
                                    disabled={isReceiving}
                                    className={`bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-900/50 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 ${isReceiving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isReceiving ? (
                                        <>
                                            <span className="material-icons text-sm animate-spin">refresh</span> Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons text-sm">done_all</span> Recibir Todo
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* TOOLBAR */}
                <div className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
                    <div className="relative w-full sm:max-w-xs group">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">qr_code_scanner</span>
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Escanear SKU o buscar..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex bg-gray-100 dark:bg-black/40 p-1 rounded-xl w-full sm:w-auto">
                        {['all', 'pending', 'completed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab as any)}
                                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filter === tab ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                {tab === 'all' ? 'Todos' : tab === 'pending' ? 'Pendientes' : 'Listos'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* GRID CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#F3F4F6] dark:bg-black/20 custom-scrollbar">
                    {filteredLines.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <span className="material-icons text-5xl mb-2">search_off</span>
                            <p className="text-sm font-medium">No se encontraron items.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredLines.map((line: any) => {
                                // Find catalog item for extra data
                                const catItem = catalog.find(i => i.id === line.itemId);
                                return (
                                    <ReceptionLineItem 
                                        key={line.itemId} 
                                        line={line} 
                                        catalogItem={catItem}
                                        globalSettings={globalInventorySettings}
                                        onReceive={(qty) => { handleReceive(line.itemId, qty); }} 
                                        onEdit={() => setEditingItem(catItem)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="bg-white dark:bg-surface-dark px-8 py-5 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0 z-20">
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-2">
                        <span className="material-icons text-sm text-blue-500">info</span>
                        {stats.pendingLines > 0 ? `${stats.pendingLines} items pendientes.` : 'Todo recibido correctamente.'}
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            Guardar Parcial
                        </button>
                        <button 
                            onClick={onClose}
                            className={`px-8 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 ${stats.percent === 100 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-black'}`}
                        >
                            <span className="material-icons text-sm">{stats.percent === 100 ? 'check_circle' : 'save'}</span>
                            {stats.percent === 100 ? 'Finalizar Recepción' : 'Cerrar'}
                        </button>
                    </div>
                </div>

            </div>

            {/* EDIT PRODUCT SIDE PANEL (DRYWALL) */}
            {editingItem && (
                <div className="fixed inset-0 z-[130] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setEditingItem(null)}>
                    <div 
                        className="w-full max-w-2xl h-full bg-[#F8F9FA] dark:bg-surface-dark shadow-2xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black/20 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons text-blue-600">settings</span>
                                Configuración de Producto
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                        
                        {/* Body */}
                        <div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-black/10">
                            <CatalogProductConfig 
                                editingItem={editingItem} 
                                setEditingItem={setEditingItem} 
                                suppliers={suppliers} 
                                lockedSupplierId={localOrder?.supplierId}
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark flex justify-end gap-3 shrink-0">
                            <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold text-xs">Cancelar</button>
                            <button onClick={() => handleSaveProduct(editingItem)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionModal;
