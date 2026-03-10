
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const Suppliers: React.FC = () => {
  const navigate = useNavigate();
  const { suppliers } = useData();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSuppliers = suppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(suppliers.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

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

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-background-dark">
      {/* Header - Responsive Height */}
      <header className="bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 h-16 md:h-20 flex items-center justify-end px-4 md:px-8 shrink-0 transition-all">
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-primary transition-colors relative">
            <span className="material-icons">notifications</span>
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark"></span>
          </button>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
          <button className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary">
            <span className="material-icons text-lg">help_outline</span>
            <span>Ayuda</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-3xl font-display font-bold text-gray-900 dark:text-white truncate">
              Proveedores
            </h2>
            <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">Gestiona relaciones comerciales y pedidos.</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg bg-white dark:bg-surface-dark px-3 py-2 text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" type="button">
              <span className="material-icons text-base md:text-lg mr-1.5 text-gray-400">download</span>
              Exportar
            </button>
            <button className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs md:text-sm font-bold text-white shadow-sm hover:bg-green-800 transition-all hover:-translate-y-0.5" type="button">
              <span className="material-icons text-base md:text-lg mr-1.5">add_business</span>
              Nuevo
            </button>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col min-h-0">

          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 sm:flex sm:items-center sm:justify-between bg-gray-50/50 dark:bg-black/20 gap-4">
            <div className="relative max-w-sm w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="material-icons text-gray-400 text-lg">search</span>
              </div>
              <input
                className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 dark:text-white dark:bg-surface-dark ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                id="search"
                name="search"
                placeholder="Buscar proveedor, contacto o ID..."
                type="text"
              />
            </div>
            <div className="mt-3 sm:mt-0 flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <div className="relative inline-block text-left min-w-[140px]">
                <select className="block w-full rounded-md border-0 py-2 pl-3 pr-8 text-gray-900 dark:text-white dark:bg-surface-dark ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6">
                  <option>Categoría</option>
                  <option>Skincare</option>
                  <option>Cabello</option>
                  <option>Equipamiento</option>
                </select>
              </div>
              <div className="relative inline-block text-left min-w-[140px]">
                <select className="block w-full rounded-md border-0 py-2 pl-3 pr-8 text-gray-900 dark:text-white dark:bg-surface-dark ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6">
                  <option>Estado</option>
                  <option>Activo</option>
                  <option>En Revisión</option>
                  <option>Inactivo</option>
                </select>
              </div>
              <button className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-white/5 bg-white dark:bg-surface-dark shadow-sm transition-colors">
                <span className="material-icons text-lg">filter_list</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-black/30">
                <tr>
                  <th className="relative px-7 sm:w-12 sm:px-6" scope="col">
                    <input className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary dark:bg-surface-dark" type="checkbox" />
                  </th>
                  <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer group hover:text-primary transition-colors" scope="col">
                    <div className="flex items-center">
                      Empresa
                      <span className="material-icons text-sm ml-1 text-gray-300 dark:text-gray-600 group-hover:text-primary">arrow_downward</span>
                    </div>
                  </th>
                  <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400" scope="col">
                    Categoría
                  </th>
                  <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400" scope="col">
                    Estado
                  </th>
                  <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400" scope="col">
                    Próxima Entrega
                  </th>
                  <th className="px-3 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400" scope="col">
                    Gasto Anual
                  </th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6" scope="col">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-surface-dark">
                {currentSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    onClick={() => navigate(`/admin/crm/suppliers/${supplier.id}`)}
                    className="hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-colors cursor-pointer group"
                  >
                    <td className="relative px-7 sm:w-12 sm:px-6" onClick={(e) => e.stopPropagation()}>
                      <div className="absolute inset-y-0 left-0 w-0.5 bg-primary group-hover:bg-primary transition-all opacity-0 group-hover:opacity-100"></div>
                      <input className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary dark:bg-surface-dark" type="checkbox" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {supplier.logo ? (
                            <img alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700" src={supplier.logo} />
                          ) : (
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                              <span className="text-sm font-bold leading-none text-gray-500 dark:text-gray-400">{supplier.initials}</span>
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors font-display text-lg">{supplier.companyName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className="material-icons text-[10px]">person</span> {supplier.contactPerson}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
                        {supplier.category}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border 
                        ${supplier.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : ''}
                        ${supplier.status === 'Review' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800' : ''}
                        ${supplier.status === 'Inactive' ? 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' : ''}
                      `}>
                        {supplier.status === 'Active' ? 'Activo' : supplier.status === 'Review' ? 'En Revisión' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="text-gray-900 dark:text-white">{supplier.nextDelivery}</div>
                      {supplier.nextDelivery !== '-' && <div className="text-xs text-green-600 dark:text-green-400 font-medium">Confirmada</div>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-right font-medium">
                      {supplier.totalSpendYTD}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button className="text-gray-400 hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <span className="material-icons">more_horiz</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark px-4 py-3 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-gray-500 dark:text-gray-400 w-full md:w-auto justify-between md:justify-start">
              <span className="whitespace-nowrap bg-gray-50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
                Viendo <span className="font-bold text-gray-900 dark:text-white">{suppliers.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, suppliers.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{suppliers.length}</span> proveedores
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
                  </select>
                  <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[14px] text-gray-400 pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <span className="material-icons text-sm">chevron_left</span>
              </button>
              <div className="hidden sm:flex gap-1.5">
                {getPageNumbers().map((page, idx) => (
                  typeof page === 'number' ? (
                    <button key={idx} onClick={() => paginate(page)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all border ${currentPage === page ? 'bg-primary border-primary text-white shadow-md' : 'bg-white dark:bg-surface-dark text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                      {page}
                    </button>
                  ) : (
                    <span key={idx} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">...</span>
                  )
                ))}
              </div>
              <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <span className="material-icons text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
