
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData, Invoice } from '../../context/DataContext';
import CreateInvoiceModal from '../../components/invoices/CreateInvoiceModal';
import { 
    PaymentModal, 
    InvoiceDetailModal, 
    ConfirmTransferModal, 
    QuoteConversionModal, 
    VoidModal 
} from '../../components/invoices/InvoiceModals';

const Invoices: React.FC = () => {
  const { invoices, payInvoice, confirmInTransitInvoice, rejectInTransitInvoice, unlinkAndVoidInvoice } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToConfirm, setInvoiceToConfirm] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Payment Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConversionOpen, setIsConversionOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Handle Navigation State (e.g. redirected from dashboard notification)
  useEffect(() => {
      const state = location.state as { openPaymentFor?: string } | null;
      if (state?.openPaymentFor) {
          const targetInvoice = invoices.find(inv => inv.id === state.openPaymentFor);
          if (targetInvoice) {
              setSelectedInvoice(targetInvoice);
              setIsModalOpen(true);
              navigate(location.pathname, { replace: true, state: {} });
          }
      }
  }, [location, invoices, navigate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  // --- Handlers ---
  const handlePayClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleViewClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleVerifyClick = (invoice: Invoice) => {
      setInvoiceToConfirm(invoice);
      setIsConfirmModalOpen(true);
  };

  // --- Helper: Check if quote is close to expiring (less than 5 days left) ---
  const isExpiringSoon = (invDate: string, status: string) => {
    if (status !== 'Cotización') return false;
    const [y, m, d] = invDate.split('-').map(Number);
    const creation = new Date(y, m - 1, d);
    const diff = Date.now() - creation.getTime();
    const daysPassed = diff / (1000 * 60 * 60 * 24);
    return daysPassed > 25; // 25 to 30 days
  };

  // --- Filter & Sort Logic ---
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = inv.client.toLowerCase().includes(term) || 
                              inv.idDisplay.toLowerCase().includes(term);
        const matchesStatus = statusFilter ? inv.status === statusFilter : true;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
          // Sort by date/time descending
          const dateA = new Date(`${a.date}T${a.time?.includes(' ') ? a.time.split(' ')[0] : a.time || '00:00'}`); 
          const dateB = new Date(`${b.date}T${b.time?.includes(' ') ? b.time.split(' ')[0] : b.time || '00:00'}`);
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
          return dateB.getTime() - dateA.getTime();
      });
  }, [invoices, searchTerm, statusFilter]);

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
          setCurrentPage(pageNumber);
      }
  };

  // Helper for numbered pagination
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 3) {
            pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
    }
    return pages;
  };

  // --- Stats Calculation ---
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalPaidThisMonth = invoices.reduce((acc, curr) => {
    const invoiceDate = new Date(curr.date + 'T12:00:00');
    if (curr.status === 'Pagada' && invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear) return acc + curr.amount;
    return acc;
  }, 0);

  const pendingAmount = invoices.filter(i => i.status === 'Pendiente' || i.status === 'Parcial').reduce((acc, curr) => acc + curr.amount, 0);
  const quoteAmount = invoices.filter(i => i.status === 'Cotización').reduce((acc, curr) => acc + curr.amount, 0);
  const inTransitAmount = invoices.filter(i => i.status === 'En Tránsito').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-background-dark p-6 overflow-hidden">
      {/* Modals */}
      <PaymentModal isOpen={isModalOpen} onClose={() => {setIsModalOpen(false); setSelectedInvoice(null);}} invoice={selectedInvoice} onConfirm={payInvoice} />
      <InvoiceDetailModal isOpen={isDetailModalOpen} onClose={() => {setIsDetailModalOpen(false); setSelectedInvoice(null);}} invoice={selectedInvoice} />
      <CreateInvoiceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <ConfirmTransferModal isOpen={isConfirmModalOpen} onClose={() => { setIsConfirmModalOpen(false); setInvoiceToConfirm(null); }} invoice={invoiceToConfirm} onConfirm={confirmInTransitInvoice} onReject={rejectInTransitInvoice} />
      <QuoteConversionModal isOpen={isConversionOpen} onClose={() => setIsConversionOpen(false)} invoice={selectedInvoice} />
      <VoidModal isOpen={isVoidModalOpen} onClose={() => setIsVoidModalOpen(false)} onConfirm={() => selectedInvoice && unlinkAndVoidInvoice(selectedInvoice.id)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 flex-shrink-0">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Facturación</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Control de ingresos y estados de cuenta.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-surface-dark px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total</span>
                <span className="text-sm font-display font-bold text-gray-900 dark:text-white">{invoices.length}</span>
            </div>
            <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-800 transition-all shadow-md shadow-primary/20 text-sm font-bold hover:-translate-y-0.5">
                <span className="material-icons text-sm">add</span> Nueva
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex-1 min-h-0 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border-l-4 border-green-500 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pagado Mes</p>
                    <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mt-1">${totalPaidThisMonth.toFixed(0)}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><span className="material-icons text-xl">bar_chart</span></div>
            </div>
            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border-l-4 border-yellow-500 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pendiente</p>
                    <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mt-1">${pendingAmount.toFixed(0)}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center"><span className="material-icons text-xl">pending_actions</span></div>
            </div>
            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border-l-4 border-indigo-500 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cotizaciones</p>
                    <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mt-1">${quoteAmount.toFixed(0)}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><span className="material-icons text-xl">description</span></div>
            </div>
            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border-l-4 border-orange-500 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">En Tránsito</p>
                    <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mt-1">${inTransitAmount.toFixed(0)}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><span className="material-icons text-xl">sync_alt</span></div>
            </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col flex-1 min-h-0">
            {/* Filter Bar */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/30 dark:bg-black/20 flex-shrink-0">
                <div className="relative w-full sm:w-64">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary text-gray-900 dark:text-white shadow-sm" placeholder="Buscar factura, cliente..."/>
                </div>
                <div className="flex items-center gap-3">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-3 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm text-gray-700 dark:text-gray-200 appearance-none shadow-sm cursor-pointer font-medium outline-none focus:border-primary">
                        <option value="">Todos los Estados</option>
                        <option value="Pagada">Pagadas</option>
                        <option value="Pendiente">Pendientes</option>
                        <option value="Cotización">Cotizaciones</option>
                        <option value="Parcial">Parciales</option>
                        <option value="En Tránsito">En Tránsito</option>
                        <option value="Anulada">Anuladas</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#1A1D21] shadow-sm">
                        <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold border-b border-gray-100 dark:border-gray-800">
                            <th className="py-3 px-4">ID</th>
                            <th className="py-3 px-4 cursor-help" title="Fecha de emisión del documento">Fecha</th>
                            <th className="py-3 px-4">Cliente</th>
                            <th className="py-3 px-4 text-center">Estado</th>
                            <th className="py-3 px-4 text-right">Monto</th>
                            <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {currentInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                                    No se encontraron facturas.
                                </td>
                            </tr>
                        ) : (
                            currentInvoices.map((inv) => (
                            <tr key={inv.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                {/* ID - Clickable */}
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <button 
                                        onClick={() => handleViewClick(inv)}
                                        className={`font-mono font-bold text-sm px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition-all ${
                                            inv.status === 'Anulada' ? 'bg-gray-100 text-gray-400 line-through dark:bg-white/5' : 
                                            'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                        }`}
                                    >
                                        {inv.idDisplay}
                                    </button>
                                </td>
                                {/* Date & Time */}
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                            {inv.date}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {inv.time || '--:--'}
                                        </span>
                                    </div>
                                </td>
                                {/* Client */}
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary">{inv.clientInitials || inv.client.charAt(0)}</div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{inv.client}</p>
                                        </div>
                                    </div>
                                </td>
                                {/* Status */}
                                <td className="py-3 px-4 whitespace-nowrap text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`inline-flex items-center justify-center min-w-[90px] px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                                            ${inv.status === 'Pagada' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400' : ''}
                                            ${inv.status === 'Pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400' : ''}
                                            ${inv.status === 'Cotización' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400' : ''}
                                            ${inv.status === 'Parcial' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400' : ''}
                                            ${inv.status === 'En Tránsito' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400' : ''}
                                            ${inv.status === 'Anulada' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400' : ''}
                                        `}>
                                            {inv.status}
                                        </span>
                                        {isExpiringSoon(inv.date, inv.status) && (
                                            <span className="text-[9px] text-orange-500 font-bold flex items-center gap-1 animate-pulse">
                                                <span className="material-icons text-[10px]">timer</span> PRÓX. A VENCER
                                            </span>
                                        )}
                                    </div>
                                </td>
                                {/* Amount */}
                                <td className="py-3 px-4 whitespace-nowrap text-right">
                                    <span className="font-display font-bold text-gray-900 dark:text-white text-base font-mono">${inv.amount.toFixed(2)}</span>
                                </td>
                                {/* Actions */}
                                <td className="py-3 px-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-24 flex justify-end">
                                            {(inv.status === 'Pendiente' || inv.status === 'Parcial') && (
                                                <button 
                                                    onClick={() => handlePayClick(inv)} 
                                                    className="w-full py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all text-xs font-bold shadow-sm flex justify-center" 
                                                >
                                                    Cobrar
                                                </button>
                                            )}

                                            {inv.status === 'En Tránsito' && (
                                                <button 
                                                    onClick={() => handleVerifyClick(inv)} 
                                                    className="w-full py-1.5 bg-orange-500 text-white hover:bg-orange-600 rounded-lg transition-all text-xs font-bold shadow-sm flex items-center justify-center gap-1" 
                                                >
                                                    Verificar
                                                </button>
                                            )}

                                            {inv.status === 'Cotización' && (
                                                <button
                                                    onClick={() => { setSelectedInvoice(inv); setIsConversionOpen(true); }}
                                                    className="w-full py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-all text-xs font-bold shadow-sm flex justify-center"
                                                >
                                                    Gestionar
                                                </button>
                                            )}
                                        </div>

                                        <button 
                                            onClick={() => handleViewClick(inv)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" 
                                            title="Ver Detalle"
                                        >
                                            <span className="material-icons text-lg">visibility</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
                {/* Counter & Rows Select */}
                <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-gray-500 dark:text-gray-400 w-full md:w-auto justify-between md:justify-start">
                    <span className="whitespace-nowrap bg-gray-50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
                        Viendo <span className="font-bold text-gray-900 dark:text-white">{filteredInvoices.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredInvoices.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredInvoices.length}</span> registros
                    </span>

                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline font-medium">Mostrar</span>
                        <div className="relative">
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="appearance-none bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded-lg focus:ring-primary focus:border-primary block pl-3 pr-8 py-1.5 font-bold cursor-pointer transition-colors hover:border-primary/50"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[14px] text-gray-400 pointer-events-none">expand_more</span>
                        </div>
                        <span className="hidden sm:inline font-medium">filas</span>
                    </div>
                </div>

                {/* Numbered Pagination */}
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-600 dark:text-gray-300 hover:text-primary hover:border-primary/30"
                    >
                        <span className="material-icons text-sm">chevron_left</span>
                    </button>
                    
                    <div className="hidden sm:flex gap-1.5">
                        {getPageNumbers().map((page, idx) => (
                            typeof page === 'number' ? (
                                <button
                                    key={idx}
                                    onClick={() => paginate(page)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all border
                                        ${currentPage === page 
                                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105' 
                                            : 'bg-white dark:bg-surface-dark text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-gray-700'
                                        }`}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span key={idx} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs tracking-widest">...</span>
                            )
                        ))}
                    </div>

                    <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-600 dark:text-gray-300 hover:text-primary hover:border-primary/30"
                    >
                        <span className="material-icons text-sm">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
