
import React from 'react';
import { AppointmentItem } from '../../../context/DataContext';

interface OrderItem {
    item: AppointmentItem;
    quantity: number;
    cost: number;
    discountPercent: number;
    deliveryType: 'immediate' | 'backorder'; 
}

interface OrderGridProps {
    cart: OrderItem[];
    onUpdateLineItem: (index: number, field: keyof OrderItem, value: any) => void;
    onRemoveItem: (index: number) => void;
    getSuggestedQty: (item: AppointmentItem) => number;
}

const OrderGrid: React.FC<OrderGridProps> = ({ cart, onUpdateLineItem, onRemoveItem, getSuggestedQty }) => {
    return (
        <div className="flex flex-col bg-white dark:bg-surface-dark relative z-10 shadow-xl shadow-gray-200/50 lg:shadow-none h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/95 dark:bg-black/40 backdrop-blur-sm sticky top-0 z-20 shadow-sm border-b border-gray-100 dark:border-gray-800">
                        <tr className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                            {/* Ajuste de anchos: SKU más ancho, Cant/Costo más estrechos */}
                            <th className="py-3 px-4 w-[15%]">SKU</th>
                            <th className="py-3 px-2 w-[30%]">Producto</th>
                            <th className="py-3 px-2 w-[12%] hidden md:table-cell">Categoría</th>
                            <th className="py-3 px-2 w-[8%] text-center">Stock</th>
                            <th className="py-3 px-2 text-center w-[10%]">Cant.</th>
                            <th className="py-3 px-2 text-right w-[10%]">Costo</th>
                            <th className="py-3 px-4 text-right w-[15%]">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                        {cart.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="h-64 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 opacity-60">
                                        <span className="material-icons text-5xl mb-3">shopping_cart_checkout</span>
                                        <p className="text-sm font-medium">Carrito vacío. Agrega productos.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            cart.map((line, idx) => {
                                const lineTotal = line.cost * line.quantity * (1 - line.discountPercent / 100);
                                const suggestedQty = getSuggestedQty(line.item);
                                const currentStock = line.item.stock || 0;
                                const minStock = line.item.minStock || 0;
                                const isLowStock = currentStock <= minStock;
                                const isOutOfStock = currentStock === 0;

                                return (
                                    <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        
                                        {/* SKU (Updated width & whitespace) */}
                                        <td className="py-3 px-4 align-middle whitespace-nowrap">
                                            <span className="font-mono text-[11px] text-gray-600 dark:text-gray-400 font-bold bg-gray-100 dark:bg-white/10 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                                {line.item.sku || 'N/A'}
                                            </span>
                                        </td>

                                        {/* Product Info */}
                                        <td className="py-3 px-2 align-middle">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[220px]" title={line.item.title}>
                                                    {line.item.title}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {suggestedQty > line.quantity && (
                                                        <button 
                                                            onClick={() => onUpdateLineItem(idx, 'quantity', suggestedQty)}
                                                            className="text-[8px] font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                                                            title={`Cantidad sugerida basada en consumo: ${suggestedQty}`}
                                                        >
                                                            <span className="material-icons text-[8px]">tips_and_updates</span>
                                                            Sug: {suggestedQty}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Category */}
                                        <td className="py-3 px-2 align-middle hidden md:table-cell">
                                            <span className="text-[10px] font-medium text-gray-500 truncate max-w-[100px] block">
                                                {line.item.category || '-'}
                                            </span>
                                        </td>

                                        {/* Stock Actual */}
                                        <td className="py-3 px-2 text-center align-middle">
                                            <div className="flex flex-col items-center">
                                                <span className={`font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-green-600'}`}>
                                                    {currentStock}
                                                </span>
                                                {isLowStock && (
                                                    <span className="text-[8px] uppercase font-bold text-red-400 bg-red-50 dark:bg-red-900/20 px-1 rounded">
                                                        {isOutOfStock ? 'Agotado' : 'Bajo'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Quantity Input */}
                                        <td className="py-3 px-2 text-center align-middle">
                                            <div className="flex justify-center">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={line.quantity}
                                                    onChange={(e) => onUpdateLineItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                                                    className="w-14 text-center font-bold bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-gray-700 rounded-lg py-1.5 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-gray-900 dark:text-white shadow-sm"
                                                />
                                            </div>
                                        </td>

                                        {/* Cost */}
                                        <td className="py-3 px-2 text-right align-middle">
                                            <div className="flex items-center justify-end gap-1 relative group/input">
                                                <span className="text-gray-400 text-[10px]">$</span>
                                                <input 
                                                    type="number"
                                                    step="0.01" 
                                                    value={line.cost}
                                                    onChange={(e) => onUpdateLineItem(idx, 'cost', parseFloat(e.target.value) || 0)}
                                                    className="w-14 text-right font-mono text-gray-600 dark:text-gray-400 bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-indigo-500 transition-colors py-0.5 text-xs"
                                                />
                                            </div>
                                        </td>

                                        {/* Total & Actions */}
                                        <td className="py-3 px-4 text-right align-middle">
                                            <div className="flex items-center justify-end gap-3 relative">
                                                <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">${lineTotal.toFixed(2)}</span>
                                                <button 
                                                    onClick={() => onRemoveItem(idx)} 
                                                    className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 absolute -right-3"
                                                    title="Eliminar"
                                                >
                                                    <span className="material-icons text-sm">close</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderGrid;
