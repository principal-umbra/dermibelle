
import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useData, Appointment, AppointmentItem } from '../../context/DataContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import AppointmentFinance from '../../components/appointments/AppointmentFinance';
import AppointmentClientProfile from '../../components/appointments/AppointmentClientProfile';
import AppointmentDetails from '../../components/appointments/AppointmentDetails';
import CreateAppointmentModal from '../../components/appointments/CreateAppointmentModal';

const Appointments: React.FC = () => {
  const { appointments, updateAppointmentStatus, archiveFinishedAppointments, addToast, getInvoiceByAppointmentId, payInvoice, invoices, catalog } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false); // New Appointment Modal
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null); // Changed to store ID only for better reactivity
  
  // Reactive Appointment Object
  // This ensures that when context updates (status change, reschedule), the modal updates immediately
  const selectedAppointment = useMemo(() => 
      appointments.find(a => a.id === selectedAppointmentId) || null, 
  [appointments, selectedAppointmentId]);
  
  // Modal Tabs
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'client' | 'finance'>('details');
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean; title: string; message: string; action: () => void} | null>(null);

  // --- POS / FINANCE STATE ---
  const [paymentSelection, setPaymentSelection] = useState<Record<string, { services: boolean; products: boolean }>>({});
  const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'efectivo' | 'transferencia'>('tarjeta');
  const [cashTendered, setCashTendered] = useState('');
  const [reference, setReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Derived Financial Data
  const linkedInvoices = useMemo(() => {
      if (!selectedAppointment) return [];
      return invoices.filter(inv => inv.appointmentId === selectedAppointment.id);
  }, [invoices, selectedAppointment]);

  const financeSummary = useMemo(() => {
      const total = linkedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const paid = linkedInvoices.reduce((sum, inv) => {
          if (inv.status === 'Pagada') return sum + inv.amount;
          if (inv.status === 'Parcial' && inv.paymentBreakdown) {
              let p = 0;
              if (inv.paymentBreakdown.servicesPaid) p += inv.paymentBreakdown.servicesTotal;
              if (inv.paymentBreakdown.productsPaid) p += inv.paymentBreakdown.productsTotal;
              return sum + p;
          }
          return sum;
      }, 0);
      const pending = total - paid;
      return { total, paid, pending };
  }, [linkedInvoices]);

  const totalSelectedToPay = useMemo(() => {
      let total = 0;
      linkedInvoices.forEach(inv => {
          if (inv.status === 'En Tránsito') return;
          const selection = paymentSelection[inv.id];
          if (!selection) return;
          const breakdown = inv.paymentBreakdown;
          if (!breakdown) {
              if (selection.services && inv.status !== 'Pagada') total += inv.amount;
          } else {
              if (selection.services && !breakdown.servicesPaid) total += breakdown.servicesTotal;
              if (selection.products && !breakdown.productsPaid) total += breakdown.productsTotal;
          }
      });
      return total;
  }, [linkedInvoices, paymentSelection]);

  // Effects
  useEffect(() => {
      if (activeModalTab === 'finance') {
          const initialSelection: Record<string, { services: boolean; products: boolean }> = {};
          const activeInvoices = linkedInvoices.filter(i => i.status !== 'Anulada');
          const shouldAutoSelect = activeInvoices.length <= 1;

          linkedInvoices.forEach(inv => {
              if (inv.status === 'En Tránsito' || !shouldAutoSelect) {
                  initialSelection[inv.id] = { services: false, products: false };
                  return;
              }
              const breakdown = inv.paymentBreakdown;
              if (!breakdown) {
                  initialSelection[inv.id] = { services: inv.status !== 'Pagada', products: false };
              } else {
                  initialSelection[inv.id] = { 
                      services: !breakdown.servicesPaid && breakdown.servicesTotal > 0,
                      products: !breakdown.productsPaid && breakdown.productsTotal > 0
                  };
              }
          });
          setPaymentSelection(initialSelection);
          setPaymentMethod('tarjeta');
          setCashTendered('');
          setReference('');
      }
  }, [activeModalTab, linkedInvoices]);

  useEffect(() => {
      const state = location.state as { openAppointmentId?: string } | null;
      if (state?.openAppointmentId) {
          // Just set the ID, the useMemo above will find the object
          setSelectedAppointmentId(state.openAppointmentId);
          setActiveModalTab('details');
          navigate(location.pathname, { replace: true, state: {} });
      }
  }, [location, navigate]);

  // Handlers
  const handleQuickPay = (apt: Appointment) => {
      setSelectedAppointmentId(apt.id);
      setActiveModalTab('finance');
  };

  const handleGenerateInvoice = () => {
      if (selectedAppointment) {
          updateAppointmentStatus(selectedAppointment.id, 'Confirmed'); 
      }
  };

  const toggleSelection = (invoiceId: string, part: 'services' | 'products') => {
      const inv = linkedInvoices.find(i => i.id === invoiceId);
      if (inv?.status === 'En Tránsito') return;
      setPaymentSelection(prev => ({
          ...prev,
          [invoiceId]: { ...prev[invoiceId], [part]: !prev[invoiceId]?.[part] }
      }));
  };

  const toggleFullInvoiceSelection = (invoiceId: string, select: boolean) => {
      const inv = linkedInvoices.find(i => i.id === invoiceId);
      if (inv?.status === 'En Tránsito') return;
      setPaymentSelection(prev => ({
          ...prev,
          [invoiceId]: { services: select, products: select }
      }));
  };

  const executePaymentProcessing = () => {
      setIsProcessing(true);
      setTimeout(() => {
          linkedInvoices.forEach(inv => {
              const selection = paymentSelection[inv.id];
              if (!selection) return;
              const breakdown = inv.paymentBreakdown;
              let scope: 'services' | 'products' | 'total' | null = null;

              if (!breakdown) {
                  if (selection.services && inv.status !== 'Pagada') scope = 'total';
              } else {
                  const payServices = selection.services && !breakdown.servicesPaid && breakdown.servicesTotal > 0;
                  const payProducts = selection.products && !breakdown.productsPaid && breakdown.productsTotal > 0;
                  if (payServices && payProducts) scope = 'total';
                  else if (payServices) scope = 'services';
                  else if (payProducts) scope = 'products';
              }
              if (scope) {
                  const ref = paymentMethod === 'efectivo' ? 'CASH' : reference;
                  payInvoice(inv.id, scope, paymentMethod, ref, { silent: true });
              }
          });
          addToast('success', 'Pago procesado correctamente');
          setIsProcessing(false);
      }, 800);
  };

  const handleProcessPayment = () => {
      if (totalSelectedToPay <= 0) return;
      if (paymentMethod === 'transferencia') {
          setConfirmModal({
              isOpen: true,
              title: 'Verificar Transferencia',
              message: '¿Confirmas que has verificado la recepción de los fondos? La factura quedará como "En Tránsito".',
              action: () => { executePaymentProcessing(); setConfirmModal(null); }
          });
          return;
      }
      executePaymentProcessing();
  };

  const columns = [
    { id: 'Pending', title: 'Por Confirmar', icon: 'hourglass_empty', color: 'text-yellow-600', countBg: 'bg-yellow-100 text-yellow-800' },
    { id: 'Confirmed', title: 'Confirmadas', icon: 'check_circle', color: 'text-green-600', countBg: 'bg-green-100 text-green-800' },
    { id: 'In Progress', title: 'En Proceso', icon: 'timelapse', color: 'text-blue-600', countBg: 'bg-blue-100 text-blue-800' },
    { id: 'Finalized', title: 'Finalizadas', icon: 'task_alt', color: 'text-purple-600', countBg: 'bg-purple-100 text-purple-800' },
    { id: 'Cancelled', title: 'Canceladas', icon: 'cancel', color: 'text-red-600', countBg: 'bg-red-100 text-red-800' }
  ];

  const getColumnAppointments = (status: string) => {
    return appointments.filter(a => a.status === status && !a.isArchived);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    const newStatus = destination.droppableId as Appointment['status'];
    const appt = appointments.find(a => a.id === draggableId);

    if (appt) {
        // Validation: Stock Issues Check
        // If an appointment has stock issues, it can ONLY be moved to Cancelled
        const hasStockIssues = appt.items.some(apptItem => {
             const catalogItem = catalog.find(i => i.id === apptItem.id);
             if (!catalogItem) return false;
             if (catalogItem.type === 'product') {
                 return (catalogItem.stock || 0) <= 0;
             }
             if (catalogItem.type === 'service' && catalogItem.recipe) {
                 return catalogItem.recipe.some(ing => {
                     const product = catalog.find(p => p.id === ing.id);
                     return product ? (product.stock || 0) <= 0 : false;
                 });
             }
             return false;
        });

        if (hasStockIssues && newStatus !== 'Cancelled' && newStatus !== appt.status) {
            addToast('error', 'Cita con insumos insuficientes. Solo puede moverse a Canceladas o reponga el stock.');
            return;
        }
    }

    if (newStatus === 'Finalized') {
        const invoice = getInvoiceByAppointmentId(draggableId);
        if (!invoice || (invoice.status !== 'Pagada' && invoice.status !== 'En Tránsito')) {
            addToast('error', 'No se puede finalizar: La factura debe estar pagada o en tránsito.');
            return;
        }
    }
    
    updateAppointmentStatus(draggableId, newStatus);
  };

  const handleOpenEdit = (apt: Appointment) => {
      setSelectedAppointmentId(apt.id);
      setActiveModalTab('details');
  };

  // Helper to handle updates from AppointmentDetails (modal closing or status change)
  const handleAppointmentUpdate = (updatedAppt: Appointment | null) => {
      if (!updatedAppt) {
          // Closed or null
          setSelectedAppointmentId(null);
      } else {
          // Just ensure status matches context?
          // Since we use ID based selection, Context update handles it automatically.
          // This is mostly kept if we needed local state override, but now we don't.
      }
  };

  const getStatusBorderColor = (status: string) => {
      switch (status) { case 'Pending': return 'bg-yellow-400'; case 'Confirmed': return 'bg-green-500'; case 'In Progress': return 'bg-blue-500'; case 'Finalized': return 'bg-purple-500'; case 'Cancelled': return 'bg-red-500'; default: return 'bg-gray-300'; }
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-background-dark p-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Tablero de Citas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestión visual del flujo de trabajo.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={archiveFinishedAppointments} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm"><span className="material-icons text-gray-400 text-lg">inventory_2</span><span>Archivar</span></button>
            <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-green-800 flex items-center gap-2"><span className="material-icons text-lg">add</span><span>Nueva Cita</span></button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-gray-100 mb-6 gap-4 flex-shrink-0">
          <div className="flex items-center gap-4 pl-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ORDEN:</span>
              <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100 cursor-pointer">Fecha Asc</span>
                  <span className="px-3 py-1 rounded-full text-gray-500 text-xs font-bold hover:bg-gray-50 cursor-pointer">Nuevas</span>
              </div>
          </div>
          <div className="flex items-center gap-2 pr-2">
              <button className="flex items-center gap-1 text-xs font-bold text-gray-500 px-3 py-1 rounded-lg hover:bg-gray-50">Todos <span className="material-icons text-sm">expand_more</span></button>
          </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 min-h-0 overflow-x-auto flex gap-6 pb-4">
          {columns.map(col => (
            <div key={col.id} className="w-80 flex-shrink-0 flex flex-col rounded-2xl h-full">
              <div className="flex items-center justify-between mb-4 px-1 flex-shrink-0">
                  <div className="flex items-center gap-2">
                      <span className={`material-icons text-lg ${col.color}`}>{col.icon}</span>
                      <span className={`font-bold text-sm uppercase tracking-wide ${col.color}`}>{col.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${col.countBg}`}>{getColumnAppointments(col.id).length}</span>
              </div>
              <Droppable droppableId={col.id}>
                {(provided: any) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar min-h-0">
                    {getColumnAppointments(col.id).map((apt, index) => {
                        const inv = getInvoiceByAppointmentId(apt.id); 
                        const hasPending = !!inv && inv.status !== 'Pagada' && inv.status !== 'Anulada';
                        return (<AppointmentCard key={apt.id} apt={apt} index={index} onClick={handleOpenEdit} onPay={handleQuickPay} hasPendingBalance={hasPending}/>);
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {confirmModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-yellow-50 text-yellow-600"><span className="material-icons text-2xl">warning_amber</span></div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
                  <p className="text-sm text-gray-500 mb-6">{confirmModal.message}</p>
                  <div className="flex gap-3 justify-end">
                      <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                      <button onClick={confirmModal.action} className="px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm bg-primary hover:bg-green-800">Confirmar</button>
                  </div>
              </div>
          </div>
      )}

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedAppointmentId(null)}>
            <div className="bg-[#F3F4F6] rounded-3xl shadow-2xl w-full max-w-5xl border border-gray-200 overflow-hidden flex flex-col relative max-h-[85vh]" onClick={e => e.stopPropagation()}>
                {/* Reactive Top Border based on active appointment status */}
                <div className={`h-2 w-full absolute top-0 left-0 z-20 ${getStatusBorderColor(selectedAppointment.status)}`}></div>
                <div className="bg-white px-8 py-4 border-b border-gray-100 flex justify-between items-center relative pt-6 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"><span className="material-icons text-xl">calendar_today</span></div>
                        <div>
                            <h2 className="text-xl font-body font-bold text-gray-900 flex items-center gap-2">{selectedAppointment.id}<span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">Ver. 1.0</span></h2>
                            <p className="text-[10px] text-gray-400 font-medium">Creada el: {new Date(selectedAppointment.createdAt || 0).toLocaleDateString('en-US', {month: 'numeric', day: 'numeric', year: 'numeric'})}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedAppointmentId(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><span className="material-icons text-2xl">close</span></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
                    {activeModalTab === 'details' && (
                        <AppointmentDetails 
                            appointment={selectedAppointment}
                            onTabChange={setActiveModalTab}
                            onUpdate={handleAppointmentUpdate}
                        />
                    )}
                    {activeModalTab === 'client' && (
                        <AppointmentClientProfile 
                            appointment={selectedAppointment}
                            onNavigateToProfile={(id) => {
                                setSelectedAppointmentId(null);
                                navigate(`/admin/crm/clients/${id}`);
                            }}
                        />
                    )}
                    {activeModalTab === 'finance' && (
                        <AppointmentFinance 
                            linkedInvoices={linkedInvoices} 
                            financeSummary={financeSummary} 
                            totalSelectedToPay={totalSelectedToPay} 
                            showHistory={showHistory} 
                            setShowHistory={setShowHistory} 
                            onGenerateInvoice={handleGenerateInvoice} 
                            paymentSelection={paymentSelection} 
                            onToggleFullSelection={toggleFullInvoiceSelection} 
                            onToggleSelection={toggleSelection} 
                            paymentMethod={paymentMethod} 
                            setPaymentMethod={setPaymentMethod} 
                            cashTendered={cashTendered} 
                            setCashTendered={setCashTendered} 
                            reference={reference} 
                            setReference={setReference} 
                            onProcessPayment={handleProcessPayment} 
                            isProcessing={isProcessing}
                            appointmentId={selectedAppointment.id}
                            clientId={selectedAppointment.clientId}
                        />
                    )}
                </div>
            </div>
            <div className="mt-4 px-8 py-3 bg-white rounded-full shadow-2xl flex justify-center gap-1.5 flex-shrink-0 animate-in slide-in-from-bottom-4 fade-in z-50" onClick={e => e.stopPropagation()}>
                <button onClick={() => setActiveModalTab('details')} className={`px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${activeModalTab === 'details' ? 'bg-primary text-white shadow-lg scale-105' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><span className="material-icons text-sm">dashboard</span> DETALLES</button>
                <button onClick={() => setActiveModalTab('client')} className={`px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${activeModalTab === 'client' ? 'bg-primary text-white shadow-lg scale-105' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><span className="material-icons text-sm">person</span> CLIENTE</button>
                <button onClick={() => setActiveModalTab('finance')} className={`px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${activeModalTab === 'finance' ? 'bg-primary text-white shadow-lg scale-105' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><span className="material-icons text-sm">account_balance_wallet</span> FINANZAS</button>
            </div>
        </div>
      )}

      {/* New Appointment Modal (Unified Component) */}
      <CreateAppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Appointments;
