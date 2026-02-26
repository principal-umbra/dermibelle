

import React, { useMemo, useState } from 'react';
import { AppointmentItem, Supplier } from '../../../types';
import { useData } from '../../../context/DataContext';
import ProductOrderHistoryDrawer from './ProductOrderHistoryDrawer';

interface ConsumableProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: AppointmentItem | null;
    onEdit: (item: AppointmentItem) => void;
    suppliers: Supplier[];
}

type DiscardReason = 'damaged' | 'expired' | 'quality' | 'finished';
type DiscardScope = 'single' | 'batch';
type YieldRating = 'low' | 'expected' | 'high';

const ConsumableProductModal: React.FC<ConsumableProductModalProps> = ({ isOpen, onClose, item, onEdit, suppliers }) => {
    const { stockLogs, openStock, updateCatalogItem, addCatalogItem, addStockLog, addToast, orders } = useData();
    const [viewMode, setViewMode] = useState<'dashboard' | 'discard'>('dashboard');
    const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

    // Discard State
    const [discardReason, setDiscardReason] = useState<DiscardReason | null>(null);
    const [discardScope, setDiscardScope] = useState<DiscardScope>('single');
    const [discardNotes, setDiscardNotes] = useState('');
    const [identifier, setIdentifier] = useState('');
    
    // New State for Finished/Yield
    const [yieldRating, setYieldRating] = useState<YieldRating>('expected');

    if (!isOpen || !item) return null;

    const supplier = suppliers.find(s => s.id === item.supplierId);
    
    // --- Lógica de Datos Inteligentes ---
    const stock = item.stock || 0;
    const min = item.minStock || 0;
    const cost = item.cost || 0;
    
    // Calculate financial impact for discard view
    const financialImpact = (discardScope === 'batch' ? stock : 1) * cost;

    const hasExpiryDate = !!item.packageInfo?.expiryDate;
    
    // 1. Datos de Empaquetado
    const pkg = item.packageInfo || { 
        purchaseUnit: 'Unidad', 
        consumptionUnit: 'Unidad', 
        unitsPerPackage: 1, 
        contentPerUnit: 1, 
        usageType: 'whole' 
    };

    // 2. Economía Unitaria
    const totalContentPerPurchase = (pkg.unitsPerPackage || 1) * (pkg.contentPerUnit || 1);
    const costPerConsumptionUnit = totalContentPerPurchase > 0 ? cost / totalContentPerPurchase : 0;

    // 3. Proyecciones
    const mockDailyConsumption = 2.5; 
    const currentTotalUnits = stock * totalContentPerPurchase; 
    const daysRemaining = mockDailyConsumption > 0 ? Math.floor(currentTotalUnits / mockDailyConsumption) : 999;
    
    // 4. Estado Visual
    const isCritical = stock === 0;
    const isLow = stock <= min;
    const statusColor = isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-blue-600';
    const statusText = isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-blue-600';
    const statusBg = isCritical ? 'bg-red-50' : isLow ? 'bg-amber-50' : 'bg-blue-50';

    // 5. Historial
    const history = useMemo(() => {
        return stockLogs
            .filter(log => String(log.itemId) === String(item.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stockLogs, item.id]);

    // 6. Unidades Abiertas
    const activeUnits = useMemo(() => {
        return openStock.filter(os => String(os.productId) === String(item.id));
    }, [openStock, item.id]);

    // --- LOGICA DE BAJA ---
    
    // Verificar Vencimiento
    const getExpiryStatus = () => {
        if (!item.packageInfo?.expiryDate) return 'unknown';
        const exp = new Date(item.packageInfo.expiryDate);
        const now = new Date();
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'expired';
        if (diffDays < 30) return 'warning';
        return 'valid';
    };
    const expiryStatus = getExpiryStatus();

    const handleConfirmDiscard = () => {
        if (!item || !discardReason) return;
        
        // Determinar alcance y cantidad
        const isFinished = discardReason === 'finished';
        const effectiveScope = isFinished ? 'batch' : discardScope;
        const qtyToDiscard = effectiveScope === 'batch' ? stock : 1;

        if (qtyToDiscard > stock) {
            addToast('error', 'La cantidad excede el stock disponible.');
            return;
        }

        const financialImpact = qtyToDiscard * cost;
        const dateStr = new Date().toLocaleDateString('es-ES');

        // 1. CREAR REGISTRO HISTÓRICO (Copia congelada)
        const batchId = item.packageInfo?.currentBatch || 'GEN';
        const suffix = isFinished 
            ? `(Terminado - ${yieldRating})` 
            : effectiveScope === 'single' 
                ? `(Unid. ${identifier || 'Dañada'})` 
                : `(Lote ${discardReason})`;

        const qualityStatus = isFinished ? 'finished' : (discardReason === 'expired' ? 'expired' : 'damaged');

        const archivedItem: Partial<AppointmentItem> = {
            ...item,
            id: undefined, // Create new ID
            title: `${item.title} ${suffix}`,
            stock: qtyToDiscard, 
            sku: `${item.sku}-${batchId}-LOG`,
            qualityStatus: qualityStatus as any,
            description: `Baja Consumible: ${discardNotes || 'Sin notas'}. Motivo: ${discardReason}. Fecha: ${dateStr}.`,
            // Consumables are generally internal, but this ensures it stays in proper context if needed
            subtype: 'consumable'
        };

        addCatalogItem(archivedItem);

        // 2. ACTUALIZAR STOCK ORIGINAL
        const newStock = Math.max(0, stock - qtyToDiscard);
        updateCatalogItem(item.id, { stock: newStock });

        // 3. LOG DE SISTEMA
        const notePrefix = identifier ? `[ID: ${identifier}] ` : '';
        const scopeText = effectiveScope === 'batch' ? 'Lote Completo' : 'Unidad Única';
        
        // Custom notes for 'finished' logic
        let finalNotes = discardNotes;
        if (isFinished) {
            const yieldMap = { low: 'Rendimiento Bajo', expected: 'Rendimiento Estándar', high: 'Rendimiento Alto' };
            finalNotes = `${yieldMap[yieldRating]}. ${discardNotes}`;
        }

        addStockLog({
            itemId: item.id,
            itemName: item.title,
            action: 'Discard',
            reasonCategory: discardReason,
            quantityChange: -qtyToDiscard,
            unit: item.packageInfo?.purchaseUnit || 'Unidad',
            costImpact: -financialImpact,
            notes: `${notePrefix}${scopeText} - ${finalNotes || 'Sin notas'}`,
            date: new Date().toISOString()
        });

        addToast('success', isFinished ? 'Lote terminado archivado.' : `Baja de ${qtyToDiscard} unidades registrada.`);
        
        // Reset
        setDiscardReason(null);
        setDiscardScope('single');
        setDiscardNotes('');
        setIdentifier('');
        setYieldRating('expected');
        setViewMode('dashboard');
    };

    // Helper para renderizar contenido específico según razón
    const renderReasonContent = () => {
        if (!discardReason) return null;

        // --- CASO 1: TERMINADO (NEW) ---
        if (discardReason === 'finished') {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="text-center">
                        <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="material-icons text-2xl">query_stats</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Califica el Rendimiento</h3>
                        <p className="text-xs text-gray-500 mb-4 px-4">
                            ¿El envase duró la cantidad de servicios esperada según el estándar?
                        </p>

                        <div className="grid grid-cols-3 gap-3 mb-2">
                            <button onClick={() => setYieldRating('low')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${yieldRating === 'low' ? 'border-red-400 bg-red-50 text-red-600 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-red-200 text-gray-400'}`}>
                                <span className="material-icons text-2xl">trending_down</span><span className="text-[10px] font-bold">Menos</span>
                            </button>
                            <button onClick={() => setYieldRating('expected')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${yieldRating === 'expected' ? 'border-green-400 bg-green-50 text-green-600 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-green-200 text-gray-400'}`}>
                                <span className="material-icons text-2xl">check</span><span className="text-[10px] font-bold">Exacto</span>
                            </button>
                            <button onClick={() => setYieldRating('high')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${yieldRating === 'high' ? 'border-blue-400 bg-blue-50 text-blue-600 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 text-gray-400'}`}>
                                <span className="material-icons text-2xl">trending_up</span><span className="text-[10px] font-bold">Más</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // --- CASO 2: VENCIMIENTO ---
        if (discardReason === 'expired') {
            return (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                    <div className="text-center mb-2">
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white dark:border-surface-dark shadow-sm ${expiryStatus === 'expired' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            <span className="material-icons text-2xl">{expiryStatus === 'expired' ? 'event_busy' : 'help_outline'}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registro de Vencimiento</h3>
                    </div>

                    {/* Alert Box */}
                    <div className={`p-3 rounded-xl border flex items-start gap-3 ${expiryStatus === 'valid' ? 'bg-blue-50 border-blue-200 text-blue-800' : expiryStatus === 'expired' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                         <div className="mt-0.5"><span className="material-icons text-sm">info</span></div>
                         <div className="flex-1">
                             <p className="text-xs font-bold mb-0.5">
                                 {expiryStatus === 'valid' ? 'Verificación Requerida' : expiryStatus === 'expired' ? 'Producto Vencido' : 'Vence Próximamente'}
                             </p>
                             <p className="text-[11px] opacity-90 leading-snug">
                                 {expiryStatus === 'valid' 
                                    ? 'El sistema indica que este producto aún es vigente. ¿Confirmas el descarte?'
                                    : `Fecha registrada: ${item.packageInfo?.expiryDate ? new Date(item.packageInfo.expiryDate).toLocaleDateString() : 'N/A'}. Se requiere baja.`}
                             </p>
                         </div>
                    </div>
                </div>
            );
        }

        // --- CASO 3: DAÑADO ---
        if (discardReason === 'damaged') {
            return (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                     <div className="text-center mb-2">
                         <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white dark:border-surface-dark shadow-sm bg-red-100 text-red-600">
                            <span className="material-icons text-2xl">broken_image</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reporte de Incidente</h3>
                        <p className="text-xs text-gray-500 px-6">Accidente operativo, rotura o derrame. Se registrará pérdida inmediata.</p>
                    </div>
                </div>
            );
        }

        // --- CASO 4: CALIDAD ---
        if (discardReason === 'quality') {
            return (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                     <div className="text-center mb-2">
                         <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white dark:border-surface-dark shadow-sm bg-purple-100 text-purple-600">
                            <span className="material-icons text-2xl">reviews</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Defecto de Calidad</h3>
                        <p className="text-xs text-gray-500 px-6">Mal estado, olor inusual o defecto de fábrica.</p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-800">
                        <label className="text-[10px] font-bold text-purple-700 uppercase mb-1 block">Observaciones</label>
                        <textarea 
                            value={discardNotes}
                            onChange={(e) => setDiscardNotes(e.target.value)}
                            className="w-full text-xs p-2 bg-white dark:bg-black/20 border border-purple-200 dark:border-purple-700 rounded-lg outline-none resize-none placeholder:text-gray-400"
                            rows={2}
                            placeholder="Ej: Cambio de color, textura grumosa..."
                        />
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                
                {/* 1. HEADER */}
                <div className="bg-white dark:bg-surface-dark p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start shrink-0">
                    <div className="flex items-start gap-5">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg text-white text-3xl ${statusColor}`}>
                            <span className="material-icons">science</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusBg} ${statusText}`}>
                                    {isCritical ? 'Agotado' : isLow ? 'Stock Bajo' : 'En Stock'}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">
                                    {item.sku || 'NO-SKU'}
                                </span>
                            </div>
                            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white leading-tight">
                                {item.title}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                <span className="material-icons text-xs">category</span> {item.category}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { onClose(); onEdit(item); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-xl text-xs font-bold transition-colors">
                            <span className="material-icons text-sm">edit</span> Editar
                        </button>
                        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors">
                            <span className="material-icons text-lg">close</span>
                        </button>
                    </div>
                </div>

                {/* 2. BODY CONTENT */}
                
                {/* A. DISCARD FLOW */}
                {viewMode === 'discard' ? (
                     <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FA] dark:bg-black/20 custom-scrollbar relative animate-in slide-in-from-right-4">
                        <div className="max-w-xl mx-auto">
                            
                            {!discardReason ? (
                                <>
                                    <h3 className="text-center text-base font-bold text-gray-900 dark:text-white mb-8">
                                        ¿Por qué cerramos este producto?
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        {/* Terminado */}
                                        <button 
                                            onClick={() => setDiscardReason('finished')}
                                            className="relative p-5 rounded-2xl border text-left transition-all duration-200 group overflow-hidden bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="material-icons text-3xl text-green-500">check_circle</span>
                                            </div>
                                            <p className="font-bold text-sm mb-1 text-gray-800 dark:text-white">Terminado</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">Consumo normal completo.</p>
                                        </button>

                                        {/* Vencido - Disabled if no expiry date */}
                                        <button 
                                            onClick={() => hasExpiryDate && setDiscardReason('expired')}
                                            disabled={!hasExpiryDate}
                                            className={`relative p-5 rounded-2xl border text-left transition-all duration-200 group overflow-hidden
                                                ${!hasExpiryDate 
                                                    ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
                                                    : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`material-icons text-3xl ${!hasExpiryDate ? 'text-gray-300' : 'text-orange-500'}`}>event_busy</span>
                                            </div>
                                            <p className={`font-bold text-sm mb-1 ${!hasExpiryDate ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>Vencido</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                                                {hasExpiryDate ? 'Fecha de expiración alcanzada.' : 'Sin fecha registrada.'}
                                            </p>
                                        </button>

                                        {/* Dañado */}
                                        <button 
                                            onClick={() => setDiscardReason('damaged')}
                                            className="relative p-5 rounded-2xl border text-left transition-all duration-200 group overflow-hidden bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="material-icons text-3xl text-red-500">broken_image</span>
                                            </div>
                                            <p className="font-bold text-sm mb-1 text-gray-800 dark:text-white">Dañado / Accidente</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">Rotura, derrame o contaminación.</p>
                                        </button>

                                        {/* Calidad */}
                                        <button 
                                            onClick={() => setDiscardReason('quality')}
                                            className="relative p-5 rounded-2xl border text-left transition-all duration-200 group overflow-hidden bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="material-icons text-3xl text-purple-500">thumb_down</span>
                                            </div>
                                            <p className="font-bold text-sm mb-1 text-gray-800 dark:text-white">Mala Calidad</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">Defecto de fábrica o rendimiento.</p>
                                        </button>
                                    </div>
                                    <button onClick={() => setViewMode('dashboard')} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
                                </>
                            ) : (
                                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 fade-in shadow-sm relative">
                                    <button onClick={() => setDiscardReason(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><span className="material-icons text-sm">close</span></button>
                                    
                                    {renderReasonContent()}

                                    {/* SCOPE SELECTION (Hide for 'finished') */}
                                    {discardReason !== 'finished' && (
                                        <div className="mb-6">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Alcance de la Baja</label>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <button 
                                                    onClick={() => setDiscardScope('single')}
                                                    className={`p-3 rounded-xl border text-left transition-all ${discardScope === 'single' ? 'bg-white dark:bg-surface-dark border-blue-500 ring-1 ring-blue-500/20 shadow-md' : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-white'}`}
                                                >
                                                    <div className="flex justify-between mb-1">
                                                        <span className="material-icons text-blue-500 text-lg">science</span>
                                                        {discardScope === 'single' && <span className="material-icons text-blue-500 text-sm">check_circle</span>}
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-800 dark:text-white">Una Unidad</p>
                                                    <p className="text-[9px] text-gray-500">Solo 1 {pkg.purchaseUnit}</p>
                                                </button>

                                                <button 
                                                    onClick={() => setDiscardScope('batch')}
                                                    className={`p-3 rounded-xl border text-left transition-all ${discardScope === 'batch' ? 'bg-red-50 dark:bg-red-900/10 border-red-500 ring-1 ring-red-500/20 shadow-md' : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-white'}`}
                                                >
                                                    <div className="flex justify-between mb-1">
                                                        <span className="material-icons text-red-500 text-lg">inventory_2</span>
                                                        {discardScope === 'batch' && <span className="material-icons text-red-500 text-sm">check_circle</span>}
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-800 dark:text-white">Todo el Stock</p>
                                                    <p className="text-[9px] text-gray-500">{stock} {pkg.purchaseUnit}s en bodega</p>
                                                </button>
                                            </div>
                                            
                                            {/* Identifier Input */}
                                            {discardScope === 'single' && (
                                                <div className="mt-3">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Identificador / Serial (Opcional)</label>
                                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                                                        <span className="material-icons text-gray-400 text-sm">qr_code_2</span>
                                                        <input 
                                                            type="text" 
                                                            value={identifier}
                                                            onChange={(e) => setIdentifier(e.target.value)}
                                                            className="flex-1 bg-transparent text-xs outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                                                            placeholder="Ej: Lote #12345"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Financial Impact */}
                                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-gray-800 mb-6 flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Impacto Financiero</p>
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Valor residual</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-mono font-bold text-lg ${discardReason === 'finished' ? 'text-gray-800 dark:text-white' : 'text-red-600'}`}>
                                                {discardReason === 'finished' ? '$0.00' : `-$${financialImpact.toFixed(2)}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setDiscardReason(null)} className="flex-1 py-3.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancelar</button>
                                        <button 
                                            onClick={handleConfirmDiscard} 
                                            className={`flex-[2] py-3.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2
                                                ${discardReason === 'finished' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'}
                                            `}
                                        >
                                            <span className="material-icons text-sm">{discardReason === 'finished' ? 'check_circle' : 'delete_forever'}</span>
                                            {discardReason === 'finished' ? 'Confirmar Cierre' : 'Confirmar Baja'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>
                ) : (
                /* C. DASHBOARD VIEW (Default) */
                    <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FA] dark:bg-black/20 custom-scrollbar animate-in slide-in-from-left-4">
                        
                        {/* TOP STATS ROW */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* A. STOCK LEVEL */}
                            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500 ${statusText}`}>
                                    <span className="material-icons text-6xl">inventory_2</span>
                                </div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Existencias Bodega</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-display font-bold text-gray-900 dark:text-white">{stock}</span>
                                    <span className="text-sm font-medium text-gray-500">{pkg.purchaseUnit}s</span>
                                </div>
                                <div className="mt-3 relative pt-4">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 absolute top-0 w-full">
                                        <span>0</span>
                                        <span className={stock <= min ? 'text-red-500' : ''}>Min: {min}</span>
                                        <span>Max: {min * 4}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${statusColor}`} 
                                            style={{ width: `${Math.min(100, (stock / (min * 4 || 10)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* B. USAGE & DURATION */}
                            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 text-purple-500 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-icons text-6xl">timelapse</span>
                                </div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cobertura Estimada</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-display font-bold text-gray-900 dark:text-white">~{daysRemaining}</span>
                                    <span className="text-sm font-medium text-gray-500">Días</span>
                                </div>
                                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/10 p-2 rounded-lg border border-purple-100 dark:border-purple-900/20 flex items-center gap-2">
                                    <span className="material-icons text-purple-500 text-sm">trending_down</span>
                                    <span>Velocidad: <strong>{mockDailyConsumption} {pkg.consumptionUnit}/día</strong></span>
                                </div>
                            </div>

                            {/* C. COST EFFICIENCY */}
                            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 text-green-500 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-icons text-6xl">attach_money</span>
                                </div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Costo Operativo</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-gray-400">$</span>
                                    <span className="text-4xl font-display font-bold text-gray-900 dark:text-white">{costPerConsumptionUnit.toFixed(2)}</span>
                                    <span className="text-sm font-medium text-gray-500">/ {pkg.consumptionUnit}</span>
                                </div>
                                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-green-50 dark:bg-green-900/10 p-2 rounded-lg border border-green-100 dark:border-green-900/20 flex items-center gap-2">
                                    <span className="material-icons text-green-600 text-sm">inventory</span>
                                    <span>Valor Stock: <strong>${(stock * cost).toLocaleString()}</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* DETAIL SECTIONS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Logistics / Supply Chain */}
                            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <span className="material-icons text-gray-400 text-sm">local_shipping</span> Logística de Compra
                                </h4>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Proveedor Principal</span>
                                        <span className="text-sm font-bold text-blue-600 cursor-pointer hover:underline">
                                            {supplier?.companyName || 'No Asignado'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Formato de Compra</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {pkg.purchaseUnit}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Costo de Reposición</span>
                                        <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                            ${cost.toFixed(2)} / {pkg.purchaseUnit}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Fecha de Vencimiento</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.packageInfo?.expiryDate ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                                            {item.packageInfo?.expiryDate ? new Date(item.packageInfo.expiryDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No registrada'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Technical / Usage Details */}
                            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <span className="material-icons text-gray-400 text-sm">settings_input_component</span> Especificaciones de Uso
                                </h4>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Modo de Consumo</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                            {pkg.usageType === 'bulk' ? 'Granel (Fraccionable)' : 'Por Pieza Entera'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Unidad de Medida</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {pkg.consumptionUnit}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Rendimiento por {pkg.purchaseUnit}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400 block">
                                                {totalContentPerPurchase} {pkg.consumptionUnit}s
                                            </span>
                                            <span className="text-[9px] text-gray-400">
                                                ({pkg.unitsPerPackage} x {pkg.contentPerUnit} {pkg.consumptionUnit})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* 3. FOOTER ACTIONS */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-gray-700 shrink-0 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span className="material-icons text-sm">info</span>
                        ID: {item.id}
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setViewMode('discard')}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-colors bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 flex items-center gap-2"
                            title="Reportar daño, vencimiento o finalización"
                        >
                             <span className="material-icons text-sm">remove_circle_outline</span>
                             Reportar Baja
                        </button>
                        <button 
                            onClick={() => setShowHistoryDrawer(true)}
                            className={`px-4 py-2.5 border rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2 bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50`}
                        >
                            <span className="material-icons text-sm">history</span>
                            Ver Historial
                        </button>
                        <button className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2">
                            <span className="material-icons text-sm">add_shopping_cart</span>
                            Solicitar Pedido
                        </button>
                    </div>
                </div>

            </div>
            
            <ProductOrderHistoryDrawer 
                isOpen={showHistoryDrawer}
                onClose={() => setShowHistoryDrawer(false)}
                item={item}
                orders={orders}
                stockLogs={stockLogs}
            />
        </div>
    );
};

export default ConsumableProductModal;