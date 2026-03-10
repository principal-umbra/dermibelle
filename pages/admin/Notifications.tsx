import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, Notification } from '../../context/DataContext';

const Notifications: React.FC = () => {
    const { notifications, markNotificationsAsRead, markNotificationsAsUnread, markAllNotificationsAsRead, addToast } = useData();
    const navigate = useNavigate();

    // Filters State
    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Derived State
    const filteredNotifications = useMemo(() => {
        return notifications.filter(notif => {
            const matchesTab = activeTab === 'all'
                || (activeTab === 'read' && notif.read)
                || (activeTab === 'unread' && !notif.read);

            const matchesType = filterType === 'all' || notif.type === filterType;

            const matchesSearch = notif.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notif.title.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesTab && matchesType && matchesSearch;
        });
    }, [notifications, activeTab, filterType, searchQuery]);

    // Stats Logic
    const stats = useMemo(() => {
        return {
            total: notifications.length,
            unread: notifications.filter(n => !n.read).length,
            appointments: notifications.filter(n => n.type === 'new_appointment').length,
            payments: notifications.filter(n => n.type === 'payment_received').length
        };
    }, [notifications]);

    // Actions
    const handleSelectAll = () => {
        if (selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredNotifications.map(n => n.id));
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleBatchRead = () => {
        markNotificationsAsRead(selectedIds);
        addToast('success', `${selectedIds.length} marcadas como leídas`);
        setSelectedIds([]);
    };

    const handleBatchUnread = () => {
        markNotificationsAsUnread(selectedIds);
        addToast('info', `${selectedIds.length} marcadas como no leídas`);
        setSelectedIds([]);
    };

    const handleMarkAllRead = () => {
        markAllNotificationsAsRead();
        addToast('success', 'Todas las notificaciones marcadas como leídas');
    };

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'new_appointment': return 'event_available';
            case 'payment_received': return 'payments';
            case 'new_product_physical': return 'inventory_2';
            case 'new_product_digital': return 'cloud_download';
            default: return 'notifications';
        }
    };

    const getTypeColor = (type: Notification['type']) => {
        switch (type) {
            case 'new_appointment': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300';
            case 'payment_received': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300';
            case 'new_product_physical': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300';
            case 'new_product_digital': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-background-dark p-4 md:p-8">

            {/* Header & Stats Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6 mb-6 md:mb-8 flex-shrink-0">
                <div>
                    <h2 className="text-xl md:text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        Centro de Actividad
                        {stats.unread > 0 && (
                            <span className="bg-red-500 text-white text-[10px] md:text-sm font-body font-bold px-2 md:px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                                {stats.unread} nuevas
                            </span>
                        )}
                    </h2>
                    <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        Monitoreo en tiempo real de eventos y alertas.
                    </p>
                </div>

                {/* Quick Stats Cards */}
                <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    <div className="bg-white dark:bg-surface-dark px-3 md:px-4 py-2 md:py-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-2 md:gap-3 min-w-[120px] md:min-w-[140px]">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                            <span className="material-icons text-lg md:text-xl">event</span>
                        </div>
                        <div>
                            <span className="block text-lg md:text-xl font-bold text-gray-900 dark:text-white">{stats.appointments}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Citas</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-surface-dark px-3 md:px-4 py-2 md:py-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-2 md:gap-3 min-w-[120px] md:min-w-[140px]">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
                            <span className="material-icons text-lg md:text-xl">payments</span>
                        </div>
                        <div>
                            <span className="block text-lg md:text-xl font-bold text-gray-900 dark:text-white">{stats.payments}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Pagos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Container */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-800 flex flex-col flex-1 min-h-0 overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row justify-between gap-4 bg-gray-50/50 dark:bg-black/20 shrink-0">

                    {/* Left: Search & Tabs */}
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        {/* Search */}
                        <div className="relative w-full sm:max-w-xs group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border-none ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white transition-all shadow-sm"
                                placeholder="Buscar..."
                            />
                        </div>

                        {/* Status Tabs */}
                        <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl w-full sm:w-auto">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-white dark:bg-surface-dark text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setActiveTab('unread')}
                                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'unread' ? 'bg-white dark:bg-surface-dark text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                No Leídas
                            </button>
                        </div>

                        {/* Category Dropdown */}
                        <div className="relative">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-surface-dark border-none ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary cursor-pointer shadow-sm w-full sm:w-auto"
                            >
                                <option value="all">Todas las Categorías</option>
                                <option value="new_appointment">Citas</option>
                                <option value="payment_received">Pagos</option>
                                <option value="new_product_physical">Inventario</option>
                                <option value="system">Sistema</option>
                            </select>
                            <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">expand_more</span>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {selectedIds.length > 0 ? (
                            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-xl animate-in fade-in slide-in-from-right-4">
                                <span className="text-xs font-bold text-primary mr-2">{selectedIds.length} seleccionados</span>
                                <button onClick={handleBatchRead} className="p-1.5 bg-white dark:bg-surface-dark text-gray-500 hover:text-green-600 rounded-lg shadow-sm transition-colors" title="Marcar leídas">
                                    <span className="material-icons text-lg">mark_email_read</span>
                                </button>
                                <button onClick={handleBatchUnread} className="p-1.5 bg-white dark:bg-surface-dark text-gray-500 hover:text-blue-600 rounded-lg shadow-sm transition-colors" title="Marcar no leídas">
                                    <span className="material-icons text-lg">mark_email_unread</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleMarkAllRead}
                                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <span className="material-icons text-lg">done_all</span> Marcar todo leído
                            </button>
                        )}
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-black/10 p-2 sm:p-4 custom-scrollbar">
                    {filteredNotifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <span className="material-icons text-4xl text-gray-300 dark:text-gray-600">notifications_off</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Estás al día</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">No hay notificaciones que coincidan con tus filtros actuales.</p>
                            {activeTab !== 'all' && (
                                <button onClick={() => setActiveTab('all')} className="mt-4 text-primary font-bold text-sm hover:underline">Ver todo el historial</button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 max-w-5xl mx-auto">
                            {/* Header Row for Select All */}
                            <div className="flex items-center px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    />
                                    <span>Seleccionar Todo</span>
                                </div>
                            </div>

                            {filteredNotifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 
                                ${!notif.read
                                            ? 'bg-white dark:bg-surface-dark border-primary/30 shadow-md shadow-primary/5'
                                            : 'bg-white/60 dark:bg-surface-dark/40 border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-surface-dark'}
                            `}
                                >
                                    {/* Selection Checkbox */}
                                    <div className="pt-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(notif.id)}
                                            onChange={() => handleSelectOne(notif.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>

                                    {/* Icon Type */}
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getTypeColor(notif.type)}`}>
                                        <span className="material-icons text-xl">{getTypeIcon(notif.type)}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`text-sm font-bold ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {notif.title}
                                            </h4>
                                            <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                {notif.time}
                                            </span>
                                        </div>
                                        <p className={`text-sm mt-1 leading-relaxed ${!notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                                            {notif.message}
                                        </p>

                                        {/* Link Action */}
                                        {notif.link && (
                                            <div className="mt-3">
                                                <button
                                                    onClick={() => navigate(notif.link!)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-green-800 transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg"
                                                >
                                                    Ver Detalles <span className="material-icons text-xs">arrow_forward</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Read Status Indicator & Actions */}
                                    <div className="flex flex-col items-end gap-2 pt-1">
                                        {!notif.read && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-300 animate-pulse" title="No leído"></span>
                                        )}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                                            <button
                                                onClick={() => notif.read ? markNotificationsAsUnread([notif.id]) : markNotificationsAsRead([notif.id])}
                                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                                title={notif.read ? "Marcar no leído" : "Marcar leído"}
                                            >
                                                <span className="material-icons text-lg">{notif.read ? 'mark_email_unread' : 'mark_email_read'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex justify-between items-center text-[10px] text-gray-500">
                    <span>Mostrando {filteredNotifications.length} notificaciones</span>
                    <span>Historial retenido por 30 días</span>
                </div>

            </div>
        </div>
    );
};

export default Notifications;