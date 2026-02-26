
import React, { useState } from 'react';
import { useServiceMenuManager } from '../../../hooks/useServiceMenuManager';
import SectionSidebar from './service_menu/SectionSidebar';
import SectionEditor from './service_menu/SectionEditor';
import SectionPreview from './service_menu/SectionPreview';
import { useData } from '../../../context/DataContext';

interface ServiceMenuManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ServiceMenuManagerModal: React.FC<ServiceMenuManagerModalProps> = ({ isOpen, onClose }) => {
    const { catalog, addToast } = useData(); 
    const {
        sections, selectedSectionId, setSelectedSectionId,
        editTab, setEditTab,
        serviceSearch, setServiceSearch,
        newFeature, setNewFeature,
        activeSection, linkedServices, availableServices,
        
        availableCategories, sectionStats, isGenerating,
        autoSelectByCategory, clearSelection, generateAIDescription,

        handleAddSection, updateActiveSection, handleDeleteSection,
        toggleService, addFeature, removeFeature, reorderSections
    } = useServiceMenuManager();

    // View Mode State: 'edit' or 'preview'
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | null>(null);

    const handleSaveChanges = () => {
        addToast('success', 'Cambios guardados correctamente.');
    };

    const handleToggleClick = () => {
        if (!activeSection) return;

        if (activeSection.isActive) {
            setConfirmAction('unpublish');
        } else {
            setConfirmAction('publish');
        }
    };

    const confirmToggle = () => {
        if (confirmAction === 'publish') {
            updateActiveSection('isActive', true);
            addToast('success', 'Sección visible al público.');
        } else if (confirmAction === 'unpublish') {
            updateActiveSection('isActive', false);
            addToast('info', 'Sección oculta (Borrador).');
        }
        setConfirmAction(null);
    };

    const cancelToggle = () => {
        setConfirmAction(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className={`bg-[#F8F9FA] dark:bg-surface-dark rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col transition-all duration-300
                    ${viewMode === 'preview' ? 'w-[98vw] h-[95vh]' : 'w-full max-w-7xl h-[90vh]'}
                `} 
                onClick={e => e.stopPropagation()}
            >
                
                {/* Header */}
                <div className="bg-white dark:bg-black/20 border-b border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-6">
                        <div>
                            <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons text-primary">web</span>
                                Constructor de Menú
                            </h2>
                            <p className="text-xs text-gray-500">Diseña cómo ven tus clientes los servicios.</p>
                        </div>

                        {/* View Mode Toggle */}
                        {activeSection && (
                            <div className="hidden md:flex bg-gray-100 dark:bg-white/10 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                                <button 
                                    onClick={() => setViewMode('edit')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    <span className="material-icons text-sm">edit</span> Editar
                                </button>
                                <button 
                                    onClick={() => setViewMode('preview')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    <span className="material-icons text-sm">visibility</span> Vista Previa
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 items-center">
                         {/* Mobile Toggle (Icon only) */}
                         {activeSection && (
                            <button onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')} className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                <span className="material-icons">{viewMode === 'edit' ? 'visibility' : 'edit'}</span>
                            </button>
                         )}

                         {activeSection && (
                             <div className="flex items-center gap-3 border-r border-gray-200 dark:border-gray-700 pr-4 mr-2">
                                 {confirmAction ? (
                                     <div className="flex items-center gap-2 animate-in slide-in-from-right-2 fade-in">
                                         <span className={`text-xs font-bold ${confirmAction === 'publish' ? 'text-green-600' : 'text-red-500'}`}>
                                            {confirmAction === 'publish' ? '¿Publicar?' : '¿Ocultar?'}
                                         </span>
                                         <button onClick={confirmToggle} className={`text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${confirmAction === 'publish' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>Sí</button>
                                         <button onClick={cancelToggle} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors">No</button>
                                     </div>
                                 ) : (
                                     <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold ${activeSection.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                            {activeSection.isActive ? 'Publicado (Visible)' : 'Borrador (Oculto)'}
                                        </span>
                                        <button 
                                            onClick={handleToggleClick}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${activeSection.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                        >
                                            <span 
                                                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${activeSection.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                                            ></span>
                                        </button>
                                     </div>
                                 )}
                             </div>
                         )}

                         <button 
                            onClick={handleSaveChanges}
                            className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black px-5 py-2 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2"
                         >
                            <span className="material-icons text-sm">save</span> Guardar
                         </button>
                         
                         <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors">
                            <span className="material-icons">close</span>
                         </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    
                    {/* Left: Sidebar */}
                    {viewMode === 'edit' && (
                        <SectionSidebar 
                            sections={sections}
                            selectedSectionId={selectedSectionId}
                            onSelectSection={(id) => { setSelectedSectionId(id); setViewMode('edit'); setConfirmAction(null); }}
                            onAddSection={handleAddSection}
                            onDeleteSection={handleDeleteSection}
                            onReorder={reorderSections}
                        />
                    )}

                    {/* Main Content Area */}
                    {activeSection ? (
                        <div className="flex-1 flex flex-col overflow-hidden relative bg-gray-50/30 dark:bg-black/5">
                            
                            {viewMode === 'edit' ? (
                                <SectionEditor 
                                    activeSection={activeSection}
                                    updateActiveSection={updateActiveSection}
                                    editTab={editTab}
                                    setEditTab={setEditTab}
                                    availableServices={availableServices}
                                    serviceSearch={serviceSearch}
                                    setServiceSearch={setServiceSearch}
                                    toggleService={toggleService}
                                    newFeature={newFeature}
                                    setNewFeature={setNewFeature}
                                    addFeature={addFeature}
                                    removeFeature={removeFeature}
                                    availableCategories={availableCategories}
                                    sectionStats={sectionStats}
                                    isGenerating={isGenerating}
                                    autoSelectByCategory={autoSelectByCategory}
                                    clearSelection={clearSelection}
                                    generateAIDescription={generateAIDescription}
                                />
                            ) : (
                                <SectionPreview 
                                    activeSection={activeSection}
                                    linkedServices={linkedServices}
                                    allSections={sections}
                                    catalog={catalog}
                                    onSelectSection={setSelectedSectionId}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center h-full text-gray-400 opacity-60 bg-gray-50 dark:bg-black/5">
                            <span className="material-icons text-4xl mb-2">web_asset_off</span>
                            <p>Selecciona una sección para editar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceMenuManagerModal;
