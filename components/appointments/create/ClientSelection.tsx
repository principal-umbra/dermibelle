
import React, { useState } from 'react';
import { Client } from '../../../context/DataContext';

interface ClientSelectionProps {
    client: Client | null;
    lockClient: boolean;
    updateForm: (updates: any) => void;
    clientSearch: string;
    setClientSearch: (val: string) => void;
    showClientSuggestions: boolean;
    setShowClientSuggestions: (val: boolean) => void;
    filteredClients: Client[];
    addClient: (client: any) => string;
    addToast: (type: any, msg: string) => void;
}

const ClientSelection: React.FC<ClientSelectionProps> = ({
    client, lockClient, updateForm, clientSearch, setClientSearch,
    showClientSuggestions, setShowClientSuggestions, filteredClients, addClient, addToast
}) => {
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientData, setNewClientData] = useState({ name: '', email: '', phone: '' });

    const handleAddClient = (c: Client) => { 
        updateForm({ client: c }); 
        setClientSearch(''); 
        setShowClientSuggestions(false); 
    };

    const handleCreateClient = () => {
        if (!newClientData.name) { addToast('error', 'El nombre es obligatorio.'); return; }
        const newId = addClient({
            name: newClientData.name,
            email: newClientData.email || 'Sin email',
            phone: newClientData.phone || '',
            avatar: null,
            initials: newClientData.name.substring(0, 2).toUpperCase(),
            status: 'New',
            lastVisit: '-',
            totalSpent: 0
        });
        const newClientObj: Client = { id: newId, name: newClientData.name, email: newClientData.email || 'Sin email', phone: newClientData.phone || '', avatar: null, initials: newClientData.name.substring(0, 2).toUpperCase(), status: 'New', lastVisit: '-', totalSpent: 0, tags: [] };
        updateForm({ client: newClientObj });
        setIsCreatingClient(false);
        setNewClientData({ name: '', email: '', phone: '' });
        addToast('success', 'Cliente creado y seleccionado.');
    };

    return (
        <div className="relative z-30 space-y-3">
            <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">1</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cliente</h3>
            </div>
            {client ? (
                <div className={`flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700 group ${lockClient ? 'border-primary/20 bg-primary/5' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{client.initials}</div>
                        <div><p className="text-sm font-bold text-gray-900 dark:text-white">{client.name}</p><p className="text-[10px] text-gray-500">{client.email}</p></div>
                    </div>
                    {!lockClient && (
                        <button onClick={() => updateForm({ client: null })} className="text-gray-400 hover:text-red-500 p-1"><span className="material-icons text-sm">close</span></button>
                    )}
                    {lockClient && (
                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded font-bold">LOCKED</span>
                    )}
                </div>
            ) : isCreatingClient ? (
                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nuevo Cliente</span>
                        <button onClick={() => setIsCreatingClient(false)} className="text-gray-400 hover:text-gray-600"><span className="material-icons text-sm">close</span></button>
                    </div>
                    <input 
                        autoFocus
                        className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg text-xs outline-none focus:border-primary transition-colors"
                        placeholder="Nombre Completo *"
                        value={newClientData.name}
                        onChange={e => setNewClientData({...newClientData, name: e.target.value})}
                    />
                    <div className="flex gap-2">
                        <input 
                            className="w-1/2 px-3 py-1.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg text-xs outline-none focus:border-primary transition-colors"
                            placeholder="Email"
                            value={newClientData.email}
                            onChange={e => setNewClientData({...newClientData, email: e.target.value})}
                        />
                        <input 
                            className="w-1/2 px-3 py-1.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg text-xs outline-none focus:border-primary transition-colors"
                            placeholder="Teléfono"
                            value={newClientData.phone}
                            onChange={e => setNewClientData({...newClientData, phone: e.target.value})}
                        />
                    </div>
                    <button 
                        onClick={handleCreateClient}
                        disabled={!newClientData.name}
                        className="w-full py-1.5 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Guardar y Seleccionar
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-lg">search</span>
                        <input type="text" value={clientSearch} onChange={e => { setClientSearch(e.target.value); setShowClientSuggestions(true); }} onFocus={() => setShowClientSuggestions(true)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Buscar cliente..." />
                        {showClientSuggestions && clientSearch && (<div className="absolute top-full left-0 w-full bg-white dark:bg-surface-dark shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl mt-1 max-h-60 overflow-y-auto z-50">{filteredClients.map(c => (<div key={c.id} onClick={() => handleAddClient(c)} className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 last:border-0"><div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">{c.initials}</div><div><p className="text-sm font-bold text-gray-800 dark:text-white">{c.name}</p><p className="text-[10px] text-gray-500">{c.email}</p></div></div>))}</div>)}
                    </div>
                    <button onClick={() => setIsCreatingClient(true)} className="w-10 h-10 shrink-0 flex items-center justify-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-primary hover:border-primary transition-colors shadow-sm" title="Crear nuevo cliente"><span className="material-icons text-xl">person_add</span></button>
                </div>
            )}
        </div>
    );
};

export default ClientSelection;
