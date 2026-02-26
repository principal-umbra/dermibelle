
import React from 'react';
import { useCreateAppointment } from '../../hooks/useCreateAppointment';
import { Client } from '../../context/DataContext';

// Sub-components
import ClientSelection from './create/ClientSelection';
import DateTimeSelection from './create/DateTimeSelection';
import CatalogSelection from './create/CatalogSelection';
import AppointmentSummary from './create/AppointmentSummary';

interface CreateAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedClient?: Client;
    lockClient?: boolean;
}

const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({ 
    isOpen, onClose, preselectedClient, lockClient = false 
}) => {
    // Custom Hook that holds all logic
    const {
        mode, setMode,
        currentForm, updateForm,
        clientSearch, setClientSearch,
        catalogFilter, setCatalogFilter,
        showClientSuggestions, setShowClientSuggestions,
        viewDate, setViewDate,
        filteredClients, searchResults, topLists,
        subTotalAmount, discountAmount, totalAmount, hasStockIssues,
        handleAddItem, handleRemoveItem, handleUpdateQuantity, handleToggleUnit, handleSubmit, handleCheckAppt,
        addClient, addToast,
        clients, catalog, openStock
    } = useCreateAppointment(isOpen, onClose, preselectedClient);

    const getStepNumber = (stepName: 'client' | 'date' | 'catalog' | 'discount') => { 
        if (mode === 'link') { if (stepName === 'client') return 1; if (stepName === 'catalog') return 2; } 
        else if (mode === 'quote') { if (stepName === 'client') return 1; if (stepName === 'discount') return 2; if (stepName === 'catalog') return 3; } 
        else { if (stepName === 'client') return 1; if (stepName === 'date') return 2; if (stepName === 'catalog') return 3; }
        return 0;
    };

    const getTheme = () => {
        switch(mode) {
            case 'quote': return { bg: 'bg-indigo-600', lightBg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', icon: 'description', label: 'Cotización', desc: 'Presupuesto sin reserva.' };
            case 'link': return { bg: 'bg-blue-600', lightBg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: 'link', label: 'Vincular', desc: 'Facturar cita existente.' };
            default: return { bg: 'bg-emerald-600', lightBg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: 'shopping_cart', label: 'Venta', desc: 'Crea cita y factura.' };
        }
    };
    const theme = getTheme();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#F8F9FA] dark:bg-surface-dark rounded-3xl shadow-2xl w-full max-w-6xl border border-gray-200 dark:border-gray-700 flex flex-col h-[95vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* --- HEADER --- */}
                <div className="bg-white dark:bg-black/20 border-b border-gray-100 dark:border-gray-800 p-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="hidden md:block">
                        <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className={`material-icons ${theme.text}`}>{theme.icon}</span> 
                            {theme.label}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{theme.desc}</p>
                    </div>
                    
                    <div className="flex p-1.5 bg-gray-100 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-gray-700/50 w-full md:w-auto shadow-inner">
                        {(['new', 'link', 'quote'] as const).map((m) => {
                            const isActive = mode === m;
                            let activeClass = '';
                            let icon = '';
                            let label = '';
                            
                            if (m === 'new') { activeClass = 'bg-white dark:bg-surface-dark text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5'; icon = 'shopping_cart'; label = 'Venta'; } 
                            else if (m === 'link') { activeClass = 'bg-white dark:bg-surface-dark text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5'; icon = 'link'; label = 'Vincular'; } 
                            else { activeClass = 'bg-white dark:bg-surface-dark text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5'; icon = 'description'; label = 'Cotizar'; }

                            return (
                                <button key={m} onClick={() => setMode(m)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 ${isActive ? activeClass : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/5'}`}>
                                    <span className="material-icons text-[18px]">{icon}</span>
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <button onClick={onClose} className="hidden md:flex w-8 h-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"><span className="material-icons">close</span></button>
                </div>

                {/* --- BODY --- */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* LEFT COL */}
                    <div className="w-full md:w-6/12 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black/10 h-full overflow-hidden p-8 gap-6">
                        
                        {/* CONFIGURATION SECTION */}
                        <div className="shrink-0 space-y-5">
                            {mode === 'link' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">{getStepNumber('client')}</span><h3 className="text-sm font-bold text-gray-900 dark:text-white">Identificar Cita</h3></div>
                                    <div className="space-y-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <label className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2"><span className="material-icons text-sm">link</span> ID de Cita Existente</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={currentForm.linkApptId} onChange={e => updateForm({ linkApptId: e.target.value })} className="flex-1 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-700 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: APT-1234"/>
                                            <button onClick={handleCheckAppt} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md">Buscar</button>
                                        </div>
                                        {currentForm.linkError && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><span className="material-icons text-xs">error</span> {currentForm.linkError}</p>}
                                        {currentForm.foundAppt && (<div className="mt-2 p-3 bg-white dark:bg-black/20 rounded-lg flex justify-between items-center animate-in fade-in"><div><p className="font-bold text-sm text-gray-900 dark:text-white">{currentForm.foundAppt.clientName}</p><p className="text-xs text-gray-500">{currentForm.foundAppt.date} | {currentForm.foundAppt.time}</p></div><span className="text-green-600 material-icons text-sm">check_circle</span></div>)}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <ClientSelection 
                                        client={currentForm.client}
                                        lockClient={lockClient}
                                        updateForm={updateForm}
                                        clientSearch={clientSearch}
                                        setClientSearch={setClientSearch}
                                        showClientSuggestions={showClientSuggestions}
                                        setShowClientSuggestions={setShowClientSuggestions}
                                        filteredClients={filteredClients}
                                        addClient={addClient}
                                        addToast={addToast}
                                    />

                                    {mode !== 'quote' && (
                                        <DateTimeSelection 
                                            date={currentForm.date}
                                            time={currentForm.time}
                                            specialist={currentForm.specialist}
                                            updateForm={updateForm}
                                            viewDate={viewDate}
                                            setViewDate={setViewDate}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        {/* DISCOUNTS WIDGET (Paso 2 - Cotización) */}
                        {mode === 'quote' && (
                            <div className="shrink-0 animate-in fade-in slide-in-from-top-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">{getStepNumber('discount')}</span>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Descuentos y Ajustes</h3>
                                    </div>
                                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">Opcional</span>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    {/* Control Segmentado (Toggle % vs $) */}
                                    <div className="flex bg-gray-100 dark:bg-black/40 p-1 rounded-xl w-full sm:w-auto shrink-0 relative h-10 border border-gray-200 dark:border-gray-700 shadow-inner">
                                        <button 
                                            onClick={() => updateForm({ discountType: 'percent' })}
                                            className={`relative z-10 flex-1 sm:w-14 flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 ${currentForm.discountType === 'percent' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            %
                                        </button>
                                        <button 
                                            onClick={() => updateForm({ discountType: 'fixed' })}
                                            className={`relative z-10 flex-1 sm:w-14 flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 ${currentForm.discountType === 'fixed' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            $
                                        </button>
                                    </div>

                                    {/* Input Numérico con Sufijo */}
                                    <div className="relative flex-1 w-full group">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={currentForm.discountValue || ''}
                                            onChange={e => updateForm({ discountValue: parseFloat(e.target.value) || 0 })}
                                            className="w-full h-10 pl-4 pr-16 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-300"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none pl-3 border-l border-gray-200 dark:border-gray-700 h-5">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">
                                                {currentForm.discountType === 'percent' ? '% OFF' : 'USD'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p className="hidden xl:block text-[10px] text-gray-400 max-w-[100px] leading-tight">Ajuste global sobre el total.</p>
                                </div>
                            </div>
                        )}

                        <CatalogSelection 
                            catalog={catalog}
                            openStock={openStock}
                            searchResults={searchResults}
                            topLists={topLists}
                            catalogFilter={catalogFilter}
                            setCatalogFilter={setCatalogFilter}
                            handleAddItem={handleAddItem}
                        />

                        {/* Compact Previous Content Footer (Link Mode Only) */}
                        {mode === 'link' && currentForm.foundAppt && (
                            <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2">
                                <details className="group bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                    <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors select-none">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                <span className="material-icons text-xs">inventory_2</span>
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Historial Facturado
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="material-icons text-gray-400 text-sm transform group-open:rotate-180 transition-transform">expand_more</span>
                                        </div>
                                    </summary>
                                    <div className="px-3 pb-3 pt-0 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-black/10">
                                        <p className="text-xs text-gray-500 italic p-2">Contenido vinculado...</p>
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COL: RECEIPT PREVIEW */}
                    <AppointmentSummary 
                        client={currentForm.client}
                        items={currentForm.items}
                        date={currentForm.date}
                        time={currentForm.time}
                        subTotalAmount={subTotalAmount}
                        discountAmount={discountAmount}
                        totalAmount={totalAmount}
                        discountType={currentForm.discountType}
                        discountValue={currentForm.discountValue}
                        handleUpdateQuantity={handleUpdateQuantity}
                        handleRemoveItem={handleRemoveItem}
                        handleToggleUnit={handleToggleUnit}
                        handleSubmit={handleSubmit}
                        onClose={onClose}
                        catalog={catalog}
                        mode={mode}
                        hasStockIssues={hasStockIssues}
                    />
                </div>
            </div>
        </div>
    );
};

export default CreateAppointmentModal;
