
import React from 'react';
import ItemCard from './ItemCard';
import { AppointmentItem, OpenStockItem } from '../../../context/DataContext';
import { checkItemAvailability } from '../../../hooks/useCreateAppointment';

interface CatalogSelectionProps {
    catalog: AppointmentItem[];
    openStock?: OpenStockItem[];
    searchResults: AppointmentItem[] | null;
    topLists: { services: any[], products: any[] };
    catalogFilter: string;
    setCatalogFilter: (val: string) => void;
    handleAddItem: (item: AppointmentItem) => void;
}

const CatalogSelection: React.FC<CatalogSelectionProps> = ({
    catalog, openStock, searchResults, topLists, catalogFilter, setCatalogFilter, handleAddItem
}) => {
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold">3</span>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Catálogo</h3>
                    </div>
                    <span className="text-[9px] font-bold bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-full text-gray-400 border border-gray-200 dark:border-gray-700">
                        {searchResults ? searchResults.length : catalog.length}
                    </span>
                </div>
                <div className="relative group">
                    <span className="material-icons absolute left-2.5 top-2 text-gray-400 text-base group-focus-within:text-primary transition-colors">filter_list</span>
                    <input type="text" value={catalogFilter} onChange={e => setCatalogFilter(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all" placeholder="Filtrar..." />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4 pt-0 custom-scrollbar">
                {searchResults ? (
                    searchResults.length === 0 
                        ? <div className="h-full flex flex-col items-center justify-center text-gray-400 italic text-xs"><span className="material-icons text-2xl mb-1 opacity-50">search_off</span>No se encontraron items.</div> 
                        : <div className="grid grid-cols-2 gap-2">{searchResults.map(item => <ItemCard key={item.id} item={item} onAdd={handleAddItem} isAvailable={checkItemAvailability(item, catalog)} openStock={openStock} />)}</div>
                ) : (
                    <div className="space-y-4">
                        {topLists.services.length > 0 && (
                            <div>
                                <h4 className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><span className="material-icons text-[10px]">spa</span> Servicios Frecuentes</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {topLists.services.map((item: any) => <ItemCard key={item.id} item={item} onAdd={handleAddItem} isAvailable={checkItemAvailability(item, catalog)} openStock={openStock} />)}
                                </div>
                            </div>
                        )}
                        {topLists.products.length > 0 && (
                            <div>
                                <h4 className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><span className="material-icons text-[10px]">shopping_bag</span> Productos Top</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {topLists.products.map((item: any) => <ItemCard key={item.id} item={item} onAdd={handleAddItem} isAvailable={checkItemAvailability(item, catalog)} openStock={openStock} />)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CatalogSelection;
