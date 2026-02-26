
import React from 'react';

interface ServiceSchedulingProps {
    duration: number;
    setDuration: (val: number) => void;
    bufferTime: number;
    setBufferTime: (val: number) => void;
    price: number;
    targetHourlyRate: number;
}

const TimeInput = ({ label, value, onChange, step = 5, min = 0, icon }: any) => (
    <div className="flex flex-col justify-between bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-700 p-2 relative group hover:border-gray-300 transition-colors h-full">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <span className="material-icons text-[10px] text-gray-400">{icon}</span> {label}
        </span>
        <div className="flex items-center justify-between mt-0.5">
            <button 
                onClick={() => onChange(Math.max(min, value - step))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white dark:hover:bg-black/20 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <span className="material-icons text-[10px]">remove</span>
            </button>
            <span className="text-xs font-bold text-gray-800 dark:text-white font-mono min-w-[24px] text-center leading-none">
                {value}<span className="text-[8px] font-normal text-gray-400 ml-0.5">m</span>
            </span>
            <button 
                onClick={() => onChange(value + step)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white dark:hover:bg-black/20 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <span className="material-icons text-[10px]">add</span>
            </button>
        </div>
    </div>
);

const ServiceScheduling: React.FC<ServiceSchedulingProps> = ({
    duration, setDuration, bufferTime, setBufferTime, price, targetHourlyRate
}) => {
    
    // Calculate Time Cost based on Base Hourly Rate
    const costPerMinute = targetHourlyRate > 0 ? (targetHourlyRate / 60) : 0;
    const timeCost = costPerMinute * duration;
    
    // Style - Using Blue/Neutral as this is an informational cost calculation
    const colorClass = 'text-blue-600 dark:text-blue-400';
    const bgClass = 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30';
    const labelColor = 'text-blue-700 dark:text-blue-300';

    return (
        <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center gap-4">
            
            {/* Title & Icon */}
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 pl-1">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                    <span className="material-icons text-lg">schedule</span>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide leading-tight">Logística</h4>
                    <p className="text-[9px] text-gray-500 leading-tight">Tiempos y costos.</p>
                </div>
            </div>

            {/* Controls Container - Balanced Grid */}
            <div className="flex-1 w-full grid grid-cols-3 gap-2 items-stretch h-[56px]">
                
                {/* Duration */}
                <TimeInput 
                    label="Duración" 
                    value={duration} 
                    onChange={setDuration} 
                    step={15} 
                    min={15}
                    icon="hourglass_top"
                />

                {/* Buffer */}
                <TimeInput 
                    label="Recuperación" 
                    value={bufferTime} 
                    onChange={setBufferTime} 
                    step={5} 
                    min={0}
                    icon="cleaning_services"
                />

                {/* Time Cost Indicator */}
                <div className={`flex flex-col justify-between rounded-xl border p-2 relative group transition-colors h-full ${bgClass}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${labelColor}`}>
                        <span className="material-icons text-[10px]">timer</span> Costo Tiempo
                    </span>
                    <div className="flex items-end justify-between mt-0.5">
                         <span className={`text-sm font-mono font-bold leading-none ${colorClass}`}>
                            ${timeCost.toFixed(2)}
                        </span>
                        <span className="text-[7px] font-bold px-1 py-0.5 rounded border flex items-center bg-white dark:bg-white/10 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600">
                             Base: ${targetHourlyRate}/h
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ServiceScheduling;
