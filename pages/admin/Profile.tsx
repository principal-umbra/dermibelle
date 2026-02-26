import React from 'react';

const Profile: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark relative">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-surface-dark/50 backdrop-blur-sm z-10 flex-shrink-0">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-primary transition-colors relative">
            <span className="material-icons">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            Ultimo acceso: Hoy, 09:41 AM
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50 dark:bg-background-dark/50">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Header Card */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <img 
                alt="Profile Picture" 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-50 dark:border-gray-800 shadow-md" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxK_wSkgs4ZVZXxbeSOLbsReX7pjZtF98-IWvUv79pMKq8j4Wf2PnOru8JnVoJElYMspGhM_7QHnqU2SAJorQLDXSczzu1kIz07yZWiJPL_ccpaY7_rlAjYWsEGdGM46DeVWWN905kgpwtmF3XP9u6t_inQgoB_DUXsego3SqfVbX2SfcTezq1MOStp3pCHtd769aLLrdsRr5eRZCwNJg01q5bQJ38iPcD2d9cxxtEXZLtYZrFJMjJwHLg10lqECCRs8kdC2E8hEdt" 
              />
              <button className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-green-700 transition-colors" title="Cambiar foto">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
            <div className="text-center sm:text-left pt-2">
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Ray Q.</h2>
              <p className="text-primary font-medium mb-2">Admin Principal</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">Gestiona los permisos de usuario, configuración global y reportes financieros del estudio.</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Información Personal</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Actualiza tu información básica y de contacto.</p>
            </div>
            <form className="p-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="firstName">Nombre</label>
                  <input className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 px-3" id="firstName" name="firstName" type="text" defaultValue="Ray" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="lastName">Apellidos</label>
                  <input className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 px-3" id="lastName" name="lastName" type="text" defaultValue="Q." />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">Correo Electrónico</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400 text-sm">mail</span>
                    </div>
                    <input className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 pr-3" id="email" name="email" type="email" defaultValue="admin@dermibelle.com" />
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="phone">Teléfono</label>
                  <input className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 px-3" id="phone" name="phone" type="tel" defaultValue="+1 (941) 555-0199" />
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Seguridad</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">Nueva Contraseña</label>
                    <input className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 px-3" id="password" name="password" placeholder="••••••••" type="password" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="confirmPassword">Confirmar Contraseña</label>
                    <input className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 px-3" id="confirmPassword" name="confirmPassword" placeholder="••••••••" type="password" />
                  </div>
                </div>
              </div>
            </form>
            <div className="bg-gray-50 dark:bg-black/20 px-8 py-4 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl flex justify-end gap-3">
              <button className="px-4 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" type="button">
                Cancelar
              </button>
              <button className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-lg shadow-primary/30 hover:bg-green-700 transition-all hover:-translate-y-0.5" type="submit">
                Guardar Cambios
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border border-red-200 dark:border-red-900/30 rounded-2xl p-6 bg-red-50 dark:bg-red-900/10">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-800 dark:text-red-200">Zona de Peligro</h3>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1 mb-3">Estas acciones no se pueden deshacer. Ten cuidado.</p>
                <button className="text-xs font-medium text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 underline">
                  Desactivar mi cuenta temporalmente
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;