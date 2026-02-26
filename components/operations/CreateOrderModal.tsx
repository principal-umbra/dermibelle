
import React, { useState, useEffect, useMemo } from 'react';
import { useData, AppointmentItem, Order, OrderTemplate, Supplier } from '../../context/DataContext';
import OrderHeader from './order/OrderHeader';
import SmartCatalog from './order/SmartCatalog';
import OrderGrid from './order/OrderGrid';
import OrderFooter from './order/OrderFooter';
import OrderPreviewFullModal from './order/OrderPreviewFullModal';
import { generateId } from '../../utils/helpers';

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderToEdit?: Order;
    preselectedSupplierId?: string;
}

interface OrderItem {
    item: AppointmentItem;
    quantity: number;
    cost: number;
    discountPercent: number;
    deliveryType: 'immediate' | 'backorder';
}

const BASE_SHIPPING_OPTIONS = [
    { id: 'ground', label: 'Standard Ground', days: 5, risk: 'Bajo' },
    { id: 'express', label: 'Express Air', days: 1, risk: 'Medio' },
    { id: 'pickup', label: 'Pickup en Bodega', days: 0, risk: 'Nulo' },
];

const NOTE_ROLES = ['Almacén', 'Contabilidad', 'Recepción', 'Gerencia'];
const ORDER_STATUSES = ['Borrador aprobado', 'Enviado proveedor', 'Programado'];

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, orderToEdit, preselectedSupplierId }) => {
    const { suppliers, catalog, addToast, orderTemplates, addOrderTemplate, addOrder, updateOrder } = useData();
    
    // Header & General
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    const [orderDate, setOrderDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [expectedDate, setExpectedDate] = useState('');
    
    // Logistics
    const [shippingMethodId, setShippingMethodId] = useState('ground');
    const [allowPartialDelivery, setAllowPartialDelivery] = useState(false);
    const [noteType, setNoteType] = useState('Almacén');
    const [notesInternal, setNotesInternal] = useState('');
    const [initialStatus, setInitialStatus] = useState('Borrador aprobado');
    const [postAction, setPostAction] = useState('close');

    // Financials
    const [paymentTerm, setPaymentTerm] = useState('Net 30');
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(0);
    const [globalDiscount, setGlobalDiscount] = useState<number>(0);
    const [manualAdjustment, setManualAdjustment] = useState<number>(0);
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [showAdvancedTotals, setShowAdvancedTotals] = useState(false);
    
    // Cart & Logic
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [selectionMode, setSelectionMode] = useState<'product' | 'need'>('product'); 
    
    // UI/Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // Scheduling Logic
    const [showScheduleConfirm, setShowScheduleConfirm] = useState(false);
    const [scheduledTime, setScheduledTime] = useState('09:00');
    
    // Animation State
    const [highlightClearBtn, setHighlightClearBtn] = useState(false);
    
    // Recurring Modal State
    const [showRecurringModal, setShowRecurringModal] = useState(false);
    const [recurringName, setRecurringName] = useState('');

    const selectedSupplier = useMemo(() => suppliers.find(s => s.id === selectedSupplierId), [suppliers, selectedSupplierId]);

    // Filtered Templates based on Supplier
    const relevantTemplates = useMemo(() => {
        return orderTemplates.filter(t => !t.supplierId || (selectedSupplierId && t.supplierId === selectedSupplierId));
    }, [orderTemplates, selectedSupplierId]);

    // Initialize or Reset
    useEffect(() => {
        if (isOpen) {
            if (orderToEdit) {
                // EDIT MODE: Populate from existing order
                setSelectedSupplierId(orderToEdit.supplierId || '');
                setOrderDate(orderToEdit.date);
                
                // Map Lines to Cart
                if (orderToEdit.lines) {
                    const loadedCart: OrderItem[] = orderToEdit.lines.map(line => {
                         const catalogItem = catalog.find(i => i.id === line.itemId) || {
                             id: line.itemId,
                             title: line.title,
                             price: line.price, // Fallback price from order
                             type: 'product',
                             // Mock other required fields if item deleted from catalog
                             category: 'General',
                             sku: 'UNKNOWN'
                         } as AppointmentItem;

                         return {
                             item: catalogItem,
                             quantity: line.qty,
                             cost: line.price,
                             discountPercent: 0,
                             deliveryType: 'immediate'
                         };
                    });
                    setCart(loadedCart);
                }

                // Load Settings
                if (orderToEdit.shippingMethod) setShippingMethodId(orderToEdit.shippingMethod);
                if (orderToEdit.paymentTerms) setPaymentTerm(orderToEdit.paymentTerms);
                if (orderToEdit.notes) setNotesInternal(orderToEdit.notes);
                if (orderToEdit.scheduledTime) setScheduledTime(orderToEdit.scheduledTime);
                
                // Map Status Back
                if (orderToEdit.status === 'Pending Approval') setInitialStatus('Borrador aprobado');
                else if (orderToEdit.status === 'Placed') setInitialStatus('Enviado proveedor');
                else if (orderToEdit.status === 'Scheduled') setInitialStatus('Programado');
                else setInitialStatus('Borrador aprobado');

            } else {
                // CREATE MODE: Reset to defaults
                setSelectedSupplierId(preselectedSupplierId || ''); // Use preselected if available
                setCart([]);
                setSearchTerm('');
                setNotesInternal('');
                setShippingCost(0); 
                setTaxRate(0);
                setGlobalDiscount(0);
                setManualAdjustment(0);
                setAdjustmentReason('');
                setOrderDate(new Date().toLocaleDateString('en-CA'));
                setExpectedDate('');
                setShowTemplates(false);
                setSelectionMode('product');
                setShowConfirmModal(false);
                setShowRecurringModal(false);
                setShowAdvancedTotals(false);
                setAllowPartialDelivery(false);
                setNoteType('Almacén');
                setInitialStatus(preselectedSupplierId ? 'Enviado proveedor' : 'Borrador aprobado'); // Default to placed if in context
                setShowScheduleConfirm(false);
                
                // Set default scheduled time to next hour
                const nextHour = new Date();
                nextHour.setHours(nextHour.getHours() + 1);
                const hh = String(nextHour.getHours()).padStart(2, '0');
                const mm = '00';
                setScheduledTime(`${hh}:${mm}`);
            }
        }
    }, [isOpen, orderToEdit, catalog, preselectedSupplierId]);

    // CALCULATE DYNAMIC SHIPPING OPTIONS based on selected supplier
    const dynamicShippingOptions = useMemo(() => {
        return BASE_SHIPPING_OPTIONS.map(option => {
            let cost = 0;
            
            if (selectedSupplier && selectedSupplier.shippingCosts) {
                 if (option.id === 'ground') cost = selectedSupplier.shippingCosts.standard;
                 else if (option.id === 'express') cost = selectedSupplier.shippingCosts.express;
                 else if (option.id === 'pickup') cost = selectedSupplier.shippingCosts.pickup;
            } else {
                 // Fallback defaults if supplier data missing
                 if (option.id === 'ground') cost = 15;
                 else if (option.id === 'express') cost = 55;
            }

            return {
                ...option,
                cost,
                label: `${option.label} ($${cost.toFixed(2)})` // Update label to show price in UI
            };
        });
    }, [selectedSupplier]);

    // Update Shipping Cost & Date based on Selection (and trigger update when supplier changes)
    useEffect(() => {
        const selectedOption = dynamicShippingOptions.find(o => o.id === shippingMethodId);
        
        if (selectedOption) {
            setShippingCost(selectedOption.cost);
            
            // Calculate Date
            // FIX: Ensure orderDate is treated as YYYY-MM-DD local, not UTC
            const [y, m, d] = orderDate.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            
            date.setDate(date.getDate() + selectedOption.days);
            const ey = date.getFullYear();
            const em = String(date.getMonth() + 1).padStart(2, '0');
            const ed = String(date.getDate()).padStart(2, '0');
            setExpectedDate(`${ey}-${em}-${ed}`);
        }
    }, [shippingMethodId, orderDate, dynamicShippingOptions, selectedSupplier]);

    // Supplier Pre-config
    useEffect(() => {
        if (selectedSupplier) {
            if (selectedSupplier.paymentTerms) setPaymentTerm(selectedSupplier.paymentTerms);
            if (selectedSupplier.category === 'Equipos' || selectedSupplier.category === 'Inyectables') {
                setTaxRate(18);
            } else {
                setTaxRate(0);
            }
        }
    }, [selectedSupplier]);

    // Financial Calcs
    const itemsTotal = useMemo(() => cart.reduce((sum, line) => {
        const lineTotal = line.cost * line.quantity;
        const discount = lineTotal * (line.discountPercent / 100);
        return sum + (lineTotal - discount);
    }, 0), [cart]);

    const globalDiscountAmount = itemsTotal * (globalDiscount / 100);
    const subtotalAfterGlobal = itemsTotal - globalDiscountAmount;
    const taxAmount = subtotalAfterGlobal * (taxRate / 100);
    const totalOrder = subtotalAfterGlobal + taxAmount + shippingCost + manualAdjustment;
    
    // Credit & Validation
    const supplierCreditStats = useMemo(() => {
        if (!selectedSupplier) return { limit: 0, used: 0, available: 0 };
        const limit = 50000; 
        const used = 12450; 
        return { limit, used, available: limit - used };
    }, [selectedSupplier]);

    const isCreditExceeded = totalOrder > supplierCreditStats.available;
    const isAtypicalOrder = useMemo(() => totalOrder > 5000, [totalOrder]);

    const confidenceScore = useMemo(() => {
        let score = 100;
        if (!selectedSupplierId) return 0;
        if (totalOrder > 10000) score -= 20; 
        if (cart.some(i => (i.item.stock || 0) > 50)) score -= 10; 
        if (cart.some(i => i.deliveryType === 'backorder')) score -= 15;
        if (isCreditExceeded) score -= 25;
        return Math.max(0, score);
    }, [selectedSupplierId, totalOrder, cart, isCreditExceeded]);

    const daysCovered = useMemo(() => {
        if (cart.length === 0) return 0;
        const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
        return Math.floor((totalItems * 2) / 5);
    }, [cart]);

    const validationErrors = useMemo(() => {
        const errors: string[] = [];
        if (!selectedSupplierId) errors.push('Selecciona un proveedor');
        if (cart.length === 0) errors.push('El carrito está vacío');
        if (manualAdjustment !== 0 && !adjustmentReason.trim()) errors.push('Justifica el ajuste manual');
        if (isCreditExceeded && paymentTerm.startsWith('Net')) errors.push('Excede límite de crédito');
        return errors;
    }, [selectedSupplierId, cart.length, manualAdjustment, adjustmentReason, isCreditExceeded, paymentTerm]);

    // Catalog Logic
    const availableProducts = useMemo(() => {
        return catalog.filter(item => {
            if (item.type !== 'product') return false;
            let matchesSupplier = true;
            if (selectedSupplierId) {
                if (item.supplierId) matchesSupplier = item.supplierId === selectedSupplierId;
                else {
                    const sup = suppliers.find(s => s.id === selectedSupplierId);
                    if (sup && sup.tags && sup.tags.length > 0) {
                         const hasTagMatch = sup.tags.some(t => item.category?.includes(t) || item.tags?.includes(t));
                         matchesSupplier = hasTagMatch;
                    } else matchesSupplier = !item.supplierId; 
                }
            }
            const matchesSearch = searchTerm === '' || 
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesNeed = selectionMode === 'need' 
                ? (item.stock || 0) <= (item.minStock || 5) 
                : true;

            const matchesLowStock = showOnlyLowStock ? (item.stock || 0) <= (item.minStock || 5) : true;
            return matchesSupplier && matchesSearch && matchesLowStock && matchesNeed;
        });
    }, [catalog, searchTerm, selectedSupplierId, showOnlyLowStock, suppliers, selectionMode]);

    // Handlers
    
    const handleSupplierChange = (id: string) => {
        if (cart.length > 0 && id !== selectedSupplierId) {
            // Trigger Animation
            setHighlightClearBtn(true);
            addToast('info', 'Debes limpiar la lista antes de cambiar de proveedor.');
            
            // Remove animation after 2s
            setTimeout(() => setHighlightClearBtn(false), 2000);
        } else {
            setSelectedSupplierId(id);
        }
    };

    const addToCart = (product: AppointmentItem, qtyOverride?: number) => {
        if (!selectedSupplierId) {
            addToast('error', 'Selecciona un proveedor para comenzar.');
            return;
        }
        setCart(prev => {
            const exists = prev.find(line => line.item.id === product.id);
            if (exists) {
                return prev.map(line => line.item.id === product.id ? { ...line, quantity: line.quantity + (qtyOverride || 1) } : line);
            }
            const acquisitionCost = product.packageCost || product.cost || (product.price * 0.4); 
            return [...prev, { item: product, quantity: qtyOverride || 1, cost: acquisitionCost, discountPercent: 0, deliveryType: 'immediate' }]; 
        });
    };
    
    // Handler for SmartCatalog quantity updates
    const handleUpdateQuantityById = (itemId: string | number, delta: number) => {
        setCart(prev => {
            const index = prev.findIndex(line => line.item.id === itemId);
            if (index === -1) return prev;
            
            const newCart = [...prev];
            const newQty = newCart[index].quantity + delta;
            
            if (newQty <= 0) {
                 return prev.filter((_, i) => i !== index);
            }
            // Create a new object for the updated line to avoid mutation
            newCart[index] = { ...newCart[index], quantity: newQty };
            return newCart;
        });
    };

    const handleFastMode = () => {
        if (!selectedSupplierId) { addToast('error', 'Selecciona proveedor.'); return; }
        const suggested = availableProducts
            .filter(p => (p.stock || 0) <= (p.minStock || 5))
            .map(p => ({
                item: p,
                quantity: Math.max(1, ((p.minStock || 5) * 2) - (p.stock || 0)),
                cost: p.packageCost || p.cost || (p.price * 0.4),
                discountPercent: 0,
                deliveryType: 'immediate' as const
            }));

        if (suggested.length === 0) {
            addToast('info', 'No hay sugerencias críticas.');
            return;
        }
        
        setCart(prev => {
            const existingIds = new Set(prev.map(i => i.item.id));
            const newItems = suggested.filter(i => !existingIds.has(i.item.id));
            return [...prev, ...newItems];
        });
        addToast('success', `Fast Mode: ${suggested.length} items agregados.`);
    };

    const handleLoadTemplate = (templateId: string) => {
        const template = orderTemplates.find(t => t.id === templateId);
        if (!template) return;
        if (!selectedSupplierId) { addToast('error', 'Selecciona un proveedor.'); return; }

        let addedCount = 0;
        setCart(prev => {
            const nextCart = [...prev];
            template.items.forEach(tmplItem => {
                const product = catalog.find(p => p.id === tmplItem.itemId);
                if (product) {
                    const existingIdx = nextCart.findIndex(i => i.item.id === product.id);
                    if (existingIdx >= 0) {
                        nextCart[existingIdx] = { ...nextCart[existingIdx], quantity: nextCart[existingIdx].quantity + tmplItem.quantity };
                    } else {
                        const acquisitionCost = product.packageCost || product.cost || (product.price * 0.4);
                        nextCart.push({
                            item: product,
                            quantity: tmplItem.quantity,
                            cost: acquisitionCost,
                            discountPercent: 0,
                            deliveryType: 'immediate'
                        });
                    }
                    addedCount++;
                }
            });
            return nextCart;
        });

        if (addedCount > 0) addToast('success', `Plantilla "${template.name}" aplicada.`);
        setShowTemplates(false);
    };

    const executeOrderCreation = () => {
        // Map UI Status to Type Status
        let finalStatus: Order['status'] = 'Draft';
        if (initialStatus === 'Enviado proveedor') finalStatus = 'Placed';
        if (initialStatus === 'Pendiente aprobación') finalStatus = 'Pending Approval';
        if (initialStatus === 'Programado') finalStatus = 'Scheduled';
        
        // --- DATE VALIDATION LOGIC FOR SCHEDULING ---
        if (finalStatus === 'Scheduled') {
            const now = new Date();
            const scheduled = new Date(`${orderDate}T${scheduledTime}:00`);

            if (scheduled < now) {
                addToast('error', 'No puedes programar una orden en el pasado.');
                return;
            }
        }
        
        const linesData = cart.map(c => ({
            itemId: c.item.id,
            title: c.item.title,
            qty: c.quantity,
            receivedQty: 0,
            price: c.cost,
            stockAtOrder: c.item.stock || 0,
            unitAtOrder: c.item.packageInfo?.purchaseUnit || 'unid'
        }));

        const commonData = {
            clientName: selectedSupplier?.companyName || 'Proveedor',
            supplierId: selectedSupplierId,
            items: cart.map(c => c.item.title).join(', '),
            total: totalOrder,
            status: finalStatus,
            date: orderDate, // Store string explicitly as YYYY-MM-DD
            scheduledTime: finalStatus === 'Scheduled' ? scheduledTime : undefined,
            type: 'physical' as const,
            lines: linesData,
            shippingMethod: shippingMethodId,
            shippingCost: shippingCost,
            paymentTerms: paymentTerm,
            notes: notesInternal + (initialStatus === 'Programado' ? ` | Auto-envío programado` : '')
        };

        if (orderToEdit) {
            // Update Existing
            updateOrder(orderToEdit.id, commonData);
            addToast('success', initialStatus === 'Programado' ? 'Orden reprogramada correctamente.' : 'Orden actualizada correctamente.');
        } else {
            // Create New
            const newOrder: Order = {
                ...commonData,
                id: `ORD-${Date.now()}`,
                idDisplay: `#${Date.now().toString().slice(-4)}`,
                originalLines: linesData,
                initialLines: linesData // Initialize baseline
            };
            addOrder(newOrder);
            addToast('success', initialStatus === 'Programado' ? 'Orden programada para envío automático.' : 'Orden creada correctamente.');
        }

        if (postAction === 'pdf') addToast('info', 'Generando PDF...');
        if (postAction === 'email') addToast('info', `Enviando correo a ${selectedSupplier?.email || 'proveedor'}...`);
        
        onClose();
    };

    const handleFinalCreate = () => {
        if (validationErrors.length > 0) {
            addToast('error', 'Corrige los errores antes de continuar.');
            return;
        }

        // Intercept for Scheduling
        if (initialStatus === 'Programado') {
            setShowScheduleConfirm(true);
            return;
        }

        executeOrderCreation();
    };

    const updateLineItem = (index: number, field: keyof OrderItem, value: any) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[index] = { ...newCart[index], [field]: value };
            return newCart;
        });
    };

    const removeItem = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const getSuggestedQty = (item: AppointmentItem) => {
        const velocity = 0.5; 
        const targetDays = 30;
        const needed = Math.ceil(targetDays * velocity);
        return Math.max(1, needed - (item.stock || 0));
    };

    // --- BUTTON ACTIONS ---
    const handleClearCart = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (cart.length === 0) return;
        
        setCart([]);
        setHighlightClearBtn(false); // Reset animation state
        addToast('info', 'Lista de productos limpiada.');
    };

    const handleOpenRecurringModal = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (cart.length === 0) {
            addToast('error', 'La lista está vacía.');
            return;
        }
        setRecurringName(selectedSupplier ? `Pedido ${selectedSupplier.companyName} - Estándar` : 'Pedido Estándar');
        setShowRecurringModal(true);
    };

    const handleConfirmRecurringSave = () => {
        if (!recurringName.trim()) {
            addToast('error', 'El nombre es obligatorio.');
            return;
        }
        
        // Save to DB via Context
        addOrderTemplate({
            name: recurringName,
            supplierId: selectedSupplierId,
            items: cart.map(line => ({ itemId: line.item.id, quantity: line.quantity }))
        });

        addToast('success', `Plantilla "${recurringName}" guardada exitosamente.`);
        setShowRecurringModal(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-[#f8fafc] dark:bg-[#0f1115] w-full max-w-[98vw] lg:max-w-[95vw] xl:max-w-[1300px] rounded-[2rem] shadow-2xl border border-white/50 dark:border-gray-700 flex flex-col h-[95vh] overflow-hidden relative" onClick={e => e.stopPropagation()}>
                
                <OrderHeader 
                    suppliers={suppliers}
                    selectedSupplierId={selectedSupplierId}
                    setSelectedSupplierId={handleSupplierChange}
                    cartLength={cart.length}
                    daysCovered={daysCovered}
                    confidenceScore={confidenceScore}
                    totalOrder={totalOrder}
                    onClose={onClose}
                />

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-50/30 dark:bg-black/20">
                    
                    {/* LEFT COLUMN: Catalog + Placeholder Actions (4/12) */}
                    <div className="w-full lg:w-4/12 flex flex-col h-full border-r border-gray-200 dark:border-gray-800">
                        <div className="flex-1 min-h-0 relative">
                            <SmartCatalog 
                                catalog={catalog}
                                selectedSupplierId={selectedSupplierId}
                                suppliers={suppliers}
                                cart={cart.map(c => ({ item: c.item, quantity: c.quantity }))}
                                onAddToCart={addToCart}
                                onUpdateQuantity={handleUpdateQuantityById}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                selectionMode={selectionMode}
                                setSelectionMode={setSelectionMode}
                                showTemplates={showTemplates}
                                setShowTemplates={setShowTemplates}
                                onLoadTemplate={handleLoadTemplate}
                                onFastMode={handleFastMode}
                                availableProducts={availableProducts}
                                templates={relevantTemplates}
                            />
                        </div>
                        {/* Action Buttons Box */}
                        <div className="p-4 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 shrink-0 grid grid-cols-2 gap-2 relative z-10">
                             <button 
                                type="button"
                                onClick={handleClearCart}
                                disabled={cart.length === 0}
                                className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group
                                    ${highlightClearBtn 
                                        ? 'bg-red-500 text-white border-red-600 scale-105 shadow-lg shadow-red-500/30 animate-pulse' 
                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10'
                                    }
                                `}
                             >
                                <span className="material-icons text-sm group-hover:shake">delete_sweep</span> Limpiar Lista
                             </button>
                             <button 
                                type="button"
                                onClick={handleOpenRecurringModal}
                                disabled={cart.length === 0}
                                className="py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                <span className="material-icons text-sm">update</span> Guardar Recurrente
                             </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Grid + Footer (8/12) */}
                    <div className="w-full lg:w-8/12 flex flex-col h-full">
                        <div className="flex-1 min-h-0 relative">
                            <OrderGrid 
                                cart={cart}
                                onUpdateLineItem={updateLineItem}
                                onRemoveItem={removeItem}
                                getSuggestedQty={getSuggestedQty}
                            />
                        </div>
                        <div className="shrink-0">
                            <OrderFooter 
                                shippingMethodId={shippingMethodId}
                                setShippingMethodId={setShippingMethodId}
                                paymentTerm={paymentTerm}
                                setPaymentTerm={setPaymentTerm}
                                isCreditExceeded={isCreditExceeded}
                                initialStatus={initialStatus}
                                setInitialStatus={setInitialStatus}
                                allowPartialDelivery={allowPartialDelivery}
                                setAllowPartialDelivery={setAllowPartialDelivery}
                                postAction={postAction}
                                setPostAction={setPostAction}
                                notesInternal={notesInternal}
                                setNotesInternal={setNotesInternal}
                                noteType={noteType}
                                setNoteType={setNoteType}
                                itemsTotal={itemsTotal}
                                shippingCost={shippingCost}
                                setShippingCost={setShippingCost}
                                taxRate={taxRate}
                                taxAmount={taxAmount}
                                manualAdjustment={manualAdjustment}
                                setManualAdjustment={setManualAdjustment}
                                globalDiscount={globalDiscount}
                                setGlobalDiscount={setGlobalDiscount}
                                totalOrder={totalOrder}
                                showAdvancedTotals={showAdvancedTotals}
                                setShowAdvancedTotals={setShowAdvancedTotals}
                                isAtypicalOrder={isAtypicalOrder}
                                validationErrors={validationErrors}
                                onClose={onClose}
                                onConfirm={() => setShowConfirmModal(true)}
                                expectedDate={expectedDate}
                                // Pass dynamic options to footer
                                SHIPPING_OPTIONS={dynamicShippingOptions}
                                NOTE_ROLES={NOTE_ROLES}
                                ORDER_STATUSES={ORDER_STATUSES}
                            />
                        </div>
                    </div>
                </div>

                {/* Confirm Modal */}
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-[2rem] shadow-2xl p-0 overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
                            <div className="bg-indigo-600 p-6 text-white text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                                <h3 className="font-bold text-xl relative z-10">{orderToEdit ? 'Actualizar Orden' : 'Resumen de Orden'}</h3>
                                <p className="text-xs opacity-80 relative z-10 mt-1">Revisa los detalles antes de {orderToEdit ? 'guardar' : 'enviar'}.</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <span className="text-sm text-gray-500">Proveedor</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{selectedSupplier?.companyName}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <span className="text-sm text-gray-500">Total Neto</span>
                                    <span className="text-2xl font-display font-bold text-indigo-600">${totalOrder.toFixed(2)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                                        <span className="block text-gray-400 uppercase text-[9px] font-bold mb-1">Entrega</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200 block">{dynamicShippingOptions.find(o=>o.id===shippingMethodId)?.label}</span>
                                        <span className="block text-[9px] text-gray-500 mt-1">{expectedDate}</span>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                                        <span className="block text-gray-400 uppercase text-[9px] font-bold mb-1">Pago</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200 block">{paymentTerm}</span>
                                        {isCreditExceeded && <span className="block text-[9px] text-red-500 font-bold mt-1">⚠️ Crédito Excedido</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-black/10 flex gap-4">
                                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors">Editar</button>
                                <button onClick={handleFinalCreate} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5">
                                    {orderToEdit ? 'Guardar Cambios' : 'Enviar Orden'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scheduling Modal */}
                {showScheduleConfirm && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={e => e.stopPropagation()}>
                        <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700 animate-in zoom-in-95">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="material-icons text-2xl">event</span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Programar Envío</h3>
                                <p className="text-sm text-gray-500 mt-1">Confirma cuándo se debe procesar esta orden.</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Fecha de Envío</label>
                                    <input 
                                        type="date" 
                                        value={orderDate} 
                                        onChange={(e) => setOrderDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]} // Validate min date
                                        className="w-full border rounded-xl p-3 text-sm dark:bg-black/20 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Hora (Opcional)</label>
                                    <input 
                                        type="time" 
                                        value={scheduledTime} 
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full border rounded-xl p-3 text-sm dark:bg-black/20 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-3 mt-8">
                                <button 
                                    onClick={() => setShowScheduleConfirm(false)} 
                                    className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowScheduleConfirm(false);
                                        executeOrderCreation(); // Execute with 'Scheduled' status implicit via logic in executeOrderCreation
                                    }}
                                    className="flex-[2] py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/20 transition-all"
                                >
                                    Confirmar Programación
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recurring Modal */}
                {showRecurringModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={e => e.stopPropagation()}>
                        <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400">
                                    <span className="material-icons">update</span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Guardar Recurrente</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Guarda esta lista como plantilla para el futuro.</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Nombre de Plantilla</label>
                                    <input 
                                        type="text" 
                                        value={recurringName} 
                                        onChange={(e) => setRecurringName(e.target.value)} 
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="Ej: Pedido Semanal Estándar"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowRecurringModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancelar</button>
                                    <button onClick={handleConfirmRecurringSave} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all">Guardar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateOrderModal;