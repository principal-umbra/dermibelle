import React, { useState, useEffect, useMemo, useRef } from 'react';

interface PortalLogisticsProps {
    logisticsType: 'courier' | 'fleet' | 'pickup';
    setLogisticsType: (type: 'courier' | 'fleet' | 'pickup') => void;
    carrierName: string;
    setCarrierName: (val: string) => void;
    trackingNumber: string;
    setTrackingNumber: (val: string) => void;
    etaDate: string;
    setEtaDate: (val: string) => void;
    onConfirmOrder: () => void;
    onExit: () => void;
    shippingCost: number;
    setShippingCost: (val: number) => void;
    missingFields: string[];
    readOnly?: boolean;
    driverName?: string;
    setDriverName?: (val: string) => void;
    vehiclePlate?: string;
    setVehiclePlate?: (val: string) => void;
    driverPhone?: string;
    setDriverPhone?: (val: string) => void;
    pickupAddress?: string;
    setPickupAddress?: (val: string) => void;
    pickupReference?: string;
    setPickupReference?: (val: string) => void;
    pickupHours?: string;
    setPickupHours?: (val: string) => void;
    requestedMethod?: string;
    supplierShippingCosts?: {
        standard: number;
        express: number;
        pickup: number;
    };
    restrictToTracking?: boolean; // When true, locks address/carrier fields but allows tracking
}

// Helper: Phone Formatter
const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return `(${phoneNumber}`;
    if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

