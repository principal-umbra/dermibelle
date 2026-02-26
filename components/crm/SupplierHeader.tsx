
import React from 'react';
import { Supplier } from '../../context/DataContext';

interface SupplierStats {
    totalSpend: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    lastOrderDate: string;
    nextDeliveryDate: string;
    nextDeliveryStatus: string;
    activityStatus: string;
    activityColor: string;
}

interface SupplierHeaderProps {
    supplier: Supplier;
    stats: SupplierStats;
    isEditing: boolean;
    editFormData: Partial<Supplier>;
    setEditFormData: (data: Partial<Supplier>) => void;
    onCopy: (text: string, label: string) => void;
}

const SUPPLIER_CATEGORIES = [
    'General',
    'Skincare',
    'Cabello',
    'Equipamiento',
    'Insumos',
    'Servicios',
    'Laboratorio',
    'Mobiliario'
];

interface StatItemProps {
    label: string;
    value: React.ReactNode;
    subtext?: string;
    dotColor?: string;
    isPill?: boolean;
    pillClass?: string;
    tooltip?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, subtext, dotColor, isPill = false, pillClass = '', tooltip }) => {
    return (
        <div className="flex flex-col justify-center px-4 border-r border-gray-100 dark:border-gray-700/50 last:border-0 h-full py-2 flex-1 min-w-[110px] group relative cursor-help hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all hover:z-50">
            
            {/* TOOLTIP */}
            {tooltip && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max max-w-[180px] flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[100] transform origin-top scale-95 group-hover:scale-100">
                    <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-primary"></div>
                    <div className="bg-primary text-white text-[10px] font-medium px-3 py-2 rounded-lg shadow-xl shadow-primary/30 tracking-wide text-center leading-snug border border-primary">
                        {tooltip}
                    </div>
                </div>
            )}

            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 truncate group-hover:text-primary transition-colors text-center block">{label}</span>
            
            {isPill ? (
                <div className="mt-0.5 flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${pillClass}`}>
                        {value}
                    </span>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center">
                    <div className="text-lg font-display font-bold text-gray-800 dark:text-white leading-none tracking-tight truncate w-full flex justify-center">
                        {value}
                    </div>
                    
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

const SupplierHeader: React.FC<SupplierHeaderProps> = ({ 
    supplier, stats, isEditing, editFormData, setEditFormData, onCopy 
}) => {
    
    const renderCategoryValue = () => {
        if (isEditing) {
            return (
                <div className="relative group/select inline-block">
                    <select
                        value={editFormData.category || supplier.category || 'General'}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                        className="appearance-none bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white text-[11px] font-bold rounded-lg pl-3 pr-6 py-1 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm text-center min-w-[100px]"
                    >
                        {SUPPLIER_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <span className="material-icons text-[14px] text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none group-hover/select:text-primary transition-colors">expand_more</span>
                </div>
            );
        }
        return supplier.category || 'General';
    };

    return (
        <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] shadow-sm shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 relative z-30">
            <div className="flex flex-col xl:flex-row h-auto xl:h-24">
                
                {/* LEFT: Identity */}
                <div className="p-6 flex items-center gap-5 border-b xl:border-b-0 xl:border-r border-gray-100 dark:border-gray-700/50 relative bg-gray-50/30 dark:bg-white/5 shrink-0 z-10">
                    <div className="relative shrink-0">
                        {supplier.logo ? (
                            <img src={supplier.logo} alt={supplier.companyName} className="w-16 h-16 rounded-xl object-cover shadow-sm ring-4 ring-white dark:ring-surface-dark"/>
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-gray-800 dark:bg-gray-700 flex items-center justify-center text-xl font-display font-bold text-white shadow-sm ring-4 ring-white dark:ring-surface-dark">
                                {supplier.initials}
                            </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center shadow-sm ${supplier.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}>
                            <span className="material-icons text-[10px] text-white">business</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center min-w-0 max-w-[180px] sm:max-w-[250px] md:max-w-[300px] xl:max-w-[350px]">
                        {isEditing ? (
                            <input 
                                value={editFormData.companyName || ''}
                                onChange={e => setEditFormData({...editFormData, companyName: e.target.value})}
                                className="font-display text-2xl md:text-3xl font-bold bg-white border-b border-primary/50 w-full outline-none text-gray-900 px-1 py-0.5"
                                placeholder="Nombre Empresa"
                            />
                        ) : (
                            <h1 
                                className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate leading-tight tracking-tight"
                                title={supplier.companyName}
                            >
                                {supplier.companyName}
                            </h1>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <button
                                onClick={() => onCopy(supplier.id, 'ID')}
                                className="bg-white dark:bg-white/10 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-gray-200 dark:border-gray-700 shadow-sm hover:text-primary hover:border-primary transition-colors cursor-pointer shrink-0"
                                title="Copiar ID"
                            >
                                {supplier.id}
                            </button>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide border-l border-gray-300 pl-2 shrink-0 truncate">
                                Contacto: {supplier.contactPerson}
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Stats */}
                <div className="flex-1 overflow-x-auto xl:overflow-visible no-scrollbar bg-white dark:bg-surface-dark w-full z-0 relative">
                    <div className="flex items-center h-full w-full min-w-max">
                        <StatItem 
                            label="GASTO TOTAL" 
                            value={`$${stats.totalSpend.toLocaleString()}`} 
                            subtext="Inversión Histórica" 
                            dotColor="bg-emerald-500" 
                            tooltip="Monto total acumulado de compras a este proveedor." 
                        />
                        <StatItem 
                            label="COMPLETADOS" 
                            value={stats.completedOrders} 
                            subtext="Pedidos Recibidos" 
                            dotColor="bg-blue-500" 
                            tooltip="Total de órdenes finalizadas y recibidas correctamente." 
                        />
                        <StatItem 
                            label="EN TRÁNSITO" 
                            value={stats.pendingOrders} 
                            subtext="Por Recibir" 
                            dotColor="bg-orange-500" 
                            tooltip="Órdenes emitidas pendientes de recepción." 
                        />
                        <StatItem 
                            label="ÚLTIMA ENTREGA" 
                            value={stats.lastOrderDate} 
                            subtext="Fecha Recepción" 
                            dotColor="bg-purple-500" 
                            tooltip="Fecha de la última mercancía recibida." 
                        />
                        <StatItem 
                            label="CATEGORÍA" 
                            value={renderCategoryValue()}
                            isPill={!isEditing} 
                            pillClass="bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" 
                            tooltip="Clasificación principal del proveedor." 
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SupplierHeader;
