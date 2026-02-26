
import React, { useState, useMemo } from 'react';
import { Order, Supplier, useData } from '../../../../context/DataContext';

interface ShippingDisputeResolutionModalProps {
    order: Order;
    supplier: Supplier;
    originalShipping: number;
    newShipping: number;
    onClose: () => void;
    onConfirm: () => void;
}

export const ShippingDisputeResolutionModal: React.FC<ShippingDisputeResolutionModalProps> = ({
    order,
    supplier,
    originalShipping,
    newShipping,
    onClose,
    onConfirm
}) => {
    const { addToast } = useData();
    const [showContextSidebar, setShowContextSidebar] = useState(false);
    const orderData = order as any;

    const diff = newShipping - originalShipping;
    const isIncrease = diff > 0;
    const isNewFee = originalShipping === 0; // Detect if this is a newly established fee vs a change
    
    // --- EXTENDED CONTEXT ANALYSIS ---
    const extendedContext = useMemo(() => {
        // 1. Parse Notes & Responsible
        const rawNote = order.notes || '';
        let respName = supplier.contactPerson || 'Proveedor';
        let respEmail = supplier.email || '';
        let respPhone = supplier.phone || '';
        let isManual = false;

        // Try to parse "Name (Email | Phone)" format from PortalConfirmationModal
        const manualPattern = /\(Resp: (.*?)\s*\((.*?)\s*\|\s*(.*?)\)\)/;
        const match = rawNote.match(manualPattern);

        if (match) {
            respName = match[1].trim();
            respEmail = match[2].trim();
            respPhone = match[3].trim();
            isManual = true;
        } else {
            // Fallback to simple format "(Resp: Name)"
            const simpleMatch = rawNote.match(/\(Resp: (.*?)\)/);
            if (simpleMatch) {
                respName = simpleMatch[1].trim();
                const contact = supplier.contacts?.find(c => c.name === respName);
                if (contact) {
                    respEmail = contact.email || respEmail;
                    respPhone = contact.phone || respPhone;
                }
            }
        }

        let cleanNote = rawNote.replace(/\(Resp: .*?\)/, '').trim();
        cleanNote = cleanNote.replace(/^\[.*?\]:/, '').trim();

        // 2. Logistics Details & Type Detection
        const method = order.shippingMethod || 'standard';
        let logisticsType = 'Courier Externo';
        if (method === 'pickup') logisticsType = 'Pickup en Tienda';
        // Check if fleet was selected by vendor (might be in order data or inferred)
        if (method === 'fleet' || orderData.shippingMethod === 'fleet') logisticsType = 'Flota Propia';

        // 3. Finance Deadline Calculation
        const terms = order.paymentTerms || supplier.paymentTerms || 'Contado';
        let deadlineDesc = 'Pago inmediato contra entrega.';
        if (terms.includes('Net')) {
            const days = parseInt(terms.split(' ')[1]) || 30;
            const date = new Date();
            date.setDate(date.getDate() + days);
            deadlineDesc = `Vence aprox: ${date.toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'})}`;
        }
        
        return {
            responsible: {
                name: respName,
                email: respEmail,
                phone: respPhone,
                isManual
            },
            notes: cleanNote || 'Sin comentarios adicionales.',
            finance: {
                terms: terms,
                deadline: deadlineDesc
            },
            logistics: {
                type: logisticsType,
                // Common / Courier
                carrier: orderData.carrier || '-',
                tracking: orderData.trackingNumber || '-',
                eta: orderData.eta ? new Date(orderData.eta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Pendiente',
                // Fleet
                driver: orderData.driverName,
                plate: orderData.vehiclePlate,
                driverPhone: orderData.driverPhone,
                // Pickup
                pickupAddress: orderData.pickupAddress || supplier.address,
                pickupRef: orderData.pickupReference,
                pickupHours: orderData.pickupHours
            }
        };
    }, [order, supplier]);

    // Determine Theme based on Logistics Type
    const isFleet = extendedContext.logistics.type === 'Flota Propia';
    const isPickup = extendedContext.logistics.type === 'Pickup en Tienda';

    const mainIcon = isFleet ? 'directions_car' : 'local_shipping';
    const mainColor = isFleet ? 'text-purple-500' : 'text-orange-500';
    const bgColor = isFleet ? 'bg-purple-100' : 'bg-orange-100';
    const darkBgColor = isFleet ? 'dark:bg-purple-900/20' : 'dark:bg-orange-900/20';

    // Sidebar Logistics Theme Variables (Defined here to avoid reference errors)
    const logIcon = isFleet ? 'directions_car' : isPickup ? 'storefront' : 'local_shipping';
    const logColor = isFleet ? 'text-purple-500' : isPickup ? 'text-emerald-500' : 'text-blue-500';
    const logBg = isFleet ? 'bg-purple-50 dark:bg-purple-900/10' : isPickup ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-blue-50 dark:bg-blue-900/10';
    const logBorder = isFleet ? 'border-purple-100 dark:border-purple-800' : isPickup ? 'border-emerald-100 dark:border-emerald-800' : 'border-blue-100 dark:border-blue-800';
    const logTitleColor = isFleet ? 'text-purple-700 dark:text-purple-300' : isPickup ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300';
    const logBorderSub = isFleet ? 'border-purple-200 dark:border-purple-800' : 'border-orange-200 dark:border-orange-800';


    // --- CONTACT ACTIONS RESOLVER ---
    const contactActions = useMemo(() => {
        const { email, phone, name } = extendedContext.responsible;
        return { email, phone, name };
    }, [extendedContext.responsible]);

    const handleContact = (type: 'whatsapp' | 'email' | 'call') => {
        const { email, phone } = contactActions;
        
        if (type === 'whatsapp' && phone) {
             window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
        } else if (type === 'email' && email) {
             window.location.href = `mailto:${email}?subject=Revisión Costo Envío Orden #${order.idDisplay}`;
        } else if (type === 'call' && phone) {
             window.location.href = `tel:${phone}`;
        } else {
             addToast('error', 'Información de contacto no disponible');
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#1e2024] w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300 h-[85vh] max-h-[800px]" onClick={e => e.stopPropagation()}>
                
                {/* HEADER */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start shrink-0 bg-white dark:bg-[#1e2024]">
                    <div className="flex gap-6 items-center">
                        <div>
                            <div className={`flex items-center gap-2 mb-1 ${mainColor}`}>
                                <span className="material-icons text-xl">{mainIcon}</span>
                                <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                                    {isNewFee ? 'Definición de Costo' : 'Cambio en Envío'}
                                </h2>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Propuesta de <strong className="text-gray-700 dark:text-gray-300">{supplier.companyName}</strong>.
                            </p>
                        </div>
                         <button 
                            onClick={() => setShowContextSidebar(!showContextSidebar)}
                            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all uppercase tracking-wide ${showContextSidebar ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                        >
                            <span className="material-icons text-sm">info</span> {showContextSidebar ? 'Ocultar Contexto' : 'Ver Contexto'}
                        </button>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">NUEVO TOTAL ESTIMADO</p>
                        <p className="text-3xl font-display font-bold text-gray-900 dark:text-white">${order.total.toFixed(2)}</p>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">

                    {/* SIDEBAR - CONTEXT */}
                    {showContextSidebar && (
                        <div className="w-72 bg-white dark:bg-[#15171B] border-r border-gray-200 dark:border-gray-800 p-6 overflow-y-auto shrink-0 animate-in slide-in-from-left-4 z-20 shadow-lg flex flex-col gap-6">
                            
                            {/* SECTION: RESPONSIBLE */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span className="material-icons text-sm text-blue-500">badge</span> Responsable
                                </p>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{extendedContext.responsible.name}</p>
                                    {(extendedContext.responsible.email || extendedContext.responsible.phone) && (
                                        <div className="mt-1 space-y-0.5">
                                            {extendedContext.responsible.email && <p className="text-[11px] text-blue-700 dark:text-blue-300">{extendedContext.responsible.email}</p>}
                                            {extendedContext.responsible.phone && <p className="text-[11px] text-blue-700 dark:text-blue-300">{extendedContext.responsible.phone}</p>}
                                        </div>
                                    )}
                                    {extendedContext.responsible.isManual && (
                                        <span className="mt-2 inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[9px] font-bold rounded uppercase">
                                            Ingreso Manual
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* SECTION: FINANCE */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span className="material-icons text-sm text-green-500">payments</span> Información de Pago
                                </p>
                                <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">Condiciones:</span>
                                        <span className="text-[11px] text-green-700 dark:text-green-400 font-bold">{extendedContext.finance.terms}</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-green-200 dark:border-green-800">
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-bold mb-0.5">Vencimiento Estimado</span>
                                        <span className="text-xs text-green-700 dark:text-green-300">{extendedContext.finance.deadline}</span>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: LOGISTICS (DYNAMIC) */}
                            <div>
                                <p className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5`}>
                                    <span className={`material-icons text-sm ${logColor}`}>{logIcon}</span> Protocolo de Envío
                                </p>
                                <div className={`p-3 ${logBg} rounded-xl border ${logBorder} space-y-2`}>
                                    
                                    <div className={`flex justify-between items-center pb-2 border-b ${logBorderSub}`}>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Método:</span>
                                        <span className={`text-[10px] font-bold ${logTitleColor} bg-white dark:bg-white/10 px-2 py-0.5 rounded`}>{extendedContext.logistics.type}</span>
                                    </div>

                                    {/* COURIER */}
                                    {extendedContext.logistics.type === 'Courier Externo' && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">Empresa:</span>
                                                <span className="text-[10px] font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{extendedContext.logistics.carrier}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">Tracking:</span>
                                                <span className="text-[10px] font-mono font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{extendedContext.logistics.tracking}</span>
                                            </div>
                                        </>
                                    )}

                                    {/* FLEET */}
                                    {extendedContext.logistics.type === 'Flota Propia' && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">Rastreo:</span>
                                                <span className="text-[10px] font-mono font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{extendedContext.logistics.tracking}</span>
                                            </div>
                                            {extendedContext.logistics.driverPhone && (
                                                <div className="flex justify-between">
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Tel:</span>
                                                    <span className="text-[10px] font-mono font-bold text-gray-900 dark:text-white">{extendedContext.logistics.driverPhone}</span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* PICKUP */}
                                    {extendedContext.logistics.type === 'Pickup en Tienda' && (
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-gray-500 dark:text-gray-400">Dirección:</p>
                                            <p className="text-[10px] font-bold text-gray-900 dark:text-white leading-tight">{extendedContext.logistics.pickupAddress}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">ETA:</span>
                                        <span className="text-[10px] font-bold text-gray-900 dark:text-white">{extendedContext.logistics.eta}</span>
                                    </div>
                                </div>
                            </div>

                             {/* SECTION: PROVIDER NOTE */}
                             <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span className="material-icons text-sm text-gray-400">chat</span> Mensaje Proveedor
                                </p>
                                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-xs italic text-gray-600 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-gray-700 relative">
                                    <span className="material-icons absolute top-2 left-2 text-gray-300 text-lg opacity-50">format_quote</span>
                                    <span className="pl-4 block">"{extendedContext.notes}"</span>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FA] dark:bg-black/10">
                        
                        {/* CENTRAL COMPARISON */}
                        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar space-y-6 flex flex-col justify-center">
                            <div className="bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-3xl p-10 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-2 ${isFleet ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
                                
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${bgColor} ${darkBgColor} ${mainColor}`}>
                                    <span className="material-icons text-4xl">{mainIcon}</span>
                                </div>

                                <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
                                    {isNewFee ? 'Tarifa de Envío Establecida' : 'Ajuste de Tarifa Logística'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                                    {isNewFee 
                                        ? `El proveedor ha establecido el costo de ${isFleet ? 'entrega con su flota' : 'envío'} para esta orden. Este cargo no estaba definido previamente.`
                                        : `El proveedor ha actualizado el costo de ${isFleet ? 'entrega con su flota' : 'envío'} para esta orden. No se han reportado cambios en los productos solicitados.`
                                    }
                                </p>

                                {/* Comparison Box */}
                                <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 w-full max-w-xl mx-auto">
                                    <div className="text-center px-4 flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                            {isNewFee ? 'TARIFA PREVIA' : 'TARIFA ORIGINAL'}
                                        </p>
                                        <p className={`text-2xl font-mono font-bold ${isNewFee ? 'text-gray-400' : 'text-gray-400 line-through decoration-gray-300 decoration-2'}`}>
                                            {isNewFee ? 'No Definida' : `$${originalShipping.toFixed(2)}`}
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-col items-center px-4">
                                        <span className={`material-icons text-2xl mb-1 ${isFleet ? 'text-purple-500' : 'text-orange-500'}`}>arrow_forward</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isFleet ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {isNewFee ? 'Nuevo Cargo' : (isIncrease ? 'Aumento' : 'Descuento')}
                                        </span>
                                    </div>

                                    <div className="text-center px-4 flex-1">
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isFleet ? 'text-purple-500' : 'text-orange-500'}`}>
                                            {isNewFee ? 'TARIFA ESTABLECIDA' : 'NUEVA TARIFA'}
                                        </p>
                                        <p className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
                                            ${newShipping.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-[10px] text-gray-400 italic mt-6">
                                    * Al confirmar, se actualizará el total de la orden y se procederá al despacho.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1e2024] flex justify-between items-center shrink-0">
                    {/* CONTACT BUTTONS */}
                    <div className="flex items-center gap-1 pl-4 border-l border-gray-200 dark:border-gray-700 h-8">
                         <button onClick={() => handleContact('whatsapp')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors" title={`WhatsApp: ${contactActions.phone || 'No disponible'}`}><span className="material-icons text-sm">chat</span></button>
                         <button onClick={() => handleContact('email')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/40 transition-colors" title={`Email: ${contactActions.email || 'No disponible'}`}><span className="material-icons text-sm">mail</span></button>
                         <button onClick={() => handleContact('call')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors" title={`Llamar: ${contactActions.phone || 'No disponible'}`}><span className="material-icons text-sm">call</span></button>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            Cancelar
                        </button>
                        <button onClick={onConfirm} className="px-8 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                            <span className="material-icons text-sm">check_circle</span>
                            Confirmar Resolución
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
