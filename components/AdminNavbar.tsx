import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

const AdminNavbar: React.FC = () => {
    const {
        notifications,
        markAllNotificationsAsRead,
        markNotificationAsRead,
        performGlobalSearch,
        currentUser,
        logout
    } = useData();

    const navigate = useNavigate();

    // States for Dropdowns
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any>({ clients: [], appointments: [], invoices: [], suppliers: [], orders: [] });

    // Calendar Widget State (Visual Only)
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Refs for click outside
    const searchRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Click Outside & ESC Handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsSearchOpen(false);
                setIsNotifOpen(false);
                setIsCalendarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Search Debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery) {
                setSearchResults(performGlobalSearch(searchQuery));
                setIsSearchOpen(true);
            } else {
                setIsSearchOpen(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleQuickSearch = (term: string) => {
        setSearchQuery(term);
    };

    // --- Calendar Logic ---
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const renderCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }

        // Days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            days.push(
                <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-medium transition-all duration-200
                      ${isSelected ? 'bg-primary text-white shadow-md scale-110' : 'text-gray-700 hover:bg-gray-100 hover:text-primary'}
                      ${isToday && !isSelected ? 'text-primary font-bold border border-primary/30' : ''}
                  `}
                >
                    {i}
                </button>
            );
        }
        return days;
    };

    return (
        <header className="h-16 md:h-20 bg-white shadow-sm flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">

            {/* 1. Global Search */}
            <div className="flex-1 max-w-[200px] sm:max-w-xs md:max-w-xl relative" ref={searchRef}>
                <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons text-gray-400 group-focus-within:text-primary transition-colors text-sm md:text-base">search</span>
                    </span>
                    <input
                        className="block w-full pl-9 md:pl-10 pr-3 py-1.5 md:py-2.5 border-none rounded-xl bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-300 text-xs md:text-sm"
                        placeholder="Buscar..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery && setIsSearchOpen(true)}
                    />
                </div>

                {/* Search Results Dropdown */}
                {isSearchOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        {Object.values(searchResults).every((arr: any) => arr.length === 0) ? (
                            <div className="p-6 text-center text-gray-500">
                                <span className="material-icons text-4xl mb-2 text-gray-300">search_off</span>
                                <p>No se encontraron resultados para "{searchQuery}"</p>
                                <div className="mt-4 flex flex-col gap-2">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Sugerencias</p>
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleQuickSearch('hoy')} className="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-full border border-gray-200">Hoy</button>
                                        <button onClick={() => handleQuickSearch('pendiente')} className="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-full border border-gray-200">Pendiente</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Appointments */}
                                {searchResults.appointments.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0">Citas</div>
                                        {searchResults.appointments.map((a: any) => (
                                            <Link
                                                key={a.id}
                                                to={`/admin/appointments`}
                                                state={{ openAppointmentId: a.id }} // PASS STATE
                                                onClick={() => setIsSearchOpen(false)}
                                                className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="material-icons text-purple-500 bg-purple-50 p-1.5 rounded-lg text-sm">event</span>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{a.serviceTitle}</div>
                                                        <div className="text-xs text-gray-500">{a.clientName} • {a.date}</div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {/* Clients */}
                                {searchResults.clients.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0">Clientes</div>
                                        {searchResults.clients.map((c: any) => (
                                            <Link key={c.id} to={`/admin/crm/clients/${c.id}`} onClick={() => setIsSearchOpen(false)} className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{c.initials || c.name.charAt(0)}</div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{c.name}</div>
                                                        <div className="text-xs text-gray-500">{c.email}</div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {/* Orders */}
                                {searchResults.orders.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0">Pedidos</div>
                                        {searchResults.orders.map((o: any) => (
                                            <Link key={o.id} to={`/admin/finance/invoices`} onClick={() => setIsSearchOpen(false)} className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <span className={`material-icons p-1.5 rounded-lg text-sm ${o.type === 'physical' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        {o.type === 'physical' ? 'inventory_2' : 'cloud_download'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-bold text-gray-900">{o.idDisplay}</span>
                                                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{o.status}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">{o.clientName} • {o.items}</div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {/* Invoices */}
                                {searchResults.invoices.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0">Facturas</div>
                                        {searchResults.invoices.map((i: any) => (
                                            <Link key={i.id} to={`/admin/finance/invoices`} onClick={() => setIsSearchOpen(false)} className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-icons text-green-600 bg-green-50 p-1.5 rounded-lg text-sm">receipt_long</span>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-bold text-gray-900">{i.idDisplay}</span>
                                                            <span className="text-sm font-bold text-gray-900">${i.amount}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">{i.client} • {i.status}</div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {/* Suppliers */}
                                {searchResults.suppliers.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0">Proveedores</div>
                                        {searchResults.suppliers.map((s: any) => (
                                            <Link key={s.id} to={`/admin/crm/suppliers/${s.id}`} onClick={() => setIsSearchOpen(false)} className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-icons text-gray-500 bg-gray-100 p-1.5 rounded-lg text-sm">store</span>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{s.companyName}</div>
                                                        <div className="text-xs text-gray-500">{s.contactPerson}</div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6 ml-4">

                {/* 2. Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`relative p-2 rounded-full transition-all focus:outline-none ${isNotifOpen ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-primary hover:bg-primary/5'}`}
                    >
                        <span className="material-icons">notifications</span>
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-red-500 rounded-full text-[10px] font-bold text-white border-2 border-white dark:border-surface-dark">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-900">Notificaciones</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllNotificationsAsRead} className="text-xs text-primary font-medium hover:underline">
                                        Marcar leídas
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500 text-sm">No tienes notificaciones recientes.</div>
                                ) : (
                                    notifications.slice(0, 10).map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${!notif.read ? 'bg-blue-50/20' : ''}`}
                                            onClick={() => {
                                                markNotificationAsRead(notif.id);
                                                if (notif.link) navigate(notif.link);
                                                setIsNotifOpen(false);
                                            }}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-transparent
                                        ${notif.type === 'new_appointment' ? 'bg-purple-100 text-purple-600' : ''}
                                        ${notif.type === 'payment_received' ? 'bg-green-100 text-green-600' : ''}
                                        ${notif.type === 'new_product_physical' ? 'bg-orange-100 text-orange-600' : ''}
                                        ${notif.type === 'new_product_digital' ? 'bg-blue-100 text-blue-600' : ''}
                                    `}>
                                                <span className="material-icons text-sm">
                                                    {notif.type === 'new_appointment' && 'event'}
                                                    {notif.type === 'payment_received' && 'payments'}
                                                    {notif.type === 'new_product_physical' && 'inventory_2'}
                                                    {notif.type === 'new_product_digital' && 'cloud_download'}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className={`text-sm font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                                                    {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1"></span>}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 font-medium">{notif.time}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                                <Link
                                    to="/admin/notifications"
                                    className="text-xs font-medium text-gray-600 hover:text-primary w-full block py-1"
                                    onClick={() => setIsNotifOpen(false)}
                                >
                                    Ver historial completo
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-gray-200"></div>

                {/* 3. Visual Calendar Widget (Non-filtering) */}
                <div className="relative" ref={calendarRef}>
                    <button
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className={`flex items-center gap-2 md:gap-3 group rounded-lg p-1 md:pr-3 transition-colors ${isCalendarOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                    >
                        <div className="hidden sm:flex flex-col items-end text-right text-gray-700">
                            <span className="block text-[10px] text-gray-400 font-medium uppercase tracking-wider">Perfil</span>
                            <span className="text-xs md:text-sm font-bold whitespace-nowrap">
                                {currentUser?.name || 'Administrador'}
                            </span>
                        </div>
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-2 ring-white`}>
                            {currentUser?.avatar ? (
                                <img src={currentUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                currentUser?.initials || 'A'
                            )}
                        </div>
                    </button>

                    {isCalendarOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 w-72 animate-in fade-in zoom-in-95 duration-200 select-none z-50">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-900 text-sm capitalize">
                                    {viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                                </h4>
                                <div className="flex gap-1">
                                    <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors">
                                        <span className="material-icons text-sm block">chevron_left</span>
                                    </button>
                                    <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors">
                                        <span className="material-icons text-sm block">chevron_right</span>
                                    </button>
                                </div>
                            </div>

                            {/* Days Header */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                                    <span key={d} className="text-[10px] font-bold text-gray-400 uppercase">{d}</span>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {renderCalendarDays()}
                            </div>

                            {/* Footer */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-[10px] text-gray-400">Consulta Visual</span>
                                <button
                                    onClick={() => { setViewDate(new Date()); setSelectedDate(new Date()); }}
                                    className="text-[10px] font-bold text-primary hover:underline"
                                >
                                    Ir a Hoy
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Logout Button (Replaces "+" button) */}
                <button
                    onClick={handleLogout}
                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm"
                    title="Cerrar Sesión"
                >
                    <span className="material-icons text-lg group-hover:scale-110 transition-transform">logout</span>
                </button>
            </div>
        </header>
    );
};

export default AdminNavbar;