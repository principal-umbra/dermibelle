
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderModalProps } from './OrderModalTypes';
import { useData, AppointmentItem } from '../../../../context/DataContext';
import SmartCatalog from '../../order/SmartCatalog';

export const DraftModal: React.FC<OrderModalProps> = ({ order, supplier, onClose, updateOrderCtx, addToast }) => {
    const { catalog, supplierInvoices, updateSupplierInvoice, addSupplierInvoice, suppliers } = useData();
    const navigate = useNavigate();
    
    // --- ESTADOS LOCALES PARA EDICIÓN ---
    const [localLines, setLocalLines] = useState<any[]>([]);
    
    // Configuración Lateral
    const [shippingMethod, setShippingMethod] = useState('ground');
    const [paymentTerms, setPaymentTerms] = useState('Contado');
    const [internalNote, setInternalNote] = useState('');
    
    // Estado Visual
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    
    // Estados Catálogo (Overlay)
    const [searchTerm, setSearchTerm] = useState('');
    const [selectionMode, setSelectionMode] = useState<'product' | 'need'>('product');
    const [showTemplates, setShowTemplates] = useState(false);

    // Inicialización
    useEffect(() => {
        if (order) {
            // Mapear líneas existentes
            if (order.lines && order.lines.length > 0) {
                setLocalLines(order.lines);
            } else {
                // Si no hay líneas estructuradas pero hay texto 'items'
                setLocalLines([]);
            }
            
            setShippingMethod(order.shippingMethod || 'ground');
            setPaymentTerms(order.paymentTerms || 'Contado');
            setInternalNote(''); // Si hubiera nota en la orden, se cargaría aquí
        }
    }, [order]);

    // --- CÁLCULOS DINÁMICOS ---
    const subtotal = useMemo(() => localLines.reduce((acc, line) => acc + (line.price * line.qty), 0), [localLines]);
    
    // Helper para obtener costo real del proveedor
    const getShippingRate = (method: string) => {
        const costs = supplier.shippingCosts || { standard: 15, express: 55, pickup: 0 };
        if (method === 'express') return costs.express;
        if (method === 'ground') return costs.standard;
        if (method === 'pickup') return costs.pickup;
        return 0;
    };

    const shippingCost = useMemo(() => getShippingRate(shippingMethod), [shippingMethod, supplier]);
    const discount = 0; 
    const total = subtotal + shippingCost - discount;

    // --- LÓGICA DE CONTACTOS ---
    const contactList = useMemo(() => {
        if (supplier.contacts && supplier.contacts.length > 0) {
            return supplier.contacts;
        }
        // Fallback al contacto principal si no hay array de contactos
        return [{
            id: 'main',
            name: supplier.contactPerson,
            email: supplier.email,
            phone: supplier.phone,
            role: 'Principal'
        }];
    }, [supplier]);

    // --- HANDLERS ---
    const handleNavigateToProfile = () => {
        onClose(); // Cerrar modal primero
        navigate(`/admin/crm/suppliers/${supplier.id}`);
    };

    const handleWhatsApp = (phone: string) => {
        if (!phone) return;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
    };

    const handleCall = (phone: string) => {
        if (!phone) return;
        window.location.href = `tel:${phone}`;
    };

    const handleEmail = (email: string) => {
        if (!email) return;
        window.location.href = `mailto:${email}`;
    };

    const handleUpdateQty = (idx: number, delta: number) => {
        setLocalLines(prev => {
            const newLines = [...prev];
            const newLine = { ...newLines[idx] };
            newLine.qty = Math.max(1, newLine.qty + delta);
            newLines[idx] = newLine;
            return newLines;
        });
    };

    // Nuevo handler para actualizar por ID (usado por el catálogo)
    const handleUpdateQtyByItemId = (itemId: string | number, delta: number) => {
        setLocalLines(prev => {
            const index = prev.findIndex(l => l.itemId === itemId);
            if (index === -1) return prev; 
            
            const newLines = [...prev];
            const currentQty = newLines[index].qty;
            const newQty = currentQty + delta;
            
            if (newQty <= 0) {
                // Eliminar si llega a 0
                return prev.filter((_, i) => i !== index);
            } else {
                newLines[index] = { ...newLines[index], qty: newQty };
                return newLines;
            }
        });
    };

    const handleRemoveItem = (idx: number) => {
        if(confirm('¿Eliminar este item?')) {
            setLocalLines(prev => prev.filter((_, i) => i !== idx));
        }
    };

    const handleAddItem = (item: AppointmentItem) => {
        setLocalLines(prev => {
            const existingIdx = prev.findIndex(l => l.itemId === item.id);
            if (existingIdx >= 0) {
                const newLines = [...prev];
                newLines[existingIdx].qty += 1;
                return newLines;
            }
            return [...prev, {
                itemId: item.id,
                title: item.title,
                qty: 1,
                price: item.cost || (item.price * 0.4), // Costo estimado si no hay cost
                receivedQty: 0
            }];
        });
        addToast('success', 'Item agregado');
    };

    const handleSaveDraft = () => {
        updateOrderCtx(order.id, {
            lines: localLines,
            total: total,
            shippingMethod,
            paymentTerms,
            items: localLines.map(l => l.title).join(', ') 
        });
        addToast('success', 'Borrador actualizado');
        onClose();
    };

    const handleSendOrder = () => {
        if (localLines.length === 0) {
            addToast('error', 'La orden debe tener al menos un item');
            return;
        }

        // 1. Update Order Status
        updateOrderCtx(order.id, {
            lines: localLines,
            // If we are sending for the first time (Draft -> Placed), set baselines
            originalLines: localLines, 
            initialLines: order.initialLines || localLines, // Preserve if exists, else set
            total: total,
            shippingMethod,
            shippingCost: shippingCost, // Save explicit shipping cost
            paymentTerms,
            status: 'Placed',
            items: localLines.map(l => l.title).join(', ')
        });

        // 2. Generate or Update "Shadow Invoice" (Purchase Order) in Finance
        const invoiceId = `PO-${order.id}`;
        const existingInvoice = supplierInvoices.find(inv => inv.id === invoiceId);

        if (existingInvoice) {
            // Update existing shadow invoice if user is re-sending
            updateSupplierInvoice(invoiceId, {
                amount: total,
                subtotal: subtotal,
                shippingCost: shippingCost,
                itemsDescription: `Orden de Compra Enviada: ${localLines.length} items`,
                supplierName: supplier.companyName,
                // Append history
                history: [
                    {
                        date: new Date().toISOString(),
                        action: 'Updated',
                        user: 'Sistema',
                        note: 'Orden re-enviada con cambios'
                    },
                    ...(existingInvoice.history || [])
                ]
            });
        } else {
            // Create new if not exists
            addSupplierInvoice({
                id: invoiceId,
                supplierId: supplier.id,
                supplierName: supplier.companyName,
                displayId: `OC-${order.idDisplay.replace('#', '')}`, // OC = Orden Compra
                date: new Date().toLocaleDateString('en-CA'),
                dueDate: '', // Unknown yet
                amount: total,
                subtotal: subtotal,
                shippingCost: shippingCost,
                status: 'Draft',
                itemsDescription: `Orden de Compra Enviada: ${localLines.length} items`,
                linkedOrderId: order.id,
                matchStatus: 'Matched', // Auto-matched since it's created from source
                history: [{
                    date: new Date().toISOString(),
                    action: 'Created',
                    user: 'Sistema',
                    note: 'Generado automáticamente al enviar Orden de Compra'
                }]
            });
        }

        addToast('success', 'Orden enviada y documento registrado en Finanzas (Borrador).');
        onClose();
    };

    const handleVoid = () => {
        if(confirm('¿Anular este borrador permanentemente?')) {
            updateOrderCtx(order.id, { status: 'Cancelled' });
            onClose();
        }
    };

    // Filtros para Catálogo
    const availableProducts = useMemo(() => {
        return catalog.filter(item => {
            if (item.type !== 'product') return false;
            return item.title.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [catalog, searchTerm]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in" onClick={onClose}>
            {/* Reduced width to max-w-5xl and height to h-auto (max-h-[90vh]) to fit content tightly */}
            <div className="bg-[#f8fafc] dark:bg-background-dark w-full max-w-5xl h-auto max-h-[90vh] rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                
                {/* --- LEFT COLUMN: CONTENT --- */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-black/20">
                    
                    {/* Header */}
                    <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500">
                                <span className="material-icons">edit_note</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                                    Editar Borrador
                                    <span className="ml-3 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold border border-yellow-200 uppercase tracking-wider">
                                        {order.status} #{order.idDisplay}
                                    </span>
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Creado el: {order.date}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 p-8 gap-6 overflow-y-auto custom-scrollbar">
                        
                        {/* Supplier Card */}
                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden shrink-0">
                            
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl font-bold border border-indigo-100 shrink-0">
                                    {supplier.initials || 'SP'}
                                </div>
                                <div className="flex-1 min-w-0 z-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">PROVEEDOR</p>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{supplier.companyName}</h3>
                                            <p className="text-sm text-gray-500">{supplier.address || 'Sin dirección'}</p>
                                        </div>
                                        <button 
                                            onClick={handleNavigateToProfile}
                                            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Ver Perfil <span className="material-icons text-xs">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Contact List */}
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Contactos & Comunicación</p>
                                <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                                    {contactList.map((contact, idx) => (
                                        <div key={idx} className="p-2 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between group hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                                                    <span className="material-icons text-sm">person</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{contact.name}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{contact.role || 'Contacto'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-1.5 shrink-0">
                                                {contact.phone && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleWhatsApp(contact.phone!)}
                                                            className="w-7 h-7 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors" 
                                                            title="WhatsApp"
                                                        >
                                                            <span className="material-icons text-[14px]">chat</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleCall(contact.phone!)}
                                                            className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-colors" 
                                                            title="Llamar"
                                                        >
                                                            <span className="material-icons text-[14px]">call</span>
                                                        </button>
                                                    </>
                                                )}
                                                {contact.email && (
                                                    <button 
                                                        onClick={() => handleEmail(contact.email!)}
                                                        className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 flex items-center justify-center transition-colors" 
                                                        title="Email"
                                                    >
                                                        <span className="material-icons text-[14px]">mail</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm flex flex-col flex-1 min-h-[200px]">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/10 shrink-0">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">ITEMS DEL PEDIDO ({localLines.length})</h3>
                                <button 
                                    onClick={() => setIsCatalogOpen(true)}
                                    className="text-indigo-600 hover:text-indigo-700 font-bold text-xs flex items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors"
                                >
                                    <span className="material-icons text-sm">add_shopping_cart</span> Agregar Item
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-white dark:bg-surface-dark text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
                                        <tr>
                                            <th className="py-3 px-6 w-12 text-center bg-white dark:bg-surface-dark">#</th>
                                            <th className="py-3 px-4 bg-white dark:bg-surface-dark">Producto / Servicio</th>
                                            <th className="py-3 px-4 text-right bg-white dark:bg-surface-dark">Costo Unit.</th>
                                            <th className="py-3 px-4 text-center bg-white dark:bg-surface-dark">Cant.</th>
                                            <th className="py-3 px-6 text-right bg-white dark:bg-surface-dark">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
                                        {localLines.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-gray-400 italic">
                                                    No hay items. Agrega productos desde el catálogo.
                                                </td>
                                            </tr>
                                        ) : (
                                            localLines.map((line, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="py-3 px-6 text-center text-gray-400">{idx + 1}</td>
                                                    <td className="py-3 px-4">
                                                        <p className="font-bold text-gray-800 dark:text-white">{line.title}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono">ID: {line.itemId}</p>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono text-gray-600 dark:text-gray-300">
                                                        {line.price}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button onClick={() => handleUpdateQty(idx, -1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold">-</button>
                                                            <span className="w-8 text-center font-bold text-gray-900 dark:text-white">{line.qty}</span>
                                                            <button onClick={() => handleUpdateQty(idx, 1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold">+</button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-6 text-right font-mono font-bold text-gray-900 dark:text-white relative">
                                                        ${(line.price * line.qty).toFixed(2)}
                                                        <button 
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                        >
                                                            <span className="material-icons text-sm">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- RIGHT COLUMN: SIDEBAR (30%) --- */}
                <div className="w-full md:w-[320px] bg-white dark:bg-surface-dark border-l border-gray-200 dark:border-gray-700 flex flex-col shrink-0 relative z-20 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
                    
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-8">
                        
                        {/* CONFIGURATION */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Configuración Orden</h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Método de Envío</label>
                                    <div className="relative">
                                        <select 
                                            value={shippingMethod} 
                                            onChange={e => setShippingMethod(e.target.value)}
                                            className="w-full appearance-none bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                                        >
                                            <option value="ground">Standard Ground (${getShippingRate('ground').toFixed(2)})</option>
                                            <option value="express">Express Air (${getShippingRate('express').toFixed(2)})</option>
                                            <option value="pickup">Pickup en Bodega (${getShippingRate('pickup').toFixed(2)})</option>
                                        </select>
                                        <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Término de Pago</label>
                                    <div className="relative">
                                        <select 
                                            value={paymentTerms} 
                                            onChange={e => setPaymentTerms(e.target.value)}
                                            className="w-full appearance-none bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                                        >
                                            <option value="Contado">Pago Anticipado / Contado</option>
                                            <option value="Net 15">Crédito - Net 15</option>
                                            <option value="Net 30">Crédito - Net 30</option>
                                        </select>
                                        <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NOTES */}
                        <div>
                             <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Nota Interna</label>
                             <textarea 
                                value={internalNote}
                                onChange={e => setInternalNote(e.target.value)}
                                className="w-full bg-yellow-50/50 border border-yellow-100 dark:border-yellow-900/30 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300 h-24 resize-none outline-none focus:border-yellow-300 placeholder:text-gray-400"
                                placeholder="Nota para almacén o finanzas..."
                             />
                        </div>

                    </div>

                    {/* FOOTER FINANCIALS */}
                    <div className="bg-gray-50 dark:bg-black/10 border-t border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Desglose Financiero</h4>
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                <span>Subtotal Items</span>
                                <span className="font-mono">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-300 items-center">
                                <span>Envío</span>
                                <span className="bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-xs font-mono min-w-[30px] text-center">${shippingCost.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end border-t border-gray-200 dark:border-gray-700 pt-4">
                            <span className="text-sm font-bold text-gray-900 dark:text-white uppercase">Total Orden</span>
                            <span className="text-3xl font-display font-bold text-indigo-600 dark:text-indigo-400">${total.toFixed(2)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 pt-2">
                             <button onClick={handleSaveDraft} className="w-full py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                 Guardar Borrador
                             </button>
                             <div className="flex gap-2">
                                 <button onClick={handleVoid} className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs transition-colors">
                                     Anular
                                 </button>
                                 <button onClick={handleSendOrder} className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2">
                                    <span className="material-icons text-sm">send</span> Confirmar Envío
                                 </button>
                             </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* CATALOG OVERLAY */}
            {isCatalogOpen && (
                <div 
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-8 animate-in fade-in"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCatalogOpen(false);
                    }}
                >
                    <div 
                        className="bg-white dark:bg-surface-dark w-full max-w-4xl h-[80vh] rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons text-indigo-500">grid_view</span> Catálogo de Productos
                            </h3>
                            <button onClick={() => setIsCatalogOpen(false)} className="text-gray-400 hover:text-gray-600"><span className="material-icons">close</span></button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                             <SmartCatalog 
                                catalog={catalog}
                                selectedSupplierId={order.supplierId || ''}
                                suppliers={suppliers}
                                // Pasamos el carrito formateado para SmartCatalog (que espera {item: {id: ...}})
                                cart={localLines.map(l => ({ item: { id: l.itemId }, quantity: l.qty }))} 
                                onAddToCart={handleAddItem}
                                onUpdateQuantity={handleUpdateQtyByItemId} // Nuevo prop
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                selectionMode={selectionMode}
                                setSelectionMode={setSelectionMode}
                                showTemplates={showTemplates}
                                setShowTemplates={setShowTemplates}
                                onLoadTemplate={() => {}}
                                onFastMode={() => {}}
                                availableProducts={availableProducts}
                                templates={[]}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
