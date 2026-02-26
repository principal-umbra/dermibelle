
import React, { useState } from 'react';
import { OrderModalProps } from './OrderModalTypes';
import { TransitHeader } from './transit/TransitHeader';
import { TransitDashboard } from './transit/TransitDashboard';
import { TransitItemsList } from './transit/TransitItemsList';
import { TransitReportFlow } from './transit/TransitReportFlow';

export const TransitModal: React.FC<OrderModalProps> = ({ order, supplier, onClose, onOpenReception, updateOrderCtx, addToast }) => {
    // Estados de Vista
    const [viewMode, setViewMode] = useState<'dashboard' | 'items' | 'report'>('dashboard');
    const orderData = order as any;
    const isPickup = order.shippingMethod === 'pickup';

    const handleCopyTracking = () => {
        const trackingRef = orderData.trackingNumber || 'PENDING';
        navigator.clipboard.writeText(trackingRef);
        addToast('success', 'Número de rastreo copiado al portapapeles');
    };

    // Acción: Contacto
    const handleContact = (method: 'email' | 'phone' | 'whatsapp') => {
        if (method === 'email' && supplier.email) {
             window.open(`mailto:${supplier.email}?subject=Consulta Orden ${order.idDisplay} (En Tránsito)&body=Hola ${supplier.contactPerson},%0D%0A%0D%0ASeguimiento de orden ${order.idDisplay}.%0D%0A%0D%0AGracias.`);
        } else if (method === 'phone' && supplier.phone) {
             window.location.href = `tel:${supplier.phone}`;
        } else if (method === 'whatsapp' && supplier.phone) {
             window.open(`https://wa.me/${supplier.phone.replace(/\D/g, '')}`, '_blank');
        } else {
            addToast('error', 'Información de contacto no disponible');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in" onClick={onClose}>
            <div className="bg-[#F8F9FC] dark:bg-surface-dark w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-gray-700 overflow-hidden flex flex-col h-[85vh] max-h-[800px]" onClick={e => e.stopPropagation()}>
                
                <TransitHeader 
                    order={order} 
                    supplier={supplier} 
                    isPickup={isPickup} 
                    onClose={onClose} 
                    onOpenReception={onOpenReception}
                    onAction={(action) => {
                        if (action === 'report') setViewMode('report');
                        if (action === 'manifest') setViewMode('items');
                    }}
                />

                <div className={`flex-1 relative ${viewMode === 'items' ? 'overflow-hidden' : 'overflow-hidden'}`}>
                    <div className="h-full p-6 overflow-y-auto custom-scrollbar">
                        {viewMode === 'dashboard' && (
                            <TransitDashboard 
                                order={order}
                                supplier={supplier}
                                isPickup={isPickup}
                                onContact={handleContact}
                                onCopyTracking={handleCopyTracking}
                                onChangeView={setViewMode}
                            />
                        )}

                        {viewMode === 'items' && (
                            <TransitItemsList 
                                order={order} 
                                onBack={() => setViewMode('dashboard')} 
                            />
                        )}

                        {viewMode === 'report' && (
                            <TransitReportFlow 
                                order={order}
                                onBack={() => setViewMode('dashboard')}
                                onComplete={() => setViewMode('dashboard')}
                                updateOrderCtx={updateOrderCtx}
                                addToast={addToast}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
