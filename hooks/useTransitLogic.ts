
import { useMemo } from 'react';
import { Order, useData } from '../context/DataContext';

export type TransitStatus = 'overdue' | 'warning' | 'normal';

export const useTransitLogic = (order: Order) => {
    const { supplierInvoices, catalog } = useData();

    // 1. ANÁLISIS DE TIEMPO
    const timeMetrics = useMemo(() => {
        const start = new Date(order.date).getTime();
        
        // Si no hay ETA, asumimos lead time estándar de 7 días
        const etaStr = order.eta || ''; 
        const end = etaStr ? new Date(etaStr).getTime() : start + (7 * 24 * 60 * 60 * 1000);
        
        const now = new Date().getTime();
        const totalDuration = end - start;
        const elapsed = now - start;
        
        // Progreso 0-100%
        let progress = 0;
        if (totalDuration > 0) {
            progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        }

        const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        
        // Estado derivado del tiempo
        let statusLabel = 'En Tiempo';
        let statusColor = 'text-green-600 bg-green-50 border-green-200';
        
        if (daysLeft < 0) {
            statusLabel = `Retrasado (${Math.abs(daysLeft)} días)`;
            statusColor = 'text-red-600 bg-red-50 border-red-200';
        } else if (daysLeft === 0) {
            statusLabel = 'Llega Hoy';
            statusColor = 'text-blue-600 bg-blue-50 border-blue-200';
        } else if (daysLeft <= 2) {
            statusLabel = 'Próximo Arribo';
            statusColor = 'text-orange-600 bg-orange-50 border-orange-200';
        }

        return {
            progress,
            daysLeft,
            etaDisplay: new Date(end).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            startDisplay: new Date(start).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            statusLabel,
            statusColor
        };
    }, [order]);

    // 2. ESTADO FINANCIERO (Cruce con SupplierInvoices)
    const financeStatus = useMemo(() => {
        // Buscar factura de proveedor vinculada
        const invoice = supplierInvoices.find(i => i.linkedOrderId === order.id);

        let status = 'Pendiente';
        let color = 'bg-gray-100 text-gray-500';
        
        if (!invoice) {
            status = 'Sin Factura';
            color = 'bg-gray-100 text-gray-500 border-gray-200';
        } else if (invoice.status === 'Paid') {
            status = 'Pagado';
            color = 'bg-green-100 text-green-700 border-green-200';
        } else if (invoice.status === 'Approved' || invoice.status === 'Scheduled') {
            status = 'Programado';
            color = 'bg-blue-100 text-blue-700 border-blue-200';
        } else if (invoice.status === 'Overdue') {
            status = 'Vencido';
            color = 'bg-red-100 text-red-700 border-red-200';
        } else {
            status = 'Por Pagar';
            color = 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }

        return {
            hasInvoice: !!invoice,
            invoiceId: invoice?.displayId || '-',
            amount: invoice?.amount || 0,
            status,
            color
        };
    }, [supplierInvoices, order]);

    // 3. ALERTA DE RECEPCIÓN (Análisis de Items)
    const receptionAlerts = useMemo(() => {
        const lineItems = order.lines || [];
        const alerts: string[] = [];
        let specialHandling = false;

        lineItems.forEach(line => {
            const item = catalog.find(i => i.id === line.itemId);
            const name = (item?.title || line.title).toLowerCase();
            const cat = (item?.category || '').toLowerCase();

            if (name.includes('serum') || name.includes('toxina') || name.includes('activo')) {
                if (!alerts.includes('Refrigeración')) alerts.push('Refrigeración');
                specialHandling = true;
            }
            if (name.includes('ampolla') || name.includes('vidrio') || cat.includes('equipo')) {
                if (!alerts.includes('Frágil')) alerts.push('Frágil');
                specialHandling = true;
            }
        });

        return {
            alerts,
            specialHandling,
            itemCount: lineItems.length,
            totalUnits: lineItems.reduce((acc, l) => acc + l.qty, 0)
        };
    }, [order, catalog]);

    return {
        timeMetrics,
        financeStatus,
        receptionAlerts,
        logisticsData: {
            // @ts-ignore
            carrier: order.carrier || (order.shippingMethod === 'pickup' ? 'N/A' : 'Propio'),
            // @ts-ignore
            trackingNumber: order.trackingNumber || '-',
            // @ts-ignore
            driverName: order.driverName,
            // @ts-ignore
            vehiclePlate: order.vehiclePlate,
            // @ts-ignore
            driverPhone: order.driverPhone,
            // @ts-ignore
            pickupAddress: order.pickupAddress,
            // @ts-ignore
            pickupReference: order.pickupReference,
            // @ts-ignore
            pickupHours: order.pickupHours
        }
    };
};
