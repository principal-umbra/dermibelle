import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const Register: React.FC = () => {
  const { addUser } = useData();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    invite_code: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const id = Math.random().toString(36).substr(2, 9);
      addUser({
        id,
        name: formData.fullname,
        email: formData.email,
        role: 'Asistente',
        status: 'Activo',
        lastAccess: 'Nunca',
        avatar: null,
        initials: formData.fullname.substring(0, 2).toUpperCase(),
        password: formData.password
      });
      navigate('/login');
    } catch (err) {
      setError('Error al crear la cuenta. Inténtalo de nuevo.');
      console.error(err);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body transition-colors duration-300 min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 hero-pattern opacity-50 dark:opacity-20 pointer-events-none bg-fixed bg-cover bg-center"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background-light/90 to-background-light dark:from-primary/10 dark:via-background-dark/95 dark:to-background-dark z-0 pointer-events-none"></div>

      <div className="w-full max-w-md p-4 relative z-10">
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 transition-colors duration-300">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-primary"></div>
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center mb-8">
              <Link className="flex items-center gap-2 group mb-2 hover:opacity-80 transition-opacity" to="/">
                <span className="material-icons text-primary text-4xl">spa</span>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-2xl tracking-tight text-primary">Dermibelle</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Studio</span>
                </div>
              </Link>
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-2"></div>
            </div>

            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">Crear Cuenta</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Acceso exclusivo para personal interno</p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-xs">
                {error}
              </div>
            )}

            <form action="#" className="space-y-5" method="POST" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="fullname">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <span className="material-icons text-lg">person</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                    id="fullname"
                    name="fullname"
                    placeholder="Ana García"
                    required
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="email">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <span className="material-icons text-lg">mail_outline</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                    id="email"
                    name="email"
                    placeholder="nombre@dermibelle.com"
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex justify-between items-end" htmlFor="invite_code">
                  Código de Invitación
                  <span className="text-xs font-normal text-gray-500 italic lowercase tracking-wide">opcional</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <span className="material-icons text-lg">vpn_key</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm font-mono tracking-wider uppercase"
                    id="invite_code"
                    name="invite_code"
                    placeholder="DERMI-CODE"
                    type="text"
                    value={formData.invite_code}
                    onChange={(e) => setFormData({ ...formData, invite_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="password">Contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <span className="material-icons text-lg">lock</span>
                    </div>
                    <input
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      required
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="confirm_password">Confirmar</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <span className="material-icons text-lg">lock_reset</span>
                    </div>
                    <input
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                      id="confirm_password"
                      name="confirm_password"
                      placeholder="••••••••"
                      required
                      type="password"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-lg text-sm font-bold text-white bg-primary hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-0.5 group" type="submit">
                  Crear Cuenta
                  <span className="material-icons ml-2 text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Ya tienes cuenta?
                <Link className="font-bold text-primary hover:text-secondary transition-colors inline-flex items-center ml-1" to="/login">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center animate-fade-in-up">
          <p className="text-xs text-gray-500 dark:text-gray-400 opacity-80">
            © 2024 Dermibelle Studio. Todos los derechos reservados.<br />
            Plataforma de gestión segura para empleados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;