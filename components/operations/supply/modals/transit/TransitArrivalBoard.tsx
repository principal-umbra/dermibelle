
import React from 'react';
import { TransitStatus } from '../../../../../hooks/useTransitLogic';

interface TransitArrivalBoardProps {
    status: TransitStatus;
    eta: Date;
    daysLeft: number;
    carrier: string;
    tracking: string;
    onReportDelay: () => void;
}

export const TransitArrivalBoard: React.FC<TransitArrivalBoardProps> = ({ 
    status, eta, daysLeft, carrier, tracking, onReportDelay 
}) => {
    const isLate = daysLeft < 0;
    const isToday = daysLeft === 0;

    return (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-[1.5rem] p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-white/10 transition-colors duration-1000"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isLate ? 'bg-red-500/20 text-red-200 border-red-500/30' : 'bg-green-500/20 text-green-200 border-green-500/30'}`}>
                            {isLate ? 'Retrasado' : isToday ? 'Llega Hoy' : 'En Tiempo'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono tracking-wider">{carrier}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight">
                        {isLate ? `Retraso de ${Math.abs(daysLeft)} días` : isToday ? 'Arribo Programado' : `Llega en ${daysLeft} días`}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        ETA: {eta.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Visual Progress Circle */}
                    <div className="relative w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-700" />
                            <circle 
                                cx="50%" cy="50%" r="45%" 
                                stroke="currentColor" strokeWidth="4" fill="transparent" 
                                strokeDasharray={100} 
                                strokeDashoffset={isLate ? 0 : 100 - (100 - (daysLeft * 10))} // Simple logic for visual
                                strokeLinecap="round" 
                                className={isLate ? 'text-red-500' : 'text-green-500'} 
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-icons text-xl text-gray-300">{isLate ? 'warning' : 'local_shipping'}</span>
                        </div>
                    </div>

                    <button 
                        onClick={onReportDelay}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                    >
                        Reportar Problema
                    </button>
                </div>
            </div>
        </div>
    );
};
