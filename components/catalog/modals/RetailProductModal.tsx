
import React, { useState } from 'react';
import { AppointmentItem, useData } from '../../../context/DataContext';
import ProductOrderHistoryDrawer from './ProductOrderHistoryDrawer';

interface RetailProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: AppointmentItem | null;
    onEdit: (item: AppointmentItem) => void;
}

type DiscardReason = 'finished' | 'expired' | 'damaged' | 'quality';
type DiscardScope = 'single' | 'batch';
type YieldRating = 'low' | 'expected' | 'high';

const RetailProductModal: React.FC<RetailProductModalProps> = ({ isOpen, onClose, item, onEdit }) => {
    const { suppliers, updateCatalogItem, addCatalogItem, addStockLog, addToast, orders, stockLogs } = useData();
    
    // View State: Dashboard vs Discard Form
    const [viewMode, setViewMode] = useState<'dashboard' | 'discard'>('dashboard');
    const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
    
    // Discard State
    const [discardReason, setDiscardReason] = useState<DiscardReason | null>(null);
    const [discardScope, setDiscardScope] = useState<DiscardScope>('single');
    const [discardNotes, setDiscardNotes] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [yieldRating, setYieldRating] = useState<YieldRating>('expected');

    if (!isOpen || !item) return null;

    const supplier = suppliers.find(s => s.id === item.supplierId);

    // Cálculos Financieros y de Stock
    const price = item.price || 0;
    const cost = item.cost || 0;
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    
    const stock = item.stock || 0;
    const potentialRevenue = stock * price;
    const potentialProfitTotal = stock * profit;
    
    const min = item.minStock || 0;
    const maxScale = Math.max(stock * 1.5, (min * 3) || 10);
    const currentPercent = Math.min(100, (stock / maxScale) * 100);
    const minMarkerPercent = Math.min(100, (min / maxScale) * 100);

    const isLowStock = stock <= min;

    // Lógica de Vencimiento
    const hasExpiryDate = !!item.packageInfo?.expiryDate;
    const expiryDateObj = item.packageInfo?.expiryDate ? new Date(item.packageInfo.expiryDate) : null;
    const expiryDateDisplay = expiryDateObj 
        ? expiryDateObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) 
        : 'Sin fecha registrada';
    
    const isExpired = expiryDateObj ? expiryDateObj < new Date() : false;

    // --- HANDLERS ---
    
    const handleOrderRequest = () => {
        addToast('success', `Solicitud de pedido para ${item.title} agregada a borradores.`);
    };

    const handleConfirmDiscard = () => {
        if (!item || !discardReason) return;
        
        // 1. Determinar Cantidad y Alcance Real
        const isFinished = discardReason === 'finished';
        
        // Si es "Terminado", SIEMPRE es todo el lote (Batch).
        // Si es otro motivo, respetamos la selección del usuario.
        const effectiveScope = isFinished ? 'batch' : discardScope;
        const qtyToDiscard = effectiveScope === 'batch' ? stock : 1;
        
        if (qtyToDiscard > stock) {
            addToast('error', 'La cantidad excede el stock disponible.');
            return;
        }

        const financialImpact = qtyToDiscard * cost; 
        const dateStr = new Date().toLocaleDateString('es-ES');
        
        // 2. CREAR REGISTRO HISTÓRICO EN CATÁLOGO (Entrada en Vencidos/Dañados/Terminados)
        // Esto crea una copia del item que persiste con el motivo de la baja
        const batchId = item.packageInfo?.currentBatch || 'GEN';
        const suffix = isFinished 
            ? `(Terminado - ${yieldRating})` 
            : effectiveScope === 'single' 
                ? `(Unid. ${identifier || 'Dañada'})` 
                : `(Lote ${discardReason})`;

        const qualityStatus = isFinished ? 'finished' : (discardReason === 'expired' ? 'expired' : 'damaged');

        const archivedItem: Partial<AppointmentItem> = {
            ...item,
            id: undefined, // Let addCatalogItem generate a new ID
            title: `${item.title} ${suffix}`,
            stock: qtyToDiscard, // La cantidad que se da de baja
            sku: `${item.sku}-${batchId}-${Date.now().toString().slice(-4)}`,
            qualityStatus: qualityStatus as any, // Cast to any because 'finished' might not be strictly typed in original interface but logic handles it
            description: `Registro de baja: ${discardNotes || 'Sin notas'}. Fecha: ${dateStr}.`,
            // Importante: Marcarlo como no disponible para venta/uso normal si la lógica lo requiere, 
            // pero al tener qualityStatus 'damaged'/'expired'/'finished' ya se filtra de las listas operativas.
        };

        addCatalogItem(archivedItem);

        // 3. ACTUALIZAR STOCK ORIGINAL
        const newStock = Math.max(0, stock - qtyToDiscard);
        updateCatalogItem(item.id, { stock: newStock });

        // 4. LOG DE SISTEMA
        const notePrefix = identifier ? `[ID: ${identifier}] ` : '';
        const scopeText = effectiveScope === 'batch' ? 'Lote Completo' : 'Unidad Única';
        
        let reasonLabel = 'Baja';
        if (discardReason === 'finished') {
            const yieldMap = { low: 'Rendimiento Bajo', expected: 'Rendimiento Estándar', high: 'Rendimiento Alto' };
            reasonLabel = `Terminado (${yieldMap[yieldRating]})`;
        } else if (discardReason === 'expired') reasonLabel = 'Vencido';
        else if (discardReason === 'damaged') reasonLabel = 'Dañado';
        else if (discardReason === 'quality') reasonLabel = 'Mala Calidad';

        addStockLog({
            itemId: item.id,
            itemName: item.title,
            action: 'Discard',
            reasonCategory: discardReason,
            quantityChange: -qtyToDiscard,
            unit: item.packageInfo?.purchaseUnit || 'Unidad',
            costImpact: -financialImpact,
            notes: `${notePrefix}${scopeText} - ${reasonLabel}. ${discardNotes}`,
            date: new Date().toISOString()
        });

        const successMsg = isFinished
            ? 'Lote cerrado y archivado en historial.' 
            : `Registrada baja de ${qtyToDiscard} unidad(es).`;
            
        addToast('success', successMsg);
        
        // Reset & Return to Dashboard
        setDiscardReason(null);
        setDiscardScope('single');
        setDiscardNotes('');
        setIdentifier('');
        setYieldRating('expected');
        setViewMode('dashboard');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            {/* Main Modal Container */}
            <div className="bg-[#F8F9FA] dark:bg-surface-dark w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-y-auto custom-scrollbar flex flex-col border border-white/20 max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
                
                {/* HEADER - Orange Gradient */}
                <div className="relative bg-gradient-to-r from-[#FFA726] to-[#FB8C00] p-8 pb-28 shadow-sm shrink-0">
                    
                    {/* Top Row: Pills & Toolbar Actions */}
                    <div className="flex justify-between items-start relative z-30 mb-6 sticky top-0">
                        <div className="flex gap-2 items-center">
                            <span className="px-3 py-1 bg-white/25 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/10 shadow-sm">RETAIL</span>
                            <span className="px-3 py-1 bg-black/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white/90 font-mono tracking-wide border border-white/5">{item.sku || 'NO-SKU'}</span>
                            {isExpired && (
                                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                    <span className="material-icons text-[10px]">warning</span> VENCIDO
                                </span>
                            )}
                        </div>
                        
                        {/* --- ACTION BUTTONS IN HEADER (Requested Change) --- */}
                        <div className="flex gap-2 items-center">
                            {/* Toggle View Mode Button */}
                            <button 
                                onClick={() => setViewMode(viewMode === 'dashboard' ? 'discard' : 'dashboard')}
                                className={`px-3 py-2 rounded-full text-[10px] font-bold transition-all shadow-sm border border-white/20 flex items-center gap-1.5 hover:bg-white/20 
                                    ${viewMode === 'discard' ? 'bg-white text-orange-600' : 'bg-white/10 text-white'}`}
                            >
                                <span className="material-icons text-[14px]">
                                    {viewMode === 'discard' ? 'undo' : 'remove_circle_outline'}
                                </span>
                                {viewMode === 'discard' ? 'Volver' : 'Reportar Baja'}
                            </button>
                            
                            {/* Order Request Button */}
                            <button 
                                onClick={handleOrderRequest}
                                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-[10px] font-bold transition-all shadow-sm border border-white/20 flex items-center gap-1.5"
                            >
                                <span className="material-icons text-[14px]">add_shopping_cart</span>
                                Solicitar Pedido
                            </button>

                            <div className="w-px h-5 bg-white/20 mx-1"></div>

                            {/* Standard Actions */}
                            <button onClick={() => { onClose(); onEdit(item); }} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md shadow-sm border border-white/10">
                                <span className="material-icons text-sm">edit</span>
                            </button>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md shadow-sm border border-white/10">
                                <span className="material-icons text-sm">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content: Title & Price */}
                    <div className="flex items-center justify-between relative z-10 px-1">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shadow-inner border border-white/30">
                                <span className="material-icons text-3xl drop-shadow-md">storefront</span>
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight max-w-sm drop-shadow-sm tracking-tight">{item.title}</h1>
                                <p className="text-orange-50 text-xs mt-1.5 font-medium flex items-center gap-1 opacity-90">
                                    {item.category} <span className="w-1 h-1 rounded-full bg-white/50"></span> Unidad
                                </p>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">PRECIO PÚBLICO</p>
                            <p className="text-5xl font-display font-bold text-white tracking-tighter drop-shadow-md">${price.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* BODY CONTENT */}
                <div className="relative bg-[#F8F9FA] dark:bg-surface-dark px-6 pb-8 flex-1">
                    
                    {viewMode === 'dashboard' ? (
                        <>
                            {/* OVERLAPPING KPI CARDS */}
                            <div className="-mt-16 relative z-20 mb-8">
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Card 1: Margen */}
                                    <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] flex flex-col justify-between h-32 border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">MARGEN UNITARIO</p>
                                        <div className="mt-auto">
                                            <span className="block text-4xl font-display font-bold text-[#10B981] tracking-tight">{margin.toFixed(0)}%</span>
                                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block mt-1">
                                                +${profit.toFixed(2)} ganancia
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card 2: Stock Físico */}
                                    <div className="bg-white dark:bg-surface-dark p-5 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] flex flex-col justify-between h-32 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">STOCK FÍSICO</p>
                                            <span className={`text-[10px] font-bold uppercase ${isLowStock ? 'text-red-500' : 'text-[#10B981]'}`}>
                                                {stock === 0 ? 'AGOTADO' : (isLowStock ? 'BAJO' : 'OK')}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-auto w-full relative">
                                            <div className="flex justify-between items-end mb-2 relative z-10">
                                                <span className="text-4xl font-display font-bold text-gray-900 dark:text-white leading-none tracking-tight">{stock}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">Capacidad: ~{Math.round(maxScale)}</span>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                                                <div 
                                                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400/50 z-20" 
                                                    style={{ left: `${minMarkerPercent}%` }}
                                                    title={`Nivel Mínimo: ${min}`}
                                                ></div>
                                                <div 
                                                    className={`h-full rounded-full shadow-sm transition-all duration-500 relative z-10 ${isLowStock ? 'bg-red-500' : 'bg-[#10B981]'}`} 
                                                    style={{ width: `${currentPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 3: Valor Potencial */}
                                    <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] flex flex-col justify-between h-32 border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">VALOR VENTA<br/>POTENCIAL</p>
                                        <div className="mt-auto flex items-end justify-between">
                                            <div>
                                                <span className="block text-2xl font-display font-bold text-gray-900 dark:text-white tracking-tight">${potentialRevenue.toLocaleString()}</span>
                                                <span className="text-[10px] font-bold text-gray-400 block mt-1">en inventario</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white shadow-lg shadow-green-200 dark:shadow-none mb-1">
                                                <span className="material-icons text-sm font-bold">attach_money</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DETAILS SECTION */}
                            <div className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                                            <span className="material-icons text-gray-400 text-[10px]">info</span>
                                        </div>
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DETALLE DE INVENTARIO</h3>
                                    </div>
                                    <button 
                                        onClick={() => setShowHistoryDrawer(true)}
                                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full transition-colors"
                                    >
                                        <span className="material-icons text-[12px]">history</span>
                                        VER HISTORIAL
                                    </button>
                                </div>
                                
                                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 flex items-center justify-between mb-5 border border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-gray-500 shadow-sm">
                                            <span className="material-icons">store</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Proveedor Principal</p>
                                            <p className="text-sm font-bold text-gray-800 dark:text-white">{supplier?.companyName || 'No asignado'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Lote Actual</p>
                                        <span className="inline-block bg-white dark:bg-white/10 px-3 py-1 rounded-lg text-xs font-mono font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                            {item.packageInfo?.currentBatch || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="p-3 border border-gray-100 dark:border-gray-700 rounded-xl flex flex-col justify-between h-20">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                            <span className="material-icons text-[12px]">monetization_on</span> Costo Unit.
                                        </span>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white font-mono">${cost.toFixed(2)}</span>
                                    </div>
                                    <div className="p-3 border border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10 rounded-xl flex flex-col justify-between h-20">
                                        <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase flex items-center gap-1">
                                            <span className="material-icons text-[12px]">trending_up</span> Beneficio
                                        </span>
                                        <span className="text-lg font-bold text-green-700 dark:text-green-300 font-mono">+${potentialProfitTotal.toLocaleString()}</span>
                                    </div>
                                    <div className={`p-3 border rounded-xl flex flex-col justify-between h-20 ${isExpired ? 'border-red-200 bg-red-50' : 'border-gray-100 dark:border-gray-700'}`}>
                                        <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${isExpired ? 'text-red-600' : 'text-gray-400'}`}>
                                            <span className="material-icons text-[12px]">{isExpired ? 'error' : 'event'}</span> Vencimiento
                                        </span>
                                        <span className={`text-sm font-bold ${isExpired ? 'text-red-700' : 'text-gray-900 dark:text-white'}`}>{expiryDateDisplay}</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Unidad Venta</p>
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize flex items-center gap-1">
                                            <span className="material-icons text-[12px] text-gray-400">shopping_bag</span>
                                            {item.packageInfo?.purchaseUnit || 'Unidad'}
                                        </p>
                                    </div>
                                    
                                    <div className="text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Alerta Stock Mínimo</p>
                                        <p className={`text-xs font-bold flex items-center justify-center gap-1 ${min === 0 ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                                            <span className="material-icons text-[12px] opacity-60">notifications_active</span>
                                            {min > 0 ? `${min} unid.` : 'Desactivada'}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Actualizado</p>
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-end gap-1">
                                            Hoy <span className="material-icons text-[12px] text-gray-400">update</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* VIEWMODE: DISCARD FORM */
                        <div className="max-w-xl mx-auto py-8">
                             {!discardReason ? (
                                <>
                                    <h3 className="text-center text-sm font-bold text-gray-900 dark:text-white mb-6">
                                        Selecciona el motivo de la baja
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <button 
                                            onClick={() => setDiscardReason('finished')}
                                            className="relative p-5 rounded-2xl border text-left transition-all duration-200 group overflow-hidden bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="material-icons text-3xl text-green-500">check_circle</span>
                                            </div>
                                            <p className="font-bold text-sm mb-1 text-gray-800 dark:text-white">Terminado</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">Consumo completo.</p>
                                        </button>

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

                                        <button 
                                            onClick={() => setDiscardReason('damaged')}
                                            className="relative p-5 rounded-2xl border text-left transition-all duration-200 group overflow-hidden bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="material-icons text-3xl text-red-500">broken_image</span>
                                            </div>
                                            <p className="font-bold text-sm mb-1 text-gray-800 dark:text-white">Dañado</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">Rotura o incidente.</p>
                                        </button>

                                        <button 
                                            onClick={() => setDiscardReason('quality')}
                                            className="relative p-5 rounded-2xl border text-left transition-all duration-200 group overflow-hidden bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="material-icons text-3xl text-purple-500">thumb_down</span>
                                            </div>
                                            <p className="font-bold text-sm mb-1 text-gray-800 dark:text-white">Calidad / Robo</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">Defecto o pérdida.</p>
                                        </button>
                                    </div>
                                    <button onClick={() => setViewMode('dashboard')} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
                                </>
                            ) : discardReason === 'finished' ? (
                                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 fade-in shadow-sm relative">
                                     <button onClick={() => setDiscardReason(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><span className="material-icons text-sm">close</span></button>
                                     <div className="text-center">
                                        <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span className="material-icons text-2xl">query_stats</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Califica el Rendimiento</h3>
                                        <p className="text-xs text-gray-500 mb-6 px-4">
                                            ¿El envase duró la cantidad de servicios esperada según el estándar?
                                        </p>

                                        <div className="grid grid-cols-3 gap-3 mb-6">
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

                                        <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-gray-800 mb-6 flex justify-between items-center text-left">
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">IMPACTO FINANCIERO</p>
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Valor residual</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono font-bold text-lg text-gray-800 dark:text-white">$0.00</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button onClick={() => setDiscardReason(null)} className="flex-1 py-3 text-xs font-bold text-gray-400 hover:bg-gray-50 rounded-xl">Cancelar</button>
                                            <button onClick={handleConfirmDiscard} className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                                                <span className="material-icons text-sm">check_circle</span> Confirmar Cierre
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 fade-in shadow-sm relative">
                                    <button onClick={() => setDiscardReason(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><span className="material-icons text-sm">close</span></button>
                                    
                                    <div className="mb-6">
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Confirmar Baja: {discardReason?.toUpperCase()}</h3>
                                        
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
                                                <p className="text-[9px] text-gray-500">Solo 1 {item.packageInfo?.purchaseUnit || 'Unidad'}</p>
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
                                                <p className="text-[9px] text-gray-500">{stock} en bodega</p>
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
                                                        placeholder="Ej: Código de Barra"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-3">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Notas</label>
                                            <textarea 
                                                value={discardNotes}
                                                onChange={(e) => setDiscardNotes(e.target.value)}
                                                className="w-full text-xs p-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg outline-none resize-none placeholder:text-gray-400"
                                                rows={2}
                                                placeholder="Detalles adicionales..."
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <button onClick={() => setDiscardReason(null)} className="flex-1 py-3.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancelar</button>
                                        <button 
                                            onClick={handleConfirmDiscard} 
                                            className="flex-[2] py-3.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 shadow-red-500/30"
                                        >
                                            <span className="material-icons text-sm">delete_forever</span>
                                            Confirmar Baja
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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

export default RetailProductModal;
