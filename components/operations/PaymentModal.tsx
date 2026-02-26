import React, { useState, useEffect } from 'react';
import { SupplierInvoice, Supplier } from '../../types';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: PaymentData) => void;
    invoice: SupplierInvoice;
    supplier?: Supplier;
}

export interface PaymentData {
    amount: number;
    method: string;
    date: string;
    reference: string;
    notes: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm, invoice, supplier }) => {
    const [amount, setAmount] = useState<string>(invoice.amount.toString());
    const [method, setMethod] = useState<string>('Transfer');
    const [date, setDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
    const [reference, setReference] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    
    // Reset state when modal opens with a new invoice
    useEffect(() => {
        if (isOpen) {
            setAmount(invoice.amount.toString());
            setMethod('Transfer'); // Could default to supplier preference if available
            setDate(new Date().toLocaleDateString('en-CA'));
            setReference('');
            setNotes('');
        }
    }, [isOpen, invoice]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        onConfirm({
            amount: numAmount,
            method,
            date,
            reference,
            notes
        });
    };

    const isFullPayment = Math.abs(parseFloat(amount || '0') - invoice.amount) < 0.01;

    const paymentMethods = [
        { id: 'Transfer', label: 'Transferencia', icon: 'account_balance' },
        { id: 'Check', label: 'Cheque', icon: 'confirmation_number' },
        { id: 'Credit Card', label: 'Tarjeta', icon: 'credit_card' },
        { id: 'Cash', label: 'Efectivo', icon: 'payments' },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-[#0f172a] p-6 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="material-icons text-emerald-400">payments</span> Registrar Pago
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
                                {supplier?.companyName || invoice.supplierName}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Factura</p>
                            <p className="text-2xl font-mono font-bold text-white">${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Amount Section */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Monto a Pagar</label>
                            {!isFullPayment && (
                                <button 
                                    onClick={() => setAmount(invoice.amount.toString())}
                                    className="text-xs text-emerald-600 font-bold hover:underline"
                                >
                                    Pagar Totalidad
                                </button>
                            )}
                        </div>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl group-focus-within:text-emerald-600 transition-colors">$</span>
                            <input 
                                type="number" 
                                className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-2xl font-bold text-gray-900 dark:text-white dark:bg-black/20 focus:border-emerald-500 focus:ring-0 transition-all outline-none"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        {isFullPayment ? (
                            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                <span className="material-icons text-[14px]">check_circle</span> Pago completo de la factura
                            </p>
                        ) : (
                            <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                                <span className="material-icons text-[14px]">pie_chart</span> Pago parcial (Restante: ${(invoice.amount - (parseFloat(amount) || 0)).toFixed(2)})
                            </p>
                        )}
                    </div>

                    {/* Method Selection */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Método de Pago</label>
                        <div className="grid grid-cols-2 gap-3">
                            {paymentMethods.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        setMethod(m.id);
                                        if (m.id === 'Cash') setReference('');
                                    }}
                                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                        method === m.id 
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' 
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                                    }`}
                                >
                                    <span className={`material-icons ${method === m.id ? 'text-emerald-500' : 'text-gray-400'}`}>{m.icon}</span>
                                    <span className="text-sm font-medium">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date & Reference Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={method === 'Cash' ? 'col-span-2' : ''}>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Fecha</label>
                            <input 
                                type="date" 
                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:bg-black/20 focus:border-emerald-500 outline-none transition-colors"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        {method !== 'Cash' && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Referencia / ID</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:bg-black/20 focus:border-emerald-500 outline-none transition-colors"
                                    placeholder={method === 'Check' ? 'Núm. Cheque' : 'ID Transacción'}
                                    value={reference}
                                    onChange={e => setReference(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Notas (Opcional)</label>
                        <textarea 
                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:bg-black/20 resize-none h-20 focus:border-emerald-500 outline-none transition-colors"
                            placeholder="Detalles adicionales..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 flex gap-3 shrink-0">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 dark:hover:bg-white/5 rounded-xl transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!amount || parseFloat(amount) <= 0}
                        className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <span className="material-icons text-sm">check_circle</span> 
                        Confirmar Pago ${parseFloat(amount || '0').toLocaleString()}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
