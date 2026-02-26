import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData, Order, Supplier } from '../../context/DataContext';
import PortalNavbar from '../../components/portal/PortalNavbar';
import PortalHero from '../../components/portal/PortalHero';
import PortalPayment from '../../components/portal/PortalPayment';
import PortalItemsTable from '../../components/portal/PortalItemsTable';
import PortalLogistics from '../../components/portal/PortalLogistics';
import PortalConfirmationModal from '../../components/portal/PortalConfirmationModal';

// Mock Constants for Brand
const BRAND_PHONE = "(941) 555-0123";
const BRAND_EMAIL = "billing@dermibelle.com";
const BRAND_WHATSAPP = "19415550123";

const VendorOrderPortal: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { orders, suppliers, updateOrder, addClientLog, addToast } = useData();

    // Memoize Order & Supplier lookups
    const order = useMemo(() => orders.find(o => o.id === id), [orders, id]);
    const supplier = useMemo(() => suppliers.find(s => s.id === order?.supplierId), [suppliers, order]);

    // --- STATES DETECTION LOGIC ---
    const isCancelled = order?.status === 'Cancelled';
    const isDelivered = order?.status === 'Delivered';
    const isTransit = order?.status === 'In Transit';
    const isRevisionSent = order?.status === 'Revision Sent';
    
    // DETECT: Approved Negotiation State (Placed + History + No active dispute)
    const isApprovedNegotiation = useMemo(() => {
        if (!order || order.status !== 'Placed' || order.inDispute) return false;
        
        // FIX: Check if originalLines differs from initialLines (Version 1.0)
        // If they are different, it means the order evolved and was agreed upon.
        if (order.initialLines && order.originalLines) {
            return JSON.stringify(order.initialLines) !== JSON.stringify(order.originalLines);
        }
        
        // Fallback for orders without initialLines (legacy): assume not negotiated if we can't prove it
        return false;
    }, [order]);

    // Determine if we are in "Revision Mode" (Waiting for vendor to accept admin changes)
    const isRevision = isRevisionSent;

    // Determine locks
    const isLocked = isDelivered || isCancelled || isTransit;
    
    // Fine-grained Locks
    // Items are locked if strictly locked OR if it's an approved negotiation (shipping only)
    // For Revision Sent, items are UNLOCKED (to confirm/deny), but specific rows might be read-only (handled by acceptedItemIds)
    const isItemsLocked = isLocked || isApprovedNegotiation;
    
    // Payment is locked in revision (admin proposed changes usually on items, payment terms stay or are handled via comments)
    const isPaymentLocked = isLocked || isRevision || isApprovedNegotiation;
    
    // Logistics is locked if strictly locked.
    // For Revision/Approved, it is UNLOCKED but restricted via props to only allow Tracking/ETA.
    const isLogisticsLocked = isLocked; 

    // Identify Items for Revision Mode
    // acceptedItemIds: Items that match exactly the original (Admin didn't change them, or reverted them)
    // This allows the UI to separate them or mark them as read-only.
    const acceptedItemIds = useMemo(() => {
        if (!isRevision || !order?.originalLines) return [];
        return order.lines
            ?.filter(line => {
                const original = order.originalLines?.find(ol => ol.itemId === line.itemId);
                // If it matches exactly (Qty and Price), it's considered "Accepted/Unchanged"
                return original && original.qty === line.qty && Number(original.price) === Number(line.price);
            })
            .map(l => String(l.itemId)) || [];
    }, [isRevision, order]);

    // Detect Responsible from History (Notes)
    const existingResponsible = useMemo(() => {
        if (!order?.notes) return undefined;
        // Search for the last occurrence of (Resp: ...)
        // The format saved is `(Resp: ${responsable})`
        // We look for the pattern and take the last one found in the history
        const matches = order.notes.match(/\(Resp:\s*([^)]+)\)/g);
        if (matches && matches.length > 0) {
             const lastMatch = matches[matches.length - 1];
             // Clean up: remove (Resp: and )
             return lastMatch.replace(/^\(Resp:\s*/, '').replace(/\)$/, '').trim();
        }
        return undefined;
    }, [order]);

    // Local State
    const [localLines, setLocalLines] = useState<any[]>([]);
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [paymentAccepted, setPaymentAccepted] = useState(false);
    
    // Logistics
    const [logisticsType, setLogisticsType] = useState<'courier' | 'fleet' | 'pickup'>('courier');
    const [etaDate, setEtaDate] = useState('');
    const [carrierName, setCarrierName] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [driverName, setDriverName] = useState('');
    const [vehiclePlate, setVehiclePlate] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [pickupAddress, setPickupAddress] = useState('');
    const [pickupReference, setPickupReference] = useState('');
    const [pickupHours, setPickupHours] = useState('');
    const [shippingCost, setShippingCost] = useState(0);

    // Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Calculated Expected Shipping Cost (Original/Standard)
    const expectedShippingCost = useMemo(() => {
        // If switching to Fleet (and assuming fleet was not the requested/agreed method), 
        // we assume 0 cost unless stated otherwise. Any manual entry > 0 triggers discrepancy.
        if (logisticsType === 'fleet') return 0;
        
        if (!supplier?.shippingCosts || !order?.shippingMethod) return 0;
        const method = order.shippingMethod;
        if (method === 'pickup') return supplier.shippingCosts.pickup;
        if (method.includes('express')) return supplier.shippingCosts.express;
        return supplier.shippingCosts.standard;
    }, [supplier, order, logisticsType]);

    useEffect(() => {
        if (order) {
            // Inicializar líneas locales
            const lines = JSON.parse(JSON.stringify(order.lines || []))
                .filter((l: any) => l.qty > 0) // Filtrar items eliminados para el proveedor
                .map((l: any) => {
                const isAccepted = acceptedItemIds.includes(String(l.itemId));
                return {
                    ...l,
                    price: Number(l.price) || 0,
                    qty: Number(l.qty) || 0,
                    discountType: l.discountType || 'fixed',
                    discountValue: Number(l.discountValue) || 0,
                    // Logic Update: Auto-confirm if Accepted/Unchanged in Revision Mode to prevent blocking
                    confirmed: isApprovedNegotiation ? true : (isRevisionSent ? isAccepted : (typeof l.confirmed === 'boolean' ? l.confirmed : false))
                };
            });
            setLocalLines(lines);
            
            if (supplier?.address) setPickupAddress(supplier.address);
            
            if (order.shippingMethod === 'pickup') {
                setLogisticsType('pickup');
            } else if (order.shippingMethod === 'fleet') {
                setLogisticsType('fleet');
            } else {
                setLogisticsType('courier');
            }
            
            // Populate existing logistics data if available
            // @ts-ignore
            if (order.carrier) setCarrierName(order.carrier);
            // @ts-ignore
            if (order.trackingNumber) setTrackingNumber(order.trackingNumber);
            // @ts-ignore
            if (order.eta) setEtaDate(order.eta);
            // @ts-ignore
            if (order.driverName) setDriverName(order.driverName);
            // @ts-ignore
            if (order.vehiclePlate) setVehiclePlate(order.vehiclePlate);
            // @ts-ignore
            if (order.driverPhone) setDriverPhone(order.driverPhone);
            // @ts-ignore
            if (order.pickupReference) setPickupReference(order.pickupReference);
            // @ts-ignore
            if (order.pickupHours) setPickupHours(order.pickupHours);
            
            // Set initial shipping cost from expected value
            // Only set if we haven't touched it (initial load) - but this effect runs on logisticsType change too
            // We'll rely on the effect in PortalLogistics to handle cost resets/defaults
            // setShippingCost(expectedShippingCost); // Removed to avoid overriding user input in PortalLogistics

            // Auto-fill logic for re-approvals or continuing workflows
            if (isRevision || isApprovedNegotiation) {
                setPaymentAccepted(true);
                // Pre-fill ETA if it's an approved negotiation to save clicks
                if (isApprovedNegotiation && !etaDate) {
                    setEtaDate(new Date().toLocaleDateString('en-CA'));
                }
            }
        }
    }, [order, supplier, isRevision, isApprovedNegotiation, acceptedItemIds]); // Removed expectedShippingCost dep to prevent reset loop

    if (!order || !supplier) return <div className="p-10 text-white bg-gray-900 h-screen flex items-center justify-center">Cargando orden...</div>;

    // Calculators
    const calculateLineTotal = (line: any) => {
        const price = Number(line.price) || 0;
        const qty = Number(line.qty) || 0;
        const sub = price * qty;
        const discountVal = Number(line.discountValue) || 0;
        
        const disc = line.discountType === 'percent' ? sub * (discountVal / 100) : discountVal;
        return sub - disc;
    };

    const calculateTotal = () => {
        const itemsTotal = localLines.reduce((acc, line) => acc + calculateLineTotal(line), 0);
        return itemsTotal + (Number(shippingCost) || 0);
    };

    const allConfirmed = localLines.every(l => l.confirmed || l.qty === 0);

    // Handlers
    const handleQtyChange = (idx: number, val: number) => {
        const newLines = [...localLines];
        newLines[idx].qty = val;
        newLines[idx].confirmed = true;
        setLocalLines(newLines);
    };

    const handlePriceChange = (idx: number, val: number) => {
        const newLines = [...localLines];
        newLines[idx].price = val;
        newLines[idx].confirmed = true;
        setLocalLines(newLines);
    };

    const handleDiscountValChange = (idx: number, val: number) => {
        const newLines = [...localLines];
        newLines[idx].discountValue = val;
        setLocalLines(newLines);
    };

    const toggleDiscountType = (idx: number) => {
        const newLines = [...localLines];
        newLines[idx].discountType = newLines[idx].discountType === 'percent' ? 'fixed' : 'percent';
        setLocalLines(newLines);
    };

    const handleMarkUnavailable = (idx: number) => {
        const newLines = [...localLines];
        newLines[idx].qty = 0;
        newLines[idx].confirmed = true; 
        setLocalLines(newLines);
    };

    const handleRestoreItem = (idx: number) => {
        const newLines = [...localLines];
        const original = order.lines?.find(l => l.itemId === newLines[idx].itemId);
        newLines[idx].qty = original ? original.qty : 1;
        newLines[idx].confirmed = false;
        setLocalLines(newLines);
    };

    const toggleLineConfirmation = (idx: number) => {
        const newLines = [...localLines];
        if (newLines[idx].qty === 0) return;
        newLines[idx].confirmed = !newLines[idx].confirmed;
        setLocalLines(newLines);
    };

    const toggleAllConfirmation = () => {
        const newState = !allConfirmed;
        const newLines = localLines.map(l => ({ ...l, confirmed: l.qty > 0 ? newState : l.confirmed }));
        setLocalLines(newLines);
    };

    // Change Detection
    const detectedChanges = (() => {
        const changes: string[] = [];
        const originalLines = order.originalLines || order.lines || []; // Compare against BASELINE (Last Agreed)
        localLines.forEach(local => {
            const original = originalLines.find(o => o.itemId === local.itemId);
            if (!original) return;
            if (local.qty !== original.qty) {
                if (local.qty === 0) changes.push(`${local.title}: No disponible (0 unids)`);
                else changes.push(`${local.title}: Cantidad cambió (${original.qty} ➝ ${local.qty})`);
            }
            if (local.price !== original.price) {
                changes.push(`${local.title}: Precio cambió ($${original.price} ➝ $${local.price})`);
            }
        });

        if (Math.abs(shippingCost - expectedShippingCost) > 0.01) {
            changes.push(`Costo de envío modificado ($${expectedShippingCost.toFixed(2)} ➝ $${shippingCost.toFixed(2)})`);
        }

        return changes;
    })();

    const isDispute = detectedChanges.length > 0;

    // --- VALIDATION LOGIC ---
    const missingFields: string[] = [];
    
    // 1. Validate Product Confirmation
    const unconfirmedCount = localLines.filter(l => !l.confirmed && l.qty > 0).length;
    if (unconfirmedCount > 0) {
        missingFields.push(`Confirmar ${unconfirmedCount} producto(s)`);
    }
    
    // 2. Validate Payment & General Info
    if (!paymentAccepted && !isPaymentLocked) missingFields.push('Aceptar condiciones de pago');
    if (!etaDate && !isLogisticsLocked) missingFields.push('Fecha estimada (ETA)');
    
    // 3. Validate Logistics Details
    // Logic specific for Revision: Address locked, Tracking required only if courier
    if (!isLogisticsLocked) {
        if (logisticsType === 'courier') {
            // For Revision Sent or Approved Negotiation, we relax carrier requirement if it wasn't there, 
            // but if user can edit, they should put something.
            // If restrictToTracking is false, fields are open.
            if (!carrierName && !isApprovedNegotiation && !isRevisionSent) missingFields.push('Empresa transportadora'); 
            if (!trackingNumber) missingFields.push('Número de guía');
        } else if (logisticsType === 'fleet') {
             // Modified validation for Fleet: Require tracking number, phone is optional
             if (!trackingNumber) missingFields.push('Número de guía interna');
        }
    } else if ((isApprovedNegotiation || isRevisionSent) && logisticsType === 'courier') {
         // Specific validation for Approved/Revision (Tracking Only Mode) - though Revision is now unlocked
         if (!trackingNumber) missingFields.push('Número de guía');
    }
    
    const handlePreConfirm = () => {
        if (missingFields.length > 0) {
            addToast('error', 'Complete las acciones pendientes');
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleFinalSubmit = (responsable: string, finalNotes: string) => {
        const combinedNotes = `${order.notes ? order.notes + '\n' : ''}[Proveedor ${new Date().toLocaleDateString()}]: ${finalNotes} (Resp: ${responsable})`;
        // If it's a revision and valid, it goes to In Transit directly
        const newStatus = isDispute ? 'Placed' : 'In Transit';
        const originalLinesToSave = order.originalLines || order.lines;

        let finalMethod = order.shippingMethod;
        if (logisticsType === 'pickup') finalMethod = 'pickup';
        else if (logisticsType === 'fleet') finalMethod = 'fleet';
        else if (finalMethod === 'pickup' || finalMethod === 'fleet') finalMethod = 'standard';

        updateOrder(order.id, {
            status: newStatus,
            lines: localLines,
            originalLines: originalLinesToSave,
            total: calculateTotal(),
            notes: combinedNotes,
            // @ts-ignore
            inDispute: isDispute,
            
            // Logistics Fields
            shippingMethod: finalMethod,
            carrier: carrierName,
            trackingNumber: trackingNumber,
            eta: etaDate,
            driverName: driverName,
            vehiclePlate: vehiclePlate,
            driverPhone: driverPhone,
            pickupReference: pickupReference,
            pickupHours: pickupHours
        });

        const actionType = isDispute ? 'PROPUESTA / DISPUTA' : 'DESPACHO CONFIRMADO';
        addClientLog({
            clientId: supplier.id,
            type: 'interaction',
            action: 'edit_profile',
            description: `Orden ${order.idDisplay}: ${actionType} por ${responsable}. ${isDispute ? `Cambios: ${detectedChanges.length}` : ''}`,
            date: new Date().toLocaleDateString('es-ES')
        });

        addToast(
            isDispute ? 'info' : 'success', 
            isDispute ? 'Propuesta enviada. Esperando aprobación.' : 'Orden confirmada y en camino.'
        );
        
        setIsConfirmModalOpen(false);
        navigate(`/portal/dashboard/${supplier.id}`);
    };

    const modalSummary = {
        itemsTotal: localLines.reduce((acc, line) => acc + calculateLineTotal(line), 0),
        shippingCost: shippingCost,
        total: calculateTotal(),
        itemCount: localLines.reduce((acc, l) => acc + l.qty, 0),
        method: logisticsType === 'pickup' ? 'Pickup en Tienda' : (logisticsType === 'fleet' ? 'Flota Propia' : 'Courier Externo'),
        date: etaDate,
        ref: logisticsType === 'pickup' ? (pickupReference || '-') : trackingNumber
    };

    return (
        <div className="min-h-screen bg-[#111316] font-body text-gray-200 flex flex-col">
            <PortalNavbar 
                brandPhone={BRAND_PHONE} 
                brandEmail={BRAND_EMAIL} 
                brandWhatsapp={BRAND_WHATSAPP}
                orderIdDisplay={order.idDisplay}
                onExit={() => navigate(`/portal/dashboard/${supplier.id}`)} 
                supplierId={supplier.id}
            />

            <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 lg:p-8 flex flex-col gap-6">
                
                {/* --- CANCELLED BANNER --- */}
                {isCancelled && (
                    <div className="w-full bg-red-500/10 border border-red-500/50 rounded-2xl p-6 flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                            <span className="material-icons text-red-500 text-2xl">block</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Orden Cancelada</h2>
                            <p className="text-red-200 text-sm">
                                Esta orden ha sido cancelada por la administración. La información se muestra solo para fines de consulta.
                            </p>
                        </div>
                    </div>
                )}

                {/* --- VISUAL SUCCESS BANNER FOR APPROVED NEGOTIATION --- */}
                {isApprovedNegotiation && (
                    <div className="w-full bg-gradient-to-r from-emerald-600 to-green-500 rounded-2xl p-6 shadow-lg shadow-green-900/20 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 border border-green-400">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <span className="material-icons text-3xl text-white">celebration</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">¡Buenas noticias! Tu propuesta fue aceptada.</h2>
                                <p className="text-green-100 font-medium text-sm">
                                    La administración ha validado los cambios. Por favor, procede a completar los datos de logística para el despacho.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                            <span className="text-xs font-bold text-white uppercase tracking-wider block text-center">ESTADO ACTUAL</span>
                            <span className="text-lg font-display font-bold text-white block text-center">LISTO PARA ENVÍO</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-8 h-full">
                        <PortalHero 
                            date={order.date} 
                            total={order.total} 
                            supplier={supplier} 
                            notes={order.notes}
                        />
                    </div>
                    <div className="lg:col-span-4 h-full">
                        <div className={`rounded-2xl shadow-lg border p-6 h-full flex flex-col justify-between transition-colors ${
                                isApprovedNegotiation 
                                ? 'bg-[#152e25] border-emerald-800' 
                                : isCancelled 
                                    ? 'bg-[#1e1a1a] border-red-900/30'
                                    : 'bg-[#1e2024] border-gray-700'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className={`text-lg font-bold ${isApprovedNegotiation ? 'text-emerald-400' : isCancelled ? 'text-red-400' : 'text-white'}`}>
                                    {isCancelled ? 'Estado Final' : isRevisionSent ? 'ORDEN MODIFICADA' : isApprovedNegotiation ? 'Propuesta Aceptada' : 'Orden Enviada'}
                                </h2>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                    isCancelled
                                        ? 'bg-red-900/30 text-red-400 border-red-800'
                                        : isRevisionSent 
                                            ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800' 
                                            : isApprovedNegotiation 
                                                ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700' 
                                                : 'bg-blue-900/30 text-blue-400 border-blue-800'
                                }`}>
                                    {isCancelled ? 'Cancelada' : isRevisionSent ? 'Acción Requerida' : isApprovedNegotiation ? 'Confirmado' : 'Esperando'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-6">
                                {isCancelled
                                    ? 'La orden se encuentra inactiva. No se pueden realizar más cambios.'
                                    : isRevisionSent 
                                        ? 'La administración ha actualizado la orden con cambios en productos o cantidades. Revisa abajo los detalles y confirma.' 
                                        : isApprovedNegotiation 
                                            ? 'La administración ha aceptado tu propuesta. Procede al despacho.'
                                            : `La orden ${order.idDisplay} fue notificada al proveedor.`}
                            </p>
                            
                            {/* Re-use PortalPayment Logic but potentially disabled if locked */}
                            {isPaymentLocked ? (
                                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-center opacity-70">
                                    <span className="material-icons text-4xl text-green-500 mb-2">check_circle</span>
                                    <h3 className="text-lg font-bold text-white">Pago Acordado</h3>
                                    <p className="text-xs text-gray-400 mt-1">Los detalles de pago fueron confirmados en la etapa anterior.</p>
                                </div>
                            ) : (
                                <PortalPayment 
                                    total={calculateTotal()}
                                    paymentTerms={order.paymentTerms || supplier.paymentTerms || 'Contado'}
                                    invoiceFile={invoiceFile}
                                    setInvoiceFile={setInvoiceFile}
                                    paymentAccepted={paymentAccepted}
                                    setPaymentAccepted={setPaymentAccepted}
                                    etaDate={etaDate}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-8 h-full min-h-[600px]">
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                {isRevisionSent ? 'Revisión de Productos' : isApprovedNegotiation ? 'Items Acordados' : 'Contenido de la Orden'}
                            </h3>
                            {(isRevisionSent) && (
                                <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-800 font-bold">
                                    VERIFICA CAMBIOS Y NUEVOS
                                </span>
                            )}
                            {(isApprovedNegotiation) && (
                                <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-800 font-bold flex items-center gap-1">
                                    <span className="material-icons text-[10px]">thumb_up</span> ACUERDO CONFIRMADO
                                </span>
                            )}
                        </div>
                        <PortalItemsTable 
                            localLines={localLines}
                            originalLines={order.originalLines || order.lines || []}
                            onQtyChange={handleQtyChange}
                            onPriceChange={handlePriceChange}
                            onDiscountValChange={handleDiscountValChange}
                            onToggleDiscountType={toggleDiscountType}
                            onMarkUnavailable={handleMarkUnavailable}
                            onRestoreItem={handleRestoreItem}
                            onToggleLineConfirmation={toggleLineConfirmation}
                            onToggleAllConfirmation={toggleAllConfirmation}
                            calculateLineTotal={calculateLineTotal}
                            calculateTotal={calculateTotal}
                            allConfirmed={allConfirmed}
                            readOnly={isItemsLocked}
                            acceptedItemIds={acceptedItemIds}
                            separateAcceptedItems={isRevisionSent} // This prop triggers the split view in table
                        />
                    </div>

                    <div className="lg:col-span-4 h-full flex flex-col gap-6">
                        <PortalLogistics 
                            logisticsType={logisticsType}
                            setLogisticsType={setLogisticsType}
                            carrierName={carrierName}
                            setCarrierName={setCarrierName}
                            trackingNumber={trackingNumber}
                            setTrackingNumber={setTrackingNumber}
                            driverName={driverName}
                            setDriverName={setDriverName}
                            vehiclePlate={vehiclePlate}
                            setVehiclePlate={setVehiclePlate}
                            driverPhone={driverPhone}
                            setDriverPhone={setDriverPhone}
                            pickupAddress={pickupAddress}
                            setPickupAddress={setPickupAddress}
                            pickupReference={pickupReference}
                            setPickupReference={setPickupReference}
                            pickupHours={pickupHours}
                            setPickupHours={setPickupHours}
                            etaDate={etaDate}
                            setEtaDate={setEtaDate}
                            onConfirmOrder={handlePreConfirm} 
                            onExit={() => navigate(`/portal/dashboard/${supplier.id}`)} 
                            requestedMethod={order.shippingMethod}
                            shippingCost={shippingCost}
                            setShippingCost={setShippingCost}
                            missingFields={missingFields}
                            readOnly={isLogisticsLocked} // Force ReadOnly if locked (Cancelled/Delivered)
                            supplierShippingCosts={supplier?.shippingCosts}
                            // Unlock logistics if RevisionSent so vendor can update details if needed
                            restrictToTracking={isApprovedNegotiation} 
                        />

                         {/* Only show this block if locked by revision logic but not totally finalized. 
                             If it's ApprovedNegotiation, isLogisticsLocked is false, so PortalLogistics renders with button inside.
                          */}
                         {isLogisticsLocked && !isLocked && (
                             <div className="bg-[#1e2024] rounded-2xl p-6 border border-gray-700 shadow-lg">
                                 <p className="text-xs text-gray-400 mb-4 text-center">
                                     {isDispute 
                                        ? 'Has realizado cambios en la orden. Se enviará como propuesta.' 
                                        : 'Todo parece correcto. Listo para despachar.'}
                                 </p>
                                 <button 
                                    onClick={handlePreConfirm}
                                    className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1
                                        ${isDispute 
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20' 
                                            : 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/20'}
                                    `}
                                 >
                                     <span className="material-icons text-sm">{isDispute ? 'gavel' : 'local_shipping'}</span>
                                     {isDispute ? 'Enviar Contrapropuesta' : 'Confirmar & Despachar'}
                                 </button>
                             </div>
                         )}
                    </div>
                </div>
            </main>

            <footer className="bg-[#1e2024] border-t border-gray-800 py-8 mt-12">
                <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-xs">
                    <p>&copy; 2024 Dermibelle Studio. Portal de Proveedores Seguro.</p>
                </div>
            </footer>

            <PortalConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleFinalSubmit}
                summary={modalSummary}
                contacts={supplier.contacts || []}
                isDispute={isDispute}
                changes={detectedChanges}
                fixedResponsible={existingResponsible}
            />
        </div>
    );
};

export default VendorOrderPortal;