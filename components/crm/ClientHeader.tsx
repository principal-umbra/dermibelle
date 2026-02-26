
import React from 'react';
import { Client } from '../../context/DataContext';

interface ClientStats {
    totalRevenue: number;
    servicesRevenue: number;
    productsRevenue: number;
    transitRevenue: number;
    lastVisitValue: string | null;
    lastVisitSubtext: string | null;
    nextVisitValue: string | null;
    nextVisitSubtext: string | null;
    activityStatus: string;
    activityColor: string;
    activityIcon: string;
}

interface ClientHeaderProps {
    client: Client;
    stats: ClientStats;
    isEditing: boolean;
    editFormData: Partial<Client>;
    setEditFormData: (data: Partial<Client>) => void;
    onCopy: (text: string, label: string) => void;
}

const StatItem = ({ label, value, subtext, dotColor, isPill = false, pillClass = '', pillIcon = '', tooltip }: any) => {
    return (
        <div className="flex flex-col justify-center px-4 border-r border-gray-100 dark:border-gray-700/50 last:border-0 h-full py-2 flex-1 min-w-[110px] group relative cursor-help hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all hover:z-50">
            
            {/* TOOLTIP: Green Bubble Below Label (Arrow Up) - Strictly Centered */}
            {tooltip && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max max-w-[180px] flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[100] transform origin-top scale-95 group-hover:scale-100">
                    {/* Upward pointing arrow */}
                    <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-primary"></div>
                    {/* Bubble content */}
                    <div className="bg-primary text-white text-[10px] font-medium px-3 py-2 rounded-lg shadow-xl shadow-primary/30 tracking-wide text-center leading-snug border border-primary">
                        {tooltip}
                    </div>
                </div>
            )}

            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 truncate group-hover:text-primary transition-colors text-center block">{label}</span>
            
            {isPill ? (
                <div className="mt-0.5 flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${pillClass}`}>
                        {pillIcon && <span className="material-icons text-[12px]">{pillIcon}</span>}
                        {value}
                    </span>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center">
                    <span className="text-lg font-display font-bold text-gray-800 dark:text-white leading-none tracking-tight truncate">
                        {value}
                    </span>
                    {subtext && (
                        <div className="flex items-center gap-1.5 mt-1">
                            {dotColor && <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}></div>}
                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate">{subtext}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ClientHeader: React.FC<ClientHeaderProps> = ({ 
    client, stats, isEditing, editFormData, setEditFormData, onCopy 
}) => {
    // Helper to render stats
    const renderStats = () => {
        const items = [
            { label: "TOTAL PAGADO", value: `$${stats.totalRevenue.toLocaleString()}`, subtext: "Ingresos Totales", dotColor: "bg-emerald-500", tooltip: "Total histórico acumulado de facturas pagadas." },
            { label: "SERVICIOS", value: `$${stats.servicesRevenue.toLocaleString()}`, subtext: "Ingresos Serv.", dotColor: "bg-purple-500", tooltip: "Ingresos generados únicamente por servicios." },
            { label: "PRODUCTOS", value: `$${stats.productsRevenue.toLocaleString()}`, subtext: "Ingresos Prod.", dotColor: "bg-blue-500", tooltip: "Ingresos generados por venta de productos." },
            { label: "POR CONFIRMAR", value: `$${stats.transitRevenue.toLocaleString()}`, subtext: "En Tránsito", dotColor: "bg-orange-500", tooltip: "Total de pagos por transferencia reportados pendientes de validación." },
            { label: "ÚLTIMA VISITA", value: stats.lastVisitValue || '--', subtext: stats.lastVisitSubtext || 'Sin registro', dotColor: "bg-gray-400", tooltip: "Fecha de la última cita completada." },
            { label: "PRÓXIMA CITA", value: stats.nextVisitValue || '--', subtext: stats.nextVisitSubtext || 'No programada', dotColor: "bg-indigo-500", tooltip: "Fecha programada para la siguiente sesión." },
            { label: "NIVEL ACTIVIDAD", value: stats.activityStatus, isPill: true, pillClass: stats.activityColor, pillIcon: stats.activityIcon, tooltip: "Estado calculado según frecuencia de visitas." }
        ];

        return items.map((item, idx) => (
            <StatItem 
                key={idx}
                {...item}
            />
        ));
    };

    return (
        <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] shadow-sm shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 relative z-30">
            {/* Increased z-index to 30 to sit above content below. 
                Changed stats container to overflow-visible on XL to prevent tooltip clipping. */}
            <div className="flex flex-col xl:flex-row h-auto xl:h-24">
                
                {/* LEFT: Profile Identity Only (Expanded Name) - Lower z-index sibling */}
                <div className="p-6 flex items-center gap-5 border-b xl:border-b-0 xl:border-r border-gray-100 dark:border-gray-700/50 relative bg-gray-50/30 dark:bg-white/5 shrink-0 z-10">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        {client.avatar ? (
                            <img src={client.avatar} alt={client.name} className="w-16 h-16 rounded-full object-cover shadow-sm ring-4 ring-white dark:ring-surface-dark"/>
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xl font-display font-bold text-gray-500 shadow-sm ring-4 ring-white dark:ring-surface-dark">
                                {client.initials}
                            </div>
                        )}
                        <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center shadow-sm ${client.status === 'Recurring' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                            <span className="material-icons text-[10px] text-white">star</span>
                        </div>
                    </div>

                    {/* Name & ID */}
                    <div className="flex flex-col justify-center min-w-0 max-w-[180px] sm:max-w-[250px] md:max-w-[300px] xl:max-w-[350px]">
                        {isEditing ? (
                            <input 
                                value={editFormData.name || ''}
                                onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                                className="font-display text-2xl md:text-3xl font-bold bg-white border-b border-primary/50 w-full outline-none text-gray-900 px-1 py-0.5"
                                placeholder="Nombre del Cliente"
                            />
                        ) : (
                            <h1 
                                className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate leading-tight tracking-tight"
                                title={client.name}
                            >
                                {client.name}
                            </h1>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <button
                                onClick={() => onCopy(client.id, 'ID')}
                                className="bg-white dark:bg-white/10 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-gray-200 dark:border-gray-700 shadow-sm hover:text-primary hover:border-primary transition-colors cursor-pointer shrink-0"
                                title="Copiar ID"
                            >
                                {client.id}
                            </button>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide border-l border-gray-300 pl-2 shrink-0">
                                {client.status === 'Recurring' ? 'HABITUAL' : 'NUEVO'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Stats Strip (Distributed Evenly) - Higher z-index sibling. 
                    CRITICAL FIX: overflow-visible on XL allows tooltips to 'escape' the container box downward. */}
                <div className="flex-1 overflow-x-auto xl:overflow-visible no-scrollbar bg-white dark:bg-surface-dark w-full z-0 relative">
                    <div className="flex items-center h-full w-full min-w-max">
                        {renderStats()}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ClientHeader;
