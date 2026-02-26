import React, { useRef, useMemo } from 'react';

interface PortalPaymentProps {
    total: number;
    paymentTerms: string;
    currency?: string;
    invoiceFile: File | null;
    setInvoiceFile: (file: File | null) => void;
    paymentAccepted: boolean;
    setPaymentAccepted: (val: boolean) => void;
    etaDate?: string;
}

const PortalPayment: React.FC<PortalPaymentProps> = ({
    total,
    paymentTerms,
    currency = 'USD',
    invoiceFile,
    setInvoiceFile,
    paymentAccepted,
    setPaymentAccepted,
    etaDate
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setInvoiceFile(e.target.files[0]);
        }
    };

    const termDetails = useMemo(() => {
        const term = paymentTerms || 'Contado';
        const cleanTerm = term.toLowerCase();
        
        const baseDate = etaDate ? new Date(etaDate + 'T12:00:00') : new Date();
        const dueDate = new Date(baseDate);

        if (cleanTerm.includes('net 30')) {
            dueDate.setDate(baseDate.getDate() + 30);
            return { 
                label: 'Crédito Comercial (30 Días)', 
                icon: 'calendar_month', 
                desc: etaDate 
                    ? `Vencimiento calculado a 30 días de la entrega estimada (${baseDate.toLocaleDateString()}).` 
                    : 'El pago se procesará 30 días después de la emisión de la factura.', 
                date: dueDate 
            };
        }
        if (cleanTerm.includes('net 15')) {
            dueDate.setDate(baseDate.getDate() + 15);
            return { 
                label: 'Crédito Comercial (15 Días)', 
                icon: 'calendar_today', 
                desc: etaDate 
                    ? `Vencimiento calculado a 15 días de la entrega estimada (${baseDate.toLocaleDateString()}).` 
                    : 'El pago se procesará 15 días después de la emisión de la factura.', 
                date: dueDate 
            };
        }
        if (cleanTerm.includes('net 60')) {
            dueDate.setDate(baseDate.getDate() + 60);
            return { 
                label: 'Crédito Extendido (60 Días)', 
                icon: 'date_range', 
                desc: etaDate 
                    ? `Vencimiento calculado a 60 días de la entrega estimada (${baseDate.toLocaleDateString()}).` 
                    : 'El pago se procesará 60 días después de la emisión de la factura.', 
                date: dueDate 
            };
        }
        if (cleanTerm.includes('contado')) {
            return { 
                label: 'Pago Contra Entrega', 
                icon: 'payments', 
                desc: etaDate
                    ? `El pago se procesará tras la recepción conforme el ${baseDate.toLocaleDateString()}.`
                    : 'El pago se procesará inmediatamente tras la recepción conforme.', 
                date: baseDate
            };
        }
        
        return { label: term, icon: 'handshake', desc: 'Sujeto a los términos del acuerdo marco vigente.', date: null };
    }, [paymentTerms, etaDate]);

    return (
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 h-full flex flex-col justify-between">
            <div>
                <h3 className="font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-700 pb-3">
                    <span className="material-icons text-green-500 bg-green-500/10 p-1 rounded-lg text-sm">payments</span> 
                    Información de Pago
                </h3>

                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 mb-5 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl -mr-5 -mt-5"></div>

                     <div className="flex justify-between items-start mb-2 relative z-10">
                         <div>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Condiciones Aplicables</span>
                             <span className="text-lg font-display font-bold text-white flex items-center gap-2">
                                 {termDetails.label}
                             </span>
                         </div>
                         <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-blue-400">
                             <span className="material-icons text-sm">{termDetails.icon}</span>
                         </div>
                     </div>
                     
                     <p className="text-xs text-gray-500 leading-relaxed mb-3 relative z-10">
                         {termDetails.desc}
                     </p>

                     {termDetails.date && (
                         <div className="flex items-center gap-2 pt-3 border-t border-gray-700/50">
                             <span className="text-[10px] font-bold text-gray-400 uppercase">Vencimiento Estimado:</span>
                             <span className="text-xs font-mono font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                 {termDetails.date.toLocaleDateString()}
                             </span>
                         </div>
                     )}
                </div>

                <div className="mb-5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Factura Fiscal (PDF/XML)</label>
                    
                    {!invoiceFile ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-600 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700/30 hover:border-gray-500 transition-all group min-h-[80px]"
                        >
                            <span className="material-icons text-gray-400 group-hover:text-green-400 text-xl mb-1 transition-colors">cloud_upload</span>
                            <p className="text-xs text-gray-300 font-medium">Click para subir factura</p>
                        </div>
                    ) : (
                        <div className="bg-green-900/20 border border-green-900/50 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center">
                                    <span className="material-icons text-sm">description</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate max-w-[150px]">{invoiceFile.name}</p>
                                    <p className="text-[10px] text-gray-400">{(invoiceFile.size / 1024).toFixed(0)} KB</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setInvoiceFile(null)}
                                className="text-gray-400 hover:text-red-400 p-1"
                            >
                                <span className="material-icons text-sm">close</span>
                            </button>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.xml,.png,.jpg"
                        onChange={handleFileChange} 
                    />
                </div>
            </div>

            <div className="pt-3 border-t border-gray-700">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                        <input 
                            type="checkbox" 
                            checked={paymentAccepted}
                            onChange={(e) => setPaymentAccepted(e.target.checked)}
                            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-500 bg-gray-900 transition-all checked:border-green-500 checked:bg-green-500 hover:border-gray-400"
                        />
                        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                            <span className="material-icons text-[10px] font-bold">check</span>
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 select-none group-hover:text-gray-300 transition-colors leading-snug">
                        Confirmo que la factura cumple con los requisitos fiscales y acepto la fecha estimada de pago <strong>({termDetails.date ? termDetails.date.toLocaleDateString() : 'A convenir'})</strong>.
                    </p>
                </label>
            </div>
        </div>
    );
};

export default PortalPayment;