
import React from 'react';
import { Order, Supplier } from '../../../context/DataContext';

interface OrderPreviewFullModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    supplier: Supplier | undefined;
}

const OrderPreviewFullModal: React.FC<OrderPreviewFullModalProps> = ({ isOpen, onClose, order, supplier }) => {
    if (!isOpen || !order) return null;

    const items = order.lines || [];
    const subtotal = order.total; // Simplificado, idealmente recalculado
    const tax = 0; // Se puede conectar a lógica real luego
    const total = subtotal + tax;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 bg-gray-900/90 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Toolbar Superior Flotante */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none">
                <div className="pointer-events-auto bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                    <span className="material-icons text-sm">visibility</span> Vista Previa de Documento
                </div>
                <button 
                    onClick={onClose}
                    className="pointer-events-auto w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                >
                    <span className="material-icons">close</span>
                </button>
            </div>

            {/* Contenedor del Documento (A4 Ratio simulado) */}
            <div className="h-full w-full overflow-y-auto custom-scrollbar flex justify-center py-8 md:py-16 bg-[#525659]" onClick={onClose}>
                <div 
                    className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-8 duration-500" 
                    onClick={e => e.stopPropagation()}
                >
                    {/* --- DOCUMENT HEADER --- */}
                    <div className="p-12 pb-6 border-b-2 border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-primary text-white flex items-center justify-center rounded-lg shadow-sm">
                                        <span className="material-icons text-2xl">spa</span>
                                    </div>
                                    <div>
                                        <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Dermibelle Studio</h1>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest">Beauty & Wellness</p>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                    <p>123 Beauty Lane, Port Charlotte, FL 33952</p>
                                    <p>Tel: (941) 555-0123 • Email: billing@dermibelle.com</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-4xl font-display font-bold text-gray-200 uppercase tracking-widest mb-2">ORDEN DE COMPRA</h2>
                                <p className="text-sm font-bold text-gray-900">PO #: {order.idDisplay.replace('#', '')}</p>
                                <p className="text-sm text-gray-500">Fecha: {new Date(order.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <div className="mt-4 inline-block px-3 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600 uppercase border border-gray-200">
                                    Estado: {order.status}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- INFO GRID --- */}
                    <div className="p-12 py-8 grid grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">Proveedor (Vendedor)</h3>
                            <div className="text-sm text-gray-800 space-y-1">
                                <p className="font-bold text-lg">{supplier?.companyName || order.clientName}</p>
                                <p>{supplier?.contactPerson}</p>
                                <p>{supplier?.address || 'Dirección no registrada'}</p>
                                <p>{supplier?.email}</p>
                                <p>{supplier?.phone}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">Enviar A (Comprador)</h3>
                            <div className="text-sm text-gray-800 space-y-1">
                                <p className="font-bold text-lg">Dermibelle Studio - Almacén Central</p>
                                <p>Atn: Recepción de Inventario</p>
                                <p>123 Beauty Lane</p>
                                <p>Port Charlotte, FL 33952</p>
                            </div>
                        </div>
                    </div>

                    {/* --- ITEMS TABLE --- */}
                    <div className="px-12 flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-800">
                                    <th className="py-3 text-xs font-bold text-gray-800 uppercase tracking-wider w-16 text-center">Cant.</th>
                                    <th className="py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Descripción / Item</th>
                                    <th className="py-3 text-xs font-bold text-gray-800 uppercase tracking-wider text-right w-32">Precio Unit.</th>
                                    <th className="py-3 text-xs font-bold text-gray-800 uppercase tracking-wider text-right w-32">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400 italic bg-gray-50 mt-2">
                                            {order.items} (Detalle no estructurado)
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((line, idx) => (
                                        <tr key={idx} className="border-b border-gray-100">
                                            <td className="py-4 text-center font-bold text-gray-700">{line.qty}</td>
                                            <td className="py-4">
                                                <p className="font-bold text-gray-900">{line.title}</p>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {line.itemId}</p>
                                            </td>
                                            <td className="py-4 text-right text-gray-600">${line.price.toFixed(2)}</td>
                                            <td className="py-4 text-right font-bold text-gray-900">${(line.qty * line.price).toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- FOOTER TOTALS --- */}
                    <div className="px-12 py-8 flex justify-end">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Impuestos (0%)</span>
                                <span>$0.00</span>
                            </div>
                            <div className="flex justify-between items-end pt-4 border-t border-gray-800">
                                <span className="font-bold text-gray-900 text-lg">TOTAL USD</span>
                                <span className="font-display font-bold text-3xl text-gray-900">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* --- TERMS & NOTES --- */}
                    <div className="px-12 pb-12 mt-auto">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-800 uppercase mb-2">Términos y Condiciones</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                1. El pago se realizará según los términos acordados (Net 30).<br/>
                                2. Por favor incluir el número de orden de compra en todas las facturas y paquetes.<br/>
                                3. Notificar inmediatamente si algún item está fuera de stock o descontinuado.
                            </p>
                        </div>
                        <div className="mt-8 flex justify-between items-end">
                            <div className="text-center w-48">
                                <div className="border-b border-gray-300 h-10 mb-2"></div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Autorizado Por</p>
                            </div>
                            <p className="text-[10px] text-gray-300">Generado digitalmente por Dermibelle System</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderPreviewFullModal;
