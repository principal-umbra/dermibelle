
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, AppointmentItem } from '../../context/DataContext';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type BookingStep = 'services' | 'datetime' | 'details' | 'confirmation';

interface TimeSlot {
    time: string;
    label: string;
    period: 'morning' | 'afternoon' | 'evening';
    available: boolean;
}

// --- Constants ---
const STEPS = [
    { id: 'services', label: 'Servicios', icon: 'spa' },
    { id: 'datetime', label: 'Fecha y Hora', icon: 'event' },
    { id: 'details', label: 'Tus Datos', icon: 'person' }
];

const TIME_SLOTS: TimeSlot[] = [
    { time: '09:00', label: '9:00 AM', period: 'morning', available: true },
    { time: '09:30', label: '9:30 AM', period: 'morning', available: true },
    { time: '10:00', label: '10:00 AM', period: 'morning', available: true },
    { time: '10:30', label: '10:30 AM', period: 'morning', available: false }, // Simulated busy
    { time: '11:00', label: '11:00 AM', period: 'morning', available: true },
    { time: '12:00', label: '12:00 PM', period: 'afternoon', available: true },
    { time: '13:00', label: '1:00 PM', period: 'afternoon', available: true },
    { time: '14:30', label: '2:30 PM', period: 'afternoon', available: true },
    { time: '15:30', label: '3:30 PM', period: 'afternoon', available: true },
    { time: '16:00', label: '4:00 PM', period: 'afternoon', available: true },
    { time: '17:00', label: '5:00 PM', period: 'evening', available: true },
    { time: '18:00', label: '6:00 PM', period: 'evening', available: true },
];

// --- Extracted Components ---

const ServicesStep = React.memo(({ 
    categories, 
    categoryFilter, 
    setCategoryFilter, 
    filteredCatalog, 
    selectedItems, 
    handleItemToggle, 
    handleQuantityChange 
}: {
    categories: string[];
    categoryFilter: string;
    setCategoryFilter: (c: string) => void;
    filteredCatalog: AppointmentItem[];
    selectedItems: Record<string, number>;
    handleItemToggle: (id: string | number) => void;
    handleQuantityChange: (id: string | number, delta: number) => void;
}) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: -10 }}
        className="space-y-8"
    >
        {/* Category Filter - Elegant Pills */}
        <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar mask-linear-fade">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300
                        ${categoryFilter === cat 
                            ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20 dark:bg-white dark:text-black transform scale-105' 
                            : 'bg-white dark:bg-surface-dark text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'}
                    `}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Grid - Refined Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCatalog.map(item => {
                const qty = selectedItems[String(item.id)] || 0;
                const isSelected = qty > 0;
                return (
                    <div 
                        key={item.id}
                        onClick={() => item.type === 'service' ? handleItemToggle(item.id) : null}
                        className={`
                            group relative bg-white dark:bg-surface-dark rounded-2xl p-5 border transition-all duration-300 cursor-pointer
                            ${isSelected 
                                ? 'border-primary ring-1 ring-primary/50 shadow-md' 
                                : 'border-gray-100 dark:border-gray-800 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1'}
                        `}
                    >
                        <div className="flex gap-5 items-start">
                            {/* Icon/Image Placeholder - Soft Square */}
                            <div className={`
                                w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300
                                ${isSelected ? 'bg-primary/10 text-primary' : 'bg-gray-50 dark:bg-white/5 text-gray-400 group-hover:bg-primary/5 group-hover:text-primary'}
                            `}>
                                <span className="material-icons text-3xl">
                                    {item.type === 'product' ? 'shopping_bag' : 'spa'}
                                </span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-display font-bold text-gray-900 dark:text-white truncate text-lg">{item.title}</h3>
                                    <span className="font-mono font-bold text-primary text-lg">${item.price}</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">{item.description || 'Sin descripción disponible.'}</p>
                                
                                <div className="flex justify-between items-center mt-4">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-md">
                                        {item.duration ? `${item.duration} min` : item.type}
                                    </span>

                                    {item.type === 'product' ? (
                                        <div className="flex items-center bg-gray-50 dark:bg-black/20 rounded-lg p-1 border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleQuantityChange(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-surface-dark rounded-md transition-colors shadow-sm"><span className="material-icons text-sm">remove</span></button>
                                            <span className="w-8 text-center text-sm font-bold font-mono">{qty}</span>
                                            <button onClick={() => handleQuantityChange(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-surface-dark rounded-md transition-colors shadow-sm"><span className="material-icons text-sm">add</span></button>
                                        </div>
                                    ) : (
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                                            ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'bg-gray-100 dark:bg-white/5 text-gray-300 group-hover:bg-primary/20 group-hover:text-primary'}
                                        `}>
                                            <span className="material-icons text-sm">{isSelected ? 'check' : 'add'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </motion.div>
));

