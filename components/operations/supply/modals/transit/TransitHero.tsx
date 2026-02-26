
import React from 'react';
import { TransitStatus } from '../../../../../hooks/useTransitLogic';

interface TransitHeroProps {
    status: TransitStatus;
    label: string;
    diffDays: number;
    etaDate: Date;
    departureDate: Date;
    orderDate: Date;
    progress: number;
    onUpdateEta: () => void;
    // onOpenReception removed
    isPickup: boolean;
    serviceLevel: string;
}

export const TransitHero: React.FC<TransitHeroProps> = ({ 
    status, label, diffDays, etaDate, departureDate, progress, onUpdateEta, serviceLevel 
}) => {
    return (
        <div className="relative rounded-2xl overflow-hidden p-5 text-white shadow-lg shrink-0 group h-full flex flex-col justify-center">
            {/* Background compacto */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-800"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-32 pointer-events-none"></div>

            {/* Content Flex Row */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left: Status & Title */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/10">
                            {serviceLevel}
                        </span>
                        {diffDays < 0 && <span className="bg-red-500/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase animate-pulse">Retrasado</span>}
                    </div>
                    <div className="flex items-end gap-3">
                        <h1 className="text-2xl font-display font-bold leading-none tracking-tight">
                            {label}
                        </h1>
                        <span className="text-3xl font-display font-bold text-blue-200 opacity-50 mb-0.5">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>

                {/* Center: Dates & Progress */}
                <div className="flex-1 w-full md:max-w-xs">
                    <div className="flex justify-between text-[10px] font-medium text-blue-100 mb-1.5 uppercase tracking-wide">
                        <span>Salida: {departureDate.toLocaleDateString('es-ES', {day: 'numeric', month: 'short'})}</span>
                        <span className="font-bold text-white flex items-center gap-1">
                             ETA: {etaDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                             <button onClick={onUpdateEta} className="hover:text-blue-300"><span className="material-icons text-[10px]">edit</span></button>
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] relative transition-all duration-1000" style={{ width: `${Math.max(5, progress)}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
