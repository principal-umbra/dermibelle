
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData, Client } from '../../context/DataContext';
import { useClientProfile } from '../../hooks/useClientProfile';
import ClientHeader from '../../components/crm/ClientHeader';
import ClientTimeline from '../../components/crm/ClientTimeline';
import ClientAppointmentsTab from '../../components/crm/ClientAppointmentsTab';
import ClientFinanceTab from '../../components/crm/ClientFinanceTab';
import CreateInvoiceModal from '../../components/invoices/CreateInvoiceModal';

// --- Helper: Phone Formatter ---
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

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
      updateClient, addClientLog, addToast, appointments 
  } = useData();

  // Use Custom Hook for Logic
  const { client, stats } = useClientProfile(id);

  // States
  const [activeTab, setActiveTab] = useState<'timeline' | 'appointments' | 'finance'>('timeline');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaveConfirmationOpen, setIsSaveConfirmationOpen] = useState(false);
  
  // Tag Management
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Edit Form State
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});
  const [localNotes, setLocalNotes] = useState('');

  // --- Modal States ---
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Effects
  useEffect(() => {
      if (client) {
          setLocalNotes(client.notes || '');
      }
  }, [client]);

  // Derived: Needed for tab counts
  const clientAppointmentsCount = appointments.filter(a => a.clientId === id).length;

  if (!client || !id || !stats) {
      return <div className="p-8 text-center text-gray-500">Cliente no encontrado.</div>;
  }

  // --- Handlers ---

  const handleCopy = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      addToast('success', `${label} copiado.`);
  };

  const startEditing = () => {
      setEditFormData({
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          status: client.status
      });
      setIsEditing(true);
  };

  const cancelEditing = () => {
      setIsEditing(false);
      setEditFormData({});
  };

  const initiateSave = () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (editFormData.email && !emailRegex.test(editFormData.email)) {
          addToast('error', 'El formato del correo electrónico no es válido.');
          return;
      }
      setIsSaveConfirmationOpen(true);
  };

  const confirmSave = () => {
      const changes: string[] = [];
      const checkChange = (field: keyof Client, label: string) => {
          const oldVal = client[field] || 'Vacío';
          const newVal = editFormData[field] || 'Vacío';
          if (newVal !== client[field]) {
              changes.push(`${label}: ${oldVal} ➝ ${newVal}`);
          }
      };
      checkChange('name', 'Nombre');
      checkChange('email', 'Email');
      checkChange('phone', 'Teléfono');
      checkChange('address', 'Dirección');
      
      updateClient(client.id, editFormData);
      
      if (changes.length > 0) {
          addClientLog({
              clientId: client.id,
              type: 'interaction',
              action: 'edit_profile',
              description: changes.join('|'), 
              date: new Date().toLocaleDateString('es-ES')
          });
      }
      
      addToast('success', 'Cliente actualizado');
      setIsSaveConfirmationOpen(false);
      setIsEditing(false);
  };

  const handleWhatsApp = () => {
      if (client.phone) {
          window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}`, '_blank');
          addClientLog({
              clientId: client.id,
              type: 'interaction',
              action: 'whatsapp',
              description: `Chat iniciado (${client.phone})`,
              date: new Date().toLocaleDateString('es-ES')
          });
      }
  };

  const handleCall = () => {
      if (client.phone) {
          window.location.href = `tel:${client.phone}`;
          addClientLog({
              clientId: client.id,
              type: 'interaction',
              action: 'call',
              description: `Llamada saliente (${client.phone})`,
              date: new Date().toLocaleDateString('es-ES')
          });
      }
  };

  const handleEmail = () => {
      window.location.href = `mailto:${client.email}`;
      addClientLog({
          clientId: client.id,
              type: 'interaction',
              action: 'email',
              description: `Email enviado a ${client.email}`,
              date: new Date().toLocaleDateString('es-ES')
      });
  };

  const handleNotesBlur = () => {
      const oldNotes = (client.notes || '').trim();
      const newNotes = localNotes.trim();

      if (newNotes !== oldNotes) {
          updateClient(client.id, { notes: newNotes });
          addClientLog({
              clientId: client.id,
              type: 'note',
              action: 'manual_note',
              description: `Nota editada: "${newNotes}"`,
              date: new Date().toLocaleDateString('es-ES')
          });
          addToast('success', 'Notas guardadas');
      }
  };

  const handleAddTag = () => {
      if (newTagInput.trim()) {
          const newTags = client.tags ? [...client.tags, newTagInput.trim()] : [newTagInput.trim()];
          updateClient(client.id, { tags: newTags });
          setNewTagInput('');
      }
  };

  const handleRemoveTag = (tag: string) => {
      const newTags = client.tags?.filter(t => t !== tag);
      updateClient(client.id, { tags: newTags });
  };

  const openUnifiedCreateModal = () => {
      setIsInvoiceModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-background-dark relative font-body">
        
        {/* Main Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-40 space-y-4 custom-scrollbar">
            <div className="max-w-[1400px] mx-auto space-y-4">
                
                {/* 0. Top Navigation */}
                <div className="flex justify-between items-center px-1">
                    <button 
                        onClick={() => navigate('/admin/crm/clients')} 
                        className="flex items-center gap-2 text-gray-500 hover:text-primary transition-all text-xs font-bold uppercase tracking-wider group hover:-translate-x-1"
                    >
                        <div className="w-6 h-6 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-icons text-sm">arrow_back</span>
                        </div>
                        Volver a Clientes
                    </button>
                </div>

                {/* 1. HEADER COMPONENT (Extracted) */}
                <ClientHeader 
                    client={client}
                    stats={stats}
                    isEditing={isEditing}
                    editFormData={editFormData}
                    setEditFormData={setEditFormData}
                    onCopy={handleCopy}
                />

                {/* 2. Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Sidebar (Sticky) */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
                        
                        {/* Contact Card */}
                        <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden group">
                            
                            {/* Header Row with Actions */}
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50 dark:border-gray-800">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-icons text-base text-primary/80">perm_contact_calendar</span> 
                                    Detalle Contacto
                                </h3>
                                
                                {/* ACTION BUTTONS */}
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <button 
                                                onClick={cancelEditing} 
                                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold transition-all shadow-sm"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={initiateSave} 
                                                className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-bold shadow-md shadow-primary/20 hover:bg-green-800 transition-all flex items-center gap-1.5 animate-in zoom-in"
                                            >
                                                <span className="material-icons text-[12px]">save</span> Guardar
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={startEditing} 
                                            className="px-3 py-1 bg-white border border-gray-200 hover:border-primary/50 text-gray-600 hover:text-primary rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5 hover:bg-gray-50"
                                        >
                                            <span className="material-icons text-[12px]">edit</span> Editar
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Phone */}
                                <div className="group/item">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-11 mb-1 block">Móvil / Celular</label>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${isEditing ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                                            <span className="material-icons text-sm">smartphone</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            {isEditing ? (
                                                <input 
                                                    type="tel"
                                                    value={editFormData.phone} 
                                                    onChange={e => {
                                                        const formatted = formatPhoneNumber(e.target.value);
                                                        setEditFormData({...editFormData, phone: formatted});
                                                    }}
                                                    className="w-full text-sm bg-gray-50 border-b-2 border-primary/30 focus:border-primary rounded-t px-2 py-1 outline-none transition-all"
                                                    placeholder="(555) 000-0000"
                                                    maxLength={14}
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-gray-900 dark:text-white font-mono tracking-wide">{client.phone || 'Sin registrar'}</p>
                                            )}
                                            {!isEditing && (
                                                <div className="flex gap-1">
                                                    <button onClick={handleWhatsApp} className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors shadow-sm" title="WhatsApp"><span className="material-icons text-[14px]">chat</span></button>
                                                    <button onClick={handleCall} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm" title="Llamar"><span className="material-icons text-[14px]">call</span></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="group/item">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-11 mb-1 block">Correo Electrónico</label>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${isEditing ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                                            <span className="material-icons text-sm">alternate_email</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            {isEditing ? (
                                                <input 
                                                    type="email"
                                                    value={editFormData.email} 
                                                    onChange={e => setEditFormData({...editFormData, email: e.target.value})} 
                                                    className="w-full text-sm bg-gray-50 border-b-2 border-primary/30 focus:border-primary rounded-t px-2 py-1 outline-none transition-all"
                                                    placeholder="cliente@email.com"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{client.email}</p>
                                            )}
                                            {!isEditing && (
                                                <button onClick={handleEmail} className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition-colors shadow-sm" title="Enviar Email"><span className="material-icons text-[14px]">mail</span></button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-11 mb-1 block">Dirección Principal</label>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${isEditing ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                                            <span className="material-icons text-sm">place</span>
                                        </div>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <textarea 
                                                    value={editFormData.address} 
                                                    onChange={e => setEditFormData({...editFormData, address: e.target.value})} 
                                                    className="w-full text-sm bg-gray-50 border-b-2 border-primary/30 focus:border-primary rounded-t px-2 py-1 outline-none transition-all resize-none"
                                                    rows={2}
                                                    placeholder="Dirección completa"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{client.address || 'Sin dirección registrada'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes & Tags */}
                        <div className="bg-gradient-to-b from-[#fffbeb] to-[#fff7ed] dark:from-yellow-900/10 dark:to-orange-900/10 rounded-[1.5rem] shadow-sm border border-yellow-100 dark:border-yellow-900/20 p-6 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <span className="material-icons text-6xl text-yellow-600">sticky_note_2</span>
                            </div>
                            
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <h3 className="text-xs font-bold text-yellow-800 dark:text-yellow-200 uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-icons text-sm">label</span> Etiquetas
                                </h3>
                                <button onClick={() => setIsManagingTags(!isManagingTags)} className="text-[10px] font-bold text-yellow-700 hover:text-yellow-900 bg-yellow-200/50 px-2 py-1 rounded transition-colors">
                                    {isManagingTags ? 'Listo' : 'Gestionar'}
                                </button>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-6 relative z-10 min-h-[30px]">
                                {client.tags?.map((tag, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/80 text-yellow-900 border border-yellow-200 shadow-sm">
                                        {tag}
                                        {isManagingTags && <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-red-400 hover:text-red-600 font-bold">×</button>}
                                    </span>
                                ))}
                                {isManagingTags && (
                                    <div className="flex items-center gap-1 animate-in fade-in">
                                        <input 
                                            value={newTagInput} 
                                            onChange={e => setNewTagInput(e.target.value)} 
                                            onKeyDown={e => e.key === 'Enter' && handleAddTag()} 
                                            className="w-20 text-[11px] bg-white border border-yellow-300 rounded px-2 py-1 focus:ring-1 focus:ring-yellow-500 outline-none" 
                                            placeholder="Nueva..." 
                                            autoFocus
                                        />
                                        <button onClick={handleAddTag} className="text-yellow-700 bg-yellow-200 rounded p-0.5 hover:bg-yellow-300"><span className="material-icons text-sm">add</span></button>
                                    </div>
                                )}
                                {!isManagingTags && (!client.tags || client.tags.length === 0) && (
                                    <span className="text-xs text-yellow-700/50 italic">Sin etiquetas</span>
                                )}
                            </div>

                            <h3 className="text-xs font-bold text-yellow-800 dark:text-yellow-200 uppercase tracking-wider mb-2 flex items-center gap-2 relative z-10">
                                <span className="material-icons text-sm">edit_note</span> Notas Privadas
                            </h3>
                            <div className="relative z-10">
                                <textarea 
                                    value={localNotes}
                                    onChange={e => setLocalNotes(e.target.value)}
                                    onBlur={handleNotesBlur}
                                    className="w-full h-32 bg-white/60 dark:bg-black/10 rounded-xl border border-yellow-200/50 text-sm text-gray-700 p-3 resize-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 outline-none placeholder:text-gray-400/70 transition-all shadow-inner"
                                    placeholder="Escribe notas privadas aquí..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: MAIN TABS & CONTENT - STACKED LAYOUT CHANGE (Fixing Scroll Bleed) */}
                    <div className="lg:col-span-8 flex flex-col h-full min-h-[600px] relative">
                        
                        {/* STICKY TABS WRAPPER (Outside the card to mask scrolling content) */}
                        <div className="sticky top-0 z-20 pt-1 pb-4 bg-[#f8fafc] dark:bg-background-dark">
                            <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-2 flex justify-between items-center">
                                <div className="flex gap-6 overflow-x-auto no-scrollbar">
                                    {[
                                        { id: 'timeline', label: 'Historia', icon: 'history_edu' },
                                        { id: 'appointments', label: `Citas (${clientAppointmentsCount})`, icon: 'calendar_month' },
                                        { id: 'finance', label: 'Facturas', icon: 'receipt_long' }
                                    ].map((tab) => (
                                        <button 
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)} 
                                            className={`py-2 px-1 font-bold text-xs md:text-sm flex items-center gap-2 transition-all relative whitespace-nowrap group ${
                                                activeTab === tab.id 
                                                ? 'text-primary' 
                                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            <span className={`material-icons text-lg group-hover:scale-110 transition-transform ${activeTab === tab.id ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}`}>{tab.icon}</span>
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <div className="absolute -bottom-2 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.5)]"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="flex gap-2">
                                    {activeTab === 'appointments' && (
                                        <button 
                                            onClick={openUnifiedCreateModal}
                                            className="bg-primary hover:bg-green-800 text-white px-3 py-1.5 rounded-lg shadow-sm shadow-primary/30 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 text-xs font-bold"
                                        >
                                            <span className="material-icons text-xs">add</span>
                                            Nueva Cita
                                        </button>
                                    )}
                                    {activeTab === 'finance' && (
                                        <button 
                                            onClick={openUnifiedCreateModal}
                                            className="bg-primary hover:bg-green-800 text-white px-3 py-1.5 rounded-lg shadow-sm shadow-primary/30 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 text-xs font-bold"
                                        >
                                            <span className="material-icons text-xs">add</span>
                                            Nueva Factura
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content Area - Rounded Card BELOW the sticky header */}
                        <div className="bg-white dark:bg-surface-dark rounded-[2rem] shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col flex-1 overflow-hidden min-h-[500px]">
                            <div className="p-6 md:p-8 flex-1 bg-[#FAFAFA] dark:bg-black/10 overflow-y-auto custom-scrollbar">
                                {activeTab === 'timeline' && <ClientTimeline clientId={id} />}
                                {activeTab === 'appointments' && <ClientAppointmentsTab clientId={id} />}
                                {activeTab === 'finance' && <ClientFinanceTab clientId={id} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Confirmation Modal */}
        {isSaveConfirmationOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700 animate-in zoom-in-95">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-primary/10 text-primary mx-auto ring-4 ring-primary/5">
                        <span className="material-icons text-2xl">save</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">¿Guardar Cambios?</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 text-center leading-relaxed">
                        Se actualizará el perfil y se registrará una entrada automática en la cronología.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setIsSaveConfirmationOpen(false)} className="flex-1 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
                        <button onClick={confirmSave} className="flex-1 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-green-800 transition-all">Confirmar</button>
                    </div>
                </div>
            </div>
        )}

        {/* Unified Invoice/Appointment Modal */}
        <CreateInvoiceModal 
            isOpen={isInvoiceModalOpen} 
            onClose={() => setIsInvoiceModalOpen(false)} 
            preselectedClient={client} 
            lockClient={true} 
        />
    </div>
  );
};

export default ClientDetails;
