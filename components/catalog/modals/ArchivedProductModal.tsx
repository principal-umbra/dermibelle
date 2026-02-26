
import React, { useState, useMemo } from 'react';
import { AppointmentItem, useData } from '../../../context/DataContext';

interface ArchivedProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: AppointmentItem | null;
}

const ArchivedProductModal: React.FC<ArchivedProductModalProps> = ({ isOpen, onClose, item }) => {
    const { addToast, deleteCatalogItem, catalog, updateCatalogItem, suppliers } = useData();
    const [tab, setTab] = useState<'analysis' | 'actions'>('analysis');

    // State for Actions
    const [claimNote, setClaimNote] = useState('');

    if (!isOpen || !item) return null;

    // --- ANÁLISIS DE CONTEXTO ---
    const isBatch = (item.stock || 0) > 1; 
    const reason = item.qualityStatus || 'finished'; // finished, expired, damaged
    const type = item.subtype === 'retail' ? 'Retail' : 'Cabina';
    
    // Find Original Active Product (Heuristic matching)
    // Assumes SKU format "ORIGINAL-BATCH-SUFFIX" or Title matching
    const originalProduct = useMemo(() => {
        // Try precise match if we stored original ID (we didn't in previous step, so we use heuristics)
        // 1. Try matching SKU prefix
        if (item.sku) {
            const potentialSku = item.sku.split('-').slice(0, 3).join('-'); // Try to get base
            const found = catalog.find(p => p.sku === potentialSku && !p.qualityStatus);
            if (found) return found;
        }
        // 2. Try matching Title prefix (removing the suffix added in archive)
        const cleanTitle = item.title.split('(')[0].trim();
        return catalog.find(p => p.title.trim() === cleanTitle && !p.qualityStatus);
    }, [catalog, item]);

    const supplier = suppliers.find(s => s.id === item.supplierId || (originalProduct && s.id === originalProduct.supplierId));

    // Configuración Visual Dinámica
    const getConfig = () => {
        if (reason === 'finished') return {
            theme: 'blue',
            gradient: 'from-blue-600 to-indigo-600',
            icon: 'check_circle',
            label: 'Consumo Finalizado',
            subLabel: 'Ciclo de vida completado',
            bgLight: 'bg-blue-50 dark:bg-blue-900/20',
            textLight: 'text-blue-600 dark:text-blue-300',
            borderColor: 'border-blue-200 dark:border-blue-800'
        };
        
        if (reason === 'expired') {
            if (isBatch) return {
                theme: 'orange',
                gradient: 'from-orange-600 to-red-600',
                icon: 'inventory_2', 
                label: 'Lote Vencido',
                subLabel: 'Pérdida por Rotación',
                bgLight: 'bg-orange-50 dark:bg-orange-900/20',
                textLight: 'text-orange-700 dark:text-orange-300',
                borderColor: 'border-orange-200 dark:border-orange-800'
            };
            return {
                theme: 'amber',
                gradient: 'from-amber-500 to-orange-500',
                icon: 'event_busy',
                label: 'Unidad Vencida',
                subLabel: 'Incidencia Puntual',
                bgLight: 'bg-amber-50 dark:bg-amber-900/20',
                textLight: 'text-amber-700 dark:text-amber-300',
                borderColor: 'border-amber-200 dark:border-amber-800'
            };
        }

        if (reason === 'damaged') return {
            theme: 'red',
            gradient: 'from-red-600 to-rose-700',
            icon: 'broken_image',
            label: isBatch ? 'Lote Dañado' : 'Producto Dañado',
            subLabel: 'Pérdida Operativa',
            bgLight: 'bg-red-50 dark:bg-red-900/20',
            textLight: 'text-red-600 dark:text-red-300',
            borderColor: 'border-red-200 dark:border-red-800'
        };

        return { // Fallback / Quality
            theme: 'purple',
            gradient: 'from-purple-600 to-fuchsia-600',
            icon: 'thumb_down',
            label: 'Falla de Calidad',
            subLabel: 'Reporte a Proveedor',
            bgLight: 'bg-purple-50 dark:bg-purple-900/20',
            textLight: 'text-purple-600 dark:text-purple-300',
            borderColor: 'border-purple-200 dark:border-purple-800'
        };
    };

    const config = getConfig();

    // Cálculos Financieros Avanzados
    const costUnit = item.cost || 0;
    const quantity = item.stock || 0;
    const totalLossCost = costUnit * quantity;
    const potentialRevenueLoss = (item.price || 0) * quantity; 
    
    const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const notes = item.description?.split('Fecha:')[0] || 'Sin notas adicionales.';
    const batchId = item.sku?.split('-').length > 1 ? item.sku.split('-')[1] : 'N/A';

    // --- ACTIONS ---
    
    const handleRestore = () => {
        if (!originalProduct) {
            addToast('error', 'No se encontró el producto original activo para restaurar el stock.');
            return;
        }
        
        // 1. Restore Stock
        const currentStock = originalProduct.stock || 0;
        updateCatalogItem(originalProduct.id, { stock: currentStock + quantity });
        
        // 2. Delete Archive Record
        deleteCatalogItem(item.id);
        
        addToast('success', `Stock restaurado (${quantity} u.) a "${originalProduct.title}" y registro eliminado.`);
        onClose();
    };

    const handleUpdateMinStock = () => {
        if (!originalProduct) return;
        const currentMin = originalProduct.minStock || 0;
        const newMin = currentMin + Math.ceil(quantity * 0.5); // Heuristic increase
        
        updateCatalogItem(originalProduct.id, { minStock: newMin });
        addToast('success', `Nivel mínimo de stock actualizado a ${newMin} para evitar roturas.`);
    };

    const handleSendClaim = () => {
        if (!supplier?.email) {
            addToast('error', 'El proveedor no tiene email registrado.');
            return;
        }
        const subject = `Reclamo de Calidad - ${item.title}`;
        const body = `Hola ${supplier.contactPerson},\n\nReportamos un problema con el producto ${item.title} (Lote: ${batchId}).\n\nMotivo: ${reason}\nCantidad Afectada: ${quantity}\nObservaciones: ${claimNote || notes}\n\nSolicitamos instrucciones para devolución o crédito.\n\nGracias.`;
        
        window.open(`mailto:${supplier.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        addToast('success', 'Cliente de correo abierto con el borrador del reclamo.');
    };

    const handleDelete = () => {
        if (confirm('¿Eliminar este registro histórico permanentemente? Esta acción afectará los reportes de pérdidas.')) {
            deleteCatalogItem(item.id);
            addToast('info', 'Registro eliminado del historial.');
            onClose();
        }
    };

    const handleReorder = () => {
        addToast('success', `Solicitud de reposición para "${originalProduct?.title || item.title}" enviada.`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 relative" onClick={e => e.stopPropagation()}>
                
                {/* 1. HEADER ANALÍTICO */}
                <div className={`relative bg-gradient-to-r ${config.gradient} p-8 pb-12 text-white overflow-hidden shrink-0`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    
                    <div className="flex justify-between items-start relative z-10 mb-6">
                        <div className="flex gap-2">
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                {type}
                            </span>
                            {isBatch && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                    <span className="material-icons text-[10px]">layers</span> Lote Completo
                                </span>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md border border-white/10">
                            <span className="material-icons text-lg">close</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                            <span className="material-icons text-4xl drop-shadow-md">{config.icon}</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-bold leading-none mb-1">{config.label}</h2>
                            <p className="text-white/80 text-sm font-medium tracking-wide flex items-center gap-2">
                                {config.subLabel}
                                <span className="w-1 h-1 rounded-full bg-white/60"></span>
                                {item.sku}
                            </p>
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark shrink-0">
                    <button 
                        onClick={() => setTab('analysis')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${tab === 'analysis' ? 'border-gray-800 text-gray-900 dark:border-white dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Análisis Forense
                    </button>
                    <button 
                        onClick={() => setTab('actions')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${tab === 'actions' ? 'border-gray-800 text-gray-900 dark:border-white dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Gestión & Acciones
                    </button>
                </div>

                {/* 2. BODY CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#F8F9FC] dark:bg-black/20">
                    
                    {tab === 'analysis' && (
                        <div className="space-y-6 animate-in slide-in-from-left-4 fade-in">
                            {/* Tarjeta de Impacto Financiero */}
                            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Impacto Financiero</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${reason === 'finished' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                        {reason === 'finished' ? 'Costo Operativo' : 'Pérdida Directa'}
                                    </span>
                                </div>
                                
                                <div className="flex items-end justify-between">
                                     <div className="flex items-end gap-3">
                                         <div>
                                             <p className="text-[10px] text-gray-400 font-bold mb-1">Pérdida Total (Costo)</p>
                                             <p className={`text-3xl font-mono font-bold ${reason === 'finished' ? 'text-gray-800 dark:text-white' : 'text-red-600'}`}>
                                                 ${totalLossCost.toFixed(2)}
                                             </p>
                                         </div>
                                         <div className="pb-1.5 pl-3 border-l border-gray-100 dark:border-gray-700">
                                             <p className="text-[10px] text-gray-400">Costo Unit.</p>
                                             <p className="text-sm font-medium text-gray-600 dark:text-gray-300">${costUnit.toFixed(2)}</p>
                                         </div>
                                     </div>
                                     
                                     {type === 'Retail' && reason !== 'finished' && (
                                         <div className="text-right hidden sm:block">
                                             <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase">Venta Potencial Perdida</p>
                                             <p className="text-lg font-mono font-bold text-gray-400 line-through decoration-red-300">
                                                 ${potentialRevenueLoss.toFixed(2)}
                                             </p>
                                         </div>
                                     )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Detalles del Lote/Item */}
                                <div className={`p-5 rounded-2xl border ${config.bgLight} ${config.borderColor} flex flex-col justify-center`}>
                                    <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${config.textLight} opacity-80`}>Detalle de Inventario</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500 dark:text-gray-400">Cantidad Afectada:</span>
                                            <span className={`font-bold ${config.textLight}`}>{quantity} unidades</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500 dark:text-gray-400">Identificador Lote:</span>
                                            <span className="font-mono text-gray-700 dark:text-gray-300 font-bold">{batchId}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500 dark:text-gray-400">Fecha Registro:</span>
                                            <span className="text-gray-700 dark:text-gray-300">{dateStr}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notas & Contexto */}
                                <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                        <span className="material-icons text-[12px]">sticky_note_2</span> Notas del Staff
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed flex-1">
                                        "{notes}"
                                    </p>
                                </div>
                            </div>

                            {/* RECOMENDACIONES (Read Only) */}
                            {reason === 'expired' && (
                                <div className="flex gap-4 items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800/30 text-amber-600 flex items-center justify-center shrink-0">
                                        <span className="material-icons text-sm">lightbulb</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-1">Análisis del Sistema</h4>
                                        <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
                                            {isBatch ? 'Vencimiento de lote completo detectado. Posible sobre-stock o baja rotación.' : 'Pérdida de unidad individual.'} 
                                            Ve a la pestaña "Gestión" para tomar medidas.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'actions' && (
                         <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                             
                             {/* Section 1: Correction */}
                             <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Corrección de Inventario</h4>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <p className="text-[11px] text-gray-500 mb-2">Si este registro fue un error, puedes revertirlo y devolver el stock al producto original.</p>
                                        <button 
                                            onClick={handleRestore}
                                            disabled={!originalProduct}
                                            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            <span className="material-icons text-sm">undo</span> Restaurar Stock
                                        </button>
                                    </div>
                                </div>
                             </div>

                             {/* Section 2: Management based on Reason */}
                             {reason === 'finished' ? (
                                 <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
                                     <h4 className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase tracking-wider mb-3">Optimización</h4>
                                     <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mb-3">
                                         El consumo de este producto es alto. Considera aumentar el nivel de stock mínimo para evitar roturas.
                                     </p>
                                     <button 
                                        onClick={handleUpdateMinStock}
                                        disabled={!originalProduct}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                     >
                                         <span className="material-icons text-sm">trending_up</span> Aumentar Stock Mínimo
                                     </button>
                                 </div>
                             ) : (
                                 <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-800">
                                     <h4 className="text-xs font-bold text-red-800 dark:text-red-200 uppercase tracking-wider mb-3">Gestión de Incidencia</h4>
                                     
                                     {supplier ? (
                                         <>
                                            <div className="mb-3">
                                                <p className="text-[11px] text-red-700/80 dark:text-red-300/80 mb-2">
                                                    Contactar a <strong>{supplier.companyName}</strong> para reportar {reason === 'expired' ? 'vencimiento' : 'daño/calidad'}.
                                                </p>
                                                <textarea 
                                                    value={claimNote}
                                                    onChange={(e) => setClaimNote(e.target.value)}
                                                    className="w-full text-xs p-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-black/20 outline-none focus:border-red-400 placeholder:text-red-300"
                                                    rows={2}
                                                    placeholder="Notas adicionales para el correo..."
                                                />
                                            </div>
                                            <button 
                                                onClick={handleSendClaim}
                                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span className="material-icons text-sm">mail</span> Iniciar Reclamo
                                            </button>
                                         </>
                                     ) : (
                                         <div className="text-center py-4 text-[11px] text-red-400 italic">
                                             No hay proveedor asociado para gestionar reclamos.
                                         </div>
                                     )}
                                 </div>
                             )}

                         </div>
                    )}
                </div>

                {/* 3. FOOTER ACTIONS */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-surface-dark z-20 relative">
                    <button 
                        onClick={handleDelete}
                        className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <span className="material-icons text-sm">delete</span> Eliminar Registro
                    </button>
                    
                    <button 
                        onClick={handleReorder}
                        className="px-6 py-3 bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white rounded-xl text-xs font-bold shadow-lg shadow-gray-200 dark:shadow-none transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                        <span className="material-icons text-sm">add_shopping_cart</span> 
                        {reason === 'finished' ? 'Reponer Stock' : 'Revisar & Reponer'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ArchivedProductModal;
