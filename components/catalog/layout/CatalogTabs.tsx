
import React from 'react';

interface CatalogTabsProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    counts: {
        services: number;
        retail: number;
        consumables: number;
        damaged: number;
    };
}

const CatalogTabs: React.FC<CatalogTabsProps> = ({ activeTab, setActiveTab, counts }) => {
    
    const getTabClass = (tabName: string, colorClass: string) => {
        const isActive = activeTab === tabName;
        return `pb-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${isActive ? `border-${colorClass}-500 text-${colorClass}-600 dark:text-${colorClass}-400` : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`;
    };

    return (
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('services')} className={getTabClass('services', 'purple')}>
                <span className="material-icons text-lg">spa</span> Menú de Servicios 
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{counts.services}</span>
            </button>
            <button onClick={() => setActiveTab('retail')} className={getTabClass('retail', 'orange')}>
                <span className="material-icons text-lg">storefront</span> Boutique (Retail) 
                <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{counts.retail}</span>
            </button>
            <button onClick={() => setActiveTab('consumables')} className={getTabClass('consumables', 'blue')}>
                <span className="material-icons text-lg">science</span> Cabina (Stock) 
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{counts.consumables}</span>
            </button>
            <button onClick={() => setActiveTab('open_products')} className={getTabClass('open_products', 'teal')}>
                <span className="material-icons text-lg">timelapse</span> Producto Abierto
            </button>
            <button onClick={() => setActiveTab('operations')} className={getTabClass('operations', 'indigo')}>
                <span className="material-icons text-lg">pending_actions</span> En Operación
            </button>
            <button onClick={() => setActiveTab('damaged')} className={getTabClass('damaged', 'red')}>
                <span className="material-icons text-lg">report_problem</span> Vencidos/Dañados
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-1 ${counts.damaged > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{counts.damaged}</span>
            </button>
        </div>
    );
};

export default CatalogTabs;
