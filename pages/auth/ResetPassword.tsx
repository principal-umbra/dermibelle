import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate password reset logic
    navigate('/login');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 hero-pattern opacity-50 dark:opacity-20 pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-2 group mb-8">
          <span className="material-icons text-primary text-5xl">spa</span>
          <div className="flex flex-col">
            <span className="font-display font-bold text-3xl tracking-tight text-primary">Dermibelle</span>
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Studio</span>
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-display font-bold text-gray-900 dark:text-white">
          Crea tu nueva contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
          Asegura tu cuenta creando una contraseña fuerte y única.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-surface-dark py-10 px-6 shadow-2xl shadow-primary/10 sm:rounded-2xl sm:px-12 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 rounded-full bg-secondary/5 blur-xl"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">
                Nueva Contraseña
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-400 text-lg">lock</span>
                </div>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  className="appearance-none block w-full pl-11 pr-3 py-3.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all duration-300"
                />
              </div>
              
              <div className="mt-3">
                <div className="flex gap-1.5 h-1.5 mb-1.5">
                  <div className="w-1/4 bg-primary/40 rounded-full"></div>
                  <div className="w-1/4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="w-1/4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="w-1/4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-500">Fuerza: <span className="text-primary/70 font-medium">Débil</span></span>
                  <span className="text-gray-400 text-[10px] uppercase tracking-wide">Mínimo 8 caracteres</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2" htmlFor="confirm-password">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-400 text-lg">verified_user</span>
                </div>
                <input 
                  id="confirm-password" 
                  name="confirm-password" 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  className="appearance-none block w-full pl-11 pr-3 py-3.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all duration-300"
                />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-lg shadow-primary/30 text-base font-bold text-white bg-primary hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-0.5">
                Restablecer Contraseña
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-gray-100 dark:border-gray-700/50 pt-6">
            <div className="flex items-center justify-center">
              <Link to="/login" className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors duration-200">
                <span className="material-icons text-base group-hover:-translate-x-1 transition-transform duration-200">arrow_back</span>
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;