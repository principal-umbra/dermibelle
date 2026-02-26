
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const PublicNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-primary font-bold' : 'text-gray-600 dark:text-gray-300 hover:text-primary';

  return (
    <nav className="fixed w-full z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 flex items-center">
            <Link className="flex items-center gap-2 group" to="/">
              <span className="material-icons text-primary text-4xl group-hover:scale-110 transition-transform">spa</span>
              <div className="flex flex-col">
                <span className="font-display font-bold text-2xl tracking-tight text-primary">Dermibelle</span>
                <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Studio</span>
              </div>
            </Link>
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            <Link className={`text-sm font-medium transition-colors ${isActive('/')}`} to="/">Inicio</Link>
            <Link className={`text-sm font-medium transition-colors ${isActive('/services')}`} to="/services">Servicios</Link>
            <Link className={`text-sm font-medium transition-colors ${isActive('/shop')}`} to="/shop">Tienda</Link>
            <Link className={`text-sm font-medium transition-colors ${isActive('/about')}`} to="/about">Nosotros</Link>
            <Link className={`text-sm font-medium transition-colors ${isActive('/contact')}`} to="/contact">Contacto</Link>
            
            {/* Login and Book Online Group */}
            <div className="flex items-center space-x-4 border-l pl-6 border-gray-200 dark:border-gray-700">
              <Link className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors" to="/login">
                Entrar
              </Link>
              <Link className="bg-primary text-white px-6 py-2.5 rounded-full font-medium shadow-lg shadow-primary/30 hover:bg-opacity-90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 transform" to="/booking">
                Reservar
              </Link>
            </div>
          </div>
          <div className="md:hidden flex items-center">
            <button 
              className="text-gray-600 dark:text-gray-300 hover:text-primary focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="material-icons text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 pt-4 pb-8 space-y-2">
            <Link 
              className={`block px-4 py-3 text-base font-medium rounded-xl transition-colors ${location.pathname === '/' ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`} 
              to="/" 
              onClick={() => setIsMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link 
              className={`block px-4 py-3 text-base font-medium rounded-xl transition-colors ${location.pathname === '/services' ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`} 
              to="/services" 
              onClick={() => setIsMenuOpen(false)}
            >
              Servicios
            </Link>
            <Link 
              className={`block px-4 py-3 text-base font-medium rounded-xl transition-colors ${location.pathname === '/shop' ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`} 
              to="/shop" 
              onClick={() => setIsMenuOpen(false)}
            >
              Tienda
            </Link>
            <Link 
              className={`block px-4 py-3 text-base font-medium rounded-xl transition-colors ${location.pathname === '/about' ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`} 
              to="/about" 
              onClick={() => setIsMenuOpen(false)}
            >
              Nosotros
            </Link>
            <Link 
              className={`block px-4 py-3 text-base font-medium rounded-xl transition-colors ${location.pathname === '/contact' ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`} 
              to="/contact" 
              onClick={() => setIsMenuOpen(false)}
            >
              Contacto
            </Link>
            
            <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-4 flex flex-col gap-4">
              <Link 
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200 dark:border-gray-700" 
                to="/login" 
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="material-icons">person_outline</span>
                Entrar
              </Link>
              <Link 
                className="flex items-center justify-center gap-2 w-full bg-primary text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-primary/30" 
                to="/booking" 
                onClick={() => setIsMenuOpen(false)}
              >
                Reservar
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-dark text-white pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-icons text-primary text-3xl">spa</span>
              <span className="font-display font-bold text-2xl tracking-tight text-white">Dermibelle</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Elevando los estándares de belleza en Port Charlotte con cuidado experto, productos orgánicos y pasión por tu bienestar.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <span className="text-sm">FB</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <span className="text-sm">IG</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg mb-6">Menú</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link className="hover:text-primary transition-colors" to="/">Inicio</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/services">Servicios</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/shop">Tienda</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/about">Nosotros</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/contact">Contacto</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/booking">Reservar</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg mb-6">Servicios</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link className="hover:text-primary transition-colors" to="/services">Sugaring Wax</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/services">Brazilian Knots</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/services">Faciales & Skincare</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/services">Tratamientos Corporales</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg mb-6">Visítanos</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <span className="material-icons text-primary text-sm mt-1">location_on</span>
                <span>123 Beauty Lane,<br/>Port Charlotte, FL 33952</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-icons text-primary text-sm">phone</span>
                <span>(941) 555-0123</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-icons text-primary text-sm">email</span>
                <span>hello@dermibelle.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2024 Dermibelle Studio. Todos los derechos reservados.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link className="hover:text-white transition-colors" to="/privacy-policy">Política de Privacidad</Link>
            <Link className="hover:text-white transition-colors" to="/terms-of-service">Términos de Servicio</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
