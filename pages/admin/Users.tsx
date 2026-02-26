
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';

const Users: React.FC = () => {
  const { users, addUser, updateUser } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Asistente', password: '' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

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

  const handleAddUser = () => {
    const id = Math.random().toString(36).substr(2, 9);
    addUser({
      id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as any,
      status: 'Activo',
      lastAccess: 'Nunca',
      avatar: null,
      initials: newUser.name.substring(0, 2).toUpperCase(),
      password: newUser.password || 'password123'
    });
    setIsModalOpen(false);
    setNewUser({ name: '', email: '', role: 'Asistente', password: '' });
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark relative">
      {/* Custom Header */}
      <header className="h-20 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 flex items-center justify-end px-8 flex-shrink-0 z-10">
        <div className="flex items-center gap-6">
          <button className="relative p-2 text-gray-400 hover:text-primary transition-colors">
            <span className="material-icons">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark"></span>
          </button>
          <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
          <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
            <span className="material-icons">logout</span>
            <span className="text-sm font-medium">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* Page Title */}
        <div className="flex flex-col mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">Configuración del Sistema</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Administra los accesos y usuarios del estudio.</p>
        </div>

        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Gestión de Personal</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-green-800 text-white px-5 py-2.5 rounded-full shadow-lg shadow-primary/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 font-medium text-sm"
            >
              <span className="material-icons text-sm">add</span>
              Agregar Usuario
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <span className="material-icons">group</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-gray-900 dark:text-white">{users.length}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Usuarios Totales</span>
              </div>
            </div>
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 flex items-center justify-center">
                <span className="material-icons">verified_user</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-gray-900 dark:text-white">{users.filter(u => u.status === 'Activo').length}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Activos Ahora</span>
              </div>
            </div>
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-icons">admin_panel_settings</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-gray-900 dark:text-white">{users.filter(u => u.role === 'Admin').length}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Administradores</span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Filter Bar */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-black/20">
              <div className="relative w-full sm:w-72">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                <input className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-gray-900 dark:text-white" placeholder="Buscar por nombre o email..." type="text" />
              </div>
              <div className="flex items-center gap-3">
                <select className="px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer">
                  <option>Todos los Roles</option>
                  <option>Admin</option>
                  <option>Asistente</option>
                  <option>Recepcionista</option>
                </select>
                <button className="p-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary hover:border-primary transition-colors" title="Actualizar">
                  <span className="material-icons text-xl">refresh</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Último Acceso</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group ${user.status === 'Inactivo' ? 'opacity-60 hover:opacity-100' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-surface-dark" src={user.avatar} />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-green-400 font-bold text-sm">
                              {user.initials}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                            ${user.role === 'Admin' ? 'bg-secondary/10 text-yellow-800 dark:text-yellow-400 border-secondary/20' : ''}
                            ${user.role === 'Asistente' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800' : ''}
                            ${user.role === 'Recepcionista' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800' : ''}
                        `}>
                          {user.role === 'Admin' && <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5"></span>}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${user.status === 'Activo' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : ''}
                            ${user.status === 'Ausente' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : ''}
                            ${user.status === 'Inactivo' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : ''}
                        `}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.lastAccess}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                          {user.email === 'admin@dermibelle.com' && (
                            <div className="flex items-center mr-3 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-800" title="Inicio de sesión automático">
                              <input
                                type="checkbox"
                                checked={!!user.isAutoLoginEnabled}
                                onChange={(e) => updateUser(user.id, { isAutoLoginEnabled: e.target.checked })}
                                className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary cursor-pointer"
                              />
                              <span className="ml-2 text-xs font-bold text-blue-700 dark:text-blue-300">Auto-Login</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Editar">
                              <span className="material-icons text-lg">edit</span>
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Eliminar">
                              <span className="material-icons text-lg">delete</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-gray-500 dark:text-gray-400 w-full md:w-auto justify-between md:justify-start">
                <span className="whitespace-nowrap bg-gray-50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
                  Viendo <span className="font-bold text-gray-900 dark:text-white">{users.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, users.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{users.length}</span> usuarios
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

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-surface-dark text-left shadow-xl transition-all border-t-4 border-primary" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-green-400">
                  <span className="material-icons">person_add</span>
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold leading-6 text-gray-900 dark:text-white">Agregar Nuevo Usuario</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Registro de un nuevo miembro del equipo.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="name">Nombre Completo</label>
                  <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-white pl-3 focus:border-primary focus:ring-primary sm:text-sm py-2 border outline-none" id="name" type="text" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">Correo Electrónico</label>
                  <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-white pl-3 focus:border-primary focus:ring-primary sm:text-sm py-2 border outline-none" id="email" type="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="role">Rol Asignado</label>
                  <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-white py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm border" id="role">
                    <option>Asistente</option>
                    <option>Recepcionista</option>
                    <option>Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">Contraseña</label>
                  <input value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-white pl-3 focus:border-primary focus:ring-primary sm:text-sm py-2 border outline-none" id="password" type="password" placeholder="Establecer contraseña" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-black/20 px-6 py-4 flex flex-row-reverse gap-3">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-800 sm:w-auto transition-colors"
                onClick={handleAddUser}
              >
                Guardar Usuario
              </button>
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-full bg-white dark:bg-surface-dark px-5 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-white/5 sm:w-auto transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
