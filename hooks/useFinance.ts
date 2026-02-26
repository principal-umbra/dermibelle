import { useState, useEffect } from 'react';
import { Invoice, Order, SupplierInvoice } from '../types';
import { invoicesDB } from '../services/database/invoices.db';
import { ordersDB } from '../services/database/orders.db';
import { supplierInvoicesDB } from '../services/database/supplier_invoices.db';

export const useFinance = (addToast: (type: 'success'|'error'|'info', msg: string) => void) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dbInvoices, dbOrders, dbSupplierInvoices] = await Promise.all([
          invoicesDB.getAll(),
          ordersDB.getAll(),
          supplierInvoicesDB.getAll()
        ]);
        setInvoices(dbInvoices.reverse());
        setOrders(dbOrders.reverse()); // Newest first
        setSupplierInvoices(dbSupplierInvoices.reverse());
      } catch (e) {
        console.error("Error loading finance data", e);
      }
    };
    load();
  }, []);

  // --- AUTOMATED SCHEDULER: CHECK FOR SCHEDULED ORDERS ---
  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        let hasUpdates = false;
        
        // Map over orders to find scheduled ones that are due
        const updatedOrders = orders.map(order => {
            if (order.status === 'Scheduled') {
                // Combine date and time. Fallback to 00:00 if time missing
                const scheduledDateTimeStr = `${order.date}T${order.scheduledTime || '09:00'}:00`;
                const scheduledDate = new Date(scheduledDateTimeStr);
                
                // If now is past the scheduled time
                if (now >= scheduledDate) {
                    hasUpdates = true;
                    // Auto-update to 'Placed'
                    const updatedOrder: Order = { ...order, status: 'Placed' };
                    // Persist to DB
                    ordersDB.update(updatedOrder);
                    
                    // Optional: You might want to trigger a notification here
                    // console.log(`Auto-sending order ${order.idDisplay}`);
                    
                    return updatedOrder;
                }
            }
            return order;
        });

        if (hasUpdates) {
            setOrders(updatedOrders);
            addToast('info', 'Se han enviado órdenes programadas automáticamente.');
        }

    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [orders, addToast]);


  const generateInvoiceId = () => {
      const existingIds = invoices.map(i => i.idDisplay).filter(id => id && id.startsWith('INV-'));
      if (existingIds.length === 0) return 'INV-1001';
      const maxId = existingIds.reduce((max, current) => {
          const num = parseInt(current.split('-')[1]);
          return !isNaN(num) && num > max ? num : max;
      }, 1000);
      return `INV-${maxId + 1}`;
  };

  const updateInvoice = (id: string, data: Partial<Invoice>) => {
      const invoice = invoices.find(i => i.id === id);
      if (invoice) {
          const updated = { ...invoice, ...data };
          invoicesDB.update(updated).then(() => {
              setInvoices(prev => prev.map(inv => inv.id === id ? updated : inv));
          });
      }
  };

  // --- ORDERS ---

  const addOrder = (order: Order) => {
      ordersDB.add(order).then(() => {
          setOrders(prev => [order, ...prev]);
          addToast('success', 'Orden de compra creada exitosamente');
      });
  };

  const updateOrder = (id: string, data: Partial<Order>) => {
      const order = orders.find(o => o.id === id);
      if (order) {
          const updated = { ...order, ...data };
          ordersDB.update(updated).then(() => {
              setOrders(prev => prev.map(o => o.id === id ? updated : o));
          });
      }
  };

  const archiveFinishedOrders = () => {
      const updatedList = orders.map(o => 
          (o.status === 'Completed' || o.status === 'Delivered' || o.status === 'Cancelled') ? { ...o, isArchived: true } : o
      );
      const toUpdate = updatedList.filter(o => o.isArchived && !orders.find(old => old.id === o.id && old.isArchived));
      
      Promise.all(toUpdate.map(o => ordersDB.update(o))).then(() => {
          setOrders(updatedList);
          addToast('success', 'Órdenes finalizadas archivadas');
      });
  };

  const reactivateArchivedOrder = (id: string, reason: string) => {
      const order = orders.find(o => o.id === id);
      if (order) {
          const updated = { 
              ...order, 
              isArchived: false,
              notes: (order.notes ? order.notes + ' | ' : '') + `[Reactivada]: ${reason}`
          };
          ordersDB.update(updated).then(() => {
              setOrders(prev => prev.map(o => o.id === id ? updated : o));
              addToast('success', 'Orden reactivada al tablero');
          });
      }
  };

  // --- SUPPLIER INVOICES ---

  const addSupplierInvoice = (invoice: SupplierInvoice) => {
      supplierInvoicesDB.add(invoice).then(() => {
          setSupplierInvoices(prev => [invoice, ...prev]);
          addToast('success', 'Factura de proveedor registrada');
      });
  };

  const updateSupplierInvoice = (id: string, data: Partial<SupplierInvoice>) => {
      const invoice = supplierInvoices.find(i => i.id === id);
      if (invoice) {
          const updated = { ...invoice, ...data };
          supplierInvoicesDB.update(updated).then(() => {
              setSupplierInvoices(prev => prev.map(inv => inv.id === id ? updated : inv));
              addToast('success', 'Factura actualizada');
          });
      }
  };

  return {
    invoices,
    setInvoices,
    supplierInvoices,
    setSupplierInvoices,
    addSupplierInvoice,
    updateSupplierInvoice,
    orders,
    setOrders,
    addOrder, // Exported
    updateOrder, // Exported
    archiveFinishedOrders, // Exported
    reactivateArchivedOrder, // Exported
    generateInvoiceId,
    updateInvoice
  };
};