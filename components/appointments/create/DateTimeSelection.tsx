
import React, { useMemo, useState } from 'react';
import { TIME_SLOTS, SPECIALISTS } from '../../../hooks/useCreateAppointment';

interface DateTimeSelectionProps {
    date: string;
    time: string;
    specialist: string;
    updateForm: (updates: any) => void;
    viewDate: Date;
    setViewDate: (d: Date) => void;
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const parseTimeSlot = (timeStr: string) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    if (!time || !modifier) return 0;
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;
    if (modifier === 'AM' && hours === 0) hours = 24;
    return hours * 60 + minutes;
};

const DateTimeSelection: React.FC<DateTimeSelectionProps> = ({ 
    date, time, specialist, updateForm, viewDate, setViewDate 
}) => {
    const [showTimeOptions, setShowTimeOptions] = useState(false);

    const availableTimeSlots = useMemo(() => {
        if (!date) return TIME_SLOTS;
        const now = new Date();
        const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        if (date === todayFormatted) {
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            return TIME_SLOTS.filter(slot => parseTimeSlot(slot) > currentMinutes);
        }
        return TIME_SLOTS;
    }, [date]);

    // Calendar Render
    const renderCalendar = () => {
        const year = viewDate.getFullYear(); const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month); const firstDay = getFirstDayOfMonth(year, month);
        const days = []; const today = new Date(); today.setHours(0, 0, 0, 0); 
        const [selY, selM, selD] = date.split('-').map(Number);
        
        for (let i = 0; i < firstDay; i++) { days.push(<div key={`empty-${i}`} className="h-6 w-6"></div>); }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dateCheck = new Date(year, month, i); 
            const isPast = dateCheck < today; 
            const isSelected = selD === i && selM === month + 1 && selY === year;
            
            const handleDateSelect = () => { 
                const year = dateCheck.getFullYear();
                const month = String(dateCheck.getMonth() + 1).padStart(2, '0');
                const dayStr = String(dateCheck.getDate()).padStart(2, '0');
                updateForm({ date: `${year}-${month}-${dayStr}` });
            };

            days.push(
                <button key={i} disabled={isPast} onClick={() => !isPast && handleDateSelect()} className={`h-6 w-6 flex items-center justify-center rounded-full text-[10px] font-bold transition-all ${isSelected ? 'bg-primary text-white shadow-md scale-110' : isPast ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-white/5' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-primary'}`}>
                    {i}
                </button>
            );
        }
        return days;
    };

    const changeMonth = (offset: number) => { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1)); };

    return (
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-3 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 flex items-center justify-center text-xs font-bold">2</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Fecha y Hora</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase text-gray-500">{viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
                        <div className="flex gap-1">
                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500"><span className="material-icons text-sm block">chevron_left</span></button>
                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500"><span className="material-icons text-sm block">chevron_right</span></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">{['D','L','M','M','J','V','S'].map((d, i) => <span key={i} className="text-[9px] font-bold text-gray-400">{d}</span>)}</div>
                    <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                </div>
                <div className="w-full md:w-40 flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">HORA INICIO</label>
                        <div className="relative group/time">
                            <input type="text" value={time} onChange={e => updateForm({ time: e.target.value })} disabled={availableTimeSlots.length === 0} className={`w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-3 pr-10 text-xs font-bold text-gray-800 dark:text-white outline-none focus:border-primary transition-colors ${availableTimeSlots.length === 0 ? 'text-gray-400 cursor-not-allowed' : ''}`} placeholder="00:00 AM" />
                            <button type="button" onClick={() => availableTimeSlots.length > 0 && setShowTimeOptions(!showTimeOptions)} className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all flex items-center justify-center outline-none ${showTimeOptions ? 'text-primary bg-primary/20 ring-2 ring-primary/30 shadow-inner' : availableTimeSlots.length > 0 ? 'text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30' : 'text-gray-300 dark:text-gray-600'} ${availableTimeSlots.length === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer shadow-sm hover:scale-105 active:scale-95'}`} title="Ver horarios disponibles"><span className="material-icons text-lg">schedule</span></button>
                            {showTimeOptions && (<div className="absolute top-full right-0 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 custom-scrollbar animate-in fade-in zoom-in-95 duration-150">{availableTimeSlots.map(t => (<button key={t} type="button" onClick={() => { updateForm({ time: t }); setShowTimeOptions(false); }} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-primary/5 hover:text-primary dark:hover:bg-white/10 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">{t}</button>))}</div>)}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">ESPECIALISTA</label>
                        <div className="relative">
                            <select value={specialist} onChange={e => updateForm({ specialist: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-2 pr-6 text-xs font-bold text-gray-800 dark:text-white outline-none focus:border-primary appearance-none cursor-pointer">{SPECIALISTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                            <span className="material-icons text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-sm pointer-events-none">expand_more</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DateTimeSelection;
