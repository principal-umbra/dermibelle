
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData, Supplier, SupplierContact } from '../../context/DataContext';
import { useSupplierProfile } from '../../hooks/useSupplierProfile';
import SupplierHeader from '../../components/crm/SupplierHeader';
import SupplierTimeline from '../../components/crm/SupplierTimeline';
import SupplierOrdersTab from '../../components/crm/SupplierOrdersTab';
import SupplierCatalogTab from '../../components/crm/SupplierCatalogTab';
import SupplierInvoicesTab from '../../components/crm/SupplierInvoicesTab';

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

// --- Helper: Bank Account Masker ---
const maskBankAccount = (account: string) => {
    if (!account) return '';
    if (account.includes('****')) return account;
    const visibleDigits = 4;
    if (account.length <= visibleDigits) return account;
    const last4 = account.slice(-visibleDigits);
    return `**** ${last4}`;
};

const SupplierDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateSupplier, addClientLog, addToast } = useData();

  const { supplier, stats } = useSupplierProfile(id);

  const [activeTab, setActiveTab] = useState<'timeline' | 'orders' | 'invoices' | 'catalog'>('timeline');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaveConfirmationOpen, setIsSaveConfirmationOpen] = useState(false);
  
  // Tag Management
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Local State for Banking Fields
  const [bankDetails, setBankDetails] = useState({
      bankName: '',
      bankAccount: '',
      bankAccountType: 'Checking / Corriente',
      bankAccountHolder: '',
      bankId: '', 
      routingNumber: ''
  });

  // Local State for Shipping Costs
  const [shippingCosts, setShippingCosts] = useState({
      standard: 0,
      express: 0
  });

  const [editFormData, setEditFormData] = useState<Partial<Supplier> & { 
      currency?: string, 
      paymentMethod?: string, 
      billingEmail?: string, 
      bankName?: string, 
      bankAccount?: string,
      bankAccountType?: string,
      bankAccountHolder?: string,
      bankId?: string,
      routingNumber?: string,
      category?: string
  }>({});
  
  const [localNotes, setLocalNotes] = useState('');

  useEffect(() => {
      if (supplier) {
          setLocalNotes(supplier.notes || '');
          // Inicializar costos de envío desde la data del proveedor
          setShippingCosts({
              standard: supplier.shippingCosts?.standard || 0,
              express: supplier.shippingCosts?.express || 0
          });
      }
  }, [supplier]);

  if (!supplier || !id || !stats) {
      return <div className="p-8 text-center text-gray-500">Proveedor no encontrado.</div>;
  }

  const handleCopy = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      addToast('success', `${label} copiado.`);
  };

  const startEditing = () => {
      const initialContacts = (supplier.contacts && supplier.contacts.length > 0) 
          ? supplier.contacts 
          : [{ id: 'c1', name: supplier.contactPerson, email: supplier.email, phone: supplier.phone }];
      
      const initialWebsites = (supplier.websites && supplier.websites.length > 0)
          ? supplier.websites
          : (supplier.website ? [supplier.website] : []);

      setEditFormData({
          companyName: supplier.companyName,
          contacts: initialContacts,
          websites: initialWebsites,
          address: supplier.address,
          taxId: supplier.taxId,
          paymentTerms: supplier.paymentTerms,
          status: supplier.status,
          category: supplier.category,
          currency: 'USD',
          paymentMethod: 'Transferencia ACH',
          billingEmail: `billing@${supplier.companyName.split(' ')[0].toLowerCase()}.com`,
          bankName: bankDetails.bankName,
          bankAccount: bankDetails.bankAccount,
          bankAccountType: bankDetails.bankAccountType,
          bankAccountHolder: bankDetails.bankAccountHolder,
          bankId: bankDetails.bankId,
          routingNumber: bankDetails.routingNumber
      });
      
      // Ensure shipping costs are synced for editing
      setShippingCosts({
          standard: (supplier as any).shippingCosts?.standard || 0,
          express: (supplier as any).shippingCosts?.express || 0
      });

      setIsEditing(true);
  };

  const cancelEditing = () => {
      setIsEditing(false);
      setEditFormData({});
  };

  const initiateSave = () => setIsSaveConfirmationOpen(true);

  const confirmSave = () => {
      const changes: string[] = [];
      const checkChange = (field: keyof Supplier, label: string) => {
          const oldVal = supplier[field] || 'Vacío';
          const newVal = editFormData[field] || 'Vacío';
          if (typeof newVal === 'string' && newVal !== oldVal) {
              changes.push(`${label}: ${oldVal} ➝ ${newVal}`);
          }
      };
      
      checkChange('companyName', 'Empresa');
      checkChange('address', 'Dirección');
      checkChange('category', 'Categoría');
      
      const primaryContact = editFormData.contacts?.[0] || { name: '', email: '', phone: '' };
      const primaryWebsite = editFormData.websites?.[0] || '';

      const updatedSupplier: Partial<Supplier> = {
          ...editFormData,
          contactPerson: primaryContact.name,
          email: primaryContact.email || '',
          phone: primaryContact.phone || '',
          website: primaryWebsite,
          // Save shipping costs to supplier object (extending type implicitly)
          shippingCosts: {
              standard: shippingCosts.standard,
              express: shippingCosts.express,
              pickup: 0
          }
      } as any;

      setBankDetails({
          bankName: editFormData.bankName || '',
          bankAccount: editFormData.bankAccount || '',
          bankAccountType: editFormData.bankAccountType || '',
          bankAccountHolder: editFormData.bankAccountHolder || '',
          bankId: editFormData.bankId || '',
          routingNumber: editFormData.routingNumber || ''
      });

      updateSupplier(supplier.id, updatedSupplier);
      
      if (changes.length > 0 || (editFormData.contacts?.length !== supplier.contacts?.length)) {
          addClientLog({
              clientId: supplier.id, 
              type: 'interaction',
              action: 'edit_profile',
              description: `Actualización Perfil: ${changes.join('|') || 'Datos de Contacto modificados'}`, 
              date: new Date().toLocaleDateString('es-ES')
          });
      }
      
      addToast('success', 'Proveedor actualizado');
      setIsSaveConfirmationOpen(false);
      setIsEditing(false);
  };

  // --- Dynamic Form Handlers ---
  const handleContactChange = (index: number, field: keyof SupplierContact, value: string) => {
      const newContacts = [...(editFormData.contacts || [])];
      newContacts[index] = { ...newContacts[index], [field]: value };
      setEditFormData({ ...editFormData, contacts: newContacts });
  };

  const addContactSlot = () => {
      if ((editFormData.contacts?.length || 0) >= 4) {
          addToast('error', 'Máximo 4 contactos permitidos.');
          return;
      }
      setEditFormData({
          ...editFormData,
          contacts: [...(editFormData.contacts || []), { id: `new-${Date.now()}`, name: '' }]
      });
  };

  const removeContactSlot = (index: number) => {
      const newContacts = [...(editFormData.contacts || [])];
      newContacts.splice(index, 1);
      setEditFormData({ ...editFormData, contacts: newContacts });
  };

  const handleWebsiteChange = (index: number, value: string) => {
      const newWebsites = [...(editFormData.websites || [])];
      newWebsites[index] = value;
      setEditFormData({ ...editFormData, websites: newWebsites });
  };

  const addWebsiteSlot = () => {
      if ((editFormData.websites?.length || 0) >= 4) {
          addToast('error', 'Máximo 4 sitios web permitidos.');
          return;
      }
      setEditFormData({
          ...editFormData,
          websites: [...(editFormData.websites || []), '']
      });
  };

  const removeWebsiteSlot = (index: number) => {
      const newWebsites = [...(editFormData.websites || [])];
      newWebsites.splice(index, 1);
      setEditFormData({ ...editFormData, websites: newWebsites });
  };

  // --- Interaction Handlers ---
  const handleWhatsApp = (phone: string) => {
      if (phone) {
          window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
          addClientLog({
              clientId: supplier.id,
              type: 'interaction',
              action: 'whatsapp',
              description: `Chat iniciado (${phone})`,
              date: new Date().toLocaleDateString('es-ES')
          });
      }
  };

  const handleCall = (phone: string) => {
      if (phone) {
          window.location.href = `tel:${phone}`;
          addClientLog({
              clientId: supplier.id,
              type: 'interaction',
              action: 'call',
              description: `Llamada saliente (${phone})`,
              date: new Date().toLocaleDateString('es-ES')
          });
      }
  };

  const handleEmail = (email: string) => {
      window.location.href = `mailto:${email}`;
      addClientLog({
          clientId: supplier.id,
              type: 'interaction',
              action: 'email',
              description: `Email enviado a ${email}`,
              date: new Date().toLocaleDateString('es-ES')
      });
  };

  const handleNotesBlur = () => {
      const oldNotes = (supplier.notes || '').trim();
      const newNotes = localNotes.trim();

      if (newNotes !== oldNotes) {
          updateSupplier(supplier.id, { notes: newNotes });
          addClientLog({
              clientId: supplier.id,
              type: 'note',
              action: 'manual_note',
              description: `Nota editada: "${newNotes}"`,
              date: new Date().toLocaleDateString('es-ES')
          });
          addToast('success', 'Acuerdos guardados');
      }
  };

  const handleAddTag = () => {
      if (newTagInput.trim()) {
          const newTags = supplier.tags ? [...supplier.tags, newTagInput.trim()] : [newTagInput.trim()];
          updateSupplier(supplier.id, { tags: newTags });
          setNewTagInput('');
      }
  };

  const handleRemoveTag = (tag: string) => {
      const newTags = supplier.tags?.filter(t => t !== tag);
      updateSupplier(supplier.id, { tags: newTags });
  };

  // Safe data for rendering
  const displayContacts = (supplier.contacts && supplier.contacts.length > 0) 
      ? supplier.contacts 
      : [{ id: 'default', name: supplier.contactPerson, email: supplier.email, phone: supplier.phone, role: 'Principal' }];
  
  const displayWebsites = (supplier.websites && supplier.websites.length > 0)
      ? supplier.websites
      : (supplier.website ? [supplier.website] : []);

  const displayCurrency = editFormData.currency || 'USD';
  const displayMethod = editFormData.paymentMethod || 'Transferencia ACH';
  const displayBillingEmail = editFormData.billingEmail || `billing@${supplier.companyName.toLowerCase().replace(/\s/g, '')}.com`;
  
  // Safe access to shipping costs for read mode (mocking if property doesn't exist on type yet)
  const readShippingCosts = (supplier as any).shippingCosts || { standard: 0, express: 0, pickup: 0 };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-background-dark relative font-body">
        
        {/* Main Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-40 space-y-4 custom-scrollbar">
            <div className="max-w-[1400px] mx-auto space-y-4">
                
                {/* 0. Top Navigation */}
                <div className="flex justify-between items-center px-1">
                    <button 
                        onClick={() => navigate('/admin/crm/suppliers')} 
                        className="flex items-center gap-2 text-gray-500 hover:text-primary transition-all text-xs font-bold uppercase tracking-wider group hover:-translate-x-1"
                    >
                        <div className="w-6 h-6 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-icons text-sm">arrow_back</span>
                        </div>
                        Volver a Proveedores
                    </button>
                </div>

                {/* 1. HEADER COMPONENT */}
                <SupplierHeader 
                    supplier={supplier}
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
                            
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-icons text-base text-primary/80">perm_contact_calendar</span> 
                                    Contactos
                                </h3>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <button onClick={cancelEditing} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold transition-all shadow-sm">Cancelar</button>
                                            <button onClick={initiateSave} className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-bold shadow-md shadow-primary/20 hover:bg-green-800 transition-all flex items-center gap-1.5 animate-in zoom-in">
                                                <span className="material-icons text-[12px]">save</span> Guardar
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={startEditing} className="px-3 py-1 bg-white border border-gray-200 hover:border-primary/50 text-gray-600 hover:text-primary rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5 hover:bg-gray-50">
                                            <span className="material-icons text-[12px]">edit</span> Editar
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* ... (Contacts logic remains unchanged) ... */}
                            <div className="space-y-3"> 
                                {isEditing ? (
                                    <div className="space-y-3">
                                        {editFormData.contacts?.map((contact, idx) => (
                                            <div key={contact.id || idx} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-700 relative group/edit">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Contacto #{idx + 1}</span>
                                                    {editFormData.contacts && editFormData.contacts.length > 1 && (
                                                        <button onClick={() => removeContactSlot(idx)} className="text-red-400 hover:text-red-600"><span className="material-icons text-sm">delete</span></button>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <input 
                                                        value={contact.name} 
                                                        onChange={e => handleContactChange(idx, 'name', e.target.value)}
                                                        className="w-full text-sm font-bold bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary"
                                                        placeholder="Nombre Completo"
                                                    />
                                                    <input 
                                                        value={contact.role || ''} 
                                                        onChange={e => handleContactChange(idx, 'role', e.target.value)}
                                                        className="w-full text-xs bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary"
                                                        placeholder="Cargo / Rol (Opcional)"
                                                    />
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="tel"
                                                            value={contact.phone || ''} 
                                                            onChange={e => {
                                                                const formatted = formatPhoneNumber(e.target.value);
                                                                handleContactChange(idx, 'phone', formatted);
                                                            }}
                                                            className="w-1/2 text-xs bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary"
                                                            placeholder="(555) 000-0000"
                                                            maxLength={14}
                                                        />
                                                        <input 
                                                            value={contact.email || ''} 
                                                            onChange={e => handleContactChange(idx, 'email', e.target.value)}
                                                            className="w-1/2 text-xs bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary"
                                                            placeholder="Email"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(editFormData.contacts?.length || 0) < 4 && (
                                            <button onClick={addContactSlot} className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors">
                                                <span className="material-icons text-sm">person_add</span> Agregar Contacto
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {displayContacts.map((contact, idx) => (
                                            <div key={idx} className="bg-gray-50/80 dark:bg-white/5 rounded-xl p-2.5 border border-gray-100 dark:border-gray-800 transition-colors hover:border-gray-200">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm
                                                        ${idx === 0 
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                                            : 'bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-100 dark:border-gray-700'}`}
                                                    >
                                                        <span className="material-icons text-sm">person</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1 leading-none">
                                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{contact.name}</p>
                                                        {contact.role && (
                                                            <p className="text-[9px] text-gray-500 uppercase font-bold truncate mt-0.5">
                                                                {contact.role}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1 pl-[2.25rem]"> 
                                                    {contact.phone && (
                                                        <div className="flex items-center justify-between h-5">
                                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300 truncate">
                                                                <span className="material-icons text-gray-400 text-[10px]">call</span>
                                                                <span className="font-mono">{contact.phone}</span>
                                                            </div>
                                                            <div className="flex gap-1 shrink-0">
                                                                <button onClick={() => handleWhatsApp(contact.phone!)} className="text-green-600 hover:bg-green-100 p-0.5 rounded transition-colors"><span className="material-icons text-[12px]">chat</span></button>
                                                                <button onClick={() => handleCall(contact.phone!)} className="text-blue-600 hover:bg-blue-100 p-0.5 rounded transition-colors"><span className="material-icons text-[12px]">call</span></button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {contact.email && (
                                                        <div className="flex items-center justify-between h-5">
                                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300 min-w-0 pr-1 truncate">
                                                                <span className="material-icons text-gray-400 text-[10px] shrink-0">mail</span>
                                                                <span className="truncate">{contact.email}</span>
                                                            </div>
                                                            <button onClick={() => handleEmail(contact.email!)} className="text-orange-600 hover:bg-orange-100 p-0.5 rounded transition-colors shrink-0"><span className="material-icons text-[12px]">send</span></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {isEditing ? (
                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Sitios Web</label>
                                        <div className="space-y-2">
                                            {editFormData.websites?.map((site, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input 
                                                        value={site} 
                                                        onChange={e => handleWebsiteChange(idx, e.target.value)}
                                                        className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary"
                                                        placeholder="www.ejemplo.com"
                                                    />
                                                    <button onClick={() => removeWebsiteSlot(idx)} className="text-red-400 hover:text-red-600"><span className="material-icons text-sm">remove_circle</span></button>
                                                </div>
                                            ))}
                                            {(editFormData.websites?.length || 0) < 4 && (
                                                <button onClick={addWebsiteSlot} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1">
                                                    <span className="material-icons text-[12px]">add</span> Agregar Web
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    displayWebsites.length > 0 && (
                                        <div className="bg-gray-50/80 dark:bg-white/5 rounded-xl p-2.5 border border-gray-100 dark:border-gray-800 mt-2">
                                            <div className="space-y-1">
                                                {displayWebsites.map((site, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 group cursor-pointer hover:bg-white dark:hover:bg-white/10 p-1 rounded transition-colors">
                                                        <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400">
                                                            <span className="material-icons text-[10px]">language</span>
                                                        </div>
                                                        <a href={`https://${site.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline truncate block flex-1">
                                                            {site}
                                                        </a>
                                                        <span className="material-icons text-gray-300 text-[10px] opacity-0 group-hover:opacity-100 -rotate-45">arrow_forward</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                )}

                                <div className="bg-gray-50/80 dark:bg-white/5 rounded-xl p-2.5 border border-gray-100 dark:border-gray-800 mt-2 flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400">
                                        <span className="material-icons text-xs">place</span>
                                    </div>
                                    <div className="flex-1 pt-0.5 min-w-0">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5 leading-none">Dirección Principal</p>
                                        {isEditing ? (
                                            <textarea 
                                                value={editFormData.address} 
                                                onChange={e => setEditFormData({...editFormData, address: e.target.value})} 
                                                className="w-full text-xs bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary resize-none mt-1"
                                                rows={2}
                                                placeholder="Dirección completa"
                                            />
                                        ) : (
                                            <p className="text-xs font-medium text-gray-900 dark:text-white leading-snug break-words">
                                                {supplier.address || 'Sin dirección registrada'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Fiscal Data */}
                        <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <span className="material-icons text-base text-gray-400">receipt_long</span> 
                                Datos Fiscales & Pago
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">ID Fiscal</span>
                                        {isEditing ? (
                                            <input value={editFormData.taxId || ''} onChange={e => setEditFormData({...editFormData, taxId: e.target.value})} className="w-full text-xs border rounded p-1"/>
                                        ) : (
                                            <span className="text-sm font-mono font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700">{supplier.taxId || '-'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Términos Pago</span>
                                        {isEditing ? (
                                            <select 
                                                value={editFormData.paymentTerms || 'Contado'} 
                                                onChange={e => setEditFormData({...editFormData, paymentTerms: e.target.value})} 
                                                className="w-full text-xs border border-gray-200 rounded p-1 bg-white dark:bg-black/20 dark:border-gray-700 dark:text-white outline-none focus:border-primary"
                                            >
                                                <option value="Contado">Contado (Inmediato)</option>
                                                <option value="Net 7">Net 7 (7 días)</option>
                                                <option value="Net 15">Net 15 (15 días)</option>
                                                <option value="Net 30">Net 30 (30 días)</option>
                                                <option value="Net 60">Net 60 (60 días)</option>
                                                <option value="Net 90">Net 90 (90 días)</option>
                                            </select>
                                        ) : (
                                            <div>
                                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{supplier.paymentTerms || 'Contado'}</span>
                                                {(supplier.paymentTerms && supplier.paymentTerms.startsWith('Net')) && (
                                                    <span className="block text-[9px] text-gray-400 font-medium">
                                                        Vence {supplier.paymentTerms.split(' ')[1]} días post-factura
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Moneda</span>
                                        {isEditing ? (
                                            <select value={editFormData.currency || 'USD'} onChange={e => setEditFormData({...editFormData, currency: e.target.value})} className="w-full text-xs border rounded p-1 bg-white">
                                                <option value="USD">USD - Dólar</option>
                                                <option value="EUR">EUR - Euro</option>
                                                <option value="MXN">MXN - Peso</option>
                                                <option value="DOP">DOP - Peso</option>
                                            </select>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-icons text-xs text-green-600">payments</span>
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{displayCurrency}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Método Preferido</span>
                                        {isEditing ? (
                                            <select 
                                                value={editFormData.paymentMethod || 'Transferencia ACH'} 
                                                onChange={e => setEditFormData({...editFormData, paymentMethod: e.target.value})} 
                                                className="w-full text-xs border border-gray-200 rounded p-1 bg-white dark:bg-black/20 dark:border-gray-700 dark:text-white outline-none focus:border-primary"
                                            >
                                                <option value="Transferencia ACH">Transferencia ACH</option>
                                                <option value="Transferencia Wire">Transferencia Wire</option>
                                                <option value="Cheque">Cheque</option>
                                                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                                                <option value="Efectivo">Efectivo</option>
                                                <option value="PayPal">PayPal</option>
                                            </select>
                                        ) : (
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{displayMethod}</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Email Facturación</span>
                                    {isEditing ? (
                                        <input value={editFormData.billingEmail || ''} onChange={e => setEditFormData({...editFormData, billingEmail: e.target.value})} className="w-full text-xs border rounded p-1" placeholder="facturacion@proveedor.com"/>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons text-xs text-gray-400">alternate_email</span>
                                            <a href={`mailto:${displayBillingEmail}`} className="text-xs font-medium text-blue-600 hover:underline">{displayBillingEmail}</a>
                                        </div>
                                    )}
                                </div>

                                {/* Banking Card (Visual) */}
                                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 text-white relative overflow-hidden shadow-md mt-2">
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <span className="material-icons text-6xl">account_balance</span>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Datos Bancarios</span>
                                            <span className="material-icons text-white/50 text-sm">lock</span>
                                        </div>
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Banco</label>
                                                        <input 
                                                            value={editFormData.bankName || ''} 
                                                            onChange={e => setEditFormData({...editFormData, bankName: e.target.value})} 
                                                            className="w-full text-xs bg-white/10 border-none rounded text-white placeholder-white/50 focus:ring-1 focus:ring-white/50" 
                                                            placeholder="Nombre Banco"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Tipo Cuenta</label>
                                                        <select
                                                            value={editFormData.bankAccountType || 'Checking / Corriente'} 
                                                            onChange={e => setEditFormData({...editFormData, bankAccountType: e.target.value})} 
                                                            className="w-full text-xs bg-white/10 border-none rounded text-white focus:ring-1 focus:ring-white/50" 
                                                        >
                                                            <option value="Checking / Corriente" className="text-black">Corriente</option>
                                                            <option value="Savings / Ahorros" className="text-black">Ahorros</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Número de Cuenta / IBAN</label>
                                                    <input 
                                                        type="text"
                                                        value={editFormData.bankAccount || ''} 
                                                        onChange={e => setEditFormData({...editFormData, bankAccount: e.target.value})} 
                                                        className="w-full text-xs bg-white/10 border-none rounded text-white placeholder-white/50 focus:ring-1 focus:ring-white/50" 
                                                        placeholder="Número de Cuenta"
                                                    />
                                                    <p className="text-[8px] text-gray-400 mt-1 pl-1">Se guardará de forma segura. En vista: **** 1234</p>
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Titular de la Cuenta</label>
                                                    <input 
                                                        value={editFormData.bankAccountHolder || ''} 
                                                        onChange={e => setEditFormData({...editFormData, bankAccountHolder: e.target.value})} 
                                                        className="w-full text-xs bg-white/10 border-none rounded text-white placeholder-white/50 focus:ring-1 focus:ring-white/50" 
                                                        placeholder="Nombre del Titular / Beneficiario"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Identificación (RNC / Cédula)</label>
                                                    <input 
                                                        value={editFormData.bankId || ''} 
                                                        onChange={e => setEditFormData({...editFormData, bankId: e.target.value})} 
                                                        className="w-full text-xs bg-white/10 border-none rounded text-white placeholder-white/50 focus:ring-1 focus:ring-white/50" 
                                                        placeholder="001-0000000-0"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Routing / SWIFT / CLABE</label>
                                                    <input 
                                                        value={editFormData.routingNumber || ''} 
                                                        onChange={e => setEditFormData({...editFormData, routingNumber: e.target.value})} 
                                                        className="w-full text-xs bg-white/10 border-none rounded text-white placeholder-white/50 focus:ring-1 focus:ring-white/50" 
                                                        placeholder="Código Bancario"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {(bankDetails.bankName || bankDetails.bankAccountType) && (
                                                    <div className="flex justify-between items-center mb-1">
                                                        {bankDetails.bankName && <p className="font-bold text-sm tracking-wide">{bankDetails.bankName}</p>}
                                                        {bankDetails.bankAccountType && (
                                                            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded uppercase tracking-wider text-gray-300">
                                                                {bankDetails.bankAccountType}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {bankDetails.bankAccount && (
                                                    <p className="font-mono text-lg tracking-widest text-gray-300 mb-2">
                                                        {maskBankAccount(bankDetails.bankAccount)}
                                                    </p>
                                                )}

                                                {(bankDetails.bankAccountHolder || bankDetails.bankId) && (
                                                    <div className="mb-2 space-y-1">
                                                        {bankDetails.bankAccountHolder && (
                                                            <div>
                                                                <p className="text-[8px] text-gray-500 uppercase">Titular / Beneficiario</p>
                                                                <p className="text-xs font-medium text-gray-200 truncate">{bankDetails.bankAccountHolder}</p>
                                                            </div>
                                                        )}
                                                        {bankDetails.bankId && (
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-[8px] text-gray-500 uppercase">ID / RNC:</p>
                                                                <p className="text-xs font-mono text-gray-300">{bankDetails.bankId}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-end mt-3">
                                                    {bankDetails.routingNumber && (
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] text-gray-500 uppercase">Código / SWIFT</span>
                                                            <span className="text-[10px] font-mono text-gray-300">{bankDetails.routingNumber}</span>
                                                        </div>
                                                    )}
                                                    {(!bankDetails.bankName && !bankDetails.bankAccount) ? (
                                                        <p className="text-xs text-gray-500 italic">Sin datos bancarios registrados.</p>
                                                    ) : (
                                                        <span className="text-[8px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded border border-green-500/30 uppercase font-bold ml-auto">Verificado</span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* SHIPPING COSTS SECTION */}
                            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30 mt-4">
                                <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-icons text-sm">local_shipping</span> Costos de Envío
                                </h4>
                                
                                {isEditing ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white dark:bg-black/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                            <label className="text-[9px] font-bold text-indigo-400 uppercase block mb-1">Estándar</label>
                                            <input 
                                                type="number"
                                                value={shippingCosts.standard}
                                                onChange={(e) => setShippingCosts({...shippingCosts, standard: parseFloat(e.target.value) || 0})}
                                                className="w-full text-sm font-bold text-center bg-transparent outline-none focus:border-b-2 border-indigo-300 text-indigo-700 dark:text-indigo-300"
                                            />
                                        </div>
                                        <div className="bg-white dark:bg-black/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                            <label className="text-[9px] font-bold text-purple-400 uppercase block mb-1">Express</label>
                                            <input 
                                                type="number"
                                                value={shippingCosts.express}
                                                onChange={(e) => setShippingCosts({...shippingCosts, express: parseFloat(e.target.value) || 0})}
                                                className="w-full text-sm font-bold text-center bg-transparent outline-none focus:border-b-2 border-purple-300 text-purple-700 dark:text-purple-300"
                                            />
                                        </div>
                                        <div className="bg-white/50 dark:bg-black/10 p-2 rounded-lg border border-dashed border-green-200 dark:border-green-800 flex flex-col justify-center items-center opacity-70">
                                            <label className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase block mb-1">Pickup</label>
                                            <span className="text-xs font-bold text-green-700 dark:text-green-300">Gratis</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white dark:bg-surface-dark p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50 flex flex-col items-center">
                                            <span className="material-icons text-indigo-400 text-lg mb-1">local_shipping</span>
                                            <p className="text-[9px] text-gray-400 uppercase font-bold">Standard</p>
                                            <p className="text-sm font-mono font-bold text-indigo-700 dark:text-indigo-300">${shippingCosts.standard.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-surface-dark p-2.5 rounded-lg border border-purple-100 dark:border-purple-800/50 flex flex-col items-center">
                                            <span className="material-icons text-purple-400 text-lg mb-1">rocket_launch</span>
                                            <p className="text-[9px] text-gray-400 uppercase font-bold">Express</p>
                                            <p className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300">${shippingCosts.express.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-surface-dark p-2.5 rounded-lg border border-green-100 dark:border-green-800/50 flex flex-col items-center">
                                            <span className="material-icons text-green-400 text-lg mb-1">storefront</span>
                                            <p className="text-[9px] text-gray-400 uppercase font-bold">Pickup</p>
                                            <p className="text-sm font-bold text-green-600 dark:text-green-400">Gratis</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes & Tags */}
                        <div className="bg-gradient-to-b from-[#fffbeb] to-[#fff7ed] dark:from-yellow-900/10 dark:to-orange-900/10 rounded-[1.5rem] shadow-sm border border-yellow-100 dark:border-yellow-900/20 p-6 relative">
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <h3 className="text-xs font-bold text-yellow-800 dark:text-yellow-200 uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-icons text-sm">label</span> Etiquetas
                                </h3>
                                <button onClick={() => setIsManagingTags(!isManagingTags)} className="text-[10px] font-bold text-yellow-700 hover:text-yellow-900 bg-yellow-200/50 px-2 py-1 rounded transition-colors">
                                    {isManagingTags ? 'Listo' : 'Gestionar'}
                                </button>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-6 relative z-10 min-h-[30px]">
                                {supplier.tags?.map((tag, idx) => (
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
                            </div>

                            <h3 className="text-xs font-bold text-yellow-800 dark:text-yellow-200 uppercase tracking-wider mb-2 flex items-center gap-2 relative z-10">
                                <span className="material-icons text-sm">description</span> Acuerdos / Notas
                            </h3>
                            <div className="relative z-10">
                                <textarea 
                                    value={localNotes}
                                    onChange={e => setLocalNotes(e.target.value)}
                                    onBlur={handleNotesBlur}
                                    className="w-full h-32 bg-white/60 dark:bg-black/10 rounded-xl border border-yellow-200/50 text-sm text-gray-700 p-3 resize-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 outline-none placeholder:text-gray-400/70 transition-all shadow-inner"
                                    placeholder="Condiciones especiales, horarios de recepción..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: MAIN TABS & CONTENT - STACKED LAYOUT CHANGE */}
                    <div className="lg:col-span-8 flex flex-col h-full min-h-[600px] relative">
                        
                        {/* STICKY TABS WRAPPER (Outside the card to mask scrolling content) */}
                        <div className="sticky top-0 z-20 pt-1 pb-4 bg-[#f8fafc] dark:bg-background-dark">
                            <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-2 flex justify-between items-center">
                                <div className="flex gap-6 overflow-x-auto no-scrollbar">
                                    {[
                                        { id: 'timeline', label: 'Historia', icon: 'history_edu' },
                                        { id: 'orders', label: `Pedidos (${stats.totalOrders})`, icon: 'inventory_2' },
                                        { id: 'invoices', label: 'Facturas', icon: 'receipt_long' },
                                        { id: 'catalog', label: `Catálogo (${stats.catalogSize})`, icon: 'list_alt' }
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
                            </div>
                        </div>

                        {/* Content Area - Rounded Card BELOW the sticky tabs */}
                        <div className="bg-white dark:bg-surface-dark rounded-[2rem] shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col flex-1 overflow-hidden min-h-[500px]">
                            <div className="p-6 md:p-8 flex-1 bg-[#FAFAFA] dark:bg-black/10 overflow-y-auto custom-scrollbar">
                                {activeTab === 'timeline' && <SupplierTimeline supplierId={id} />}
                                {activeTab === 'orders' && <SupplierOrdersTab supplierName={supplier.companyName} supplierId={id} />}
                                {activeTab === 'invoices' && <SupplierInvoicesTab supplierId={id} />}
                                {activeTab === 'catalog' && <SupplierCatalogTab supplierTags={supplier.tags} />}
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
                        Se actualizará el perfil del proveedor y se registrará una entrada automática en la cronología.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setIsSaveConfirmationOpen(false)} className="flex-1 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">Cancelar</button>
                        <button onClick={confirmSave} className="flex-1 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-green-800 transition-all">Confirmar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SupplierDetails;
