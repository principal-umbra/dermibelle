
import React from 'react';
import { AppointmentItem } from '../../../../types';

interface ProductDefinitionProps {
    editingItem: Partial<AppointmentItem>;
    setEditingItem: (item: Partial<AppointmentItem>) => void;
    purchaseMode: 'unit' | 'pack';
    setPurchaseMode: (mode: 'unit' | 'pack') => void;
    acquisitionCost: number;
    setAcquisitionCost: (val: number) => void;
    unitsPerPack: number;
    setUnitsPerPack: (val: number) => void;
    unitCost: number;
    containerType: string;
    setContainerType: (val: string) => void;
}

const CONTAINER_TYPES = [
    'Unidad', 'Botella', 'Caja', 'Paquete', 'Frasco', 'Tubo', 'Bolsa', 'Galón', 'Kit', 'Ampolla', 'Lata', 'Rollo', 'Spray', 'Gotero'
];

const ProductDefinition: React.FC<ProductDefinitionProps> = ({
    editingItem, setEditingItem, purchaseMode, setPurchaseMode,
    acquisitionCost, setAcquisitionCost, unitsPerPack, setUnitsPerPack, unitCost,
    containerType, setContainerType
}) => {
    
    const handleSetPackMode = () => {
        setPurchaseMode('pack');
        // Si el usuario cambia a Pack y tiene 1 unidad, sugerimos 2 para asegurar que se guarde como pack.
        // El usuario puede cambiarlo después, pero esto evita el "revert a unidad" automático.
        if (unitsPerPack <= 1) {
            setUnitsPerPack(12); // Valor por defecto común, o podría ser 2
        }
    };

    const isEProduct = editingItem.isEProduct;

    return (
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-3xl p-4 shadow-sm flex flex-col gap-3 relative group overflow-y-auto custom-scrollbar h-full">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2 shrink-0">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">2</span>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Definición de Compra</h3>
            </div>

            <div className="shrink-0">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Tipo de Producto</label>
                <div className="flex flex-col gap-1.5">
                    <button type="button" onClick={() => setEditingItem({...editingItem, subtype: 'retail'})} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${editingItem.subtype === 'retail' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        <span className="text-[11px] font-bold">Solo Venta (Retail)</span>
                        {editingItem.subtype === 'retail' && <span className="material-icons text-xs">check_circle</span>}
                    </button>
                    <button type="button" onClick={() => setEditingItem({...editingItem, subtype: 'consumable', price: 0})} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${editingItem.subtype === 'consumable' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        <span className="text-[11px] font-bold">Solo Consumo (Cabina)</span>
                        {editingItem.subtype === 'consumable' && <span className="material-icons text-xs">check_circle</span>}
                    </button>
                    <button type="button" onClick={() => setEditingItem({...editingItem, subtype: 'both', stockConfig: { isCustom: true, retailRatio: 0.5 }})} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${editingItem.subtype === 'both' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        <span className="text-[11px] font-bold">Mixto (Ambos)</span>
                        {editingItem.subtype === 'both' && <span className="material-icons text-xs">check_circle</span>}
                    </button>
                </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
                <div className={isEProduct ? 'opacity-50 pointer-events-none grayscale' : ''}>
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Formato de Compra</label>
                    <div className="flex bg-gray-100 dark:bg-black/20 p-0.5 rounded-lg mb-2">
                        <button type="button" onClick={() => setPurchaseMode('unit')} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${purchaseMode === 'unit' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Por Unidad</button>
                        <button type="button" onClick={handleSetPackMode} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${purchaseMode === 'pack' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Caja / Pack</button>
                    </div>
                </div>

                <div className={isEProduct ? 'opacity-50 pointer-events-none grayscale' : ''}>
                     <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Tipo de Envase / Paquete</label>
                     <div className="relative">
                        <select 
                            value={containerType} 
                            onChange={(e) => setContainerType(e.target.value)} 
                            className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            {CONTAINER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">expand_more</span>
                     </div>
                </div>

                <div className="relative group/input">
                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Costo de Adquisición</label>
                    <span className="absolute left-3 top-6 text-gray-400 font-bold text-xs">$</span>
                    <input type="number" value={acquisitionCost || ''} onChange={e => setAcquisitionCost(parseFloat(e.target.value))} className="w-full pl-6 pr-3 py-1.5 bg-white border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" placeholder="0.00" />
                </div>

                {purchaseMode === 'pack' && (
                    <div className={isEProduct ? 'opacity-50 pointer-events-none grayscale' : ''}>
                        <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Unidades por Pack</label>
                        <div className="flex gap-2 items-center">
                            <input 
                                type="number" 
                                value={unitsPerPack || ''} 
                                onChange={e => setUnitsPerPack(parseFloat(e.target.value) || 0)} 
                                className="flex-1 px-3 py-1.5 bg-white border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 text-center" 
                                placeholder="Ej: 12"
                            />
                            <div className="bg-blue-50 px-2 py-1 rounded-lg border border-blue-100"><span className="text-[8px] text-blue-400 block uppercase font-bold">Costo Unit.</span><span className="text-xs font-mono font-bold text-blue-700">${unitCost.toFixed(2)}</span></div>
                        </div>
                        {unitsPerPack <= 1 && (
                            <p className="text-[9px] text-orange-500 mt-1 animate-pulse">Debe ser mayor a 1 para guardar como Pack.</p>
                        )}
                    </div>
                )}

                {/* E-PRODUCT TOGGLE */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-gray-700 mt-2">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Producto Digital (E-Product)</span>
                        <span className="text-[9px] text-gray-400 leading-tight">No descuenta stock físico, uso infinito.</span>
                    </div>
                    <button 
                        type="button"
                        onClick={() => setEditingItem({...editingItem, isEProduct: !editingItem.isEProduct})}
                        className={`w-10 h-5 rounded-full flex items-center transition-colors p-1 ${editingItem.isEProduct ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${editingItem.isEProduct ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDefinition;
