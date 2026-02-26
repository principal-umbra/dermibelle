
import React from 'react';

interface CatalogPaginationProps {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    setItemsPerPage: (val: number) => void;
    paginate: (page: number) => void;
    totalItems: number;
    indexOfFirstItem: number;
    indexOfLastItem: number;
}

const CatalogPagination: React.FC<CatalogPaginationProps> = ({
    currentPage, totalPages, itemsPerPage, setItemsPerPage, paginate, totalItems, indexOfFirstItem, indexOfLastItem
}) => {
    
    if (totalItems === 0) return null;

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 bg-[#F3F4F6] dark:bg-background-dark">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-gray-500 dark:text-gray-400 w-full md:w-auto justify-between md:justify-start">
                <span className="whitespace-nowrap bg-white dark:bg-surface-dark px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    Viendo <span className="font-bold text-gray-900 dark:text-white">{totalItems > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, totalItems)}</span> de <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span> items
                </span>

                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline font-medium">Mostrar</span>
                    <div className="relative">
                        <select 
                            value={itemsPerPage} 
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="appearance-none bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded-lg focus:ring-primary focus:border-primary block pl-3 pr-8 py-1.5 font-bold cursor-pointer transition-colors hover:border-primary/50 shadow-sm"
                        >
                            <option value={8}>8</option>
                            <option value={12}>12</option>
                            <option value={24}>24</option>
                            <option value={48}>48</option>
                            <option value={96}>96</option>
                        </select>
                        <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[14px] text-gray-400 pointer-events-none">expand_more</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-surface-dark p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <button 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:text-primary"
                >
                    <span className="material-icons text-sm">chevron_left</span>
                </button>
                
                <div className="hidden sm:flex gap-1">
                    {getPageNumbers().map((page, idx) => (
                        typeof page === 'number' ? (
                            <button
                                key={idx}
                                onClick={() => paginate(page)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all
                                    ${currentPage === page 
                                        ? 'bg-primary text-white shadow-md' 
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                {page}
                            </button>
                        ) : (
                            <span key={idx} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs tracking-widest">...</span>
                        )
                    ))}
                </div>

                <button 
                    onClick={() => paginate(currentPage + 1)} 
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:text-primary"
                >
                    <span className="material-icons text-sm">chevron_right</span>
                </button>
            </div>
        </div>
    );
};

export default CatalogPagination;
