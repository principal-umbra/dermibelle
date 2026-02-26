
import React from 'react';
import { useData } from '../../context/DataContext';

interface SupplierCatalogTabProps {
    supplierTags?: string[];
}

const SupplierCatalogTab: React.FC<SupplierCatalogTabProps> = ({ supplierTags = [] }) => {
    const { catalog } = useData();

    // Filter logic
    const supplierProducts = catalog.filter(item => 
        item.type === 'product' && 
        (supplierTags.some(tag => item.category?.includes(tag) || item.tags?.includes(tag)))
    );

    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Productos Suministrados</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Asociados por etiquetas de categoría.</p>
                </div>
                <button className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <span className="material-icons text-xs">edit</span> Gestionar
                </button>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-white/5 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 border-b border-gray-100 dark:border-gray-700">Producto</th>
                            <th className="p-4 border-b border-gray-100 dark:border-gray-700 text-center">SKU</th>
                            <th className="p-4 border-b border-gray-100 dark:border-gray-700 text-right">Costo Est.</th>
                            <th className="p-4 border-b border-gray-100 dark:border-gray-700 text-center">Stock</th>
                            <th className="p-4 border-b border-gray-100 dark:border-gray-700 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {supplierProducts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-400 text-sm">
                                    <span className="material-icons text-3xl mb-2 opacity-30">category</span>
                                    <p>No se encontraron productos asociados.</p>
                                </td>
                            </tr>
                        ) : (
                            supplierProducts.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shrink-0">
                                                <span className="material-icons text-sm">inventory_2</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-xs">{item.title}</p>
                                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-gray-100 dark:bg-white/10 text-gray-500 mt-0.5">
                                                    {item.category}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-mono text-xs text-gray-500">{item.sku || '-'}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <p className="font-mono text-gray-900 dark:text-white text-xs">${(item.price * 0.4).toFixed(2)}</p>
                                        <p className="text-[9px] text-green-600">Margen: 60%</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`text-xs font-bold ${
                                                (item.stock || 0) < 5 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                                {item.stock} u.
                                            </span>
                                            <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                <div 
                                                    className={`h-full ${(item.stock || 0) < 5 ? 'bg-red-500' : 'bg-green-500'}`} 
                                                    style={{width: `${Math.min(100, (item.stock || 0) * 5)}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-gray-400 hover:text-primary p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100">
                                            <span className="material-icons text-lg">edit</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SupplierCatalogTab;
