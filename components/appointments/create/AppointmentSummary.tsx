
import React from 'react';
import { Client, AppointmentItem } from '../../../context/DataContext';
import { checkItemAvailability } from '../../../hooks/useCreateAppointment';

interface AppointmentSummaryProps {
    client: Client | null;
    items: AppointmentItem[];
    date: string;
    time: string;
    subTotalAmount: number;
    discountAmount: number;
    totalAmount: number;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    handleUpdateQuantity: (idx: number, delta: number) => void;
    handleRemoveItem: (idx: number) => void;
    handleSubmit: () => void;
    onClose: () => void;
    catalog: AppointmentItem[];
    mode: 'new' | 'link' | 'quote';
    hasStockIssues: boolean;
    handleToggleUnit?: (idx: number) => void;
}

const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({
    client, items, date, time, subTotalAmount, discountAmount, totalAmount, discountType, discountValue,
    handleUpdateQuantity, handleRemoveItem, handleSubmit, onClose, catalog, mode, hasStockIssues, handleToggleUnit
}) => {
    
    const getFormattedPreviewDate = () => { 
        const [y, m, d] = date.split('-').map(Number); 
        const previewDate = new Date(y, m - 1, d); 
        return previewDate.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: '2-digit'}); 
    };

    return (
        <div className="w-full md:w-6/12 bg-gray-100 dark:bg-black/40 flex flex-col items-center p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

            <div className="w-full max-w-[380px] bg-white dark:bg-surface-dark shadow-2xl rounded-sm overflow-hidden flex flex-col flex-1 min-h-0 animate-in slide-in-from-right-4 duration-500 relative">
                <div className={`h-2 w-full ${hasStockIssues ? 'bg-amber-500' : 'bg-primary'}`}></div>
                <div className="p-4 pb-2 text-center">
                    <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white tracking-widest uppercase">DERMIBELLE STUDIO</h3>
                    <p className="text-[9px] text-gray-500 font-medium tracking-widest mt-0.5 uppercase">Beauty & Wellness Center</p>
                    <div className="text-[8px] text-gray-400 mt-1">123 Beauty Lane, Port Charlotte, FL • (941) 555-0123</div>
                </div>
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <div className="text-left"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">FECHA</p><p className="font-mono text-[10px] font-bold text-gray-700 dark:text-gray-300">{getFormattedPreviewDate()}</p></div>
                    <div className="text-right"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">HORA</p><p className="font-mono text-[10px] font-bold text-gray-700 dark:text-gray-300">{time}</p></div>
                </div>
                <div className="px-4 pt-2">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">FACTURAR A:</p>
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div><p className="text-xs font-bold text-gray-900 dark:text-white leading-none mb-0.5">{client ? client.name : 'Cliente General'}</p><p className="text-[9px] text-gray-500 truncate max-w-[180px]">{client ? client.email : 'Sin registro'}</p></div>
                        {client && (<div className="w-6 h-6 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 shadow-sm">{client.initials}</div>)}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                    <table className="w-full">
                        <thead><tr className="border-b border-dashed border-gray-200 dark:border-gray-700"><th className="text-[9px] font-bold text-gray-400 uppercase tracking-wider py-2 text-left">Cant.</th><th className="text-[9px] font-bold text-gray-400 uppercase tracking-wider py-2 text-left pl-2">Descripción</th><th className="text-[9px] font-bold text-gray-400 uppercase tracking-wider py-2 text-right">Importe</th></tr></thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <span className="material-icons text-gray-400 text-2xl">shopping_cart</span>
                                            <span className="text-xs text-gray-500 italic font-medium">Agrega items del catálogo</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (items.map((item, idx) => (
                                <tr key={`${item.id}-${item.saleUnit || 'pack'}-${idx}`} className="group relative hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-3 text-center align-top w-20">
                                        <div className="flex items-center justify-center gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1 border border-gray-200 dark:border-gray-700/50">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(idx, -1); }}
                                                className="w-5 h-5 flex items-center justify-center rounded-md bg-white dark:bg-white/10 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm border border-gray-200 dark:border-gray-600 transition-all"
                                            >
                                                <span className="material-icons text-[10px]">remove</span>
                                            </button>
                                            <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 w-4 text-center leading-none">{item.quantity}</span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(idx, 1); }}
                                                className="w-5 h-5 flex items-center justify-center rounded-md bg-white dark:bg-white/10 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 shadow-sm border border-gray-200 dark:border-gray-600 transition-all"
                                            >
                                                <span className="material-icons text-[10px]">add</span>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-3 pl-2 align-top">
                                        <p className={`text-xs font-bold leading-tight ${!checkItemAvailability(item, catalog) ? 'text-amber-600 line-through decoration-amber-300' : 'text-gray-900 dark:text-white'}`}>{item.title}</p>
                                        {!checkItemAvailability(item, catalog) && <p className="text-[9px] text-amber-500 font-bold">Sin Stock</p>}
                                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">${item.price.toFixed(2)} c/u</p>
                                        
                                        {/* Unit Toggle for Fractional Items */}
                                        {catalog.find(c => c.id === item.id)?.allowFractionalSale && handleToggleUnit && (
                                            <div className="flex mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 w-fit border border-gray-200 dark:border-gray-700">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); if(item.saleUnit !== 'pack') handleToggleUnit(idx); }}
                                                    className={`px-2 py-1 rounded-md text-[9px] font-bold flex items-center gap-1 transition-all ${(!item.saleUnit || item.saleUnit === 'pack') ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                                >
                                                    <span className="material-icons text-[10px]">inventory_2</span>
                                                    Caja
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); if(item.saleUnit === 'pack' || !item.saleUnit) handleToggleUnit(idx); }}
                                                    className={`px-2 py-1 rounded-md text-[9px] font-bold flex items-center gap-1 transition-all ${item.saleUnit === 'unit' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 shadow-sm ring-1 ring-orange-200 dark:ring-orange-800' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                                >
                                                    <span className="material-icons text-[10px]">archive</span>
                                                    Unidad
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 text-right align-top relative">
                                        <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">${((item.quantity || 1) * item.price).toFixed(2)}</span>
                                        <button onClick={() => handleRemoveItem(idx)} className="absolute -right-4 top-3 text-gray-300 hover:text-red-500 transition-colors p-1">
                                            <span className="material-icons text-sm">close</span>
                                        </button>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 pb-4 pt-2 bg-gray-50/30 dark:bg-black/10 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center text-[10px] text-gray-500 mb-0.5"><span>SUBTOTAL</span><span className="font-mono">${subTotalAmount.toFixed(2)}</span></div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-[10px] text-green-600 dark:text-green-400 mb-0.5 font-bold">
                            <span>DESCUENTO ({discountType === 'percent' ? `${discountValue}%` : 'FIJO'})</span>
                            <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] text-gray-500 mb-2"><span>IMPUESTOS (0%)</span><span className="font-mono">$0.00</span></div>
                    <div className="flex justify-between items-end border-t border-gray-200 dark:border-gray-700 pt-2 mb-2"><span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">TOTAL</span><span className="text-2xl font-display font-bold text-gray-900 dark:text-white">${totalAmount.toFixed(2)}</span></div>
                    
                    {hasStockIssues && mode === 'new' && (
                        <div className="bg-amber-50 text-amber-800 text-[10px] p-2 rounded-lg text-center mt-4 border border-amber-100 flex items-center justify-center gap-1">
                            <span className="material-icons text-sm">warning</span>
                            <span>Items sin stock. Se guardará como <strong>Pendiente</strong>.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-[340px] mt-6 flex gap-3">
                <button onClick={onClose} className="flex-1 py-3.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wide">Cancelar</button>
                <button 
                    onClick={handleSubmit} 
                    disabled={!client || items.length === 0} 
                    className={`flex-[2] py-3.5 rounded-xl text-white text-xs font-bold shadow-xl flex items-center justify-center gap-2 uppercase tracking-wide transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed
                        ${hasStockIssues && mode === 'new' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-900/20' : 'bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-purple-900/20'}
                    `}
                >
                    <span className="material-icons text-sm">{hasStockIssues && mode === 'new' ? 'warning' : 'check_circle'}</span> 
                    {mode === 'quote' ? 'GUARDAR COTIZACIÓN' : (hasStockIssues ? 'GUARDAR PENDIENTE' : 'CONFIRMAR CITA')}
                </button>
            </div>
        </div>
    );
};

export default AppointmentSummary;
