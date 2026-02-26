
import React from 'react';

// --- TRANSPORT CARD (Compact) ---
export const TransitCarrierCard: React.FC<{
    carrier: string;
    trackingNumber: string;
    onCopy: () => void;
}> = ({ carrier, trackingNumber, onCopy }) => {
    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <span className="material-icons text-xl">local_shipping</span>
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transportista</p>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{carrier || 'Logística Interna'}</h3>
                </div>
            </div>
            
            <div 
                onClick={onCopy}
                className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-600 cursor-pointer hover:bg-gray-100 transition-colors group max-w-[50%]"
            >
                <div className="min-w-0 text-right">
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Guía / Rastreo</span>
                    <span className="block text-xs font-mono font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 transition-colors">
                        {trackingNumber || 'PENDIENTE'}
                    </span>
                </div>
                <span className="material-icons text-gray-400 text-xs group-hover:text-blue-500">content_copy</span>
            </div>
        </div>
    );
};

// --- RESPONSIBLE CARD (Merged with Actions) ---
export const TransitResponsibleCard: React.FC<{
    name: string;
    email: string;
    phone: string;
}> = ({ name, email, phone }) => {
    
    const handleAction = (type: string) => {
        // Mock action handlers, usually passed from parent but kept simple here for UI demo
        if (type === 'call') window.location.href = `tel:${phone}`;
        if (type === 'mail') window.location.href = `mailto:${email}`;
        if (type === 'chat') window.open(`https://wa.me/${phone?.replace(/\D/g,'')}`, '_blank');
    };

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-icons text-xs">badge</span> Responsable
                </p>
                {/* Inline Actions */}
                <div className="flex gap-1">
                    <button onClick={() => handleAction('chat')} className="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors" title="WhatsApp">
                        <span className="material-icons text-xs">chat</span>
                    </button>
                    <button onClick={() => handleAction('call')} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors" title="Llamar">
                        <span className="material-icons text-xs">call</span>
                    </button>
                    <button onClick={() => handleAction('mail')} className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 flex items-center justify-center transition-colors" title="Email">
                        <span className="material-icons text-xs">mail</span>
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-500 border border-white dark:border-gray-600 ring-1 ring-gray-200 dark:ring-gray-700">
                    {name.charAt(0)}
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-xs text-gray-500">
                        <span className="truncate">{email}</span>
                        <span className="hidden sm:inline text-gray-300">|</span>
                        <span className="font-mono">{phone}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- REMOVED SEPARATE CONTACT BLOCK (Integrated above) ---
// This export is kept empty or null to avoid breaking imports if strictly needed, 
// but logically replaced by the integrated buttons above.
export const ContactActionsBlock: React.FC = () => null;
