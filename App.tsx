
import React, { useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, useLocation, Outlet, Link } from 'react-router-dom';
import { PublicNavbar, Footer } from './components/PublicComponents';
import AdminNavbar from './components/AdminNavbar';
import Calculator from './components/Calculator';
import { DataProvider, useData } from './context/DataContext';

// Public Pages
const Home = React.lazy(() => import('./pages/public/Home'));
const Services = React.lazy(() => import('./pages/public/Services'));
const Shop = React.lazy(() => import('./pages/public/Shop')); // New Import
const Booking = React.lazy(() => import('./pages/public/Booking'));
const About = React.lazy(() => import('./pages/public/About'));
const Contact = React.lazy(() => import('./pages/public/Contact'));
const FAQ = React.lazy(() => import('./pages/public/FAQ'));
const PrivacyPolicy = React.lazy(() => import('./pages/public/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/public/TermsOfService'));

// Auth Pages
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));

// Portal Pages (External)
const VendorOrderPortal = React.lazy(() => import('./pages/portal/VendorOrderPortal'));
const VendorDashboard = React.lazy(() => import('./pages/portal/VendorDashboard'));

// Admin Pages
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const Invoices = React.lazy(() => import('./pages/admin/Invoices'));
const History = React.lazy(() => import('./pages/admin/History'));
const Appointments = React.lazy(() => import('./pages/admin/Appointments'));
const Archive = React.lazy(() => import('./pages/admin/Archive'));
const Clients = React.lazy(() => import('./pages/admin/Clients'));
const ClientDetails = React.lazy(() => import('./pages/admin/ClientDetails'));
const Suppliers = React.lazy(() => import('./pages/admin/Suppliers'));
const SupplierDetails = React.lazy(() => import('./pages/admin/SupplierDetails'));
const Users = React.lazy(() => import('./pages/admin/Users'));
const Profile = React.lazy(() => import('./pages/admin/Profile'));
const Notifications = React.lazy(() => import('./pages/admin/Notifications'));
const Catalog = React.lazy(() => import('./pages/admin/Catalog')); 

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Toast Component (unchanged)
const ToastContainer = () => {
    const { toasts, removeToast } = useData();
    return (
        <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark animate-in slide-in-from-right-10 fade-in duration-300 relative overflow-hidden group">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 
                        ${toast.type === 'success' ? 'bg-primary' : ''}
                        ${toast.type === 'error' ? 'bg-red-500' : ''}
                        ${toast.type === 'info' ? 'bg-secondary' : ''}
                    `}></div>

                    <div className={`p-2 rounded-full shrink-0 mt-0.5
                        ${toast.type === 'success' ? 'bg-primary/10 text-primary' : ''}
                        ${toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : ''}
                        ${toast.type === 'info' ? 'bg-secondary/10 text-secondary' : ''}
                    `}>
                        <span className="material-icons text-xl">
                            {toast.type === 'success' && 'check_circle'}
                            {toast.type === 'error' && 'error_outline'}
                            {toast.type === 'info' && 'notifications'}
                        </span>
                    </div>
                    
                    <div className="flex-1 min-w-0 py-0.5">
                        <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-0.5">
                            {toast.type === 'success' && 'Operación Exitosa'}
                            {toast.type === 'error' && 'Ha ocurrido un error'}
                            {toast.type === 'info' && 'Nueva Notificación'}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-body">
                            {toast.message}
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => removeToast(toast.id)} 
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-md hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                        <span className="material-icons text-sm">close</span>
                    </button>
                </div>
            ))}
        </div>
    );
};

// Layouts (unchanged)
const PublicLayout: React.FC = () => (
  <>
    <PublicNavbar />
    <main className="min-h-screen">
      <Outlet />
    </main>
    <Footer />
  </>
);

const AdminLayout: React.FC = () => {
  const { appointments } = useData();
  const location = useLocation();
  const isFinancePage = location.pathname.includes('/finance');
  const isAppointmentsPage = location.pathname.includes('/admin/appointments');
  const isClientsPage = location.pathname.includes('/admin/crm/clients');
  const isSuppliersPage = location.pathname.includes('/admin/crm/suppliers');
  const isCatalogPage = location.pathname.includes('/admin/crm/catalog');
  const isUsersPage = location.pathname.includes('/admin/users');
  const isProfilePage = location.pathname.includes('/admin/profile');
  const isArchivePage = location.pathname.includes('/admin/archive');

  const activeAppointmentsCount = useMemo(() => 
    appointments.filter(a => a.status !== 'Finalized' && a.status !== 'Cancelled').length,
  [appointments]);

  return (
    <div className="bg-background-light font-body text-text-light antialiased h-screen w-full overflow-hidden flex">
      <aside className="w-64 bg-surface-dark text-white flex flex-col shadow-2xl z-20 flex-shrink-0 transition-all duration-300 hidden md:flex border-r border-gray-800 overflow-y-auto">
        <div className="h-20 flex items-center px-6 border-b border-gray-800 bg-surface-dark flex-shrink-0">
          <Link className="flex items-center gap-2 group w-full" to="/admin">
            <span className="material-icons text-primary text-3xl group-hover:scale-110 transition-transform">spa</span>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl tracking-wide text-white">Dermibelle</span>
              <span className="text-xs uppercase tracking-[0.2em] text-secondary">Admin Panel</span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          <Link className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === '/admin' ? 'bg-primary/20 text-white border-l-4 border-secondary shadow-lg shadow-black/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} to="/admin">
            <span className={`material-icons transition-colors ${location.pathname === '/admin' ? 'text-secondary' : 'group-hover:text-secondary'}`}>dashboard</span>
            <span className={`font-medium tracking-wide ${location.pathname === '/admin' ? '' : ''}`}>Dashboard</span>
          </Link>
          
          <div className="mt-2 space-y-1">
            <Link className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isAppointmentsPage ? 'bg-primary text-white shadow-lg shadow-primary/20 relative' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} to="/admin/appointments">
                {isAppointmentsPage && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl"></div>}
                <span className={`material-icons transition-colors ${isAppointmentsPage ? '' : 'group-hover:text-secondary'}`}>calendar_view_week</span>
                <span className="font-medium">Citas</span>
                {(!isAppointmentsPage && activeAppointmentsCount > 0) && (
                    <span className="ml-auto bg-primary text-xs font-bold px-2 py-0.5 rounded-full text-white">
                        {activeAppointmentsCount}
                    </span>
                )}
            </Link>
            
            <div className="ml-9 border-l border-gray-700/50 pl-2">
                <Link className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm group ${isArchivePage ? 'text-white font-medium bg-white/10' : 'text-gray-500 hover:text-gray-300'}`} to="/admin/archive">
                    <span className="material-icons text-xs group-hover:text-secondary transition-colors">folder_open</span>
                    <span>Archivo</span>
                </Link>
            </div>
          </div>

          <div className="pt-6 pb-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Finanzas</div>
          <div className="space-y-1">
            <Link className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${location.pathname.includes('invoices') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} to="/admin/finance/invoices">
              <span className="material-icons text-sm group-hover:text-secondary">receipt_long</span>
              <span className="font-medium">Facturas</span>
            </Link>
            <Link className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${location.pathname.includes('history') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} to="/admin/finance/history">
              <span className="material-icons text-sm group-hover:text-secondary">history</span>
              <span className="font-medium">Operaciones</span>
            </Link>
          </div>

          <div className="pt-6 pb-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Gestión CRM</div>
          <div className="space-y-1">
            <Link className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isClientsPage ? 'bg-primary text-white shadow-lg shadow-primary/20 relative' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} to="/admin/crm/clients">
              {isClientsPage && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl"></div>}
              <span className={`material-icons text-sm ${isClientsPage ? '' : 'group-hover:text-secondary'}`}>people</span>
              <span className="font-medium">Clientes</span>
            </Link>
            <Link className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isSuppliersPage ? 'bg-primary text-white shadow-lg shadow-primary/20 relative' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} to="/admin/crm/suppliers">
              {isSuppliersPage && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl"></div>}
              <span className={`material-icons text-sm ${isSuppliersPage ? '' : 'group-hover:text-secondary'}`}>inventory_2</span>
              <span className="font-medium">Proveedores</span>
            </Link>
            <Link className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isCatalogPage ? 'bg-primary text-white shadow-lg shadow-primary/20 relative' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} to="/admin/crm/catalog">
              {isCatalogPage && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl"></div>}
              <span className={`material-icons text-sm ${isCatalogPage ? '' : 'group-hover:text-secondary'}`}>spa</span>
              <span className="font-medium">Catálogo</span>
            </Link>
          </div>

          <div className="pt-6 pb-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Sistema</div>
          <div className="space-y-1">
            <Link className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isUsersPage ? 'bg-primary text-white shadow-lg shadow-primary/20 relative' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} to="/admin/users">
                {isUsersPage && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl"></div>}
                <span className={`material-icons transition-colors ${isUsersPage ? '' : 'group-hover:text-secondary'}`}>admin_panel_settings</span>
                <span className="font-medium">Configuración</span>
            </Link>
            <Link className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 group" to="/">
                <span className="material-icons group-hover:text-secondary transition-colors">public</span>
                <span className="font-medium">Ver Sitio Web</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800 bg-black/20 flex-shrink-0">
          <Link to="/admin/profile" className="flex items-center gap-3 group hover:bg-white/5 p-2 rounded-lg transition-colors">
            <img alt="Admin User" className="w-10 h-10 rounded-full border-2 border-secondary object-cover group-hover:border-primary transition-colors" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTmbtnThyRcY-UuQYkb8xakqYr1Qeq6qEHsmBipiX7Jfzu8bQi29NVIWIXKzAXC3nACR8G1hVZqov325385Vb1oKji3TCl-FamPm-bZ0hBv7-cOeeA5oaZM5QVV2b6tONpZA_Ekn9VBZqAQUOI2KtkHZeuRQXHJfXPqFPKwLnqZyYSrcZaG-XIZzTeM8Ea_hnYPpD_Xb5Lu8HMn_t2PkUs1PNDd-NetN1qm8Sou6FIkuEYL5syn9cWf0YHLVib0hErULA6SfeMQrz8"/>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">Ray Q.</span>
              <span className="text-xs text-gray-400 truncate">Admin</span>
            </div>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/50">
        {!isUsersPage && !isProfilePage && (
           <AdminNavbar />
        )}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <Outlet />
        </main>
      </div>

      {isFinancePage && <Calculator />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <DataProvider>
        <ScrollToTop />
        <React.Suspense fallback={
          <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        }>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/shop" element={<Shop />} /> 
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
            </Route>

            <Route path="/booking" element={<Booking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Vendor Portal Routes */}
            <Route path="/portal/order/:id" element={<VendorOrderPortal />} />
            <Route path="/portal/dashboard/:id" element={<VendorDashboard />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="finance/invoices" element={<Invoices />} />
              <Route path="finance/history" element={<History />} />
              <Route path="archive" element={<Archive />} />
              <Route path="crm/clients" element={<Clients />} />
              <Route path="crm/clients/:id" element={<ClientDetails />} />
              <Route path="crm/suppliers" element={<Suppliers />} />
              <Route path="crm/suppliers/:id" element={<SupplierDetails />} />
              <Route path="crm/catalog" element={<Catalog />} />
              <Route path="users" element={<Users />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            
            <Route path="*" element={
              <div className="h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
                <h1 className="text-4xl font-display font-bold mb-4">404</h1>
                <p className="text-gray-500">Página no encontrada</p>
                <Link to="/" className="mt-6 text-primary hover:underline">Volver al Inicio</Link>
              </div>
            } />
          </Routes>
        </React.Suspense>
        <ToastContainer />
      </DataProvider>
    </HashRouter>
  );
};

export default App;
