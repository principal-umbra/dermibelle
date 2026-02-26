
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Order, Supplier, useData } from '../../../../context/DataContext';
import { ShippingDisputeResolutionModal } from './ShippingDisputeResolutionModal';
import { OrderModalProps } from './OrderModalTypes';

type Decision = 'pending' | 'accepted' | 'remove';
type FilterType = 'all' | 'pending' | 'reviewed';

export const ReviewChangesModal: React.FC<OrderModalProps> = ({ 
    order, supplier, onClose, updateOrderCtx, addToast
}) => {
    const { catalog } = useData();

    // --- STATE ---
    const [lines, setLines] = useState<any[]>([]); 
    const [originalLines, setOriginalLines] = useState<any[]>([]); 
    const [decisions, setDecisions] = useState<Record<string, Decision>>({});
    
    // Estados de UI
    const [isOrderCancelled, setIsOrderCancelled] = useState(false);
    const [hasAcceptedAll, setHasAcceptedAll] = useState(false); 
    const [confirmAction, setConfirmAction] = useState<string | null>(null);

    // Snapshot para restaurar
    const snapshotRef = useRef<{ 
        lines: any[], 
        decisions: Record<string, Decision>,
        originalLines: any[] 
    } | null>(null);
    const isInitializedRef = useRef(false);
    
    const listRef = useRef<HTMLDivElement>(null);
    const [showContextSidebar, setShowContextSidebar] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    
    // --- UNIFIED REPLACEMENT MODAL STATE ---
    const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
    const [replacingId, setReplacingId] = useState<string | null>(null); // ID of line being replaced (null = mass mode)
    const [replacementSearch, setReplacementSearch] = useState('');
    const [replacementCart, setReplacementCart] = useState<Record<string, number>>({});
    const [showNoChanges, setShowNoChanges] = useState(false);

    const orderData = order as any;
    
    // --- EXTENDED CONTEXT ANALYSIS ---
    const extendedContext = useMemo(() => {
        // 1. Parse Notes & Responsible
        const rawNote = order.notes || '';
        let respName = supplier.contactPerson || 'Proveedor';
        let respEmail = supplier.email || '';
        let respPhone = supplier.phone || '';
        let isManual = false;

        const manualPattern = /\(Resp: (.*?)\s*\((.*?)\s*\|\s*(.*?)\)\)/;
        const match = rawNote.match(manualPattern);

        if (match) {
            respName = match[1].trim();
            respEmail = match[2].trim();
            respPhone = match[3].trim();
            isManual = true;
        } else {
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

        // 2. Logistics Details
        const method = order.shippingMethod || 'standard';
        let logisticsType = 'Courier Externo';
        if (method === 'pickup') logisticsType = 'Pickup en Tienda';
        // Ensure Fleet detection if it comes from order
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
                carrier: orderData.carrier || '-',
                tracking: orderData.trackingNumber || '-',
                eta: orderData.eta ? new Date(orderData.eta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Pendiente',
                driver: orderData.driverName,
                plate: orderData.vehiclePlate,
                driverPhone: orderData.driverPhone,
                pickupAddress: orderData.pickupAddress || supplier.address,
                pickupRef: orderData.pickupReference,
                pickupHours: orderData.pickupHours
            }
        };
    }, [order, supplier]);

    // Theme Variables for Logistics Section
    const isFleet = extendedContext.logistics.type === 'Flota Propia';
    const logIcon = isFleet ? 'directions_car' : 'local_shipping';
    const logColor = isFleet ? 'text-purple-500' : 'text-orange-500';
    const logBg = isFleet ? 'bg-purple-50 dark:bg-purple-900/10' : 'bg-orange-50 dark:bg-orange-900/10';
    const logBorder = isFleet ? 'border-purple-100 dark:border-purple-900/30' : 'border-orange-100 dark:border-orange-900/30';
    const logTitleColor = isFleet ? 'text-purple-700 dark:text-purple-300' : 'text-orange-700 dark:text-orange-300';
    const logBorderSub = isFleet ? 'border-purple-200 dark:border-purple-800' : 'border-orange-200 dark:border-orange-800';


    // --- CONTACT ACTIONS ---
    const contactActions = useMemo(() => {
        const { email, phone, name } = extendedContext.responsible;
        return { email, phone, name };
    }, [extendedContext.responsible]);

    const handleContact = (type: 'whatsapp' | 'email' | 'call') => {
        const { email, phone } = contactActions;
        if (type === 'whatsapp' && phone) {
             window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
        } else if (type === 'email' && email) {
             window.location.href = `mailto:${email}?subject=Revisión Orden #${order.idDisplay}`;
        } else if (type === 'call' && phone) {
             window.location.href = `tel:${phone}`;
        } else {
             addToast('error', 'Información de contacto no disponible');
        }
    };

    // Productos disponibles para reemplazo
    const availableForReplacement = useMemo(() => {
        if (!isReplacementModalOpen) return [];
        const currentIds = new Set(lines.map(l => l.itemId));
        return catalog.filter(item => 
            item.type === 'product' && 
            !currentIds.has(item.id) &&
            (item.supplierId === supplier.id || (supplier.tags?.some(t => item.category?.includes(t)))) &&
            (item.title.toLowerCase().includes(replacementSearch.toLowerCase()) || (item.sku && item.sku.toLowerCase().includes(replacementSearch.toLowerCase())))
        );
    }, [catalog, supplier, lines, isReplacementModalOpen, replacementSearch]);

    const generateDecisionsMap = useCallback((currentItems: any[], baseItems: any[]) => {
        const newDecisions: Record<string, Decision> = {};
        const allIds = new Set([...currentItems.map((l:any) => l.itemId), ...baseItems.map((l:any) => l.itemId)]);
        allIds.forEach(id => {
            const currLine = currentItems.find((l:any) => l.itemId === id);
            const baseLine = baseItems.find((l:any) => l.itemId === id);
            const hasChange = !currLine || !baseLine || currLine.qty !== baseLine.qty || currLine.price !== baseLine.price;
            const isZeroQty = currLine && currLine.qty === 0;
            newDecisions[id as string] = (hasChange || isZeroQty) ? 'pending' : 'accepted';
        });
        return newDecisions;
    }, []);

    useEffect(() => {
        if (order && !isInitializedRef.current) {
            const current = order.lines ? JSON.parse(JSON.stringify(order.lines)) : [];
            const original = order.originalLines && order.originalLines.length > 0 
                ? JSON.parse(JSON.stringify(order.originalLines)) 
                : JSON.parse(JSON.stringify(current)); 

            setLines(current);
            setOriginalLines(original);
            
            const initialDecisions = generateDecisionsMap(current, original);
            setDecisions(initialDecisions);

            snapshotRef.current = {
                lines: JSON.parse(JSON.stringify(current)),
                decisions: JSON.parse(JSON.stringify(initialDecisions)),
                originalLines: JSON.parse(JSON.stringify(original))
            };
            isInitializedRef.current = true;
        }
    }, [order, generateDecisionsMap]);

    const analysis = useMemo(() => {
        let originalTotal = 0;
        let resolvedTotal = 0;
        let conflictItems: any[] = [];
        let cleanItems: any[] = [];
        let pendingCount = 0;
        let highestImpactItem = { name: '', amount: 0, id: '' };

        const allIds = new Set([
            ...lines.map(l => l.itemId),
            ...originalLines.map(l => l.itemId)
        ]);

        allIds.forEach(itemId => {
            const prop = lines.find(l => l.itemId === itemId);
            const orig = originalLines.find(l => l.itemId === itemId);
            const decision = decisions[itemId] || 'pending';

            const origQty = orig ? orig.qty : 0;
            const origPrice = orig ? orig.price : 0;
            const propQty = prop ? prop.qty : 0;
            const propPrice = prop ? prop.price : 0;

            const origTotalLine = origQty * origPrice;
            const propTotalLine = propQty * propPrice;

            originalTotal += origTotalLine;

            if (decision === 'accepted' || decision === 'pending') resolvedTotal += propTotalLine;
            else if (decision === 'remove') resolvedTotal += 0;

            if (isOrderCancelled) resolvedTotal = 0;

            const isNew = !orig;
            const isDeleted = !prop || (prop && prop.qty === 0 && orig && orig.qty > 0);
            const isModified = !isNew && !isDeleted && (origQty !== propQty || origPrice !== propPrice);
            const itemDiff = propTotalLine - origTotalLine;

            if (decision === 'pending' && !isOrderCancelled && !isDeleted) pendingCount++;

            if (decision === 'pending' && Math.abs(itemDiff) > Math.abs(highestImpactItem.amount)) {
                highestImpactItem = { name: prop?.title || orig?.title || 'Item', amount: itemDiff, id: itemId as string };
            }
            
            let reason = "";
            if (isDeleted) reason = "Descontinuado por proveedor";
            else if (isModified && propQty < origQty) reason = `Stock limitado (Solicitado: ${origQty})`;
            else if (isModified && propPrice > origPrice) reason = "Actualización de tarifa";
            else if (isNew) reason = "Item sustituto sugerido";

            const itemData = {
                itemId,
                title: prop?.title || orig?.title,
                sku: prop?.itemId || orig?.itemId, 
                orig: { qty: origQty, price: origPrice, total: origTotalLine },
                prop: { qty: propQty, price: propPrice, total: propTotalLine },
                isNew, isDeleted, isModified,
                qtyDiff: propQty - origQty,
                priceDiff: propPrice - origPrice,
                itemDiff, decision, reason
            };

            if (isNew || isDeleted || isModified || decision === 'pending') {
                conflictItems.push(itemData);
            } else {
                cleanItems.push(itemData);
            }
        });

        conflictItems.sort((a, b) => Math.abs(b.itemDiff) - Math.abs(a.itemDiff));

        return { conflictItems, cleanItems, originalTotal, resolvedTotal, pendingCount, delta: resolvedTotal - originalTotal, highestImpactItem };
    }, [lines, originalLines, decisions, isOrderCancelled]);

    // --- CHECK FOR SHIPPING DISPUTE (FIXED LOGIC) ---
    const shippingAnalysis = useMemo(() => {
        // Determine expected base cost based on method
        const method = (order.shippingMethod || 'standard').toLowerCase();
        let originalShipping = 0;

        // CRITICAL LOGIC FIX: 
        // If method is fleet or pickup, original expectation is ALWAYS 0.
        // This handles "New Fee" scenarios (0 -> X) correctly.
        if (method === 'pickup' || method === 'fleet') {
            originalShipping = 0;
        } else if (method.includes('express')) {
            originalShipping = supplier.shippingCosts?.express || 0;
        } else {
            originalShipping = supplier.shippingCosts?.standard || 0;
        }
        
        // Use snapshot or order.lines (Vendor Data) instead of 'lines' (Admin Edits)
        const sourceLines = snapshotRef.current?.lines || order.lines || [];
        
        const vendorItemsTotal = sourceLines.reduce((acc: number, l: any) => acc + (Number(l.price) * Number(l.qty)), 0);
        const newShipping = Math.max(0, order.total - vendorItemsTotal);
        
        const diff = newShipping - originalShipping;
        const hasChange = Math.abs(diff) > 0.01; 

        // Only trigger shipping modal if no items are in conflict
        const isShippingDispute = hasChange && analysis.conflictItems.length === 0;

        return { isShippingDispute, hasChange, originalShipping, newShipping, diff };
    }, [order.total, order.lines, order.shippingMethod, supplier.shippingCosts, analysis.conflictItems.length]);


    const handleConfirmResolution = () => {
        if (isOrderCancelled) {
             updateOrderCtx(order.id, {
                status: 'Cancelled',
                // @ts-ignore
                inDispute: false,
                notes: (order.notes || '') + '\n[Admin]: Cancelada durante revisión.'
            });
            addToast('success', 'Orden cancelada.');
            onClose();
            return;
        }

        const finalLines: any[] = [];
        const allIds = new Set([...lines.map(l => l.itemId), ...originalLines.map(l => l.itemId)]);
        allIds.forEach(itemId => {
            const prop = lines.find(l => l.itemId === itemId);
            const decision = decisions[itemId];
            if (decision !== 'remove' && prop && prop.qty > 0) {
                 finalLines.push(prop);
            }
        });

        if (finalLines.length === 0) {
             updateOrderCtx(order.id, { status: 'Cancelled', inDispute: false } as any);
        } else {
             // Calculate final total including the shipping we accepted/calculated
             const itemsTotal = finalLines.reduce((acc, l) => acc + (l.qty * l.price), 0);
             // We reuse the 'newShipping' from analysis if available, otherwise fallback
             const finalShipping = shippingAnalysis.newShipping;
             const finalOrderTotal = itemsTotal + finalShipping;

             updateOrderCtx(order.id, {
                lines: finalLines,
                originalLines: finalLines, 
                total: finalOrderTotal,
                // @ts-ignore
                inDispute: false,
                status: 'Revision Sent', 
                notes: (order.notes || '') + '\n[Admin]: Cambios enviados para revisión.'
            });
        }
        addToast('success', 'Revisión enviada al proveedor para confirmación.');
        onClose();
    };

    if (shippingAnalysis.isShippingDispute) {
        return (
            <ShippingDisputeResolutionModal 
                order={order}
                supplier={supplier}
                originalShipping={shippingAnalysis.originalShipping}
                newShipping={shippingAnalysis.newShipping}
                onClose={onClose}
                onConfirm={handleConfirmResolution}
            />
        );
    }

    // --- STANDARD ITEM DISPUTE HANDLERS ---
    const handleDecision = (itemId: string, decision: Decision) => {
        if (isOrderCancelled) return;
        setDecisions(prev => ({ ...prev, [itemId]: decision }));
    };

    const handleRevertItem = (itemData: any) => {
        if (isOrderCancelled) return;
        setDecisions(prev => ({ ...prev, [itemData.itemId]: 'pending' }));
    };

    const openMassReplace = () => {
        setReplacingId(null);
        setReplacementCart({});
        setReplacementSearch('');
        setIsReplacementModalOpen(true);
    };

    const openSingleReplace = (itemId: string) => {
        setReplacingId(itemId);
        setReplacementCart({});
        setReplacementSearch('');
        setIsReplacementModalOpen(true);
    };

    const toggleCartItem = (itemId: string) => {
        if (replacingId) {
             setReplacementCart({ [itemId]: 1 });
        } else {
             setReplacementCart(prev => {
                if (prev[itemId]) {
                    const { [itemId]: _, ...rest } = prev;
                    return rest;
                }
                return { ...prev, [itemId]: 1 };
             });
        }
    };

    const updateReplacementQty = (itemId: string, delta: number) => {
        setReplacementCart(prev => {
            const current = prev[itemId] || 0;
            if (replacingId && !prev[itemId]) {
                 if (delta > 0) return { [itemId]: 1 };
                 return prev;
            }
            const next = Math.max(0, current + delta);
            if (next === 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: next };
        });
    };

    const confirmReplacement = () => {
        const selectedIds = Object.keys(replacementCart);
        if (selectedIds.length === 0) {
            addToast('error', 'Selecciona al menos un producto.');
            return;
        }

        if (replacingId) {
            const newItemId = selectedIds[0];
            const qty = replacementCart[newItemId];
            const product = catalog.find(p => p.id === newItemId);

            if (product) {
                setLines(prevLines => prevLines.map(line => {
                    if (line.itemId === replacingId) {
                        return {
                            ...line,
                            itemId: product.id,
                            title: product.title,
                            price: product.cost || (product.price * 0.4),
                            sku: product.sku,
                            qty: qty
                        };
                    }
                    return line;
                }));
                setDecisions(prev => {
                    const next = { ...prev };
                    delete next[replacingId];
                    next[product.id] = 'accepted'; 
                    return next;
                });
                addToast('success', `Item reemplazado por ${product.title}`);
            }
        } else {
            const newDecisions = { ...decisions };
            Object.keys(newDecisions).forEach(key => {
                if (newDecisions[key] === 'pending') newDecisions[key] = 'remove';
            });
            const newLines = [...lines];
            selectedIds.forEach(id => {
                const product = catalog.find(p => p.id === id);
                if (product) {
                    const qty = replacementCart[id];
                    if (!newLines.find(l => l.itemId === product.id)) {
                        newLines.push({
                            itemId: product.id,
                            title: product.title,
                            price: product.cost || (product.price * 0.4),
                            qty: qty,
                            sku: product.sku
                        });
                        newDecisions[product.id] = 'accepted';
                    }
                }
            });
            setLines(newLines);
            setDecisions(newDecisions);
            addToast('success', `Reemplazo masivo aplicado.`);
        }
        setIsReplacementModalOpen(false);
        setReplacementCart({});
        setReplacingId(null);
    };

    const handleSafeAction = (actionKey: string, callback: () => void) => {
        if (confirmAction === actionKey) {
            callback();
            setConfirmAction(null);
        } else {
            setConfirmAction(actionKey);
            setTimeout(() => setConfirmAction(null), 3000);
        }
    };
    
    const executeRestore = () => {
        if (!snapshotRef.current) return;
        setLines(JSON.parse(JSON.stringify(snapshotRef.current.lines)));
        setOriginalLines(JSON.parse(JSON.stringify(snapshotRef.current.originalLines)));
        setDecisions(JSON.parse(JSON.stringify(snapshotRef.current.decisions)));
        setIsOrderCancelled(false);
        setReplacingId(null);
        setHasAcceptedAll(false);
        addToast('info', 'Orden restaurada al estado original.');
    };

    const executeAcceptAll = () => {
        const newDecisions = { ...decisions };
        analysis.conflictItems.forEach(item => {
            if (newDecisions[item.itemId] === 'pending') {
                newDecisions[item.itemId] = 'accepted';
            }
        });
        setDecisions(newDecisions);
        setHasAcceptedAll(true);
        addToast('success', 'Todos los cambios aceptados. Confirma para finalizar.');
    };

    const executeCancelOrder = () => {
        setIsOrderCancelled(true);
        setReplacingId(null);
        addToast('info', 'Orden marcada como cancelada.');
    };

    const scrollToItem = (itemId: string) => {
        const element = document.getElementById(`row-${itemId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
            setTimeout(() => element.classList.remove('bg-blue-50', 'dark:bg-blue-900/20'), 2000);
        }
    };

    const visibleItems = analysis.conflictItems.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'pending') return item.decision === 'pending';
        if (filter === 'reviewed') return item.decision !== 'pending';
        return true;
    });

    const moneyDiff = (val: number) => `${val > 0 ? '+' : ''}${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#F8F9FA] dark:bg-[#0F1115] w-[95vw] max-w-6xl h-[90vh] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
                
                {/* HEADER */}
                <div className="bg-white dark:bg-[#15171B] px-8 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0 shadow-sm z-30">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white leading-none">Resolución de Disputa</h2>
                            <p className="text-xs text-gray-500 mt-1">
                                {supplier.companyName} • <span className="font-mono bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">#{order.idDisplay}</span>
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowContextSidebar(!showContextSidebar)}
                            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all uppercase tracking-wide ${showContextSidebar ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                        >
                            <span className="material-icons text-sm">info</span> {showContextSidebar ? 'Ocultar Contexto' : 'Ver Contexto'}
                        </button>
                    </div>

                    <div className="flex items-center gap-8">
                        {Math.abs(analysis.highestImpactItem.amount) > 0 && (
                            <button 
                                onClick={() => scrollToItem(analysis.highestImpactItem.id)}
                                className="hidden lg:flex flex-col items-end text-right border-r border-gray-200 dark:border-gray-700 pr-8 group hover:opacity-80 transition-opacity"
                            >
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 group-hover:text-primary transition-colors">
                                    Mayor Impacto <span className="material-icons text-[10px] inline-block align-middle">arrow_downward</span>
                                </span>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {analysis.highestImpactItem.name.substring(0, 25)}... 
                                    <span className={`ml-1 font-bold ${analysis.highestImpactItem.amount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {moneyDiff(analysis.highestImpactItem.amount)}
                                    </span>
                                </span>
                            </button>
                        )}
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Impacto Neto</p>
                            <div className="flex items-baseline justify-end gap-2">
                                <p className={`text-2xl font-display font-bold leading-none ${analysis.delta > 0 ? 'text-red-500' : analysis.delta < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                                    {moneyDiff(analysis.delta)}
                                </p>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                Original ${analysis.originalTotal.toLocaleString()} <span className="mx-1">→</span> Nuevo ${analysis.resolvedTotal.toLocaleString()}
                            </p>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors border border-transparent hover:border-gray-200">
                            <span className="material-icons text-xl">close</span>
                        </button>
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
                                            <div className="flex justify-between">
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">ETA:</span>
                                                <span className="text-[10px] font-bold text-gray-900 dark:text-white">{extendedContext.logistics.eta}</span>
                                            </div>
                                        </>
                                    )}

                                    {/* FLEET */}
                                    {extendedContext.logistics.type === 'Flota Propia' && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">Conductor:</span>
                                                <span className="text-[10px] font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{extendedContext.logistics.driver || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">Placa:</span>
                                                <span className="text-[10px] font-mono font-bold text-gray-900 dark:text-white uppercase">{extendedContext.logistics.plate || 'N/A'}</span>
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
                                        <>
                                             <div className="space-y-1">
                                                 <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold">Dirección Recogida</p>
                                                 <p className="text-[10px] text-gray-800 dark:text-gray-200 leading-tight">{extendedContext.logistics.pickupAddress || 'N/A'}</p>
                                             </div>
                                             {extendedContext.logistics.pickupRef && (
                                                <div className="flex justify-between mt-1">
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Referencia:</span>
                                                    <span className="text-[10px] font-bold text-gray-900 dark:text-white">{extendedContext.logistics.pickupRef}</span>
                                                </div>
                                             )}
                                             {extendedContext.logistics.pickupHours && (
                                                <div className="flex justify-between mt-1">
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Horario:</span>
                                                    <span className="text-[10px] font-bold text-gray-900 dark:text-white">{extendedContext.logistics.pickupHours}</span>
                                                </div>
                                             )}
                                        </>
                                    )}

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

                    {/* MAIN CONTENT */}
                    <div className="flex-1 flex flex-col bg-[#F8F9FA] dark:bg-black/10 min-w-0">
                        
                        {/* Control Bar */}
                        <div className="px-8 py-3 flex justify-between items-center bg-white/50 dark:bg-white/5 border-b border-gray-200/50 backdrop-blur-sm sticky top-0 z-20">
                            <div className="flex gap-2">
                                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border ${filter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Todo ({analysis.conflictItems.length})</button>
                                <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border flex items-center gap-1.5 ${filter === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    {analysis.pendingCount > 0 && !isOrderCancelled && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                                    Pendiente ({analysis.pendingCount})
                                </button>
                                <button onClick={() => setFilter('reviewed')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border ${filter === 'reviewed' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Revisado</button>
                            </div>

                            <div className="flex gap-2 items-center">
                                <button 
                                    onClick={() => handleSafeAction('restore', executeRestore)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 border
                                        ${confirmAction === 'restore' 
                                            ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm animate-pulse' 
                                            : 'bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 border-transparent'}
                                    `}
                                    title="Revertir a estado inicial de disputa"
                                >
                                    <span className="material-icons text-[12px]">{confirmAction === 'restore' ? 'warning' : 'restart_alt'}</span> 
                                    {confirmAction === 'restore' ? '¿Confirmar?' : 'Restaurar Original'}
                                </button>

                                <div className="w-px h-4 bg-gray-300 mx-1"></div>

                                {!isOrderCancelled && (
                                    <>
                                        {!hasAcceptedAll && (
                                            <button 
                                                onClick={() => handleSafeAction('accept', executeAcceptAll)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1
                                                    ${confirmAction === 'accept' 
                                                        ? 'bg-green-600 text-white shadow-md animate-pulse' 
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'}
                                                `}
                                            >
                                                <span className="material-icons text-[12px]">{confirmAction === 'accept' ? 'check' : 'done_all'}</span> 
                                                {confirmAction === 'accept' ? '¿Confirmar Todo?' : 'Aceptar Todo'}
                                            </button>
                                        )}

                                        <button 
                                            onClick={openMassReplace}
                                            disabled={hasAcceptedAll}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1 
                                                ${hasAcceptedAll
                                                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'}
                                            `}
                                        >
                                            <span className="material-icons text-[12px]">swap_horiz</span> Reemplazar Todo
                                        </button>

                                        <button 
                                            onClick={() => handleSafeAction('cancel', executeCancelOrder)}
                                            disabled={hasAcceptedAll}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center gap-1
                                                ${hasAcceptedAll
                                                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                                    : confirmAction === 'cancel'
                                                        ? 'bg-red-600 text-white border-red-600 shadow-md animate-pulse'
                                                        : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'}
                                            `}
                                        >
                                            <span className="material-icons text-[12px]">{confirmAction === 'cancel' ? 'warning' : 'block'}</span> 
                                            {confirmAction === 'cancel' ? '¿Seguro?' : 'Cancelar Orden'}
                                        </button>
                                    </>
                                )}
                                
                                {isOrderCancelled && (
                                    <span className="text-[10px] font-bold text-red-500 uppercase bg-red-50 px-2 py-1 rounded border border-red-100 flex items-center gap-1">
                                        <span className="material-icons text-[10px]">lock</span> Orden Cancelada
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* LIST HEADER */}
                        <div className="px-8 py-2 grid grid-cols-[50px_minmax(0,1.5fr)_minmax(0,1fr)_30px_minmax(0,1fr)_100px_110px] gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 bg-gray-50/50">
                             <div className="text-center">Estado</div>
                             <div>Producto / SKU</div>
                             <div>Solicitado</div>
                             <div></div>
                             <div>Propuesta</div>
                             <div className="text-right">Impacto</div>
                             <div className="text-center">Acción</div>
                        </div>

                        {/* THE LIST */}
                        <div ref={listRef} className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar space-y-1">
                            {/* SHIPPING CHANGE ROW */}
                            {shippingAnalysis.hasChange && !shippingAnalysis.isShippingDispute && (
                                <div className="relative mb-3 group">
                                    <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800"></div>
                                    <div className="relative grid grid-cols-[50px_minmax(0,1.5fr)_minmax(0,1fr)_30px_minmax(0,1fr)_100px_110px] gap-4 items-center p-4 z-10">
                                        
                                        {/* Icon */}
                                        <div className="flex justify-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-white/10 ${logColor} shadow-sm border ${logBorderSub}`}>
                                                <span className="material-icons">{logIcon}</span>
                                            </div>
                                        </div>

                                        {/* Title & Description */}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">Ajuste de Envío</span>
                                                <span className={`text-[9px] font-bold uppercase ${isFleet ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'} px-2 py-0.5 rounded-full border`}>
                                                    {isFleet ? 'Flota Propia' : 'Logística'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 leading-tight">
                                                Actualización de tarifa por proveedor
                                            </p>
                                        </div>

                                        {/* Original */}
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Tarifa Original</p>
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                ${shippingAnalysis.originalShipping.toFixed(2)}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex justify-center">
                                            <span className="material-icons text-blue-300 text-sm">arrow_forward</span>
                                        </div>

                                        {/* New */}
                                        <div className="min-w-0">
                                             <p className="text-[10px] text-blue-400 uppercase font-bold mb-0.5">Nueva Tarifa</p>
                                             <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                ${shippingAnalysis.newShipping.toFixed(2)}
                                            </p>
                                        </div>

                                        {/* Impact */}
                                        <div className="text-right flex flex-col justify-center">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Diferencia</span>
                                            <span className={`text-sm font-bold font-mono ${shippingAnalysis.diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {shippingAnalysis.diff > 0 ? '+' : ''}{Math.abs(shippingAnalysis.diff).toFixed(0)}
                                            </span>
                                        </div>
                                         
                                         {/* Action - Just Info */}
                                         <div className="text-center">
                                            <span className="text-[10px] text-gray-400 italic">Informativo</span>
                                         </div>
                                    </div>
                                </div>
                            )}

                            {visibleItems.map((item) => {
                                const isPending = item.decision === 'pending';
                                const isAccepted = item.decision === 'accepted';
                                const isRemoved = item.decision === 'remove' || isOrderCancelled;
                                
                                // Dynamic Styles
                                let rowBg = 'bg-white dark:bg-surface-dark';
                                let opacity = 'opacity-100';
                                
                                if (isAccepted) {
                                    rowBg = 'bg-green-50/30 dark:bg-green-900/5 border-green-100';
                                } else if (isRemoved) {
                                    rowBg = 'bg-red-50/30 dark:bg-red-900/5 border-red-100';
                                    opacity = 'opacity-70 grayscale';
                                } else {
                                    rowBg = 'bg-white dark:bg-surface-dark border-gray-200 shadow-sm z-10'; 
                                }

                                const impactColor = item.itemDiff > 0 ? 'text-red-600' : item.itemDiff < 0 ? 'text-green-600' : 'text-gray-400';
                                const impactIcon = item.itemDiff > 0 ? 'arrow_upward' : item.itemDiff < 0 ? 'arrow_downward' : 'remove';

                                let badge = { label: 'MOD', color: 'bg-amber-100 text-amber-700 border-amber-200' };
                                if (item.isDeleted) badge = { label: 'DEL', color: 'bg-red-100 text-red-700 border-red-200' };
                                if (item.isNew) badge = { label: 'ADD', color: 'bg-blue-100 text-blue-700 border-blue-200' };
                                if (isAccepted) badge = { label: 'OK', color: 'bg-green-100 text-green-700 border-green-200' };

                                return (
                                    <div 
                                        id={`row-${item.itemId}`}
                                        key={item.itemId} 
                                        className={`grid grid-cols-[50px_minmax(0,1.5fr)_minmax(0,1fr)_30px_minmax(0,1fr)_100px_110px] gap-4 items-center p-3 rounded-xl border transition-all group relative ${rowBg} ${opacity}
                                            ${isPending && !isOrderCancelled ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-transparent'}
                                            ${replacingId === item.itemId ? 'ring-2 ring-blue-400 z-50' : ''}
                                        `}
                                    >
                                        <div className="flex justify-center">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-sm ${badge.color}`}>
                                                {badge.label}
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <p className={`text-sm font-semibold text-gray-900 dark:text-white truncate ${item.isDeleted ? 'line-through decoration-red-400 text-red-800' : ''}`}>
                                                {item.title}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{item.sku}</p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-400 truncate font-medium">
                                                Solicitado: {item.orig.qty} x ${item.orig.price}
                                            </p>
                                            <p className="text-[10px] text-gray-300 font-mono">
                                                Total: ${item.orig.total.toFixed(0)}
                                            </p>
                                        </div>

                                        <div className="flex justify-center">
                                            <span className="material-icons text-gray-300 text-xs">arrow_forward</span>
                                        </div>

                                        <div className="min-w-0">
                                            {item.isDeleted || item.decision === 'remove' ? (
                                                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">ELIMINADO</span>
                                            ) : (
                                                <p className={`text-sm font-bold truncate ${item.priceDiff ? 'text-orange-600' : 'text-gray-900 dark:text-white'}`}>
                                                    Propuesto: {item.prop.qty} x ${item.prop.price}
                                                </p>
                                            )}
                                            {item.reason && (
                                                <p className="text-[10px] text-gray-500 mt-0.5 truncate italic">
                                                    {item.reason}
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-right flex items-center justify-end gap-1 group/impact cursor-help relative">
                                            <span className={`text-sm font-bold font-mono ${impactColor}`}>
                                                {item.itemDiff > 0 ? '+' : ''}{Math.abs(item.itemDiff).toFixed(0)}
                                            </span>
                                            <span className={`material-icons text-[12px] font-bold ${impactColor}`}>{impactIcon}</span>
                                        </div>

                                        <div className="flex justify-end gap-1.5 relative">
                                            {isOrderCancelled ? (
                                                <span className="text-[10px] font-bold text-red-400 uppercase">Cancelado</span>
                                            ) : (
                                                <>
                                                    {item.decision !== 'pending' && (
                                                        <button 
                                                            onClick={() => handleRevertItem(item)}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all border bg-white border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-800 shadow-sm"
                                                            title="Deshacer Decisión"
                                                        >
                                                            <span className="material-icons text-base">undo</span>
                                                        </button>
                                                    )}

                                                    {(isPending || isReplacementModalOpen) && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleDecision(item.itemId, 'remove')}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${isRemoved ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600'}`}
                                                                title="Quitar de Orden"
                                                            >
                                                                <span className="material-icons text-sm">close</span>
                                                            </button>
                                                            
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); openSingleReplace(item.itemId); }}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${replacingId === item.itemId ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'}`}
                                                                title="Reemplazar Producto"
                                                            >
                                                                <span className="material-icons text-sm">swap_horiz</span>
                                                            </button>
                                                            
                                                            {!isAccepted && !item.isDeleted && (
                                                                <button 
                                                                    onClick={() => handleDecision(item.itemId, 'accepted')}
                                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${isAccepted ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600'}`}
                                                                    title="Aceptar Condición"
                                                                >
                                                                    <span className="material-icons text-sm">check</span>
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* No Changes Section */}
                        {analysis.cleanItems.length > 0 && !isReplacementModalOpen && (
                            <div className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark pb-4">
                                <button 
                                    onClick={() => setShowNoChanges(!showNoChanges)}
                                    className="w-full flex items-center justify-between px-8 py-3 text-xs font-bold text-gray-400 uppercase hover:bg-gray-50 transition-colors group"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className={`material-icons text-lg transition-transform duration-300 ${showNoChanges ? 'rotate-180' : ''}`}>expand_more</span>
                                        {analysis.cleanItems.length} Items sin cambios (Aceptados Automáticamente)
                                    </span>
                                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-300 transition-opacity">Click para ver detalle</span>
                                </button>
                                
                                {showNoChanges && (
                                    <div className="px-8 pb-4 space-y-1 animate-in slide-in-from-top-2">
                                        {analysis.cleanItems.map(item => (
                                            <div key={item.itemId} className="grid grid-cols-[50px_minmax(0,1.5fr)_1fr_100px] gap-4 items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100">
                                                <div className="flex justify-center">
                                                    <span className="material-icons text-green-400 text-sm">check_circle_outline</span>
                                                </div>
                                                <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{item.title}</span>
                                                <span className="text-xs text-gray-400 font-mono">{item.prop.qty} x ${item.prop.price}</span>
                                                <span className="text-right text-xs font-bold text-gray-300 font-mono">${item.prop.total.toFixed(0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>

                {/* 4. STICKY FOOTER */}
                <div className="bg-white dark:bg-[#15171B] border-t border-gray-200 dark:border-gray-800 px-8 py-5 flex justify-between items-center z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-xs text-gray-500">
                                {analysis.pendingCount > 0 
                                    ? <span className="text-amber-600 font-bold flex items-center gap-2"><span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span> {analysis.pendingCount} decisiones pendientes</span> 
                                    : isOrderCancelled 
                                        ? <span className="text-red-600 font-bold flex items-center gap-1"><span className="material-icons text-sm">block</span> Cancelada</span>
                                        : <span className="text-green-600 font-bold flex items-center gap-1"><span className="material-icons text-sm">check_circle</span> Todo revisado</span>
                                }
                            </p>
                        </div>
                        
                        {/* CONTACT BUTTONS */}
                        <div className="flex items-center gap-1 pl-6 border-l border-gray-200 dark:border-gray-700 h-6">
                             <button onClick={() => handleContact('whatsapp')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors" title={`WhatsApp: ${contactActions.phone || 'No disponible'}`}>
                                <span className="material-icons text-sm">chat</span>
                             </button>
                             <button onClick={() => handleContact('email')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/40 transition-colors" title={`Email: ${contactActions.email || 'No disponible'}`}>
                                <span className="material-icons text-sm">mail</span>
                             </button>
                             <button onClick={() => handleContact('call')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors" title={`Llamar: ${contactActions.phone || 'No disponible'}`}>
                                <span className="material-icons text-sm">call</span>
                             </button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
                        <button 
                            onClick={handleConfirmResolution}
                            disabled={analysis.pendingCount > 0 && !isOrderCancelled}
                            className={`px-8 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5
                                ${analysis.pendingCount > 0 && !isOrderCancelled ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-gray-900 hover:bg-black dark:bg-white dark:text-black'}
                            `}
                        >
                            Confirmar & Aplicar
                        </button>
                    </div>
                </div>

            </div>

            {/* REPLACEMENT MODAL (Shared for Mass and Single) */}
            {(isReplacementModalOpen) && (
                <div className="absolute inset-0 z-50 bg-white dark:bg-surface-dark flex flex-col animate-in fade-in slide-in-from-bottom-10">
                    <div className="px-8 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/10">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons text-blue-600">
                                    {replacingId ? 'change_circle' : 'swap_horizontal_circle'}
                                </span>
                                {replacingId ? 'Reemplazar Producto' : 'Reemplazo Masivo'}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {replacingId 
                                    ? 'Selecciona UN producto sustituto.' 
                                    : 'Selecciona los productos nuevos. Los pendientes actuales serán eliminados.'}
                            </p>
                        </div>
                        <button onClick={() => { setIsReplacementModalOpen(false); setReplacingId(null); }} className="text-gray-400 hover:text-gray-600"><span className="material-icons">close</span></button>
                    </div>
                    
                    <div className="flex-1 flex overflow-hidden">
                        <div className="w-1/2 border-r border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
                            <div className="relative">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                <input 
                                    autoFocus
                                    value={replacementSearch}
                                    onChange={(e) => setReplacementSearch(e.target.value)}
                                    placeholder="Buscar producto alternativo..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                {availableForReplacement.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 text-xs italic">
                                        {replacementSearch ? 'No se encontraron productos.' : 'Escribe para buscar...'}
                                    </div>
                                ) : (
                                    availableForReplacement.map(item => (
                                        <div 
                                            key={item.id} 
                                            className={`flex justify-between items-center p-3 border rounded-xl hover:border-blue-300 transition-colors group cursor-pointer 
                                                ${replacementCart[item.id] ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-700'}`}
                                            onClick={() => toggleCartItem(item.id as string)}
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.title}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">${item.price}</p>
                                            </div>
                                            <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-opacity ${replacementCart[item.id] ? 'bg-blue-600 text-white opacity-100' : 'bg-blue-50 text-blue-600 opacity-0 group-hover:opacity-100'}`}>
                                                <span className="material-icons text-sm">{replacementCart[item.id] ? 'check' : 'add'}</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="w-1/2 p-6 flex flex-col bg-gray-50/30 dark:bg-black/10">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {replacingId ? 'Producto Seleccionado (1)' : 'Nuevos Productos Seleccionados'}
                            </h4>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                                {Object.keys(replacementCart).length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 text-xs italic border-2 border-dashed border-gray-200 rounded-xl">
                                        Lista vacía.
                                    </div>
                                ) : (
                                    Object.keys(replacementCart).map(id => {
                                        const item = catalog.find(p => p.id === id);
                                        if (!item) return null;
                                        return (
                                            <div key={id} className="flex justify-between items-center p-3 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold truncate">{item.title}</p>
                                                </div>
                                                <div className="flex items-center gap-3 ml-3">
                                                    <button onClick={() => updateReplacementQty(id, -1)} className="text-gray-400 hover:text-red-500"><span className="material-icons text-xs">remove</span></button>
                                                    <span className="text-sm font-bold w-4 text-center">{replacementCart[id]}</span>
                                                    <button onClick={() => updateReplacementQty(id, 1)} className="text-gray-400 hover:text-green-500"><span className="material-icons text-xs">add</span></button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end gap-3">
                                <button onClick={() => { setIsReplacementModalOpen(false); setReplacingId(null); }} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-lg">Cancelar</button>
                                <button 
                                    onClick={confirmReplacement}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={Object.keys(replacementCart).length === 0}
                                >
                                    {replacingId ? 'Confirmar Reemplazo' : 'Confirmar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
