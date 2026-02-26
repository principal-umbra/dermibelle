
import React from 'react';

interface CatalogFiltersProps {
    show: boolean;
    activeTab: string;
    sortBy: string;
    setSortBy: (val: any) => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (val: 'asc' | 'desc') => void;
    selectedCategory: string;
    setSelectedCategory: (cat: string) => void;
    categories: string[];
}

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
    show, activeTab, sortBy, setSortBy, sortOrder, setSortOrder, selectedCategory, setSelectedCategory, categories
}) => {
    
    if (!show) return null;

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white dark:bg-surface-dark p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-top-2">
            {/* Sort Controls */}
            <div className="flex items-center gap-2 shrink-0 border-r border-gray-100 dark:border-gray-700 pr-4">
                <div className="relative group">
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <option value="title">Nombre</option>
                        <option value="price">Precio</option>
                        {activeTab !== 'services' && <option value="stock">Stock</option>}
                    </select>
                    <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-gray-400 pointer-events-none">sort</span>
                </div>
                <button 
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-primary hover:border-primary/50 transition-all"
                    title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                >
                    <span className="material-icons text-sm transform transition-transform duration-300" style={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)' }}>arrow_upward</span>
                </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade flex-1">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat ? (cat === 'all' ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-black dark:border-white' : 'bg-primary/10 text-primary border-primary/20') : 'bg-white dark:bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    >
                        {cat === 'all' ? 'Todo' : cat}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CatalogFilters;
