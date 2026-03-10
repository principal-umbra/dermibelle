
import React, { useState, useEffect } from 'react';
import { useData, Client, Appointment } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const Clients: React.FC = () => {
    const { clients, addClient, addAppointment, addToast } = useData();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isApptModalOpen, setIsApptModalOpen] = useState(false);

    // New Client State
    const [newClientData, setNewClientData] = useState<Partial<Client>>({});

    // New Appointment State
    const [selectedClientForAppt, setSelectedClientForAppt] = useState<Client | null>(null);
    const [tempAppointment, setTempAppointment] = useState<Partial<Appointment>>({});
    const [viewDate, setViewDate] = useState(new Date());

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Filter Logic
    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Reset pagination on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

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

    const handleOpenClientModal = () => {
        setNewClientData({});
        setIsClientModalOpen(true);
    };

    const handleSaveClient = () => {
        if (newClientData.name && newClientData.email) {
            addClient({
                name: newClientData.name,
                email: newClientData.email,
                phone: newClientData.phone || '',
                avatar: null,
                initials: newClientData.name.substring(0, 2).toUpperCase(),
                status: 'New',
                lastVisit: '-',
                lastVisitTimeAgo: '-',
                totalSpent: 0,
                tags: []
            });
            addToast('success', `Cliente ${newClientData.name} registrado con éxito.`);
            setIsClientModalOpen(false);
        } else {
            addToast('error', 'Nombre y Email son requeridos');
        }
    };

    const handleOpenApptModal = (client: Client, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedClientForAppt(client);
        const today = new Date();
        setTempAppointment({
            clientId: client.id,
            clientName: client.name,
            date: today.toLocaleDateString('en-CA'),
            time: '09:00',
            status: 'Pending',
            total: 0,
            items: []
        });
        setIsApptModalOpen(true);
    };

    const handleDateSelect = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setTempAppointment(prev => ({ ...prev, date: `${year}-${month}-${day}` }));
    };

    const changeMonth = (offset: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentSelectedDate = new Date();
        if (tempAppointment && tempAppointment.date) {
            const parts = tempAppointment.date.split('-');
            currentSelectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }

        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const isSelected = date.getDate() === currentSelectedDate.getDate() &&
                date.getMonth() === currentSelectedDate.getMonth() &&
                date.getFullYear() === currentSelectedDate.getFullYear();
            const isPast = date < today;

            days.push(
                <button
                    key={i}
                    type="button"
                    disabled={isPast}
                    onClick={() => handleDateSelect(date)}
                    className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-medium transition-all duration-200 
                      ${isSelected ? 'bg-primary text-white shadow-md scale-110' :
                            isPast ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-primary'}`}
                >
                    {i}
                </button>
            );
        }
        return days;
    };

    const handleSaveAppointment = () => {
        if (tempAppointment.date && tempAppointment.time) {
            addAppointment({
                clientId: selectedClientForAppt!.id,
                clientName: selectedClientForAppt!.name,
                client: selectedClientForAppt!.name,
                clientAvatar: selectedClientForAppt!.avatar,
                avatar: null,
                service: 'Consulta General',
                status: 'Pending',
                items: [],
                date: tempAppointment.date,
                time: tempAppointment.time,
                specialistName: 'Elena G.',
                total: 0,
                notes: 'Creada desde lista de clientes'
            });
            setIsApptModalOpen(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-background-dark p-4 md:p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
                    <p className="text-xs md:text-sm text-gray-500">Base de datos de clientes CRM.</p>
                </div>
                <button onClick={handleOpenClientModal} className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-800 flex items-center justify-center gap-2 shadow-sm text-sm font-bold transition-all transform hover:-translate-y-0.5">
                    <span className="material-icons text-lg">person_add</span> Nuevo
                </button>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col flex-1 min-h-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5 flex-shrink-0">
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full max-w-sm border rounded-lg px-3 py-2 text-sm dark:bg-black/20 dark:border-gray-700 outline-none focus:border-primary"
                    />
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-white/5 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Última Visita</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {currentClients.map(client => (
                                <tr
                                    key={client.id}
                                    onClick={() => navigate(`/admin/crm/clients/${client.id}`)}
                                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            {client.avatar ? (
                                                <img src={client.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                    {client.initials}
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</div>
                                                <div className="text-xs text-gray-500">{client.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${client.status === 'Recurring' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {client.lastVisit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={(e) => handleOpenApptModal(client, e)}
                                            className="text-primary hover:text-green-900 bg-primary/5 hover:bg-primary/10 px-3 py-1 rounded-full transition-colors"
                                        >
                                            Agendar
                                        </button>
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
                            Viendo <span className="font-bold text-gray-900 dark:text-white">{filteredClients.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredClients.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredClients.length}</span> clientes
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

            {/* New Client Modal */}
            {isClientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Registrar Nuevo Cliente</h2>
                        <div className="space-y-4">
                            <input
                                type="text" placeholder="Nombre Completo"
                                value={newClientData.name || ''}
                                onChange={e => setNewClientData({ ...newClientData, name: e.target.value })}
                                className="w-full border rounded p-2 dark:bg-black/20 dark:border-gray-700 dark:text-white"
                            />
                            <input
                                type="email" placeholder="Correo Electrónico"
                                value={newClientData.email || ''}
                                onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                                className="w-full border rounded p-2 dark:bg-black/20 dark:border-gray-700 dark:text-white"
                            />
                            <input
                                type="tel" placeholder="Teléfono"
                                value={newClientData.phone || ''}
                                onChange={e => setNewClientData({ ...newClientData, phone: e.target.value })}
                                className="w-full border rounded p-2 dark:bg-black/20 dark:border-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsClientModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300">Cancelar</button>
                            <button onClick={handleSaveClient} className="px-4 py-2 bg-primary text-white rounded hover:bg-green-800">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Modal (Quick Add) */}
            {isApptModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4 dark:text-white">Cita para {selectedClientForAppt?.name}</h2>

                        {/* Calendar Widget */}
                        <div className="border rounded-xl p-4 dark:border-gray-700 bg-gray-50/50 dark:bg-white/5 mb-4">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-sm text-gray-900 dark:text-white capitalize">{viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full"><span className="material-icons text-sm block">chevron_left</span></button>
                                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full"><span className="material-icons text-sm block">chevron_right</span></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => <span key={d} className="text-[10px] font-bold text-gray-400">{d}</span>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {renderCalendar()}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Hora</label>
                            <input
                                type="time"
                                value={tempAppointment.time || ''}
                                onChange={e => setTempAppointment({ ...tempAppointment, time: e.target.value })}
                                className="w-full border rounded-lg p-2 dark:bg-black/20 dark:border-gray-700 dark:text-white"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsApptModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300">Cancelar</button>
                            <button onClick={handleSaveAppointment} className="px-4 py-2 bg-primary text-white rounded hover:bg-green-800">Agendar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;