const DateTimeStep = React.memo(({ 
    selectedDate, 
    handleDateSelect, 
    selectedTime, 
    setSelectedTime 
}: {
    selectedDate: Date;
    handleDateSelect: (date: Date) => void;
    selectedTime: string | null;
    setSelectedTime: (time: string) => void;
}) => {
    // Generate next 14 days
    const days = useMemo(() => Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    }), []);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
        >
            {/* Date Picker - Elegant Horizontal Scroll */}
            <div>
                <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span className="material-icons text-sm">calendar_today</span></span> 
                    Selecciona una Fecha
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x px-1">
                    {days.map(date => {
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        const isToday = date.toDateString() === new Date().toDateString();
                        
                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => handleDateSelect(date)}
                                className={`
                                    snap-start shrink-0 w-24 h-32 rounded-3xl flex flex-col items-center justify-center border transition-all duration-300 group relative overflow-hidden
                                    ${isSelected 
                                        ? 'bg-gray-900 border-gray-900 text-white shadow-xl shadow-gray-900/20 scale-105 dark:bg-white dark:text-black dark:border-white' 
                                        : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'}
                                `}
                            >
                                {isToday && (
                                    <span className={`absolute top-3 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                                        Hoy
                                    </span>
                                )}
                                <span className={`text-xs font-medium uppercase mb-1 ${isSelected ? 'text-white/60 dark:text-black/60' : 'text-gray-400'}`}>
                                    {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                                </span>
                                <span className="text-3xl font-display font-bold mb-1">{date.getDate()}</span>
                                <span className={`text-[10px] ${isSelected ? 'text-white/60 dark:text-black/60' : 'text-gray-300'}`}>
                                    {date.toLocaleDateString('es-ES', { month: 'short' })}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Time Picker - Clean Grid */}
            <div>
                <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span className="material-icons text-sm">schedule</span></span> 
                    Horarios Disponibles
                </h3>
                
                <div className="space-y-8">
                    {['morning', 'afternoon', 'evening'].map(period => {
                        const slots = TIME_SLOTS.filter(s => {
                            if (s.period !== period) return false;
                            const now = new Date();
                            if (selectedDate.toDateString() === now.toDateString()) {
                                const [h, m] = s.time.split(':').map(Number);
                                if (h < now.getHours() || (h === now.getHours() && m < now.getMinutes())) return false;
                            }
                            return true;
                        });

                        if (slots.length === 0) return null;

                        return (
                            <div key={period} className="relative">
                                <div className="absolute -left-3 top-3 bottom-3 w-0.5 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-4">
                                    {period === 'morning' ? 'Mañana' : period === 'afternoon' ? 'Tarde' : 'Noche'}
                                </h4>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pl-2">
                                    {slots.map(slot => (
                                        <button
                                            key={slot.time}
                                            disabled={!slot.available}
                                            onClick={() => setSelectedTime(slot.time)}
                                            className={`
                                                py-3 rounded-xl text-sm font-bold transition-all border relative overflow-hidden
                                                ${selectedTime === slot.time 
                                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 transform scale-105' 
                                                    : slot.available 
                                                        ? 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary hover:shadow-md' 
                                                        : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-300 cursor-not-allowed opacity-60'}
                                            `}
                                        >
                                            {slot.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
});

const DetailsStep = React.memo(({ 
    clientData, 
    setClientData 
}: {
    clientData: { name: string; email: string; phone: string; notes: string };
    setClientData: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; notes: string }>>;
}) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: -10 }}
        className="space-y-8"
    >
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-black/20">
            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span className="material-icons">person_outline</span></span>
                Información de Contacto
            </h3>
            
            <div className="space-y-6">
                <div className="group">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Nombre Completo</label>
                    <div className="relative transition-all duration-300 focus-within:scale-[1.01]">
                        <span className="material-icons absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">person</span>
                        <input 
                            type="text" 
                            value={clientData.name}
                            onChange={e => setClientData(prev => ({...prev, name: e.target.value}))}
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-400"
                            placeholder="Ej: Ana García"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email</label>
                        <div className="relative transition-all duration-300 focus-within:scale-[1.01]">
                            <span className="material-icons absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">email</span>
                            <input 
                                type="email" 
                                value={clientData.email}
                                onChange={e => setClientData(prev => ({...prev, email: e.target.value}))}
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-400"
                                placeholder="ana@ejemplo.com"
                            />
                        </div>
                    </div>
                    <div className="group">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Teléfono</label>
                        <div className="relative transition-all duration-300 focus-within:scale-[1.01]">
                            <span className="material-icons absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">phone</span>
                            <input 
                                type="tel" 
                                value={clientData.phone}
                                onChange={e => setClientData(prev => ({...prev, phone: e.target.value}))}
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-400"
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </div>
                </div>

                <div className="group">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Notas Adicionales (Opcional)</label>
                    <div className="relative transition-all duration-300 focus-within:scale-[1.01]">
                        <span className="material-icons absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">edit_note</span>
                        <textarea 
                            value={clientData.notes}
                            onChange={e => setClientData(prev => ({...prev, notes: e.target.value}))}
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-32 resize-none placeholder-gray-400"
                            placeholder="Alergias, preferencias o peticiones especiales..."
                        />
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
));

const ConfirmationStep = React.memo(({ 
    clientData, 
    selectedDate, 
    selectedTime, 
    navigate 
}: {
    clientData: { email: string };
    selectedDate: Date;
    selectedTime: string | null;
    navigate: (path: string) => void;
}) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex flex-col items-center justify-center text-center py-12 max-w-lg mx-auto"
    >
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="w-28 h-28 bg-white dark:bg-surface-dark rounded-full flex items-center justify-center relative shadow-xl border-4 border-green-50 dark:border-green-900/30">
                <span className="material-icons text-6xl text-green-500">check_circle</span>
            </div>
        </div>

        <h2 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4 tracking-tight">¡Reserva Confirmada!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 leading-relaxed">
            Hemos enviado los detalles de tu cita a <strong className="text-gray-900 dark:text-white font-medium">{clientData.email}</strong>.<br/>
            Nos vemos el <span className="text-primary font-bold">{selectedDate.toLocaleDateString()}</span> a las <span className="text-primary font-bold">{selectedTime}</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/')} className="px-8 py-4 bg-white dark:bg-surface-dark text-gray-700 dark:text-white rounded-2xl font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                Volver al Inicio
            </button>
            <button onClick={() => window.print()} className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl shadow-gray-900/20 hover:scale-105 transition-all flex items-center justify-center gap-2">
                <span className="material-icons text-sm">print</span> Imprimir Comprobante
            </button>
        </div>
    </motion.div>
));

const Booking: React.FC = () => {
    const { catalog, addAppointment, clients, addClient, addToast } = useData();
    const navigate = useNavigate();

    // --- State ---
    const [currentStep, setCurrentStep] = useState<BookingStep>('services');
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [clientData, setClientData] = useState({ name: '', email: '', phone: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('Todos');

    // --- Derived Data ---
    const catalogItems = useMemo(() => catalog.filter(i => {
        // 1. Allow Services
        if (i.type === 'service') return true;
        
        // 2. Allow Products (Retail Only, Stock Check)
        if (i.type === 'product') {
            // Exclude consumables (internal use only)
            if (i.subtype === 'consumable') return false;
            
            // Check Stock (unless it's an E-Product)
            if (!i.isEProduct && (i.stock || 0) <= 0) return false;
            
            return true;
        }
        
        return false;
    }), [catalog]);
    
    const categories = useMemo(() => {
        const cats = new Set(catalogItems.map(i => i.category || 'General'));
        return ['Todos', ...Array.from(cats)];
    }, [catalogItems]);

    const filteredCatalog = useMemo(() => {
        if (categoryFilter === 'Todos') return catalogItems;
        return catalogItems.filter(i => i.category === categoryFilter);
    }, [catalogItems, categoryFilter]);

    const cartItems = useMemo(() => {
        return Object.entries(selectedItems).map(([id, qty]) => {
            const item = catalog.find(i => i.id === id);
            return item ? { ...item, qty } : null;
        }).filter(Boolean) as (AppointmentItem & { qty: number })[];
    }, [selectedItems, catalog]);

    const totalAmount = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    }, [cartItems]);

    const totalDuration = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (item.duration || 30), 0); // Default 30 min if no duration
    }, [cartItems]);

    // --- Handlers ---
    const handleItemToggle = React.useCallback((id: string | number) => {
        const strId = String(id);
        setSelectedItems(prev => {
            const newQty = (prev[strId] || 0) > 0 ? 0 : 1;
            if (newQty === 0) {
                const { [strId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [strId]: newQty };
        });
    }, []);

    const handleQuantityChange = React.useCallback((id: string | number, delta: number) => {
        const strId = String(id);
        setSelectedItems(prev => {
            const current = prev[strId] || 0;
            const next = Math.max(0, current + delta);
            if (next === 0) {
                const { [strId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [strId]: next };
        });
    }, []);

    const handleDateSelect = React.useCallback((date: Date) => {
        setSelectedDate(date);
        setSelectedTime(null); // Reset time when date changes
    }, []);

    const handleConfirmBooking = async () => {
        setIsSubmitting(true);
        
        // Simulate network delay for "Intelligence" feel
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // 1. Find or Create Client
            let clientId = clients.find(c => c.email.toLowerCase() === clientData.email.toLowerCase())?.id;
            
            if (!clientId) {
                clientId = addClient({
                    name: clientData.name,
                    email: clientData.email,
                    phone: clientData.phone,
                    avatar: null,
                    initials: clientData.name.substring(0, 2).toUpperCase(),
                    status: 'New',
                    lastVisit: '-',
                    totalSpent: 0
                });
            }

            // 2. Create Appointment
            const itemsToBook = cartItems.map(i => ({
                ...i,
                quantity: i.qty
            }));

            const serviceName = itemsToBook.some(i => i.type === 'service') 
                ? itemsToBook.filter(i => i.type === 'service').map(i => i.title).join(', ')
                : 'Pedido de Productos';

            addAppointment({
                clientId,
                clientName: clientData.name,
                client: clientData.name,
                clientAvatar: null,
                items: itemsToBook,
                service: serviceName,
                date: selectedDate.toLocaleDateString('en-CA'),
                time: selectedTime || '09:00',
                specialistName: 'Asignado por Sistema', // Intelligent assignment placeholder
                total: totalAmount,
                status: 'Pending',
                notes: clientData.notes || 'Reserva Web'
            });

            setCurrentStep('confirmation');
            addToast('success', '¡Reserva confirmada con éxito!');
        } catch (error) {
            addToast('error', 'Hubo un error al procesar tu reserva.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Helpers ---
    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-12 space-x-6">
            {STEPS.map((step, index) => {
                const isActive = STEPS.findIndex(s => s.id === currentStep) === index;
                const isCompleted = STEPS.findIndex(s => s.id === currentStep) > index;
                
                return (
                    <div key={step.id} className="flex items-center">
                        <div className={`
                            flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500 relative
                            ${isActive 
                                ? 'border-gray-900 bg-gray-900 text-white shadow-xl shadow-gray-900/20 scale-110 dark:bg-white dark:text-black dark:border-white' 
                                : isCompleted 
                                    ? 'border-primary bg-primary text-white' 
                                    : 'border-gray-200 text-gray-300 bg-white dark:bg-surface-dark dark:border-gray-800'}
                        `}>
                            <span className="material-icons text-lg">{isCompleted ? 'check' : step.icon}</span>
                            {isActive && (
                                <span className="absolute -bottom-8 text-xs font-bold whitespace-nowrap text-gray-900 dark:text-white uppercase tracking-widest animate-fade-in">
                                    {step.label}
                                </span>
                            )}
                        </div>
                        {index < STEPS.length - 1 && (
                            <div className={`w-16 h-0.5 mx-4 transition-all duration-700 rounded-full ${isCompleted ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );

    // --- Main Render ---
    if (currentStep === 'confirmation') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-background-dark flex items-center justify-center p-4">
                <ConfirmationStep 
                    clientData={clientData} 
                    selectedDate={selectedDate} 
                    selectedTime={selectedTime} 
                    navigate={navigate} 
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-background-dark font-body text-gray-900 dark:text-gray-100 selection:bg-primary/20">
            {/* Header - Glassmorphism */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-50 h-20 flex items-center transition-all">
                <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
                    <button onClick={() => navigate('/')} className="group flex items-center gap-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors">
                            <span className="material-icons text-sm">arrow_back</span>
                        </div>
                        <span className="text-sm font-bold hidden sm:inline uppercase tracking-wider">Volver</span>
                    </button>
                    <h1 className="font-display font-bold text-xl tracking-tight">Reserva tu Cita</h1>
                    <div className="w-16"></div> {/* Spacer */}
                </div>
            </header>

            <main className="pt-32 pb-32 px-6 max-w-7xl mx-auto">
                {renderStepIndicator()}

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left: Main Content */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            {currentStep === 'services' && (
                                <ServicesStep 
                                    key="services"
                                    categories={categories}
                                    categoryFilter={categoryFilter}
                                    setCategoryFilter={setCategoryFilter}
                                    filteredCatalog={filteredCatalog}
                                    selectedItems={selectedItems}
                                    handleItemToggle={handleItemToggle}
                                    handleQuantityChange={handleQuantityChange}
                                />
                            )}
                            {currentStep === 'datetime' && (
                                <DateTimeStep 
                                    key="datetime"
                                    selectedDate={selectedDate}
                                    handleDateSelect={handleDateSelect}
                                    selectedTime={selectedTime}
                                    setSelectedTime={setSelectedTime}
                                />
                            )}
                            {currentStep === 'details' && (
                                <DetailsStep 
                                    key="details"
                                    clientData={clientData}
                                    setClientData={setClientData}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Smart Summary (Sticky) */}
                    <div className="lg:w-96 shrink-0">
                        <div className="sticky top-28 space-y-6">
                            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-2xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                                {/* Decorative gradient blob */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                                <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-3 relative">
                                    <span className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-900 dark:text-white"><span className="material-icons text-sm">receipt_long</span></span>
                                    Resumen
                                </h3>
                                
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                                        <span className="material-icons text-4xl mb-3 opacity-30">shopping_basket</span>
                                        <p className="text-sm font-medium">Tu carrito está vacío</p>
                                        <p className="text-xs mt-1 opacity-70">Selecciona servicios para comenzar</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 relative">
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                            {cartItems.map(item => (
                                                <div key={item.id} className="flex justify-between text-sm group items-start">
                                                    <div className="flex-1 pr-4">
                                                        <p className="font-bold text-gray-900 dark:text-white mb-0.5">{item.title}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{item.qty} x ${item.price}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold font-mono text-gray-900 dark:text-white">${item.price * item.qty}</p>
                                                        <button 
                                                            onClick={() => handleItemToggle(item.id)}
                                                            className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-3">
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span>Duración Estimada</span>
                                                <span className="font-mono">{totalDuration} min</span>
                                            </div>
                                            {selectedDate && selectedTime && (
                                                <div className="flex justify-between text-sm text-gray-500">
                                                    <span>Fecha</span>
                                                    <span className="text-primary font-bold bg-primary/5 px-2 py-0.5 rounded text-xs">{selectedDate.toLocaleDateString()} {selectedTime}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-end pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                                                <span className="font-bold text-gray-900 dark:text-white text-lg">Total</span>
                                                <span className="text-3xl font-display font-bold text-gray-900 dark:text-white tracking-tight">${totalAmount}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Button */}
                                <div className="mt-8">
                                    {currentStep === 'services' && (
                                        <button 
                                            onClick={() => setCurrentStep('datetime')}
                                            disabled={cartItems.length === 0}
                                            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                                        >
                                            Continuar <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </button>
                                    )}
                                    {currentStep === 'datetime' && (
                                        <button 
                                            onClick={() => setCurrentStep('details')}
                                            disabled={!selectedTime}
                                            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                                        >
                                            Continuar <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </button>
                                    )}
                                    {currentStep === 'details' && (
                                        <button 
                                            onClick={handleConfirmBooking}
                                            disabled={!clientData.name || !clientData.email || isSubmitting}
                                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        >
                                            {isSubmitting ? (
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            ) : (
                                                <>Confirmar Reserva <span className="material-icons text-sm">check</span></>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Trust Badges - Minimalist */}
                            <div className="flex justify-center gap-6 text-gray-400 grayscale opacity-50">
                                <div className="flex items-center gap-1.5"><span className="material-icons text-sm">lock</span> <span className="text-[10px] font-bold uppercase tracking-widest">SSL Secure</span></div>
                                <div className="flex items-center gap-1.5"><span className="material-icons text-sm">verified</span> <span className="text-[10px] font-bold uppercase tracking-widest">Garantía</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Booking;