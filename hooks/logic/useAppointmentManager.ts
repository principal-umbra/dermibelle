
import { useCallback } from 'react';
import { Appointment, Invoice, AppointmentItem, OpenStockItem } from '../../types';
import { catalogDB } from '../../services/database/catalog.db';
import { invoicesDB } from '../../services/database/invoices.db';
import { appointmentsDB } from '../../services/database/appointments.db';
import { openStockDB } from '../../services/database/open_stock.db';
import { generateId } from '../../utils/helpers';

export const useAppointmentManager = (
    operations: any,
    finance: any,
    catalogData: any, // Contains openStock state & methods
    crm: any,
    system: any
) => {

    const addAppointment = useCallback((appt: Omit<Appointment, 'id' | 'createdAt' | 'isArchived'>) => {
        const newId = operations.addAppointment(appt);
        
        // Efecto colateral: Reservar Stock si está confirmada
        if (appt.status === 'Confirmed') {
            catalogDB.reserveStock(appt.items).then(() => {
                catalogDB.getAll().then(catalogData.setCatalog);
            });
        }
        return newId;
    }, [operations.addAppointment, catalogData.setCatalog]);

    const updateAppointmentStatus = useCallback(async (id: string, status: Appointment['status']) => {
        const appt = operations.appointments.find((a: Appointment) => a.id === id);
        if (!appt) return;
        
        // --- LÓGICA DE CONSUMO INTELIGENTE (FINALIZAR) ---
        if (status === 'Finalized' && appt.status !== 'Finalized') {
            
            // 1. Obtener estado fresco de OpenStock desde DB
            let tempOpenStock = await openStockDB.getAll();

            // Iterate Service Items in Appointment
            for (const item of appt.items) {
                if (item.type === 'service' && item.recipe) {
                    const serviceQty = item.quantity || 1;
                    
                    for (const ingredient of item.recipe) {
                        const product = catalogData.catalog.find((p: AppointmentItem) => p.id === ingredient.id);
                        if (!product) continue;

                        // --- CÁLCULO DE CONSUMO NORMALIZADO ---
                        const pkgInfo = product.packageInfo || { contentPerUnit: 1, unitsPerPackage: 1 };
                        const totalContent = (pkgInfo.unitsPerPackage || 1) * (pkgInfo.contentPerUnit || 1);
                        
                        let amountToConsume = 0;
                        const mode = ingredient.consumptionMode || 'unit';
                        
                        if (mode === 'unit') {
                            // "1 Unidad" en receta = 1 Envase Completo (según lógica de visualización)
                            // Si el producto se mide en ml, 1 unidad = 1000ml (el contenido total del envase unitario)
                            amountToConsume = ingredient.qty * (pkgInfo.contentPerUnit || 1) * serviceQty;
                        } else if (mode === 'percentage') {
                             amountToConsume = (totalContent * (ingredient.qty / 100)) * serviceQty;
                        } else if (mode === 'yield') {
                             amountToConsume = (ingredient.qty > 0 ? totalContent / ingredient.qty : 0) * serviceQty;
                        } else {
                            // Measurement (ml, g)
                            amountToConsume = ingredient.qty * serviceQty;
                        }

                        // --- CICLO DE CONSUMO (Manejo de múltiples envases si es necesario) ---
                        let remainingToConsume = amountToConsume;
                        
                        // Protección contra bucles infinitos
                        let safetyCounter = 0; 
                        
                        while (remainingToConsume > 0 && safetyCounter < 5) {
                            safetyCounter++;
                            
                            // A. Buscar ítem abierto en memoria temporal
                            let openItemIndex = tempOpenStock.findIndex((os: any) => os.productId === product.id);
                            let openItem = openItemIndex >= 0 ? tempOpenStock[openItemIndex] : null;
                            
                            if (openItem) {
                                // Caso 1: Consumir de abierto
                                const available = openItem.remaining;
                                const deduct = Math.min(available, remainingToConsume);
                                
                                const newRemaining = available - deduct;
                                remainingToConsume -= deduct;
                                
                                if (newRemaining <= 0.001) { // Epsilon para float
                                    // Agotado
                                    await openStockDB.delete(openItem.id);
                                    tempOpenStock.splice(openItemIndex, 1);
                                    system.addToast('warning', `${openItem.productName} se ha agotado.`);
                                } else {
                                    // Actualizar parcial
                                    const updatedItem = { ...openItem, remaining: newRemaining };
                                    await openStockDB.update(updatedItem);
                                    tempOpenStock[openItemIndex] = updatedItem;
                                }

                            } else {
                                // Caso 2: Abrir nuevo del inventario
                                if ((product.stock || 0) >= 1) {
                                    // Deduct from Main Inventory
                                    const newStock = (product.stock || 0) - 1;
                                    // Update Context Optimistically (visual only for now, DB handles reliable sync)
                                    // Note: We don't wait for this to avoid slowing down the loop
                                    catalogData.updateCatalogItem(product.id, { stock: newStock }); 
                                    await catalogDB.update({ ...product, stock: newStock });
                                    
                                    // Update local product reference for next iterations within this function scope
                                    product.stock = newStock;

                                    // Create Open Item
                                    const initialTotal = (pkgInfo.unitsPerPackage || 1) * (pkgInfo.contentPerUnit || 1);
                                    
                                    const deduct = Math.min(initialTotal, remainingToConsume);
                                    const newRemaining = initialTotal - deduct;
                                    remainingToConsume -= deduct;

                                    const newOpenItem: OpenStockItem = {
                                        id: generateId('OPEN'),
                                        productId: product.id,
                                        productName: product.title,
                                        total: initialTotal,
                                        remaining: newRemaining,
                                        unit: pkgInfo.consumptionUnit || 'unid',
                                        openedDate: new Date().toLocaleDateString('es-ES'),
                                        associatedRecipe: item.title
                                    };
                                    
                                    if (newRemaining > 0) {
                                        await openStockDB.add(newOpenItem);
                                        tempOpenStock.push(newOpenItem);
                                        system.addToast('info', `Abierto: ${product.title}.`);
                                    } else {
                                        // Opened and immediately fully consumed (rare but possible)
                                        system.addToast('warning', `${product.title} abierto y consumido totalmente.`);
                                    }

                                } else {
                                    // No stock available
                                    system.addToast('error', `Stock agotado para ${product.title}. Falta por consumir: ${remainingToConsume.toFixed(2)}`);
                                    remainingToConsume = 0; // Break loop
                                }
                            }
                        }
                    }
                }
            }
            
            // Sync UI State with final DB state
            catalogData.setOpenStock(tempOpenStock);
        }

        // --- LÓGICA DE CANCELACIÓN (Devolver stock, anular factura, log) ---
        if (status === 'Cancelled' && appt.status !== 'Cancelled') {
            catalogDB.releaseReservation(appt.items).then(() => {
                catalogDB.getAll().then(catalogData.setCatalog);
                
                // Anular factura vinculada si existe
                const linkedInv = finance.invoices.find((i: Invoice) => i.appointmentId === id);
                if (linkedInv) {
                    const updatedInv = { ...linkedInv, status: 'Anulada' as const };
                    invoicesDB.update(updatedInv);
                    finance.setInvoices((prev: Invoice[]) => prev.map(i => i.id === linkedInv.id ? updatedInv : i));
                    
                    if (linkedInv.clientId && linkedInv.clientId !== 'GUEST') {
                        crm.addClientLog({
                            clientId: linkedInv.clientId,
                            type: 'finance',
                            action: 'invoice_voided',
                            description: `${linkedInv.idDisplay}|${linkedInv.amount.toFixed(2)}|Cancelación Cita|${appt.id}`,
                            date: new Date().toLocaleDateString('es-ES')
                        });
                    }
                }
                
                // Log Histórico
                const snapshotData = {
                    snapshot: true,
                    id: appt.id,
                    title: `Cita #${appt.id.split('-')[1] || appt.id}`,
                    items: appt.items.map((i: any) => i.title).join(', '),
                    total: appt.total,
                    date: appt.date,
                    time: appt.time
                };

                crm.addClientLog({
                    clientId: appt.clientId,
                    type: 'system',
                    action: 'appointment_cancelled',
                    description: JSON.stringify(snapshotData),
                    date: new Date().toLocaleDateString('es-ES')
                });

                system.addToast('info', 'Cita anulada. Se ha generado un registro histórico.');
            });
        }

        // --- LÓGICA DE CONFIRMACIÓN (Reservar stock) ---
        if (status === 'Confirmed') {
            const existingInvoice = finance.invoices.find((i: Invoice) => i.appointmentId === id);
            if (existingInvoice) {
                if (existingInvoice.status === 'Anulada' || existingInvoice.status === 'Cotización') {
                    const revivedInvoice = { ...existingInvoice, status: 'Pendiente' as const };
                    invoicesDB.update(revivedInvoice);
                    finance.setInvoices((prev: Invoice[]) => prev.map(i => i.id === existingInvoice.id ? revivedInvoice : i));
                    
                    catalogDB.reserveStock(appt.items).then(() => {
                        catalogDB.getAll().then(catalogData.setCatalog);
                    });
                    system.addToast('info', 'Factura reactivada y stock reservado.');
                }
            } else {
                const sTotal = appt.items.filter((i: any) => i.type === 'service').reduce((acc: number, i: any) => acc + i.price * (i.quantity||1), 0);
                const pTotal = appt.items.filter((i: any) => i.type === 'product').reduce((acc: number, i: any) => acc + i.price * (i.quantity||1), 0);
                const newId = finance.generateInvoiceId();
                const newInvoice: Invoice = {
                    id: newId,
                    idDisplay: newId,
                    clientId: appt.clientId,
                    client: appt.clientName,
                    clientInitials: appt.clientName.substring(0,2).toUpperCase(),
                    service: 'Servicios de Estética',
                    items: appt.items,
                    amount: appt.total,
                    date: new Date().toLocaleDateString('en-CA'),
                    status: 'Pendiente',
                    appointmentId: appt.id,
                    paymentBreakdown: {
                        servicesTotal: sTotal,
                        productsTotal: pTotal,
                        servicesPaid: false,
                        productsPaid: false
                    }
                };
                catalogDB.reserveStock(appt.items).then(() => {
                    catalogDB.getAll().then(catalogData.setCatalog);
                    invoicesDB.add(newInvoice).then(() => {
                        finance.setInvoices((prev: Invoice[]) => [...prev, newInvoice]);
                        system.addToast('info', 'Factura generada y stock reservado');
                    });
                });
            }
        }

        // Actualizar estado en DB
        operations.updateAppointment(id, { status });
        
        // Log de cambio de estado
        if (status !== 'Cancelled') {
            crm.addClientLog({
                clientId: appt.clientId,
                type: 'system',
                action: `status_change_${status.toLowerCase().replace(' ', '_')}`,
                description: `Cita ${id}: Estado actualizado a ${status}`,
                date: new Date().toLocaleDateString('es-ES')
            });
        }
        
        if (status !== 'Confirmed' && status !== 'Cancelled') {
            system.addToast('info', `Estado de cita actualizado a ${status}`);
        }
    }, [operations.appointments, finance.invoices, catalogData.openStock, catalogData.setCatalog, finance.setInvoices, operations.updateAppointment, crm.addClientLog, system.addToast, finance.generateInvoiceId, catalogData.setOpenStock]);

    const reactivateArchivedAppointment = useCallback((id: string, reason: string, newDate?: string, newTime?: string) => {
        const appt = operations.appointments.find((a: Appointment) => a.id === id);
        if (!appt) return;

        const updatedAppt: Appointment = {
            ...appt,
            status: 'Pending',
            isArchived: false,
            date: newDate || appt.date,
            time: newTime || appt.time,
            wasReactivated: true,
            notes: (appt.notes ? appt.notes + ' | ' : '') + `[Reactivada]: ${reason}`
        };

        appointmentsDB.update(updatedAppt).then(() => {
            operations.setAppointments((prev: Appointment[]) => prev.map(a => a.id === id ? updatedAppt : a));
            crm.addClientLog({
                clientId: appt.clientId,
                type: 'system',
                action: 'appointment_reactivated',
                description: `Cita reactivada a estado 'Por Confirmar'. Motivo: ${reason}`,
                date: new Date().toLocaleDateString('es-ES')
            });
            system.addToast('success', 'Cita restaurada al tablero (Pendiente).');
        });
    }, [operations.appointments, operations.setAppointments, crm.addClientLog, system.addToast]);

    return {
        addAppointment,
        updateAppointmentStatus,
        reactivateArchivedAppointment
    };
};
