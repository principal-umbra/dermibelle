
import React from 'react';

interface CatalogHeaderProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onOpenSettings: () => void;
    onOpenNew: () => void;
    onOpenMenuManager?: () => void; 
    onOpenProductMenuManager?: () => void; // New prop
}

const CatalogHeader: React.FC<CatalogHeaderProps> = ({ 
    searchTerm, 
    onSearchChange, 
    onOpenSettings, 
    onOpenNew,
    onOpenMenuManager,
    onOpenProductMenuManager
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Inventario & Servicios</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión centralizada de catálogo, recetas y stock.</p>
            </div>
            <div className="flex items-center gap-3">
                {/* Product Manager Button */}
                {onOpenProductMenuManager && (
                    <button 
                        onClick={onOpenProductMenuManager}
                        className="p-2.5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-orange-600 hover:border-orange-200 transition-colors shadow-sm flex items-center gap-2 group"
                        title="Gestionar Tienda Online"
                    >
                        <span className="material-icons text-xl group-hover:scale-110 transition-transform">storefront</span>
                        <span className="hidden lg:inline text-xs font-bold">Web Tienda</span>
                    </button>
                )}

                {onOpenMenuManager && (
                    <button 
                        onClick={onOpenMenuManager}
                        className="p-2.5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-purple-600 hover:border-purple-200 transition-colors shadow-sm flex items-center gap-2 group"
                        title="Gestionar Menú Web"
                    >
                        <span className="material-icons text-xl group-hover:scale-110 transition-transform">web</span>
                        <span className="hidden lg:inline text-xs font-bold">Web Menú</span>
                    </button>
                )}
                <button 
                    onClick={onOpenSettings}
                    className="p-2.5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-primary transition-colors shadow-sm"
                    title="Configuración de Inventario"
                >
                    <span className="material-icons text-xl">settings</span>
                </button>
                <div className="relative">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                    <input 
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 pr-4 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm w-full md:w-64"
                        placeholder="Buscar item..."
                    />
                </div>
                <button 
                    onClick={onOpenNew}
                    className="bg-primary hover:bg-green-800 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 font-bold text-sm shrink-0"
                >
                    <span className="material-icons text-sm">add</span>
                    Nuevo
                </button>
            </div>
        </div>
    );
};

export default CatalogHeader;
