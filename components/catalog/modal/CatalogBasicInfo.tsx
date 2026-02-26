
import React from 'react';
import { AppointmentItem, Supplier } from '../../../types';

interface CatalogBasicInfoProps {
    editingItem: Partial<AppointmentItem>;
    setEditingItem: (item: Partial<AppointmentItem>) => void;
    suppliers: Supplier[];
}

const CatalogBasicInfo: React.FC<CatalogBasicInfoProps> = ({ editingItem, setEditingItem, suppliers }) => {
    return (
        <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
            
            {/* FILA 1: NOMBRE COMERCIAL (Full Width) */}
            <div className="w-full">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Nombre Comercial</label>
                <input 
                    value={editingItem.title || ''}
                    onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                    className="w-full text-lg font-bold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                    placeholder="Ej: Shampoo Keratina 500ml"
                    autoFocus
                />
            </div>

            {/* FILA 2: DATOS DE CLASIFICACIÓN */}
            <div className="flex gap-4">
                {/* Categoría */}
                <div className="flex-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Categoría</label>
                    <div className="relative">
                        <input 
                            value={editingItem.category || ''}
                            onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                            className="w-full text-xs font-medium bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-8 py-2 outline-none focus:border-primary transition-all"
                            placeholder="Ej: Capilar"
                            list="categories-list"
                        />
                         <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] pointer-events-none">category</span>
                    </div>
                    <datalist id="categories-list">
                        <option value="Faciales" />
                        <option value="Capilar" />
                        <option value="Corporal" />
                        <option value="Venta" />
                    </datalist>
                </div>

                {/* SKU */}
                <div className="w-32">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">SKU / Código</label>
                    <div className="relative">
                        <input 
                            value={editingItem.sku || ''}
                            onChange={e => setEditingItem({...editingItem, sku: e.target.value})}
                            className="w-full text-xs font-mono font-bold uppercase bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-7 py-2 outline-none focus:border-primary transition-all"
                            placeholder="AUTO"
                        />
                        <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] pointer-events-none">qr_code</span>
                    </div>
                </div>

                {/* Proveedor (Solo Productos) */}
                {editingItem.type === 'product' && (
                    <div className="flex-1 min-w-[140px]">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Proveedor</label>
                        <div className="relative">
                            <select 
                                value={editingItem.supplierId || ''}
                                onChange={e => setEditingItem({...editingItem, supplierId: e.target.value})}
                                className="w-full text-xs font-medium bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-6 py-2 outline-none focus:border-primary appearance-none cursor-pointer transition-all"
                            >
                                <option value="">Seleccionar...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                            </select>
                            <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">expand_more</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CatalogBasicInfo;
