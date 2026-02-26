
import React, { useMemo } from 'react';
import { useData, Order } from '../../../context/DataContext';

// Importar modales específicos
import { PartialModal } from './modals/PartialModal';
import { CancelledModal } from './modals/CancelledModal';
import { CompletedModal } from './modals/CompletedModal'; 
import { DraftModal } from './modals/DraftModal'; 
import { PlacedModal } from './modals/PlacedModal';
import { TransitModal } from './modals/TransitModal';
import { ReviewChangesModal } from './modals/ReviewChangesModal'; 
import { ScheduledModal } from './modals/ScheduledModal'; // Nueva Importación

interface OrderDetailManagerProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string | null;
    onOpenReception: (id: string) => void;
    onUpdateStatus: (id: string, status: Order['status']) => void;
}

const OrderDetailManager: React.FC<OrderDetailManagerProps> = ({ 
    isOpen, onClose, orderId, onOpenReception, onUpdateStatus 
}) => {
    const { orders, suppliers, updateOrder, addToast } = useData();
    
    // Obtener orden y proveedor
    const order = useMemo(() => orders.find(o => o.id === orderId), [orders, orderId]);
    const supplier = useMemo(() => suppliers.find(s => s.id === order?.supplierId), [suppliers, order]);

    if (!isOpen || !order) return null;

    // Props comunes para todos los modales
    const commonProps = {
        order,
        supplier: supplier || { companyName: 'Desconocido', email: '', phone: '', contactPerson: '' } as any,
        onClose,
        onUpdateStatus: (status: Order['status']) => {
            onUpdateStatus(order.id, status);
            onClose();
        },
        onOpenReception: () => {
            onClose();
            onOpenReception(order.id);
        },
        updateOrderCtx: updateOrder, // Acceso directo para updates complejos
        addToast
    };

    // Renderizado condicional basado en el estado
    switch (order.status) {
        case 'Draft':
            return <DraftModal {...commonProps} />;
            
        case 'Scheduled': // Added Scheduled Case
            return <ScheduledModal {...commonProps} />;
        
        case 'Pending Approval': 
            return <ReviewChangesModal {...commonProps} />;

        case 'Placed':
            // Check for Dispute/Proposal Flag
            // @ts-ignore
            if (order.inDispute) {
                return <ReviewChangesModal {...commonProps} />;
            }
            return <PlacedModal {...commonProps} />;

        case 'Revision Sent':
            // When revision is sent, it acts like a placed order waiting for vendor confirmation
            return <PlacedModal {...commonProps} />;
        
        case 'In Transit':
            return <TransitModal {...commonProps} />;
        
        case 'Partially Received':
            return <PartialModal {...commonProps} />;
        
        case 'Delivered':
        case 'Completed':
            return <CompletedModal {...commonProps} />;
        
        case 'Cancelled':
            return <CancelledModal {...commonProps} />;
        
        default:
            // Fallback to Draft or generic view
            return <DraftModal {...commonProps} />;
    }
};

export default OrderDetailManager;