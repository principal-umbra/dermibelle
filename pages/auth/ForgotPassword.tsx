import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would trigger the email sending process.
    // For this demonstration, we navigate directly to the Reset Password page.
    navigate('/reset-password');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body min-h-screen flex flex-col justify-center items-center relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background-light via-transparent to-primary/5 dark:from-background-dark dark:via-transparent dark:to-black"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] opacity-70"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[80px] opacity-60"></div>
      </div>
      
      <main className="w-full max-w-md px-6 relative z-10">
        <div className="flex justify-center mb-10">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <span className="material-icons text-primary text-5xl drop-shadow-sm">spa</span>
            <div className="flex flex-col">
              <span className="font-display font-bold text-3xl tracking-tight text-primary">Dermibelle</span>
              <span className="text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400 font-semibold ml-0.5">Studio</span>
            </div>
          </Link>
        </div>
        
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-10 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Recuperar tu contraseña
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Ingresa tu correo electrónico asociado y te enviaremos un enlace seguro para restablecer tu acceso.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">
                Tu correo electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-400 group-focus-within:text-primary transition-colors text-xl">email</span>
                </div>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  placeholder="nombre@dermibelle.com" 
                  className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-surface-dark sm:text-sm transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="pt-2">
              <button type="submit" className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-lg shadow-primary/30 text-base font-semibold text-white bg-primary hover:bg-[#0c4027] hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform">
                Enviar enlace de recuperación
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-green-300 transition-colors group">
              <span className="material-icons text-base mr-1 group-hover:-translate-x-1 transition-transform duration-300">arrow_back</span>
              Volver a Iniciar Sesión
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center space-x-6 text-xs text-gray-400 dark:text-gray-500">
          <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacidad</Link>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <Link to="/terms-of-service" className="hover:text-primary transition-colors">Términos</Link>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <Link to="/contact" className="hover:text-primary transition-colors">Ayuda</Link>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;