const PortalLogistics: React.FC<PortalLogisticsProps> = ({
    logisticsType, setLogisticsType,
    carrierName, setCarrierName,
    trackingNumber, setTrackingNumber,
    etaDate, setEtaDate,
    onConfirmOrder, onExit,
    shippingCost, setShippingCost,
    missingFields,
    readOnly = false,
    driverName, setDriverName,
    vehiclePlate, setVehiclePlate,
    driverPhone, setDriverPhone,
    pickupAddress, setPickupAddress,
    pickupReference, setPickupReference,
    pickupHours, setPickupHours,
    requestedMethod,
    supplierShippingCosts,
    restrictToTracking = false
}) => {
    const isValidToSubmit = missingFields.length === 0;
    const isPickupOrder = requestedMethod === 'pickup';

    // --- CUSTOM CALENDAR STATE ---
    const [showCalendar, setShowCalendar] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);

    // Auto-fill Carrier Name for Fleet
    useEffect(() => {
        if (logisticsType === 'fleet') {
            setCarrierName('Logística Interna');
        } else if (logisticsType === 'courier' && carrierName === 'Logística Interna') {
            setCarrierName('');
        }
    }, [logisticsType]);

    // Enforce Pickup Type if requested method is pickup
    useEffect(() => {
        if (isPickupOrder) {
            setLogisticsType('pickup');
        }
    }, [isPickupOrder, setLogisticsType]);

    // --- AUTO COST ADJUSTMENT LOGIC ---
    useEffect(() => {
        if (!supplierShippingCosts || readOnly || restrictToTracking) return; 

        if (logisticsType === 'pickup') {
            setShippingCost(supplierShippingCosts.pickup || 0);
        } else if (logisticsType === 'fleet') {
            setShippingCost(0); // Internal fleet usually handled differently or 0 in this context
        } else {
            // Courier Logic
            const method = (requestedMethod || '').toLowerCase();
            const isExpress = method.includes('express') || method.includes('air') || method.includes('urgent') || method.includes('priority');
            
            if (isExpress) {
                setShippingCost(supplierShippingCosts.express || 0);
            } else {
                setShippingCost(supplierShippingCosts.standard || 0);
            }
        }
    }, [logisticsType, requestedMethod, supplierShippingCosts, restrictToTracking]);

    // Close calendar on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- SMART LOGIC ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const suggestedDateData = useMemo(() => {
        const baseDate = new Date();
        baseDate.setHours(0, 0, 0, 0);
        
        let minDays = 3;
        let maxDays = 5;
        let label = 'Estándar';

        if (logisticsType === 'pickup') {
            minDays = 0; // Hoy o Mañana
            maxDays = 2;
            label = 'Listo para Retiro';
        } else if (logisticsType === 'fleet') {
            minDays = 1;
            maxDays = 3;
            label = 'Flota Local';
        } else {
            // Courier Logic
            const method = (requestedMethod || '').toLowerCase();
            if (method.includes('express') || method.includes('air') || method.includes('next day')) {
                minDays = 1;
                maxDays = 2;
                label = 'Express';
            } else if (method.includes('ground') || method.includes('standard')) {
                minDays = 5;
                maxDays = 7;
                label = 'Ground';
            }
        }

        // Calculate Range Dates
        const rangeStartDate = new Date(baseDate);
        rangeStartDate.setDate(baseDate.getDate() + minDays);
        
        const rangeEndDate = new Date(baseDate);
        rangeEndDate.setDate(baseDate.getDate() + maxDays);

        return {
            rangeStart: rangeStartDate,
            rangeEnd: rangeEndDate,
            minDays,
            maxDays,
            label,
            displayRange: `${rangeStartDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${rangeEndDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
        };
    }, [logisticsType, requestedMethod]);

    // Format display date for input
    const displayValue = etaDate 
        ? new Date(etaDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
        : '';

    // Calendar Helpers
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun

    const handleDateSelect = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setEtaDate(`${year}-${month}-${day}`);
        setShowCalendar(false);
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Selected Date Object
        const selectedObj = etaDate ? new Date(etaDate + 'T12:00:00') : null;
        if (selectedObj) selectedObj.setHours(0,0,0,0);

        // Headers
        const weekDays = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];

        // Empty Slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            date.setHours(0,0,0,0);
            
            const time = date.getTime();
            const rangeStartTime = suggestedDateData.rangeStart.getTime();
            const rangeEndTime = suggestedDateData.rangeEnd.getTime();

            const isPast = date < today;
            const isSelected = selectedObj && time === selectedObj.getTime();
            
            // Range Logic
            const isInRange = time >= rangeStartTime && time <= rangeEndTime;
            const isRangeStart = time === rangeStartTime;
            const isRangeEnd = time === rangeEndTime;
            const isToday = time === today.getTime();

            // Dynamic Styling for Range
            let rangeClasses = '';
            if (isInRange) {
                rangeClasses = 'bg-green-500/20 text-green-400 font-bold rounded-none'; // Base range style
                if (isRangeStart) rangeClasses += ' rounded-l-lg';
                if (isRangeEnd) rangeClasses += ' rounded-r-lg';
                // If it's a single day range
                if (isRangeStart && isRangeEnd) rangeClasses += ' rounded-lg';
            }

            days.push(
                <button 
                    key={i} 
                    disabled={isPast || readOnly} // Should restrictToTracking affect date? Usually yes, allowed to edit.
                    onClick={() => handleDateSelect(date)}
                    className={`h-8 w-full flex items-center justify-center text-xs transition-all relative
                        ${isSelected 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 rounded-lg z-10' 
                            : isInRange
                                ? rangeClasses
                                : isPast 
                                    ? 'text-gray-600 cursor-not-allowed opacity-50 rounded-lg' 
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg'}
                    `}
                >
                    {i}
                    {isToday && !isSelected && !isInRange && (
                        <div className="absolute bottom-1 w-1 h-1 bg-gray-400 rounded-full"></div>
                    )}
                </button>
            );
        }

        return (
            <div className="p-3">
                <div className="flex justify-between items-center mb-3">
                    <button onClick={() => changeMonth(-1)} className="text-gray-400 hover:text-white p-1"><span className="material-icons text-sm">chevron_left</span></button>
                    <span className="text-xs font-bold text-white capitalize">{viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => changeMonth(1)} className="text-gray-400 hover:text-white p-1"><span className="material-icons text-sm">chevron_right</span></button>
                </div>
                <div className="grid grid-cols-7 gap-0 text-center mb-2">
                    {weekDays.map(d => <span key={d} className="text-[9px] font-bold text-gray-500">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                    {days}
                </div>
            </div>
        );
    };

    const handleApplySuggestion = () => {
        const date = suggestedDateData.rangeStart;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setEtaDate(`${year}-${month}-${day}`);
        setShowCalendar(false);
    };

    // --- Dynamic Theme Styles based on Logistics Type & Method ---
    const getThemeStyles = () => {
        // 1. Fleet Logic
        if (logisticsType === 'fleet') {
            return {
                headerBorder: 'border-purple-900/30',
                headerBg: 'bg-purple-900/10',
                iconBg: 'bg-purple-900/20 text-purple-400',
                textLabel: 'text-purple-300',
                textValue: 'text-purple-100',
                inputBorder: 'border-purple-400/30 focus:border-purple-400',
                badge: 'bg-purple-500',
                label: 'Flota Propia',
                icon: 'directions_car'
            };
        }
        
        // 2. Pickup Logic
        if (logisticsType === 'pickup') {
             return {
                headerBorder: 'border-emerald-900/30',
                headerBg: 'bg-emerald-900/10',
                iconBg: 'bg-emerald-900/20 text-emerald-400',
                textLabel: 'text-emerald-300',
                textValue: 'text-emerald-100',
                inputBorder: 'border-emerald-400/30 focus:border-emerald-400',
                badge: 'bg-emerald-500',
                label: 'Pickup en Tienda',
                icon: 'storefront'
            };
        }

        // 3. Courier Logic
        const method = (requestedMethod || '').toLowerCase();
        const isExpress = method.includes('express') || method.includes('air') || method.includes('urgent') || method.includes('priority');
        
        if (isExpress) {
            return {
                headerBorder: 'border-orange-500/50',
                headerBg: 'bg-orange-500/10',
                iconBg: 'bg-orange-500/20 text-orange-400',
                textLabel: 'text-orange-300',
                textValue: 'text-orange-100',
                inputBorder: 'border-orange-400/50 focus:border-orange-400',
                badge: 'bg-orange-500',
                label: 'Courier Express',
                icon: 'rocket_launch'
            };
        }
        
        return {
            headerBorder: 'border-blue-900/30',
            headerBg: 'bg-blue-900/10',
            iconBg: 'bg-blue-900/20 text-blue-400',
            textLabel: 'text-blue-300',
            textValue: 'text-blue-100',
            inputBorder: 'border-blue-400/30 focus:border-blue-400',
            badge: 'bg-blue-500',
            label: 'Courier Estándar',
            icon: 'local_shipping'
        };
    };
    
    const theme = getThemeStyles();

    return (
        <div className={`bg-[#1e2024] rounded-2xl shadow-xl border border-gray-800 p-6 h-full flex flex-col justify-between ${readOnly ? 'opacity-90' : ''}`}>
            <div>
                <h3 className="font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-4">
                    <span className="material-icons text-green-500 text-lg">local_shipping</span> 
                    Protocolo de Envío
                </h3>
                
                {/* Metodo Solicitado & Costo Dinámico */}
                <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between transition-colors duration-300 ${theme.headerBorder} ${theme.headerBg}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${theme.iconBg}`}>
                            <span className="material-icons text-xl">
                                {theme.icon}
                            </span>
                        </div>
                        <div>
                            <p className={`text-[10px] font-bold uppercase opacity-70 ${theme.textLabel}`}>MÉTODO DE ENVÍO</p>
                            <p className={`text-sm font-bold ${theme.textValue}`}>
                                {theme.label}
                            </p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <p className={`text-[10px] font-bold uppercase opacity-70 mb-0.5 ${theme.textLabel}`}>COSTO ({logisticsType.toUpperCase()})</p>
                        <div className="flex items-center justify-end gap-1">
                            <span className={`text-xs font-bold opacity-70 ${theme.textLabel}`}>$</span>
                            <input 
                                type="number" 
                                min="0"
                                step="0.01"
                                value={shippingCost}
                                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                                disabled={readOnly || isPickupOrder || restrictToTracking}
                                className={`w-16 bg-transparent border-b text-right font-mono font-bold text-sm outline-none text-white transition-colors p-0 ${theme.inputBorder} ${restrictToTracking ? 'cursor-not-allowed opacity-70' : ''}`}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Selector de Transporte - LOCKED FOR PICKUP ORDERS OR RESTRICTED MODE */}
                    {isPickupOrder ? (
                         <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-xl p-4 mb-6 flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-4 opacity-10">
                                <span className="material-icons text-6xl text-emerald-500">storefront</span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                                <span className="material-icons text-xl text-emerald-500">store</span>
                            </div>
                            <div className="relative z-10">
                                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Protocolo de Retiro</h4>
                                <p className="text-xs text-gray-400 mt-1">Esta orden fue configurada para ser retirada en tienda.</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3 tracking-wider">MEDIO DE TRANSPORTE</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => !readOnly && !restrictToTracking && setLogisticsType('courier')}
                                    disabled={readOnly || restrictToTracking}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${logisticsType === 'courier' ? 'bg-blue-900/20 border-blue-500/50 text-white shadow-lg' : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'} ${restrictToTracking ? 'cursor-not-allowed opacity-70' : ''}`}
                                >
                                    <span className="material-icons text-xl mb-1.5">local_shipping</span>
                                    <span className="text-[11px] font-bold">Courier Externo</span>
                                </button>
                                <button 
                                    onClick={() => !readOnly && !restrictToTracking && setLogisticsType('fleet')}
                                    disabled={readOnly || restrictToTracking}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${logisticsType === 'fleet' ? 'bg-purple-900/20 border-purple-500/50 text-white shadow-lg' : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'} ${restrictToTracking ? 'cursor-not-allowed opacity-70' : ''}`}
                                >
                                    <span className="material-icons text-xl mb-1.5">directions_car</span>
                                    <span className="text-[11px] font-bold">Flota Propia</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Formulario Dinámico: Pickup vs Delivery */}
                    {logisticsType === 'pickup' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                             {/* Pickup Specific Fields */}
                             <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 tracking-wider">DIRECCIÓN DE RECOGIDA</label>
                                <div className="p-3 bg-[#16181c] border border-gray-700 rounded-xl flex gap-3 items-start">
                                    <span className="material-icons text-emerald-500 text-sm mt-0.5">place</span>
                                    <p className="text-xs text-gray-300 font-medium leading-relaxed">
                                        {pickupAddress || 'Dirección del proveedor no disponible.'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 tracking-wider">NÚMERO DE REFERENCIA</label>
                                    <input 
                                        type="text" 
                                        value={pickupReference || ''}
                                        onChange={(e) => setPickupReference && setPickupReference(e.target.value)}
                                        placeholder="Ej: REF-001"
                                        disabled={readOnly || restrictToTracking}
                                        className={`w-full bg-[#16181c] border border-gray-700 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none transition-all placeholder-gray-600 ${restrictToTracking ? 'cursor-not-allowed opacity-70' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 tracking-wider">HORARIO PREVISTO</label>
                                    <input 
                                        type="time" 
                                        value={pickupHours || ''}
                                        onChange={(e) => setPickupHours && setPickupHours(e.target.value)}
                                        disabled={readOnly || restrictToTracking}
                                        className={`w-full bg-[#16181c] border border-gray-700 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none transition-all placeholder-gray-600 ${restrictToTracking ? 'cursor-not-allowed opacity-70' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
                            {/* Standard Delivery Fields */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 tracking-wider">EMPRESA TRANSPORTADORA</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={carrierName}
                                        onChange={(e) => setCarrierName(e.target.value)}
                                        placeholder="Ej: FedEx, DHL, Correos..."
                                        disabled={readOnly || logisticsType === 'fleet' || restrictToTracking}
                                        className={`w-full bg-[#16181c] border rounded-xl p-3.5 pl-10 text-sm text-white outline-none transition-all placeholder-gray-600
                                            ${logisticsType === 'fleet' || restrictToTracking
                                                ? 'border-purple-500/30 text-purple-300 bg-purple-900/10 cursor-not-allowed font-bold' 
                                                : 'border-gray-700 focus:border-blue-500'}`}
                                    />
                                    <span className={`material-icons absolute left-3 top-1/2 -translate-y-1/2 text-sm ${logisticsType === 'fleet' ? 'text-purple-500' : 'text-gray-500'}`}>
                                        {logisticsType === 'fleet' ? 'lock' : 'business'}
                                    </span>
                                </div>
                            </div>
                            
                            {logisticsType === 'fleet' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 tracking-wider">NÚMERO DE GUÍA / RASTREO</label>
                                        <input 
                                            type="text" 
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="Ej: INT-999..."
                                            disabled={readOnly}
                                            className="w-full bg-[#16181c] border border-gray-700 rounded-xl p-3.5 text-sm text-white focus:border-purple-500 outline-none transition-all placeholder-gray-600 font-mono"
                                        />
                                    </div>
                                    <div>
                                         <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 tracking-wider">TELÉFONO DE CONTACTO (OPCIONAL)</label>
                                         <input 
                                             type="tel"
                                             value={driverPhone || ''}
                                             onChange={(e) => setDriverPhone && setDriverPhone(formatPhoneNumber(e.target.value))}
                                             placeholder="(555) 000-0000"
                                             disabled={readOnly}
                                             maxLength={14}
                                             className="w-full bg-[#16181c] border border-gray-700 rounded-xl p-3.5 text-sm text-white focus:border-purple-500 outline-none transition-all placeholder-gray-600"
                                         />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 tracking-wider">NÚMERO DE GUÍA / RASTREO</label>
                                    <input 
                                        type="text" 
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="Ej: 1Z999..."
                                        disabled={readOnly}
                                        className="w-full bg-[#16181c] border border-gray-700 rounded-xl p-3.5 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder-gray-600 font-mono"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Common Date Picker */}
                    <div className="relative pt-2" ref={calendarRef}>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 tracking-wider">
                            {logisticsType === 'pickup' ? 'FECHA DE RETIRO ESTIMADA' : 'FECHA ESTIMADA ENTREGA (ETA)'}
                        </label>
                        
                        <div 
                            onClick={() => !readOnly && setShowCalendar(!showCalendar)}
                            className={`w-full bg-[#16181c] border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${showCalendar ? 'border-green-500 ring-1 ring-green-500/20' : 'border-gray-700 hover:border-gray-600'}`}
                        >
                            <span className={`text-sm font-bold ${displayValue ? 'text-white' : 'text-gray-600'}`}>
                                {displayValue || 'Seleccionar fecha...'}
                            </span>
                            <span className="material-icons text-gray-400 text-lg">event</span>
                        </div>

                        {/* Dropdown Calendar */}
                        {showCalendar && (
                            <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1A1D21] border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-bottom">
                                {/* Smart Suggestion Chip */}
                                <div className="bg-green-900/20 p-2 border-b border-gray-700">
                                    <button 
                                        onClick={handleApplySuggestion}
                                        className="w-full flex items-center justify-between bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg p-2 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons text-green-400 text-sm">auto_awesome</span>
                                            <div className="text-left">
                                                <p className="text-[10px] text-green-300 font-bold uppercase">SUGERENCIA INTELIGENTE</p>
                                                <p className="text-[10px] text-gray-400">Entrega Estimada (+{suggestedDateData.minDays}-{suggestedDateData.maxDays}d)</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-white group-hover:text-green-300 transition-colors">
                                            {suggestedDateData.displayRange}
                                        </span>
                                    </button>
                                </div>
                                
                                {renderCalendar()}
                                
                                <div className="bg-[#16181c] p-2 border-t border-gray-800 flex justify-center">
                                    <button 
                                        onClick={() => { setViewDate(new Date()); }}
                                        className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase"
                                    >
                                        IR A HOY
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-800 mt-6">
                {!readOnly && (
                    <div className="relative group w-full">
                        <button 
                            onClick={onConfirmOrder}
                            disabled={!isValidToSubmit}
                            className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 transform
                                ${isValidToSubmit 
                                    ? 'bg-primary hover:bg-green-700 text-white shadow-primary/20 hover:-translate-y-1' 
                                    : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700 opacity-50'}
                            `}
                        >
                            <span className="material-icons text-sm">
                                {logisticsType === 'pickup' ? 'storefront' : 'local_shipping'}
                            </span>
                            {logisticsType === 'pickup' ? 'Confirmar Retiro' : 'Confirmar & Despachar'}
                        </button>
                        
                        {!isValidToSubmit && missingFields.length > 0 && (
                             <div className="absolute bottom-full left-0 w-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                 <div className="bg-[#1A1D21] border border-red-500/30 rounded-xl p-4 shadow-2xl text-left transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                     <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                                         <span className="material-icons text-red-500 text-sm">error_outline</span>
                                         <span className="text-xs font-bold text-red-400 uppercase tracking-widest">ACCIONES PENDIENTES</span>
                                     </div>
                                     <ul className="space-y-1.5">
                                         {missingFields.map((field, i) => (
                                             <li key={i} className="text-[11px] text-gray-300 flex items-start gap-2">
                                                 <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                                                 {field}
                                             </li>
                                         ))}
                                     </ul>
                                     <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1A1D21] border-b border-r border-red-500/30 transform rotate-45"></div>
                                 </div>
                             </div>
                        )}
                    </div>
                )}

                <button 
                    onClick={onExit}
                    className="w-full py-3.5 bg-[#16181c] border border-gray-700 text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-800 hover:text-white transition-colors"
                >
                    {readOnly ? 'Salir / Volver' : 'Rechazar / Cancelar Orden'}
                </button>
            </div>
        </div>
    );
};

export default PortalLogistics;