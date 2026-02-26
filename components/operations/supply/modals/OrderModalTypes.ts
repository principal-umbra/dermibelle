
import { Order, Supplier } from '../../../../context/DataContext';

export interface OrderModalProps {
    order: Order;
    supplier: Supplier;
    onClose: () => void;
    onUpdateStatus: (status: Order['status']) => void;
    onOpenReception: () => void;
    updateOrderCtx: (id: string, data: Partial<Order>) => void;
    addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}
