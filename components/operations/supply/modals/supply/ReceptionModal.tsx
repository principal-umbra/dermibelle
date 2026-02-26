
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../../../../context/DataContext';

interface ReceptionModalProps {
    orderId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onReceiveLine: (orderId: string, lineItemId: string | number, qty: number, tracking?: { batch?: string; expiry?: string }) => Promise<string | void>;
    orders: any[];
}

// --- ITEM CARD: SMART PRODUCT EDITOR ---
const ReceptionLineItem: React.FC<{ 
    line: any; 
    catalogItem: any;
    globalSettings: any;
    onReceive: (qty: number, tracking?: { batch?: string; expiry?: string }) => void; 
}> = ({ line, catalogItem, globalSettings, onReceive }) => {
    const { updateCatalogItem } = useData();

    // 1. Estado de Recepción
    const pending = line.qty - (line.receivedQty || 0);
    const isCompleted = pending <= 0;
    
    // 2. Estado Local de Inputs (Recepción)
    const [val, setVal] = useState<string>(String(Math.max(0, pending)));
    const [mode, setMode] = useState<'unit' | 'pack'>('unit');
    const [showDetails, setShowDetails] = useState(false); // Lote/Vencimiento toggle
    const [batch, setBatch] = useState('');
    const [expiry, setExpiry] = useState('');

    // 3. Estado de Auditoría (SMART EDITOR)
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditTab, setAuditTab] = useState<'definition' | 'strategy' | 'destination'>('definition');
    
    const [auditState, setAuditState] = useState({
        // Tab 1: Definición (Compra + Contenido)
        cost: 0,
        purchaseUnit: 'Unidad',
        unitsPerPackage: 1,
        usageType: 'whole', // 'whole' | 'bulk'
        contentPerUnit: 1,
        consumptionUnit: 'Unidad',
        
        // Tab 2: Estrategia (Precio)
        price: 0,
        
        // Tab 3: Destino (Tipo + Ratio)
        subtype: 'retail', // 'retail' | 'consumable' | 'both'
        retailRatio: 0.5,
    });

    // Inicializar datos al montar o cambiar item
    useEffect(() => {
        if (catalogItem) {
            const pkg = catalogItem.packageInfo || {};
            const isPackConfigured = (pkg.unitsPerPackage || 1) > 1;

            // Configurar modo inicial de recepción (Smart detection)
            if (isPackConfigured && pending >= (pkg.unitsPerPackage || 1) && pending % (pkg.unitsPerPackage || 1) === 0) {
                setMode('pack');
                setVal(String(pending / (pkg.unitsPerPackage || 1)));
            } else {
                setMode('unit');
                setVal(String(pending));
            }

            // Cargar datos para el editor
            setAuditState({
                cost: catalogItem.cost || 0,
                purchaseUnit: pkg.purchaseUnit || 'Unidad',
                unitsPerPackage: pkg.unitsPerPackage || 1,
                
                usageType: pkg.usageType || 'whole',
                contentPerUnit: pkg.contentPerUnit || 1,
                consumptionUnit: pkg.consumptionUnit || 'Unidad',

                price: catalogItem.price || 0,
                
                subtype: catalogItem.subtype || 'retail',
                retailRatio: catalogItem.stockConfig?.isCustom 
                    ? catalogItem.stockConfig.retailRatio 
                    : globalSettings.defaultRetailRatio,
            });
        }
    }, [catalogItem, pending, globalSettings]);

    // --- ACCIONES DE AUDITORÍA ---
    const handleSaveAudit = () => {
        if (!catalogItem) return;
        
        // Determinar unidad de consumo correcta según modo
        const finalConsUnit = auditState.usageType === 'whole' ? 'Unidad' : auditState.consumptionUnit;
        const finalContent = auditState.usageType === 'whole' ? 1 : auditState.contentPerUnit;

        updateCatalogItem(catalogItem.id, {
            cost: auditState.cost,
            price: auditState.price,
            subtype: auditState.subtype as any,
            stockConfig: auditState.subtype === 'both' ? { isCustom: true, retailRatio: auditState.retailRatio } : undefined,
            packageInfo: {
                ...catalogItem.packageInfo,
                unitsPerPackage: auditState.unitsPerPackage,
                purchaseUnit: auditState.purchaseUnit,
                usageType: auditState.usageType as any,
                contentPerUnit: finalContent,
                consumptionUnit: finalConsUnit
            } as any
        });
        
        setIsAuditing(false);
    };

    const applyMarkup = (percent: number) => {
        const newPrice = auditState.cost * (1 + percent / 100);
        setAuditState(prev => ({ ...prev, price: parseFloat(newPrice.toFixed(2)) }));
    };

    // --- ACCIONES DE RECEPCIÓN ---
    const handleReceiveClick = () => {
        const rawQty = parseInt(val);
        if (isNaN(rawQty) || rawQty <= 0) return;
        const finalQty = mode === 'pack' ? rawQty * auditState.unitsPerPackage : rawQty;
        onReceive(finalQty, (batch || expiry) ? { batch, expiry } : undefined);
        if (batch || expiry) setShowDetails(false);
    };

    // --- CÁLCULOS VISUALES & KPIs ---
    const percentage = Math.min(100, Math.round(((line.receivedQty || 0) / line.qty) * 100));
    const orderPrice = line.price || 0;
    
    // KPIs Estrategia
    const margin = auditState.price > 0 ? ((auditState.price - auditState.cost) / auditState.price) * 100 : 0;
    const roi = auditState.cost > 0 ? (auditState.price - auditState.cost) / auditState.cost : 0;
    // Cuantas unidades vender para recuperar inversión de este lote (o unidad)
    // Inversion Lote = (Cantidad recibida estimada * Costo) / Precio Venta
    const investment = auditState.cost * (parseInt(val) || 1) * (mode === 'pack' ? auditState.unitsPerPackage : 1);
    const breakEvenUnits = auditState.price > 0 ? Math.ceil(investment / auditState.price) : 0;

    return (
        <div className={`relative overflow-hidden rounded-2xl transition-all duration-300 flex flex-col border group
            ${isCompleted 
                ? 'bg-emerald-50/40 border-emerald-200/60 shadow-none opacity-75' 
                : isAuditing
                    ? 'bg-white dark:bg-surface-dark border-blue-500 ring-1 ring-blue-500/20 shadow-xl z-20 scale-[1.01]'
                    : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-300'
            }`}
        >
            {/* CABECERA (Siempre Visible) */}
            <div className="p-4 flex gap-4 items-start">
                {/* Icono */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors relative
                    ${isCompleted ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-gray-700 text-gray-400'}`}>
                    <span className="material-icons text-xl">{isCompleted ? 'check_circle' : (catalogItem?.type === 'service' ? 'spa' : 'inventory_2')}</span>
                    
                    {/* Badge de Tipo Dinámico */}
                    {!isCompleted && (
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-surface-dark transition-colors
                            ${auditState.subtype === 'both' ? 'bg-purple-500' : auditState.subtype === 'retail' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                            {auditState.subtype === 'both' ? 'M' : auditState.subtype === 'retail' ? 'R' : 'C'}
                        </div>
                    )}
                </div>

                {/* Info Principal */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                        <h4 className={`font-bold text-sm truncate pr-2 ${isCompleted ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`}>
                            {line.title}
                        </h4>
                        {!isCompleted && !isAuditing && (
                            <button 
                                onClick={() => setIsAuditing(true)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-white/10 dark:text-gray-300 transition-colors flex items-center gap-1"
                            >
                                <span className="material-icons text-[10px]">tune</span> Gestionar
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="font-mono bg-gray-100 dark:bg-white/10 px-1.5 rounded text-[10px] font-bold">
                            {catalogItem?.sku || 'SKU-???'}
                        </span>
                        {!isAuditing && (
                            <span className="text-[10px] text-gray-400">
                                Costo Base: ${auditState.cost.toFixed(2)}
                            </span>
                        )}
                        {/* Cost Warning */}
                        {Math.abs(auditState.cost - orderPrice) > 0.01 && !isAuditing && !isCompleted && (
                             <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-100">
                                 Orden: ${orderPrice.toFixed(2)}
                             </span>
                        )}
                    </div>

                    {/* Progress Bar (Oculto al auditar para limpiar visual) */}
                    {!isAuditing && (
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex relative mb-1">
                            <div className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${percentage}%` }}></div>
                        </div>
                    )}
                    
                    <div className="flex justify-between mt-1 items-end">
                         <span className={`text-[9px] font-bold uppercase ${isCompleted ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {isCompleted ? 'Completado' : `${pending} Pendientes`}
                         </span>
                         {!isAuditing && <span className="text-[9px] text-gray-400 font-mono">{line.receivedQty || 0} / {line.qty}</span>}
                    </div>
                </div>
            </div>

            {/* --- SMART EDITOR (Desplegable) --- */}
            {isAuditing && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 bg-gray-50/50 dark:bg-black/20 pt-2 border-t border-gray-100 dark:border-gray-700">
                    
                    {/* Tabs */}
                    <div className="flex bg-white dark:bg-black/20 rounded-xl p-1 mb-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <button onClick={() => setAuditTab('definition')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${auditTab === 'definition' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600'}`}>Definición</button>
                        <button onClick={() => setAuditTab('strategy')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${auditTab === 'strategy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'text-gray-400 hover:text-gray-600'}`}>Estrategia</button>
                        <button onClick={() => setAuditTab('destination')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${auditTab === 'destination' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'text-gray-400 hover:text-gray-600'}`}>Destino</button>
                    </div>

                    <div className="space-y-4 mb-4">
                        
                        {/* TAB 1: DEFINICIÓN (Compra & Contenido) */}
                        {auditTab === 'definition' && (
                            <div className="space-y-3">
                                {/* Compra */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2 relative">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Costo Unitario</label>
                                        <input 
                                            type="number" 
                                            value={auditState.cost}
                                            onChange={e => setAuditState({...auditState, cost: parseFloat(e.target.value)})}
                                            className="w-full pl-6 pr-2 py-2 text-sm font-bold border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-surface-dark"
                                        />
                                        <span className="absolute left-2.5 top-[25px] text-gray-400 text-xs">$</span>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Unidad Compra</label>
                                        <input 
                                            type="text" 
                                            value={auditState.purchaseUnit}
                                            onChange={e => setAuditState({...auditState, purchaseUnit: e.target.value})}
                                            className="w-full py-2 px-3 text-xs border border-gray-200 dark:border-gray-600 rounded-xl outline-none bg-white dark:bg-surface-dark"
                                            placeholder="Caja, Pack..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Unidades/Pack</label>
                                        <input 
                                            type="number"
                                            value={auditState.unitsPerPackage}
                                            onChange={e => setAuditState({...auditState, unitsPerPackage: parseFloat(e.target.value)})}
                                            className="w-full py-2 px-3 text-xs border border-gray-200 dark:border-gray-600 rounded-xl outline-none bg-white dark:bg-surface-dark"
                                        />
                                    </div>
                                </div>
                                
                                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                                
                                {/* Contenido (NUEVO REQUERIMIENTO) */}
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Naturaleza del Producto</label>
                                    <div className="flex bg-gray-100 dark:bg-black/20 p-1 rounded-xl mb-2">
                                        <button 
                                            onClick={() => setAuditState({...auditState, usageType: 'whole'})}
                                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${auditState.usageType === 'whole' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                                        >
                                            Pieza Unitaria
                                        </button>
                                        <button 
                                            onClick={() => setAuditState({...auditState, usageType: 'bulk'})}
                                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${auditState.usageType === 'bulk' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                                        >
                                            Granel (Medible)
                                        </button>
                                    </div>

                                    {auditState.usageType === 'bulk' && (
                                        <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-1">
                                            <div>
                                                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Contenido Neto</label>
                                                <input 
                                                    type="number"
                                                    value={auditState.contentPerUnit}
                                                    onChange={e => setAuditState({...auditState, contentPerUnit: parseFloat(e.target.value)})}
                                                    className="w-full py-2 px-3 text-xs border border-gray-200 dark:border-gray-600 rounded-xl outline-none bg-white dark:bg-surface-dark"
                                                    placeholder="Ej: 500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Unidad Medida</label>
                                                <select 
                                                    value={auditState.consumptionUnit}
                                                    onChange={e => setAuditState({...auditState, consumptionUnit: e.target.value})}
                                                    className="w-full py-2 px-3 text-xs border border-gray-200 dark:border-gray-600 rounded-xl outline-none bg-white dark:bg-surface-dark"
                                                >
                                                    <option value="ml">Mililitros (ml)</option>
                                                    <option value="g">Gramos (g)</option>
                                                    <option value="oz">Onzas (oz)</option>
                                                    <option value="l">Litros (l)</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: ESTRATEGIA (Precio + KPIs) */}
                        {auditTab === 'strategy' && (
                            <div className="space-y-4">
                                <div className="bg-green-50/50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-800">
                                    <label className="text-[9px] font-bold text-green-700 dark:text-green-300 uppercase block mb-1">Precio Venta Público</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold text-lg">$</span>
                                        <input 
                                            type="number" 
                                            value={auditState.price}
                                            onChange={e => setAuditState({...auditState, price: parseFloat(e.target.value)})}
                                            className="w-full pl-7 pr-3 py-2 text-xl font-bold bg-white dark:bg-black/20 border border-green-200 dark:border-green-700 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 text-green-700 dark:text-green-400"
                                        />
                                    </div>
                                    
                                    <div className="flex gap-2 mt-2">
                                        {[30, 50, 100].map(pct => (
                                            <button 
                                                key={pct}
                                                onClick={() => applyMarkup(pct)}
                                                className="flex-1 py-1 bg-white dark:bg-white/10 border border-green-200 dark:border-green-800 rounded-lg text-[9px] font-bold text-green-600 dark:text-green-300 hover:bg-green-100 transition-colors"
                                            >
                                                +{pct}%
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* KPIs Inteligentes */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl text-center border border-gray-200 dark:border-gray-700">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Margen</p>
                                        <p className={`text-sm font-bold ${margin < 30 ? 'text-orange-500' : 'text-green-600'}`}>
                                            {margin.toFixed(0)}%
                                        </p>
                                    </div>
                                    <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl text-center border border-gray-200 dark:border-gray-700">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Retorno (ROI)</p>
                                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {roi.toFixed(1)}x
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-gray-400 italic">
                                        * Punto de equilibrio: Vender <strong>{breakEvenUnits}</strong> unidades de este pedido para recuperar inversión.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: DESTINO (Tipo + Ratio) */}
                        {auditTab === 'destination' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Uso Principal</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'retail', label: 'Venta', icon: 'storefront', color: 'orange' },
                                            { id: 'consumable', label: 'Cabina', icon: 'science', color: 'blue' },
                                            { id: 'both', label: 'Mixto', icon: 'compare_arrows', color: 'purple' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setAuditState({...auditState, subtype: opt.id})}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                                    auditState.subtype === opt.id 
                                                    ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700` 
                                                    : 'border-transparent bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                }`}
                                            >
                                                <span className="material-icons text-lg mb-1">{opt.icon}</span>
                                                <span className="text-[9px] font-bold uppercase">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {auditState.subtype === 'both' && (
                                    <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-800 animate-in fade-in">
                                        <div className="flex justify-between text-[9px] font-bold uppercase mb-2">
                                            <span className="text-blue-600">Uso: {Math.round((1 - auditState.retailRatio) * 100)}%</span>
                                            <span className="text-orange-600">Venta: {Math.round(auditState.retailRatio * 100)}%</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="1" step="0.1" 
                                            value={auditState.retailRatio}
                                            onChange={e => setAuditState({...auditState, retailRatio: parseFloat(e.target.value)})}
                                            className="w-full h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <p className="text-[9px] text-gray-500 mt-2 text-center leading-tight">
                                            El stock se dividirá automáticamente según este porcentaje al recibir.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    <div className="flex justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                         <button onClick={() => setIsAuditing(false)} className="flex-1 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                             Cancelar
                         </button>
                         <button onClick={handleSaveAudit} className="flex-[2] py-2.5 bg-gray-900 dark:bg-white dark:text-black hover:bg-black text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                             <span className="material-icons text-sm">save</span> Confirmar Cambios
                         </button>
                    </div>
                </div>
            )}

            {/* --- ACTION INPUTS (Solo visible si no se está auditando) --- */}
            {!isCompleted && !isAuditing && (
                <div className="px-4 pb-4 pt-0">
                    
                    {/* Campos opcionales: Lote/Vencimiento */}
                    {showDetails && (
                        <div className="mb-3 p-2 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 animate-in slide-in-from-top-1">
                             <input value={batch} onChange={e => setBatch(e.target.value)} className="w-full text-xs p-1.5 bg-white dark:bg-surface-dark border rounded outline-none" placeholder="Lote #"/>
                             <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full text-xs p-1.5 bg-white dark:bg-surface-dark border rounded outline-none" />
                        </div>
                    )}

                    <div className="flex gap-2 h-10">
                        
                        {/* Toggle Unidades / Packs */}
                        {auditState.unitsPerPackage > 1 && (
                            <button 
                                onClick={() => {
                                    if (mode === 'unit') {
                                        setMode('pack');
                                        const newVal = Math.floor(parseInt(val) / auditState.unitsPerPackage);
                                        setVal(String(newVal > 0 ? newVal : 1));
                                    } else {
                                        setMode('unit');
                                        setVal(String(parseInt(val) * auditState.unitsPerPackage));
                                    }
                                }}
                                className="px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-[10px] font-bold text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors flex flex-col justify-center items-center min-w-[50px]"
                            >
                                <span className="material-icons text-sm">{mode === 'unit' ? 'widgets' : 'inventory_2'}</span>
                                {mode === 'unit' ? 'UNID' : auditState.purchaseUnit.substring(0,3).toUpperCase()}
                            </button>
                        )}

                        <button 
                            onClick={() => setShowDetails(!showDetails)}
                            className={`w-10 rounded-xl border flex items-center justify-center transition-colors ${showDetails ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white dark:bg-white/5 text-gray-400 border-gray-200 hover:border-gray-300'}`}
                        >
                            <span className="material-icons text-sm">qr_code</span>
                        </button>

                        <div className="flex-1 relative group">
                             <input 
                                type="number" 
                                min="1"
                                value={val}
                                onChange={(e) => setVal(e.target.value)}
                                className="w-full h-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-center text-lg font-bold outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 shadow-inner"
                             />
                             {mode === 'pack' && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-medium pointer-events-none">
                                    = {parseInt(val || '0') * auditState.unitsPerPackage} u.
                                </span>
                             )}
                        </div>

                        <button 
                            onClick={handleReceiveClick}
                            className="px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <span className="material-icons text-base">download</span> Recibir
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReceptionModal: React.FC<ReceptionModalProps> = ({ orderId, isOpen, onClose, onReceiveLine, orders }) => {
    const { catalog, globalInventorySettings } = useData();
    const [localOrder, setLocalOrder] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && orderId) {
            const found = orders.find(o => o.id === orderId);
            if (found) {
                const lines = found.lines || [];
                setLocalOrder({ ...found, lines: JSON.parse(JSON.stringify(lines)) });
            }
        }
    }, [isOpen, orderId, orders]);

    // Stats Computation
    const stats = useMemo(() => {
        if (!localOrder?.lines) return { total: 0, received: 0, percent: 0, pendingLines: 0, valueReceived: 0 };
        const total = localOrder.lines.reduce((acc: number, l: any) => acc + l.qty, 0);
        const received = localOrder.lines.reduce((acc: number, l: any) => acc + (l.receivedQty || 0), 0);
        const valueReceived = localOrder.lines.reduce((acc: number, l: any) => acc + ((l.receivedQty || 0) * l.price), 0);
        const pendingLines = localOrder.lines.filter((l: any) => (l.receivedQty || 0) < l.qty).length;
        const percent = total > 0 ? Math.round((received / total) * 100) : 0;
        return { total, received, percent, pendingLines, valueReceived };
    }, [localOrder]);

    // Filter Logic
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
        if (!localOrder) return;
        // Batch process
        for (const line of localOrder.lines) {
            const pending = line.qty - (line.receivedQty || 0);
            if (pending > 0) {
                await handleReceive(line.itemId, pending);
            }
        }
    };

    if (!isOpen || !localOrder) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-[#F8F9FB] dark:bg-[#0F1115] w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] border border-white/10" onClick={e => e.stopPropagation()}>
                
                {/* HERO HEADER - Compact */}
                <div className="bg-slate-900 text-white px-8 py-6 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
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
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-900/50 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                                >
                                    <span className="material-icons text-sm">done_all</span> Recibir Todo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* FILTERS & SEARCH TOOLBAR */}
                <div className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
                    {/* Search / Scanner */}
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

                    {/* Tabs */}
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

                {/* SCROLLABLE GRID */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#F3F4F6] dark:bg-black/20 custom-scrollbar">
                    {filteredLines.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <span className="material-icons text-5xl mb-2">search_off</span>
                            <p className="text-sm font-medium">No se encontraron items.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLines.map((line: any) => {
                                // Find catalog item for extra data
                                const catItem = catalog.find(i => i.id === line.itemId);
                                return (
                                    <ReceptionLineItem 
                                        key={line.itemId} 
                                        line={line} 
                                        catalogItem={catItem}
                                        globalSettings={globalInventorySettings}
                                        onReceive={(qty, tracking) => handleReceive(line.itemId, qty, tracking)} 
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
        </div>
    );
};

export default ReceptionModal;
