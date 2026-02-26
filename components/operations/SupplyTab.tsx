
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupply } from '../../hooks/operations/useSupply';
import { useData } from '../../context/DataContext';
import CreateOrderModal from './CreateOrderModal';
import SupplyFinanceTab from './SupplyFinanceTab';
import SupplyPredictive from './supply/SupplyPredictive';
import SupplyKanban from './supply/SupplyKanban';
import SupplyArchive from './supply/SupplyArchive';
import ReceptionModal from './supply/ReceptionModal';
import OrderDetailManager from './supply/OrderDetailManager';
import { Order, SupplierInvoice, OrderLine } from '../../types';
import PaymentModal, { PaymentData } from './PaymentModal';
import { generateId } from '../../utils/helpers';

const SupplyTab: React.FC = () => {
  const { risks, orders, forecastImpact, getSmartReorderSuggestion, suppliers, processReception, processReceptionBatch, kpis } = useSupply();
  const { addToast, updateOrder, archiveFinishedOrders, supplierInvoices, updateSupplierInvoice, addSupplierInvoice, addOrder } = useData(); 
  const navigate = useNavigate();
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'predictive' | 'orders' | 'finance' | 'archive'>('predictive');

  // Modal States
  const [activeModal, setActiveModal] = useState<'none' | 'reorder' | 'reception' | 'create_order' | 'order_detail'>('none');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [reorderItems, setReorderItems] = useState<{id: string|number; name: string; qty: number; price: number; current: number}[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<SupplierInvoice | null>(null);

  // Preview Mode State
  const [isPortalSelectOpen, setIsPortalSelectOpen] = useState(false);

  // State for Editing Drafts (Legacy support, though DraftModal now handles edits)
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined);

  // --- Actions ---
  const handleOpenReorder = (supplierId: string) => {
      const items = getSmartReorderSuggestion(supplierId);
      if (items.length === 0) {
          addToast('info', 'El stock parece suficiente. No hay sugerencias automáticas.');
          return;
      }
      setSelectedSupplierId(supplierId);
      setReorderItems(items);
      setActiveModal('reorder');
  };

  const handleOpenReception = (orderId: string) => {
      setSelectedOrderId(orderId);
      setActiveModal('reception');
  };

  // Handler for Kanban Card Click
  const handleOpenOrderDetail = (orderId: string) => {
      // Normal behavior: Open Manager
      setSelectedOrderId(orderId);
      setActiveModal('order_detail');
  };

  const handleOpenVendorDashboard = (supplierId: string) => {
      navigate(`/portal/dashboard/${supplierId}`);
  };

  const checkAndTriggerPayment = (orderId: string, status: string) => {
      if (status === 'Delivered' || status === 'Completed' || status === 'Partially Received') {
          const order = orders.find(o => o.id === orderId);
          if (!order) return;

          const supplier = suppliers.find(s => s.id === order.supplierId || s.companyName === order.clientName);
          if (!supplier) return;

          // Check for immediate payment terms
          const terms = (supplier.paymentTerms || '').toLowerCase();
          const isImmediate = terms.includes('contado') || terms.includes('cash') || terms.includes('inmediato') || terms.includes('immediate') || terms.includes('al recibir');

          if (isImmediate) {
              // Find or Create Invoice
              let invoice = supplierInvoices.find(inv => inv.linkedOrderId === orderId);
              
              if (!invoice) {
                  // Create a temporary invoice object if it doesn't exist yet (it will be saved when paid)
                  // Or better, create it now so we can pay it.
                  // Actually, let's just create a transient object for the modal, and save it on payment.
                  // But the modal expects an ID.
                  // Let's look for one by displayId match as fallback
                  invoice = supplierInvoices.find(inv => inv.displayId === order.idDisplay);
              }

              if (invoice) {
                  setPaymentInvoice(invoice);
                  setIsPaymentModalOpen(true);
              } else {
                  // Create new invoice on the fly?
                  // For now, let's just warn or skip.
                  // Ideally we should create it.
                  const newInvoice: SupplierInvoice = {
                      id: `SUP-INV-${Date.now()}`,
                      displayId: order.idDisplay, // Use Order ID as Invoice ID initially
                      supplierId: supplier.id,
                      supplierName: supplier.companyName,
                      date: new Date().toISOString().split('T')[0],
                      dueDate: new Date().toISOString().split('T')[0], // Immediate
                      amount: order.total,
                      status: 'Sent', // Ready for payment
                      itemsDescription: `Orden #${order.idDisplay}`,
                      linkedOrderId: order.id,
                      matchStatus: 'Matched'
                  };
                  addSupplierInvoice(newInvoice);
                  setPaymentInvoice(newInvoice);
                  setIsPaymentModalOpen(true);
              }
          }
      }
  };

  const handleReceiveLineAction = async (orderId: string, lineItemId: string | number, qty: number) => {
      const newStatus = await processReception(orderId, lineItemId, qty);
      addToast('success', `Recibidas ${qty} unidades. Inventario actualizado.`);
      
      // Check for payment trigger
      checkAndTriggerPayment(orderId, newStatus || 'Partially Received');

      return newStatus;
  };

  const handleReceiveBatchWrapper = async (orderId: string, items: { lineItemId: string | number, qty: number }[]) => {
      const newStatus = await processReceptionBatch(orderId, items);
      
      // Check for payment trigger
      checkAndTriggerPayment(orderId, newStatus || 'Partially Received');

      return newStatus;
  };

  const handleProcessPayment = (data: PaymentData) => {
      if (paymentInvoice) {
          updateSupplierInvoice(paymentInvoice.id, {
              status: 'Paid',
              paymentMethod: data.method,
              transactionReference: data.reference,
              paymentDate: new Date().toISOString(),
              notes: (paymentInvoice.notes || '') + ` [Pagado: ${data.method}]`
          });
          addToast('success', 'Pago registrado exitosamente');
          setIsPaymentModalOpen(false);
          setPaymentInvoice(null);
      }
  };

  const handleCreateSmartOrder = () => {
      if (!selectedSupplierId || reorderItems.length === 0) return;

      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      if (!supplier) return;

      const orderLines: OrderLine[] = reorderItems.map(item => ({
          itemId: item.id,
          title: item.name,
          qty: item.qty,
          price: item.price,
          stockAtOrder: item.current
      }));

      const total = orderLines.reduce((acc, line) => acc + (line.price * line.qty), 0);
      const orderId = generateId('ORD');

      const newOrder: Order = {
          id: orderId,
          idDisplay: orderId,
          clientName: supplier.companyName,
          supplierId: supplier.id,
          items: `${orderLines.length} Items`,
          total: total,
          status: 'Draft',
          date: new Date().toISOString().split('T')[0],
          type: 'physical',
          lines: orderLines,
          originalLines: orderLines,
          initialLines: orderLines
      };

      addOrder(newOrder);
      addToast('success', 'Orden generada y enviada a Borradores.');
      setActiveModal('none');
      setActiveTab('orders');
  };

  const handleUpdateStatus = (id: string, status: any) => {
      updateOrder(id, { status });
      checkAndTriggerPayment(id, status);
  };

  const handleCloseCreateModal = () => {
      setActiveModal('none');
      setEditingOrder(undefined);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Payment Modal */}
      {isPaymentModalOpen && paymentInvoice && (
          <PaymentModal
              isOpen={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
              invoice={paymentInvoice}
              onConfirm={handleProcessPayment}
          />
      )}

      {/* 1. Header & Navigation Area */}
      <div className="shrink-0 mb-4 pt-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                  <div>
                      <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">Cadena de Suministro</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Control inteligente de stock y compras.</p>
                  </div>
                  
                  <div className="hidden md:block h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

                  {/* SUB-NAVIGATION */}
                  <div className="bg-white dark:bg-surface-dark p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm inline-flex self-start md:self-auto relative">
                      <button 
                          onClick={() => setActiveTab('predictive')}
                          className={`relative px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 z-10 ${activeTab === 'predictive' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400'}`}
                      >
                          <span className="material-icons text-sm">insights</span> Predicción
                      </button>
                      <button 
                          onClick={() => setActiveTab('orders')}
                          className={`relative px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 z-10 ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400'}`}
                      >
                          <span className="material-icons text-sm">local_shipping</span> Gestión Órdenes
                      </button>
                      <button 
                          onClick={() => setActiveTab('finance')}
                          className={`relative px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 z-10 ${activeTab === 'finance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400'}`}
                      >
                          <span className="material-icons text-sm">receipt</span> Facturas
                      </button>
                      <button 
                          onClick={() => setActiveTab('archive')}
                          className={`relative px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 z-10 ${activeTab === 'archive' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400'}`}
                      >
                          <span className="material-icons text-sm">inventory_2</span> Archivo
                      </button>
                  </div>
              </div>

              <div className="flex items-center gap-3 self-end lg:self-auto">
                  <button 
                      onClick={() => setIsPortalSelectOpen(true)}
                      className="px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2 border bg-gray-900 dark:bg-white text-white dark:text-black border-transparent hover:opacity-90"
                  >
                      <span className="material-icons text-sm">login</span> 
                      Portal Proveedor
                  </button>

                  {activeTab === 'orders' && (
                      <>
                          <button 
                              onClick={archiveFinishedOrders} 
                              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                          >
                              <span className="material-icons text-gray-400 text-lg">inventory_2</span>
                              <span>Archivar</span>
                          </button>
                          <button 
                              onClick={() => { setEditingOrder(undefined); setActiveModal('create_order'); }}
                              className="bg-primary hover:bg-green-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2"
                          >
                              <span className="material-icons text-sm">add_shopping_cart</span> Nueva Orden
                          </button>
                      </>
                  )}
              </div>
          </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6 transition-all">
          
          {/* --- TAB 1: PREDICTIVE DASHBOARD --- */}
          {activeTab === 'predictive' && (
              <SupplyPredictive 
                  kpis={kpis} 
                  forecastImpact={forecastImpact} 
                  risks={risks} 
                  suppliers={suppliers} 
                  onReorder={handleOpenReorder}
              />
          )}

          {/* --- TAB 2: ORDERS MANAGEMENT (Kanban) --- */}
          {activeTab === 'orders' && (
              <>
                 <SupplyKanban 
                    orders={orders} 
                    onOpenReception={handleOpenReception} 
                    onOrderClick={handleOpenOrderDetail}
                 />
              </>
          )}

          {/* --- TAB 3: FINANCE (Supplier Invoices) --- */}
          {activeTab === 'finance' && <SupplyFinanceTab />}

          {/* --- TAB 4: ARCHIVE --- */}
          {activeTab === 'archive' && (
              <SupplyArchive 
                  orders={orders} 
                  onOrderClick={handleOpenOrderDetail} 
              />
          )}

      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Smart Reorder Modal */}
      {activeModal === 'reorder' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveModal('none')}>
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="material-icons text-blue-500">auto_awesome</span> Sugerencia Inteligente
                      </h3>
                      <button onClick={() => setActiveModal('none')}><span className="material-icons text-gray-400">close</span></button>
                  </div>
                  <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {reorderItems.map((item, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-700">
                              <div><p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.name}</p></div>
                              <div className="flex items-center gap-3"><span className="text-xs font-mono font-bold text-gray-900 dark:text-white">${(item.price * item.qty).toFixed(2)}</span></div>
                          </div>
                      ))}
                  </div>
                  <button onClick={handleCreateSmartOrder} className="w-full px-5 py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:text-black rounded-xl font-bold text-xs shadow-lg transition-transform hover:-translate-y-0.5">Crear Borrador</button>
              </div>
          </div>
      )}

      {/* 2. Reception Modal */}
      <ReceptionModal 
          isOpen={activeModal === 'reception'} 
          onClose={() => setActiveModal('none')} 
          orderId={selectedOrderId} 
          orders={orders}
          onReceiveLine={handleReceiveLineAction}
          onReceiveBatch={handleReceiveBatchWrapper}
      />

      {/* 3. Create Order Modal (Global) */}
      <CreateOrderModal 
          isOpen={activeModal === 'create_order'} 
          onClose={handleCloseCreateModal}
          orderToEdit={editingOrder} 
      />

      {/* 4. Order Detail Manager (Manages all state modals) */}
      <OrderDetailManager
          isOpen={activeModal === 'order_detail'}
          onClose={() => setActiveModal('none')}
          orderId={selectedOrderId}
          onOpenReception={handleOpenReception}
          onUpdateStatus={handleUpdateStatus}
      />

      {/* 5. Portal Selection Modal */}
      {isPortalSelectOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setIsPortalSelectOpen(false)}>
              <div className="bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                      <div>
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              <span className="material-icons text-primary">login</span> Acceder como Proveedor
                          </h3>
                          <p className="text-xs text-gray-400">Simulación de vista externa del portal.</p>
                      </div>
                      <button onClick={() => setIsPortalSelectOpen(false)} className="text-gray-400 hover:text-white"><span className="material-icons">close</span></button>
                  </div>
                  <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
                      {suppliers.map(s => (
                          <div 
                              key={s.id} 
                              onClick={() => handleOpenVendorDashboard(s.id)}
                              className="group p-4 rounded-xl bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 cursor-pointer transition-all flex items-center justify-between"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-400 group-hover:text-white group-hover:bg-primary border border-gray-600 group-hover:border-primary transition-all">
                                      {s.companyName.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-200 group-hover:text-white">{s.companyName}</p>
                                      <p className="text-xs text-gray-500 group-hover:text-gray-400">{s.contactPerson}</p>
                                  </div>
                              </div>
                              <span className="material-icons text-gray-500 group-hover:text-primary">arrow_forward</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default SupplyTab;
