
import React, { useState, useEffect, useMemo } from 'react';
import { OpenStockItem, StockLog, AppointmentItem } from '../../../types';
import { useData } from '../../../context/DataContext';
import AuditView from './open_product/AuditView';
import ReasonSelector from './open_product/ReasonSelector';
import AnalysisView from './open_product/AnalysisView';

interface OpenProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: OpenStockItem | null;
    onUpdate: (id: string, newVal: number) => void;
    onDiscard: (id: string) => void;
}

type DiscardReason = 'finished' | 'expired' | 'damaged' | 'quality';
type YieldRating = 'low' | 'expected' | 'high';
type DiscardScope = 'single' | 'batch';

const OpenProductDetailModal: React.FC<OpenProductDetailModalProps> = ({ isOpen, onClose, item, onUpdate, onDiscard }) => {
    const { catalog, updateCatalogItem, addCatalogItem, addToast, addStockLog } = useData(); 
    
    // Audit Adjustment State
    const [adjustedValue, setAdjustedValue] = useState<number>(0);
    const [isDirty, setIsDirty] = useState(false);

    // Discard Flow State
    const [viewMode, setViewMode] = useState<'audit' | 'reason' | 'analysis'>('audit');
    const [reason, setReason] = useState<DiscardReason | null>(null);
    const [yieldRating, setYieldRating] = useState<YieldRating>('expected');

    useEffect(() => {
        if (isOpen && item) {
            setAdjustedValue(item.remaining);
            setIsDirty(false);
            setViewMode('audit');
            setReason(null);
            setYieldRating('expected');
        }
    }, [isOpen, item]);

    // --- SMART LOGIC ---
    const parentProduct = useMemo(() => {
        if (!item) return null;
        return catalog.find(p => p.id === item.productId);
    }, [catalog, item]);

    const inventoryInsights = useMemo(() => {
        if (!parentProduct) return null;

        // 1. Expiration Logic
        const expiryDateStr = parentProduct.packageInfo?.expiryDate;
        let expiryStatus = { days: 999, label: 'No configurado', color: 'bg-gray-50 text-gray-500 border-gray-100', icon: 'event_busy' };
        
        if (expiryDateStr) {
            const exp = new Date(expiryDateStr);
            const now = new Date();
            const diffTime = exp.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                expiryStatus = { days: diffDays, label: 'Vencido', color: 'bg-red-50 text-red-800 border-red-200', icon: 'error' };
            } else if (diffDays < 30) {
                expiryStatus = { days: diffDays, label: 'Expira pronto', color: 'bg-orange-50 text-orange-800 border-orange-200', icon: 'warning' };
            } else {
                expiryStatus = { days: diffDays, label: 'Vigente', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: 'verified_user' };
            }
        }

        // 2. Warehouse Stock Logic
        const stock = parentProduct.stock || 0;
        const min = parentProduct.minStock || 0;
        let stockStatus = { label: 'Stock Saludable', color: 'bg-blue-50 text-blue-800 border-blue-200', icon: 'inventory_2', action: '' };

        if (stock === 0) {
            stockStatus = { label: 'Sin Repuestos', color: 'bg-red-50 text-red-800 border-red-200', icon: 'production_quantity_limits', action: 'Urgente' };
        } else if (stock <= min) {
            stockStatus = { label: 'Stock Bajo', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: 'shopping_cart', action: 'Reordenar' };
        }

        return { expiryStatus, stockStatus, stock, expiryDateStr };
    }, [parentProduct]);

    if (!isOpen || !item) return null;

    const handleSaveAdjustment = () => {
        if (adjustedValue !== item.remaining) {
            // Log adjustment
            const diff = adjustedValue - item.remaining;
            addStockLog({
                date: new Date().toISOString(),
                itemId: item.productId,
                itemName: item.productName,
                action: 'Adjustment',
                reasonCategory: 'manual_correction',
                quantityChange: diff, // Relative to usage unit, technically mostly 0 cost impact unless big
                unit: item.unit,
                costImpact: 0, // Simplified for manual tweaks
                notes: 'Ajuste manual de auditoría de producto abierto'
            });
        }
        onUpdate(item.id, adjustedValue);
        onClose();
    };

    const handleUpdateExpiry = (newDate: string) => {
        if (parentProduct) {
            updateCatalogItem(parentProduct.id, {
                packageInfo: {
                    ...parentProduct.packageInfo,
                    expiryDate: newDate
                } as any
            });
            addToast('success', 'Fecha de vencimiento actualizada correctamente.');
            onClose(); // Close modal to refresh state if needed
        }
    };

    const handleConfirmDiscard = (scope: DiscardScope = 'single', identifierNote?: string) => {
        // --- 1. RECORD LOG FOR PREDICTIVE SYSTEMS ---
        if (parentProduct) {
            let lostQuantity = 0;
            let lostValue = 0;
            const unitCost = parentProduct.cost || 0; // Purchase unit cost
            const packSize = parentProduct.packageInfo?.contentPerUnit || 1; // Content size per purchase unit

            // Calculate loss based on scope
            if (scope === 'single') {
                // Remaining amount in open container
                lostQuantity = item.remaining; // e.g. 500g
                // Value: (remaining / total_capacity) * unit_cost
                const ratio = item.remaining / item.total;
                lostValue = unitCost * ratio;
            } else {
                // Batch: Remaining open + All full units in stock
                const warehouseStock = parentProduct.stock || 0;
                // Total quantity in consumption units (e.g. grams)
                lostQuantity = item.remaining + (warehouseStock * packSize);
                // Value: Open value + (Full units * unit cost)
                const openRatio = item.remaining / item.total;
                lostValue = (unitCost * openRatio) + (warehouseStock * unitCost);
            }

            // Map reason to Log Type
            const reasonMap: Record<string, StockLog['reasonCategory']> = {
                'finished': 'finished',
                'expired': 'expired',
                'damaged': 'damaged',
                'quality': 'quality'
            };

            addStockLog({
                date: new Date().toISOString(),
                itemId: parentProduct.id,
                itemName: parentProduct.title,
                action: 'Discard',
                reasonCategory: reasonMap[reason || 'finished'] || 'manual_correction',
                quantityChange: -lostQuantity, // Negative because it's a loss
                unit: item.unit,
                costImpact: -lostValue,
                notes: identifierNote || (scope === 'batch' ? 'Descarte de Lote Completo' : 'Descarte Unidad Individual'),
                batchId: parentProduct.packageInfo?.currentBatch
            });
        }

        // --- 2. EXECUTE DISCARD LOGIC ---
        
        // Always remove from Open Stock List (The currently open item is gone)
        onDiscard(item.id);

        if (scope === 'batch' && parentProduct) {
            // LOTE COMPLETO: 
            // 1. Calculamos el stock total perdido (La abierta + las cerradas en bodega)
            const warehouseStock = parentProduct.stock || 0;
            const totalDiscardedCount = warehouseStock + 1;

            // 2. Creamos un REGISTRO HISTÓRICO en el catálogo (Copia congelada) para la pestaña Vencidos/Dañados
            // Esto asegura que en el historial veas "10 unidades perdidas" y no "0"
            const qualityStatus = reason === 'expired' ? 'expired' : 'damaged';
            const batchId = parentProduct.packageInfo?.currentBatch || 'LOTE-GEN';
            
            const damagedBatchRecord: Partial<AppointmentItem> = {
                title: `${parentProduct.title} (Lote Completo)`,
                type: 'product',
                subtype: 'consumable',
                category: parentProduct.category,
                price: 0,
                cost: parentProduct.cost,
                sku: `${parentProduct.sku}-${batchId}-LOSS`,
                stock: totalDiscardedCount, // AQUÍ GUARDAMOS EL TOTAL PERDIDO (Ej: 10)
                minStock: 0,
                supplierId: parentProduct.supplierId,
                packageInfo: { ...parentProduct.packageInfo },
                qualityStatus: qualityStatus, // Esto lo manda a la pestaña Vencidos/Dañados
                description: `Baja masiva por ${reason}. Incluye ${warehouseStock} en bodega + 1 abierta. Fecha: ${new Date().toLocaleDateString()}`
            };

            addCatalogItem(damagedBatchRecord);

            // 3. Reseteamos el stock del producto ORIGINAL a 0 (Para que el sistema sepa que hay que comprar)
            // NO le cambiamos el qualityStatus para que no desaparezca del inventario operativo, solo se queda sin stock.
            updateCatalogItem(parentProduct.id, { 
                stock: 0 
            });
            
            const msgReason = reason === 'expired' ? 'vencido' : 'dañado/baja';
            addToast('info', `Lote completo (${totalDiscardedCount} u.) registrado en historial de pérdidas. Stock actual en 0.`);
        } 
        else if (scope === 'single' && parentProduct && (reason === 'damaged' || reason === 'expired' || reason === 'quality')) {
            // UNIDAD ÚNICA: Crea un registro independiente en el catálogo para esta unidad dañada
            
            const qualityStatus = reason === 'expired' ? 'expired' : 'damaged';
            const suffix = identifierNote ? `(${identifierNote})` : '(Unid. Dañada)';
            
            const damagedUnit: Partial<AppointmentItem> = {
                title: `${parentProduct.title} ${suffix}`,
                type: 'product',
                subtype: 'consumable', // Generalmente no se venden dañados
                category: parentProduct.category,
                price: 0, // Valor comercial nulo
                cost: parentProduct.cost, // Mantiene el costo para reportes de pérdida
                sku: identifierNote || `${parentProduct.sku}-DMG-${Date.now().toString().slice(-4)}`,
                stock: 1, // Es 1 sola unidad la que se descarta
                minStock: 0,
                supplierId: parentProduct.supplierId,
                packageInfo: { ...parentProduct.packageInfo },
                qualityStatus: qualityStatus, // Esto lo manda a la pestaña Vencidos/Dañados
                description: `Registro automático de baja individual desde cabina. Motivo: ${reason}. ID Original: ${parentProduct.id}.`
            };

            addCatalogItem(damagedUnit);
            addToast('info', `Unidad individual registrada en Vencidos/Dañados: ${identifierNote || 'Sin ID'}`);
        } 
        else {
            // Terminado normal (Happy Path)
            const extraMsg = identifierNote ? ` (ID: ${identifierNote})` : '';
            addToast('info', `Unidad cerrada/consumida correctamente${extraMsg}.`);
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/20" onClick={e => e.stopPropagation()}>
                
                {/* HEADER */}
                <div className="relative bg-gradient-to-r from-slate-800 to-gray-900 p-6 pb-8 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                         <div className="flex gap-2">
                             <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider border border-white/10">En Uso</span>
                             <span className="px-2 py-0.5 bg-black/30 rounded text-[10px] font-mono opacity-80">{item.id.split('-')[1]}</span>
                         </div>
                         <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><span className="material-icons text-sm">close</span></button>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm border border-white/10">
                            <span className="material-icons">science</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-display font-bold leading-tight">{item.productName}</h1>
                            <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                                <span className="material-icons text-[10px]">calendar_today</span> Abierto: {item.openedDate}
                            </p>
                        </div>
                    </div>
                </div>

                {/* BODY */}
                <div className="p-6 -mt-4 bg-white dark:bg-surface-dark rounded-t-[1.5rem] relative z-20">
                    {viewMode === 'audit' && (
                        <AuditView 
                            item={item}
                            inventoryInsights={inventoryInsights}
                            adjustedValue={adjustedValue}
                            setAdjustedValue={setAdjustedValue}
                            isDirty={isDirty}
                            setIsDirty={setIsDirty}
                            onSaveAdjustment={handleSaveAdjustment}
                            onDiscardRequest={() => setViewMode('reason')}
                        />
                    )}

                    {viewMode === 'reason' && (
                        <ReasonSelector 
                            onSelectReason={(r) => { setReason(r); setViewMode('analysis'); }}
                            onCancel={() => setViewMode('audit')}
                            hasExpiryDate={!!inventoryInsights?.expiryDateStr}
                        />
                    )}

                    {viewMode === 'analysis' && (
                        <AnalysisView 
                            reason={reason}
                            item={item}
                            inventoryInsights={inventoryInsights}
                            yieldRating={yieldRating}
                            setYieldRating={setYieldRating}
                            onConfirm={handleConfirmDiscard}
                            onUpdateDate={handleUpdateExpiry}
                            onBack={() => setViewMode('reason')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default OpenProductDetailModal;
