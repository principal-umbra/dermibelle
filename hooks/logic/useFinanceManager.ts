
import { useCallback } from 'react';
import { Invoice, Appointment, AppointmentItem } from '../../types';
import { catalogDB } from '../../services/database/catalog.db';
import { invoicesDB } from '../../services/database/invoices.db';
import { appointmentsDB } from '../../services/database/appointments.db';

export const useFinanceManager = (
    finance: any, // Typed as any to avoid circular type hell
    operations: any,
    catalogData: any,
    crm: any,
    system: any
) => {

    const createManualInvoice = useCallback((data: any, options?: { silent?: boolean }) => {
        const { clientId, clientName, items, date, time, existingAppointmentId, status, amount, discount } = data;
        const cleanItems = (items || []).filter(Boolean);
        const shouldReserveStock = !existingAppointmentId; 
        const total = amount || cleanItems.reduce((acc: number, i: any) => acc + (i.price * (i.quantity || 1)), 0);
        const serviceTotal = cleanItems.filter((i:any) => i?.type === 'service').reduce((acc: number, i: any) => acc + (i.price * (i.quantity || 1)), 0);
        const productTotal = cleanItems.filter((i:any) => i?.type === 'product').reduce((acc: number, i: any) => acc + (i.price * (i.quantity || 1)), 0);
        const newId = finance.generateInvoiceId();

        const newInvoice: Invoice = {
            id: newId,
            idDisplay: newId,
            clientId: clientId || 'GUEST',
            client: clientName || 'Cliente General',
            service: cleanItems.length > 0 ? cleanItems[0].title + (cleanItems.length > 1 ? ` y otros` : '') : 'Venta Directa',
            items: cleanItems.map((i:any) => ({...i})), 
            amount: total,
            date: date || new Date().toLocaleDateString('en-CA'),
            time: time || new Date().toLocaleTimeString(),
            status: status || 'Pendiente',
            appointmentId: existingAppointmentId,
            discount: discount,
            paymentBreakdown: {
                servicesTotal: serviceTotal,
                productsTotal: productTotal,
                servicesPaid: false,
                productsPaid: false
            }
        };

        const saveInvoice = () => {
            invoicesDB.add(newInvoice).then(() => {
                finance.setInvoices((prev: Invoice[]) => [newInvoice, ...prev]);
                if (!options?.silent) system.addToast('success', status === 'Cotización' ? 'Cotización creada y stock reservado' : 'Factura generada');
                
                if (clientId && clientId !== 'GUEST') {
                    const logAction = status === 'Cotización' ? 'quote_created' : 'invoice_created';
                    const serviceName = newInvoice.service || (cleanItems.length > 0 ? cleanItems[0].title : 'Varios');
                    const composition = `${cleanItems.filter((i:any) => i.type === 'service').length} Svcs, ${cleanItems.filter((i:any) => i.type === 'product').length} Prods`;
                    const logDesc = `${newInvoice.idDisplay}|${total.toFixed(2)}|${serviceName}|${composition}|${discount ? `Desc: ${discount.value}${discount.type === 'percent' ? '%' : '$'}` : 'Neto'}`;
                    
                    crm.addClientLog({
                        clientId: clientId,
                        type: 'finance',
                        action: logAction,
                        description: logDesc,
                        date: new Date().toLocaleDateString('es-ES')
                    });
                }
            });
        };

        if (shouldReserveStock) {
            catalogDB.reserveStock(cleanItems).then(() => {
                catalogDB.getAll().then(catalogData.setCatalog);
                saveInvoice();
            });
        } else {
            saveInvoice();
        }
    }, [finance.generateInvoiceId, finance.setInvoices, system.addToast, crm.addClientLog, catalogData.setCatalog]);

    const payInvoice = useCallback((id: string, scope: 'services' | 'products' | 'total', method: string, txId?: string, options?: { silent?: boolean }) => {
        const invoice = finance.invoices.find((i: Invoice) => i.id === id);
        if (!invoice) return;

        let newStatus = invoice.status;
        let breakdown = { ...invoice.paymentBreakdown! };
        let amountPaid = 0;
        let previousPaid = 0;
        
        if (invoice.paymentBreakdown) {
            if (invoice.paymentBreakdown.servicesPaid) previousPaid += invoice.paymentBreakdown.servicesTotal;
            if (invoice.paymentBreakdown.productsPaid) previousPaid += invoice.paymentBreakdown.productsTotal;
        }

        if (scope === 'services') amountPaid = breakdown.servicesTotal;
        else if (scope === 'products') amountPaid = breakdown.productsTotal;
        else {
            if (!breakdown.servicesPaid) amountPaid += breakdown.servicesTotal;
            if (!breakdown.productsPaid) amountPaid += breakdown.productsTotal;
            if (amountPaid === 0 && invoice.status !== 'Pagada') amountPaid = invoice.amount;
        }

        if (method === 'transferencia') {
            newStatus = 'En Tránsito';
        } else {
            if (scope === 'services') breakdown.servicesPaid = true;
            if (scope === 'products') breakdown.productsPaid = true;
            if (scope === 'total') {
                breakdown.servicesPaid = true;
                breakdown.productsPaid = true;
            }

            if (breakdown.servicesPaid && breakdown.productsPaid) newStatus = 'Pagada';
            else newStatus = 'Parcial';

            if (breakdown.servicesTotal === 0) breakdown.servicesPaid = true;
            if (breakdown.productsTotal === 0) breakdown.productsPaid = true;
            
            if (breakdown.servicesPaid && breakdown.productsPaid) newStatus = 'Pagada';
        }

        if (newStatus === 'Pagada' && invoice.status !== 'Pagada') {
            catalogDB.finalizeSale(invoice.items).then(() => {
                catalogDB.getAll().then(catalogData.setCatalog);
            });
        }

        const updated = { 
            ...invoice, 
            status: newStatus, 
            paymentMethod: method, 
            paymentBreakdown: breakdown,
            transactionReference: txId 
        };

        invoicesDB.update(updated).then(() => {
            finance.setInvoices((prev: Invoice[]) => prev.map(inv => inv.id === id ? updated : inv));
            
            if (!options?.silent) {
                system.addToast('success', method === 'transferencia' ? 'Pago registrado en tránsito' : 'Pago registrado y stock descontado.');
            }
            
            system.addNotification({
                type: 'payment_received',
                title: method === 'transferencia' ? 'Transferencia Reportada' : 'Pago Registrado',
                message: `Factura asociada pagada mediante ${method}`,
                time: 'Ahora',
                link: '/admin/finance/invoices'
            });

            if (invoice.clientId && invoice.clientId !== 'GUEST') {
                const action = method === 'transferencia' ? 'transfer_reported' : 'payment_received';
                const refDisplay = txId ? txId : (method === 'efectivo' ? 'Efectivo' : 'Sin Ref');
                const scopeDisplay = scope === 'total' ? 'Total' : (scope === 'services' ? 'Solo Servicios' : 'Solo Productos');
                
                const totalDue = invoice.amount;
                const newTotalPaid = previousPaid + (method === 'transferencia' ? 0 : amountPaid);
                const remaining = Math.max(0, totalDue - newTotalPaid);
                const balanceStatus = remaining === 0 ? 'Saldado' : `Resta: $${remaining.toFixed(2)}`;

                const logDesc = `${invoice.idDisplay}|${amountPaid.toFixed(2)}|${method}|${refDisplay}|${balanceStatus}|${scopeDisplay}`;
                
                crm.addClientLog({
                    clientId: invoice.clientId,
                    type: 'finance',
                    action: action,
                    description: logDesc,
                    date: new Date().toLocaleDateString('es-ES')
                });
            }
        });
    }, [finance.invoices, finance.setInvoices, catalogData.setCatalog, system.addToast, system.addNotification, crm.addClientLog]);

    const confirmInTransitInvoice = useCallback((id: string, finalReference: string) => {
        const invoice = finance.invoices.find((i: Invoice) => i.id === id);
        if (invoice) {
            const breakdown = invoice.paymentBreakdown ? {
                ...invoice.paymentBreakdown,
                servicesPaid: true,
                productsPaid: true
            } : undefined;
            
            catalogDB.finalizeSale(invoice.items).then(() => {
                catalogDB.getAll().then(catalogData.setCatalog);
            });

            const updated: Invoice = { 
                ...invoice, 
                status: 'Pagada',
                paymentBreakdown: breakdown,
                transactionReference: finalReference 
            };

            invoicesDB.update(updated).then(() => {
                finance.setInvoices((prev: Invoice[]) => prev.map(inv => inv.id === id ? updated : inv));
                system.addToast('success', 'Transferencia confirmada, pago registrado y stock descontado.');
                
                if (invoice.clientId && invoice.clientId !== 'GUEST') {
                    crm.addClientLog({
                        clientId: invoice.clientId,
                        type: 'finance',
                        action: 'transfer_confirmed',
                        description: `${invoice.idDisplay}|${invoice.amount.toFixed(2)}|${finalReference}|Conciliado`,
                        date: new Date().toLocaleDateString('es-ES')
                    });
                }
            });
        }
    }, [finance.invoices, finance.setInvoices, catalogData.setCatalog, system.addToast, crm.addClientLog]);

    const rejectInTransitInvoice = useCallback((id: string) => {
        const invoice = finance.invoices.find((i: Invoice) => i.id === id);
        if (invoice) {
            const updated: Invoice = { ...invoice, status: 'Pendiente' };
            invoicesDB.update(updated).then(() => {
                finance.setInvoices((prev: Invoice[]) => prev.map(inv => inv.id === id ? updated : inv));
                system.addToast('info', 'Transferencia rechazada, factura devuelta a pendiente.');
            });
        }
    }, [finance.invoices, finance.setInvoices, system.addToast]);

    const linkInvoiceToAppointment = useCallback((invoiceId: string, appointmentId: string) => {
        const invoice = finance.invoices.find((i: Invoice) => i.id === invoiceId);
        if (invoice) {
            if (invoice.appointmentId) {
                system.addToast('error', 'Esta factura ya está vinculada a otra cita. Desvincúlela primero.');
                return;
            }
            const updated: Invoice = { 
                ...invoice, 
                appointmentId, 
                status: (invoice.status === 'Anulada' || invoice.status === 'Cotización') ? 'Pendiente' : invoice.status 
            };
            invoicesDB.update(updated).then(() => {
                finance.setInvoices((prev: Invoice[]) => prev.map(inv => inv.id === invoiceId ? updated : inv));
                system.addToast('success', 'Factura vinculada correctamente');
                
                if (invoice.clientId && invoice.clientId !== 'GUEST') {
                    crm.addClientLog({
                        clientId: invoice.clientId,
                        type: 'finance',
                        action: 'invoice_linked',
                        description: `${invoice.idDisplay}|Vinculación Manual|Cita #${appointmentId}`,
                        date: new Date().toLocaleDateString('es-ES')
                    });
                }
            });
        }
    }, [finance.invoices, finance.setInvoices, system.addToast, crm.addClientLog]);

    const unlinkAndVoidInvoice = useCallback(async (invoiceId: string) => {
        const inv = finance.invoices.find((i: Invoice) => i.id === invoiceId);
        if (!inv) return;

        const linkedApptId = inv.appointmentId;
        
        if (inv.status !== 'Cotización' && inv.status !== 'Anulada') {
            await catalogDB.releaseReservation(inv.items);
        }

        const updatedInv: Invoice = { ...inv, status: 'Anulada', appointmentId: undefined };
        await invoicesDB.update(updatedInv);

        const newCatalog = await catalogDB.getAll();
        catalogData.setCatalog(newCatalog);
        finance.setInvoices((prev: Invoice[]) => prev.map(i => i.id === invoiceId ? updatedInv : i));

        if (inv.clientId && inv.clientId !== 'GUEST') {
            crm.addClientLog({
                clientId: inv.clientId,
                type: 'finance',
                action: 'invoice_voided',
                description: `${inv.idDisplay}|${inv.amount.toFixed(2)}|Anulación Manual|Sin motivo`,
                date: new Date().toLocaleDateString('es-ES')
            });
        }

        if (linkedApptId) {
            const hasOtherActiveInvoices = finance.invoices.some((i: Invoice) => 
                i.id !== invoiceId && 
                i.appointmentId === linkedApptId && 
                i.status !== 'Anulada'
            );

            if (!hasOtherActiveInvoices) {
                const appt = operations.appointments.find((a: Appointment) => a.id === linkedApptId);
                if (appt && appt.status !== 'Cancelled') {
                    const updatedAppt: Appointment = { ...appt, status: 'Cancelled' };
                    await appointmentsDB.update(updatedAppt);
                    operations.setAppointments((prev: Appointment[]) => prev.map(a => a.id === linkedApptId ? updatedAppt : a));
                    system.addToast('info', 'Factura anulada. La cita ha sido cancelada al quedar sin respaldo.');
                    return;
                }
            }
        }
        system.addToast('info', 'Factura anulada correctamente.');
    }, [finance.invoices, finance.setInvoices, catalogData.setCatalog, operations.setAppointments, crm.addClientLog, system.addToast, operations.appointments]);

    const getInvoiceByAppointmentId = useCallback((apptId: string) => {
        return finance.invoices.find((i: Invoice) => i.appointmentId === apptId);
    }, [finance.invoices]);

    const checkReferenceExists = useCallback((ref: string, method?: string) => {
        if (!ref) return false;
        const normalizedRef = ref.trim().toLowerCase();
        return finance.invoices.some((inv: Invoice) => {
            const statusMatch = inv.status === 'Pagada' || inv.status === 'Parcial';
            const refMatch = inv.transactionReference?.trim().toLowerCase() === normalizedRef;
            const methodMatch = method ? inv.paymentMethod === method : true;
            return statusMatch && refMatch && methodMatch;
        });
    }, [finance.invoices]);

    return {
        createManualInvoice,
        payInvoice,
        confirmInTransitInvoice,
        rejectInTransitInvoice,
        linkInvoiceToAppointment,
        unlinkAndVoidInvoice,
        getInvoiceByAppointmentId,
        checkReferenceExists
    };
};
