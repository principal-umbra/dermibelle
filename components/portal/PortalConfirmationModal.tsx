import React, { useState, useEffect } from 'react';
import { SupplierContact } from '../../types';

interface PortalConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (responsable: string, notes: string) => void;
    summary: {
        itemsTotal: number;
        shippingCost: number;
        total: number;
        itemCount: number;
        method: string;
        date: string;
        ref: string;
    };
    contacts: SupplierContact[];
    isDispute?: boolean;
    changes?: string[];
    fixedResponsible?: string; // New Prop for Locking Responsible
}

// Helper: Phone Formatter
const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return `(${phoneNumber}`;
    if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

const PortalConfirmationModal: React.FC<PortalConfirmationModalProps> = ({ 
    isOpen, onClose, onConfirm, summary, contacts, isDispute = false, changes = [], fixedResponsible
}) => {
    const [selectedContactId, setSelectedContactId] = useState<string>('');
    const [manualName, setManualName] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    const [manualPhone, setManualPhone] = useState('');
    const [notes, setNotes] = useState('');

    // Seleccionar el primer contacto por defecto si existe
    useEffect(() => {
        if (isOpen) {
            if (contacts.length > 0) {
                setSelectedContactId(contacts[0].id);
            } else {
                setSelectedContactId('manual');
            }
            setManualName('');
            setManualEmail('');
            setManualPhone('');
            setNotes('');
        }
    }, [isOpen, contacts]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        let finalResponsable = '';
        
        if (fixedResponsible) {
            finalResponsable = fixedResponsible;
        } else if (selectedContactId === 'manual') {
            if (!manualName.trim() || !manualEmail.trim() || !manualPhone.trim()) return; 
            // Concatenar datos para el registro
            finalResponsable = `${manualName} (${manualEmail} | ${manualPhone})`;
        } else {
            const contact = contacts.find(c => c.id === selectedContactId);
            finalResponsable = contact ? contact.name : 'Desconocido';
        }

        onConfirm(finalResponsable, notes);
    };

    const isConfirmDisabled = !fixedResponsible && selectedContactId === 'manual' && (!manualName.trim() || !manualEmail.trim() || !manualPhone.trim());

    // Theme Logic based on State
    const theme = isDispute ? {
        headerIcon: 'gavel',
        headerColor: 'text-amber-500',
        headerBg: 'bg-amber-500/20 border-amber-500/30',
        title: 'Revisión Requerida',
        desc: 'Se han detectado cambios respecto a la orden original.',
        btnColor: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',
        btnText: 'Enviar Propuesta'
    } : {
        headerIcon: 'check_circle',
        headerColor: 'text-green-500',
        headerBg: 'bg-green-500/20 border-green-500/30',
        title: 'Confirmar Despacho',
        desc: 'Revisa los detalles finales antes de enviar la actualización.',
        btnColor: 'bg-green-600 hover:bg-green-500 shadow-green-500/20',
        btnText: 'Confirmar Envío'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e2024] w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-700 bg-[#1e2024] flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${theme.headerBg} ${theme.headerColor}`}>
                        <span className="material-icons text-2xl">{theme.headerIcon}</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-display font-bold text-white">{theme.title}</h2>
                        <p className="text-sm text-gray-400">{theme.desc}</p>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[#16181c]">
                    
                    {/* ALERT SECTION FOR DISPUTE */}
                    {isDispute && changes.length > 0 && (
                        <div className="bg-amber-900/10 border border-amber-700/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                            <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="material-icons text-sm">warning</span> Cambios Detectados ({changes.length})
                            </h4>
                            <ul className="space-y-1">
                                {changes.map((change, idx) => (
                                    <li key={idx} className="text-xs text-amber-200/80 flex items-start gap-2">
                                        <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                                        {change}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-[10px] text-gray-500 mt-3 italic">
                                * Esta orden se enviará como "Propuesta" y deberá ser aprobada por el administrador antes de proceder.
                            </p>
                        </div>
                    )}

                    {/* Summary Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Económico */}
                        <div className="bg-[#1e2024] p-4 rounded-xl border border-gray-700 shadow-sm">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">ECONÓMICO</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-400">
                                    <span>Items</span>
                                    <span className="font-mono">${summary.itemsTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-blue-400">
                                    <span>Envío / Logística</span>
                                    <span className="font-mono">+${summary.shippingCost.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between items-end">
                                    <span className="font-bold text-white">TOTAL</span>
                                    <span className={`font-display font-bold text-xl ${isDispute ? 'text-amber-500' : 'text-green-400'}`}>${summary.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Logística */}
                        <div className="bg-[#1e2024] p-4 rounded-xl border border-gray-700 shadow-sm">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">LOGÍSTICA</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Método</span>
                                    <span className="text-white font-medium capitalize">{summary.method}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Fecha Est.</span>
                                    <span className="text-white font-medium">{summary.date || 'Pendiente'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Items</span>
                                    <span className="text-white font-medium">{summary.itemCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Ref / Guía</span>
                                    <span className="text-white font-mono text-xs bg-gray-800 px-2 py-0.5 rounded border border-gray-700">{summary.ref || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Responsable Section */}
                    <div>
                        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${isDispute ? 'text-amber-500' : 'text-green-500'}`}>
                            <span className="material-icons text-sm">badge</span> RESPONSABLE DEL REPORTE
                        </h4>
                        
                        {fixedResponsible ? (
                             <div className="p-4 bg-gray-800/50 rounded-xl border border-blue-500/30 flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                                     <span className="material-icons text-lg">lock</span>
                                 </div>
                                 <div>
                                     <p className="text-xs font-bold text-gray-400 uppercase">Responsable Fijado</p>
                                     <p className="text-sm font-bold text-white">{fixedResponsible}</p>
                                 </div>
                             </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                {contacts.map(contact => (
                                    <button
                                        key={contact.id}
                                        onClick={() => setSelectedContactId(contact.id)}
                                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 group
                                            ${selectedContactId === contact.id 
                                                ? `${isDispute ? 'bg-amber-500/10 border-amber-500 ring-amber-500/50' : 'bg-green-500/10 border-green-500 ring-green-500/50'} ring-1` 
                                                : 'bg-[#1e2024] border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200'}
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                                            ${selectedContactId === contact.id ? (isDispute ? 'bg-amber-500' : 'bg-green-500') + ' text-white' : 'bg-gray-800 text-gray-500'}`}>
                                            <span className="material-icons text-sm">person</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-xs font-bold truncate ${selectedContactId === contact.id ? 'text-white' : 'text-current'}`}>{contact.name}</p>
                                            <p className="text-[10px] opacity-60 truncate">{contact.role || 'Contacto'}</p>
                                        </div>
                                    </button>
                                ))}

                                {/* Manual Option */}
                                <button
                                    onClick={() => setSelectedContactId('manual')}
                                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3
                                        ${selectedContactId === 'manual' 
                                            ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500/50' 
                                            : 'bg-[#1e2024] border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200'}
                                    `}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                                        ${selectedContactId === 'manual' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                        <span className="material-icons text-sm">edit</span>
                                    </div>
                                    <span className={`text-xs font-bold ${selectedContactId === 'manual' ? 'text-white' : 'text-current'}`}>
                                        Otro / Manual
                                    </span>
                                </button>
                            </div>
                        )}

                        {!fixedResponsible && selectedContactId === 'manual' && (
                            <div className="animate-in fade-in slide-in-from-top-2 p-4 bg-gray-800/30 rounded-xl border border-blue-500/30 space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nombre Completo *</label>
                                    <input 
                                        type="text"
                                        value={manualName}
                                        onChange={(e) => setManualName(e.target.value)}
                                        placeholder="Ej: Juan Pérez"
                                        className="w-full bg-[#1e2024] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Email *</label>
                                        <input 
                                            type="email"
                                            value={manualEmail}
                                            onChange={(e) => setManualEmail(e.target.value)}
                                            placeholder="contacto@empresa.com"
                                            className="w-full bg-[#1e2024] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Teléfono *</label>
                                        <input 
                                            type="tel"
                                            value={manualPhone}
                                            onChange={(e) => setManualPhone(formatPhoneNumber(e.target.value))}
                                            placeholder="(555) 000-0000"
                                            maxLength={14}
                                            className="w-full bg-[#1e2024] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div>
                         <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                            COMENTARIO OPCIONAL
                        </h4>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className={`w-full bg-[#1e2024] border border-gray-700 rounded-xl p-4 text-sm text-white outline-none resize-none placeholder-gray-600 transition-all focus:ring-1 ${isDispute ? 'focus:border-amber-500 focus:ring-amber-500/50' : 'focus:border-green-500 focus:ring-green-500/50'}`}
                            rows={3}
                            placeholder={isDispute ? "Explica la razón de los cambios propuestos..." : "Mensaje para el cliente sobre el envío, cuidados especiales, etc..."}
                        />
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-[#1e2024] border-t border-gray-700 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 font-bold text-sm hover:bg-gray-800 transition-colors"
                    >
                        Volver
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className={`px-8 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all transform active:scale-95 text-white
                            ${isConfirmDisabled 
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                : theme.btnColor}
                        `}
                    >
                        <span>{theme.btnText}</span>
                        <span className="material-icons text-sm">send</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PortalConfirmationModal;