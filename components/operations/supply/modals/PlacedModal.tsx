
import React, { useState } from 'react';
import { OrderModalProps } from './OrderModalTypes';
import { useData } from '../../../../context/DataContext';

export const PlacedModal: React.FC<OrderModalProps> = ({ order, supplier, onClose, updateOrderCtx, addToast }) => {
    const { supplierInvoices, updateSupplierInvoice } = useData(); // Use context here
    
    // Modo de vista: 'dashboard', 'tracking', 'items'
    const [viewMode, setViewMode] = useState<'dashboard' | 'tracking' | 'items'>('dashboard');
    
    // Estados de confirmación local para evitar window.confirm
    const [confirmAction, setConfirmAction] = useState<'revert' | 'cancel' | null>(null);
    
    // Estados de Formulario Logístico
    const isPickup = order.shippingMethod === 'pickup';
    const isRevisionSent = order.status === 'Revision Sent';
    const [deliveryType, setDeliveryType] = useState<'courier' | 'direct'>('courier');
    
    const [trackingNumber, setTrackingNumber] = useState('');
    const [courierName, setCourierName] = useState('');
    const [eta, setEta] = useState('');
    const [shippingCost, setShippingCost] = useState(order.shippingCost ? order.shippingCost.toString() : '');
    const [fileName, setFileName] = useState<string | null>(null);

    // Acción: Avanzar a "En Tránsito"
    const handleMarkInTransit = () => {
        if (!eta) {
            addToast('error', isPickup ? 'Ingresa la fecha de recolección.' : 'La fecha estimada (ETA) es obligatoria.');
            return;
        }
        
        const shipCost = parseFloat(shippingCost) || 0;

        // 1. Update Order
        updateOrderCtx(order.id, { 
            status: 'In Transit',
            shippingCost: shipCost,
            // Save logistics data would go here in a real app (e.g. trackingNumber, etc)
        }); 

        // 2. Mutate Finance Document (Shadow Invoice -> Real Pending Invoice)
        // Look for the "Shadow Invoice" created in Draft stage (PO-...)
        // It should be linked by `linkedOrderId`
        const shadowInvoice = supplierInvoices.find(inv => inv.linkedOrderId === order.id);
        
        if (shadowInvoice) {
            // Recalculate total for invoice: Subtotal (from order lines) + Shipping + Tax (if any)
            // Ensure subtotal is correct (recalculate from lines if possible)
            const subtotal = (order.lines && order.lines.length > 0)
                ? order.lines.reduce((acc, line) => acc + (line.price * line.qty), 0)
                : (shadowInvoice.subtotal || shadowInvoice.amount);
            
            const newAmount = subtotal + shipCost + (shadowInvoice.taxAmount || 0);

            updateSupplierInvoice(shadowInvoice.id, {
                status: 'Pending Approval', // Now it's a real pending obligation
                itemsDescription: `En Tránsito (ETA: ${new Date(eta).toLocaleDateString()}) - ${order.items}`,
                subtotal: subtotal,
                shippingCost: shipCost,
                amount: newAmount,
                history: [
                    {
                        date: new Date().toISOString(),
                        action: 'Updated',
                        user: 'Sistema',
                        note: `Orden marcada en tránsito. Costo envío: $${shipCost}. Documento activado.`
                    },
                    ...(shadowInvoice.history || [])
                ]
            });
            addToast('success', isPickup ? 'Orden lista para recolección. Factura activada en Finanzas.' : 'Despacho registrado. Factura activada en Finanzas.');
        } else {
             addToast('success', isPickup ? 'Orden lista para recolección.' : 'Despacho registrado.');
        }

        // No cerramos, dejamos que el OrderDetailManager cambie la vista al TransitModal automáticamente (reactively via order status)
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    // Lógica Segura: Acción Revertir
    const handleRevertClick = () => {
        if (confirmAction === 'revert') {
            // Ejecutar acción confirmada
            updateOrderCtx(order.id, { status: 'Draft' });
            addToast('success', 'Orden devuelta a borrador para edición.');
            setConfirmAction(null);
            // El componente padre detectará el cambio de estado y montará DraftModal
        } else {
            // Pedir confirmación
            setConfirmAction('revert');
            // Resetear después de 3 segundos si no confirma
            setTimeout(() => setConfirmAction(null), 3000);
        }
    };

    // Lógica Segura: Acción Cancelar
    const handleCancelClick = () => {
        if (confirmAction === 'cancel') {
            updateOrderCtx(order.id, { status: 'Cancelled' });
            addToast('info', 'Orden cancelada.');
            setConfirmAction(null);
        } else {
            setConfirmAction('cancel');
            setTimeout(() => setConfirmAction(null), 3000);
        }
    };

    // Acción: Contacto
    const handleContact = (method: 'email' | 'phone') => {
        if (method === 'email' && supplier.email) {
             window.open(`mailto:${supplier.email}?subject=Consulta Orden ${order.idDisplay}&body=Hola ${supplier.contactPerson},%0D%0A%0D%0AConsultando el estado de la orden ${order.idDisplay} enviada el ${new Date(order.date).toLocaleDateString()}.%0D%0A%0D%0AGracias.`);
        } else if (method === 'phone' && supplier.phone) {
             window.location.href = `tel:${supplier.phone}`;
        } else {
            addToast('error', 'Información de contacto no disponible');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-[#F8F9FC] dark:bg-surface-dark w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* HEADER: Estado Actual */}
                <div className="bg-white dark:bg-black/20 px-8 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 ${isRevisionSent ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                            <span className="material-icons text-2xl">{isRevisionSent ? 'rate_review' : 'send'}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                                    {isRevisionSent ? 'Propuesta Enviada' : 'Orden Enviada'}
                                </h2>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${isRevisionSent ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                    {isRevisionSent ? 'Esperando Aceptación' : 'Esperando'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isRevisionSent 
                                    ? 'Se han enviado cambios al proveedor. Esperando su confirmación final.' 
                                    : <>La orden <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{order.idDisplay}</span> fue notificada al proveedor.</>}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
                        <span className="material-icons text-lg">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    
                    {/* VISUAL TIMELINE */}
                    <div className="flex items-center justify-between mb-8 px-6 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                        
                        <div className="flex flex-col items-center gap-1.5 bg-[#F8F9FC] dark:bg-surface-dark px-2 z-10 opacity-60">
                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                                <span className="material-icons text-xs">check</span>
                            </div>
                            <span className="text-[9px] font-bold text-gray-500 uppercase">Borrador</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 bg-[#F8F9FC] dark:bg-surface-dark px-2 z-10">
                            <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center shadow-lg ring-4 ${isRevisionSent ? 'bg-indigo-600 ring-indigo-50' : 'bg-blue-600 ring-blue-50'}`}>
                                <span className="material-icons text-sm">{isRevisionSent ? 'rate_review' : 'send'}</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase ${isRevisionSent ? 'text-indigo-600' : 'text-blue-600'}`}>
                                {isRevisionSent ? 'Revisión' : 'Enviada'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 bg-[#F8F9FC] dark:bg-surface-dark px-2 z-10 opacity-40">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 flex items-center justify-center">
                                <span className="material-icons text-xs">local_shipping</span>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Tránsito</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 bg-[#F8F9FC] dark:bg-surface-dark px-2 z-10 opacity-40">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 flex items-center justify-center">
                                <span className="material-icons text-xs">inventory</span>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Recepción</span>
                        </div>
                    </div>

                    {viewMode === 'dashboard' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                            
                            {/* INFO CARDS GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Proveedor Card */}
                                <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                                        <span className="material-icons text-6xl text-gray-400">store</span>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Proveedor Destino</p>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{supplier.companyName}</h3>
                                        <p className="text-xs text-gray-500 mb-4">{supplier.contactPerson}</p>
                                        
                                        <div className="flex gap-2">
                                            <button onClick={() => handleContact('email')} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold border border-gray-200 transition-colors flex items-center justify-center gap-1">
                                                <span className="material-icons text-xs">mail</span> Email
                                            </button>
                                            <button onClick={() => handleContact('phone')} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold border border-gray-200 transition-colors flex items-center justify-center gap-1">
                                                <span className="material-icons text-xs">call</span> Llamar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Resumen Orden Card */}
                                <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-3 opacity-5">
                                        <span className="material-icons text-6xl text-gray-400">receipt_long</span>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resumen Solicitud</p>
                                            <button 
                                                onClick={() => setViewMode('items')}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                                            >
                                                Ver Detalle Items <span className="material-icons text-[10px]">arrow_forward</span>
                                            </button>
                                        </div>
                                        <div className="space-y-2.5">
                                            <div className="flex justify-between items-center text-xs pb-2 border-b border-dashed border-gray-100 dark:border-gray-700">
                                                <span className="text-gray-500">Fecha Envío</span>
                                                <span className="font-bold text-gray-900 dark:text-white">{new Date(order.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs pb-2 border-b border-dashed border-gray-100 dark:border-gray-700">
                                                <span className="text-gray-500">Método Pref.</span>
                                                <span className="font-bold text-gray-900 dark:text-white capitalize">
                                                    {isPickup ? 'Pickup (Recogida)' : order.shippingMethod === 'express' ? 'Express Air' : 'Standard Ground'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1">
                                                <span className="text-xs font-bold text-gray-500">Monto Total</span>
                                                <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">${order.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MAIN ACTION: WAITING STATE */}
                            <div className={`border rounded-2xl p-6 text-center ${isRevisionSent ? 'bg-indigo-50/50 border-indigo-100' : 'bg-blue-50/50 border-blue-100'}`}>
                                <div className={`w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm ${isRevisionSent ? 'text-indigo-500' : 'text-blue-500'}`}>
                                    <span className="material-icons animate-pulse">pending</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                    {isRevisionSent ? 'Esperando Aceptación de Propuesta' : isPickup ? 'Esperando Aviso para Recoger' : 'Esperando Confirmación de Envío'}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto leading-relaxed">
                                    {isRevisionSent 
                                        ? 'El proveedor debe revisar y aceptar los cambios propuestos en la orden.'
                                        : isPickup 
                                            ? 'El proveedor debe confirmar que el pedido está listo para ser retirado.' 
                                            : 'Estamos a la espera de que el proveedor procese el pedido y envíe los datos de seguimiento.'}
                                </p>
                                {!isRevisionSent && (
                                    <button 
                                        onClick={() => setViewMode('tracking')}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mx-auto transform hover:-translate-y-0.5"
                                    >
                                        <span className="material-icons text-sm">{isPickup ? 'store' : 'local_shipping'}</span>
                                        {isPickup ? 'Confirmar Recolección' : 'Registrar Despacho'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : viewMode === 'items' ? (
                        /* ITEMS DETAIL VIEW */
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <button 
                                onClick={() => setViewMode('dashboard')}
                                className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2"
                            >
                                <span className="material-icons text-sm">arrow_back</span> Volver al Resumen
                            </button>

                            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-black/10 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Detalle de Productos</h3>
                                    <span className="text-xs font-mono font-bold text-gray-500">{order.lines?.length || 0} items</span>
                                </div>
                                <div className="p-0">
                                    {order.lines && order.lines.length > 0 ? (
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-gray-50 dark:bg-white/5 text-gray-400 font-bold uppercase">
                                                <tr>
                                                    <th className="px-4 py-2">Producto</th>
                                                    <th className="px-4 py-2 text-center">Cant.</th>
                                                    <th className="px-4 py-2 text-right">Unitario</th>
                                                    <th className="px-4 py-2 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {order.lines.map((line, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{line.title}</td>
                                                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{line.qty}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">${line.price.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 dark:text-white">${(line.qty * line.price).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-6 text-center">
                                            <p className="text-sm text-gray-500 italic mb-2">Detalle no estructurado disponible:</p>
                                            <p className="text-xs bg-gray-100 dark:bg-white/10 p-3 rounded-lg">{order.items}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* TRACKING FORM VIEW */
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <button 
                                onClick={() => setViewMode('dashboard')}
                                className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2"
                            >
                                <span className="material-icons text-sm">arrow_back</span> Volver al Resumen
                            </button>
                            
                            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                                    <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                        <span className="material-icons text-lg">{isPickup ? 'store' : 'local_shipping'}</span> 
                                        {isPickup ? 'Coordinar Recolección' : 'Registrar Despacho'}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isPickup 
                                            ? 'Confirma que el pedido está listo para ser retirado en la ubicación del proveedor.' 
                                            : 'Ingresa los datos proporcionados por el proveedor para activar el seguimiento.'}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {!isPickup && (
                                        <div className="bg-gray-50 dark:bg-black/20 p-1 rounded-xl flex mb-2">
                                            <button onClick={() => setDeliveryType('courier')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${deliveryType === 'courier' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Courier Externo</button>
                                            <button onClick={() => setDeliveryType('direct')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${deliveryType === 'direct' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Entrega Directa</button>
                                        </div>
                                    )}

                                    {!isPickup && deliveryType === 'courier' && (
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Empresa de Transporte</label>
                                            <div className="relative">
                                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">local_shipping</span>
                                                <input value={courierName} onChange={e => setCourierName(e.target.value)} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Ej: DHL, FedEx..." autoFocus />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Ref. Rastreo</label>
                                            <div className="relative">
                                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">qr_code</span>
                                                <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" placeholder="Ej: 1Z999..." />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">{isPickup ? 'Fecha Recolección' : 'Fecha Estimada (ETA)'} *</label>
                                            <div className="relative">
                                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">event</span>
                                                <input type="date" value={eta} onChange={e => setEta(e.target.value)} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Costo de Envío (USD)</label>
                                            <div className="relative">
                                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">attach_money</span>
                                                <input 
                                                    type="number" 
                                                    value={shippingCost} 
                                                    onChange={e => setShippingCost(e.target.value)} 
                                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" 
                                                    placeholder="0.00" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button onClick={handleMarkInTransit} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                                    <span className="material-icons text-sm">check_circle</span>
                                    {isPickup ? 'Marcar Listo para Recoger' : 'Confirmar & Mover a Tránsito'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* FOOTER */}
                <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0">
                    <div className="flex gap-2">
                        <button 
                            onClick={handleRevertClick}
                            className={`text-xs font-bold flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-lg border 
                                ${confirmAction === 'revert' 
                                    ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm animate-pulse' 
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-white dark:hover:bg-white/5 border-transparent hover:border-gray-200'}`}
                        >
                            <span className="material-icons text-sm">{confirmAction === 'revert' ? 'warning' : 'undo'}</span> 
                            {confirmAction === 'revert' ? '¿Confirmar Regreso?' : 'Corregir / Volver a Borrador'}
                        </button>
                        
                        <button 
                            onClick={handleCancelClick}
                            className={`text-xs font-bold flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-lg border 
                                ${confirmAction === 'cancel' 
                                    ? 'bg-red-100 text-red-700 border-red-200 shadow-sm animate-pulse' 
                                    : 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-transparent hover:border-red-100'}`}
                        >
                            <span className="material-icons text-sm">{confirmAction === 'cancel' ? 'report' : 'block'}</span> 
                            {confirmAction === 'cancel' ? '¿Confirmar Cancelación?' : 'Cancelar Orden'}
                        </button>
                    </div>
                    {viewMode === 'dashboard' && (
                        <p className="text-[10px] text-gray-400 italic hidden sm:block">
                            La orden permanecerá aquí hasta que {isPickup ? 'confirmes recolección' : 'registres despacho'}.
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
};
