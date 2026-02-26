import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const Login: React.FC = () => {
  const { users } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check for auto-login user
    const autoLoginUser = users.find(u => u.isAutoLoginEnabled);
    if (autoLoginUser) {
        // Auto login success
        navigate('/admin');
        return;
    }
    
    // Simple hardcoded validation as requested
    if (email === 'admin@dermibelle.com' && password === '123456789') {
      navigate('/admin');
    } else {
      setError('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.');
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 login-hero-pattern transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-6">
          <span className="material-icons text-primary text-5xl group-hover:scale-110 transition-transform duration-300">spa</span>
          <div className="flex flex-col items-start">
            <span className="font-display font-bold text-3xl tracking-tight text-primary">Dermibelle</span>
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Studio</span>
          </div>
        </Link>
        <h2 className="font-display text-4xl font-bold text-gray-900 dark:text-white">
          Iniciar Sesión
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
          Bienvenido de nuevo a tu espacio de belleza y bienestar.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-surface-light dark:bg-surface-dark py-10 px-6 shadow-xl shadow-gray-200/50 dark:shadow-none sm:rounded-2xl sm:px-12 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="material-icons text-lg">error_outline</span>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-400 text-lg">mail_outline</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm bg-white dark:bg-background-dark/50 dark:text-white transition-all duration-200"
                  placeholder="admin@dermibelle.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-400 text-lg">lock_outline</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm bg-white dark:bg-background-dark/50 dark:text-white transition-all duration-200"
                  placeholder="••••••••"
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer group"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-icons text-gray-400 group-hover:text-primary transition-colors text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end mt-2">
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-primary hover:text-green-700 dark:hover:text-green-400 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-lg shadow-primary/30 text-base font-bold text-white bg-primary hover:bg-green-800 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300"
              >
                Ingresar
              </button>
            </div>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface-light dark:bg-surface-dark text-gray-500 font-medium">
                Nuevo en Dermibelle?
              </span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary transition-colors inline-flex items-center gap-1 group">
              ¿No tienes cuenta? <span className="text-primary group-hover:underline">Regístrate</span>
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          © 2024 Dermibelle Studio. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;