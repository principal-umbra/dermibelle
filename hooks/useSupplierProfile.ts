
import { useMemo } from 'react';
import { useData } from '../context/DataContext';

export const useSupplierProfile = (supplierId?: string) => {
    const { suppliers, orders, catalog } = useData();

    const supplier = useMemo(() => suppliers.find(s => s.id === supplierId), [suppliers, supplierId]);

    const stats = useMemo(() => {
        if (!supplier || !supplierId) return null;

        // 1. Filter Related Orders
        const supplierOrders = orders
            .filter(o => o.clientName === supplier.companyName) // Assuming clientName stores Supplier Name in Orders for this context
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 2. Financial Metrics
        const totalOrders = supplierOrders.length;
        const completedOrders = supplierOrders.filter(o => o.status === 'Delivered').length;
        const pendingOrders = supplierOrders.filter(o => o.status !== 'Delivered').length;
        
        // Calculate Spend based on Orders (parsing string total if needed, or assumig number)
        const totalSpend = supplierOrders.reduce((sum, ord) => sum + ord.total, 0);

        // 3. Catalog Metrics
        // Mocking relationship: Filter products that "might" belong to this supplier based on category matching or tags
        // In a real DB, items would have a `supplierId` field.
        const relatedItems = catalog.filter(item => 
            item.type === 'product' && 
            (supplier.tags?.some(tag => item.category?.includes(tag) || item.tags?.includes(tag)))
        );
        const lowStockItems = relatedItems.filter(i => (i.stock || 0) < 5).length;

        // 4. Dates
        const lastOrder = completedOrders > 0 ? supplierOrders.find(o => o.status === 'Delivered') : null;
        const nextDelivery = supplierOrders.find(o => o.status === 'In Transit');

        const formatDate = (dateStr: string) => {
            if(!dateStr) return '--';
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        };

        return {
            totalSpend,
            totalOrders,
            completedOrders,
            pendingOrders,
            lowStockItems,
            catalogSize: relatedItems.length,
            lastOrderDate: lastOrder ? formatDate(lastOrder.date) : '--',
            nextDeliveryDate: nextDelivery ? formatDate(nextDelivery.date) : '--',
            nextDeliveryStatus: nextDelivery ? 'En Camino' : 'Sin pendientes',
            // UI Helpers
            activityStatus: pendingOrders > 0 ? 'Activo' : 'Inactivo',
            activityColor: pendingOrders > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500',
            supplierOrders // Return detailed list for tabs
        };
    }, [supplier, orders, catalog, supplierId]);

    return { supplier, stats };
};