
import React, { useState, useEffect } from 'react';
import { PublicServiceSection, PublicServiceFeature, AppointmentItem } from '../../../../types';
import ServiceProtocolManager from './ServiceProtocolManager';

interface SectionEditorProps {
    activeSection: PublicServiceSection;
    updateActiveSection: (field: keyof PublicServiceSection, value: any) => void;
    editTab: 'content' | 'design' | 'features';
    setEditTab: (tab: 'content' | 'design' | 'features') => void;
    
    // Service Selection
    availableServices: AppointmentItem[];
    serviceSearch: string;
    setServiceSearch: (val: string) => void;
    toggleService: (id: string | number) => void;

    // Smart Features
    availableCategories: string[];
    sectionStats: { min: number; max: number; avg: number };
    isGenerating: boolean;
    autoSelectByCategory: (cat: string) => void;
    clearSelection: () => void;
    generateAIDescription: () => void;

    // Features
    newFeature: PublicServiceFeature;
    setNewFeature: (val: PublicServiceFeature) => void;
    addFeature: () => void;
    removeFeature: (idx: number) => void;
}

// --- CONSTANTS FOR SMART FEATURES ---
const FEATURE_PRESETS = [
    { icon: 'eco', title: '100% Orgánico', description: 'Ingredientes naturales certificados.' },
    { icon: 'bolt', title: 'Resultados Rápidos', description: 'Visible desde la primera sesión.' },
    { icon: 'sentiment_satisfied', title: 'Sin Dolor', description: 'Técnica suave y delicada.' },
    { icon: 'verified', title: 'Garantizado', description: 'Satisfacción asegurada.' },
    { icon: 'pets', title: 'Cruelty Free', description: 'No testado en animales.' },
    { icon: 'event', title: 'Sin Cita Previa', description: 'Walk-ins bienvenidos.' },
];

const AVAILABLE_ICONS = [
    'star', 'check_circle', 'favorite', 'bolt', 'spa', 'verified', 
    'eco', 'water_drop', 'clean_hands', 'face', 'diamond', 'timer',
    'security', 'thumb_up', 'pets', 'local_fire_department'
];

const SectionEditor: React.FC<SectionEditorProps> = ({
    activeSection, updateActiveSection, editTab, setEditTab,
    availableServices, serviceSearch, setServiceSearch, toggleService,
    availableCategories, sectionStats, isGenerating, autoSelectByCategory, clearSelection, generateAIDescription,
    newFeature, setNewFeature, addFeature, removeFeature
}) => {
    
    const [showSmartSelect, setShowSmartSelect] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showIconGrid, setShowIconGrid] = useState(false);
    
    // NEW: Sub-tab state for Extras
    const [extrasSubTab, setExtrasSubTab] = useState<'features' | 'protocol' | 'banner'>('features');

    // Smart Icon Logic: Auto-detect icon based on title input if not manually set recently
    useEffect(() => {
        if (editingIndex !== null) return; // Don't auto-change when editing existing
        
        const titleLower = newFeature.title.toLowerCase();
        let suggestedIcon = '';

        if (titleLower.includes('natur') || titleLower.includes('bio') || titleLower.includes('eco')) suggestedIcon = 'eco';
        else if (titleLower.includes('rapido') || titleLower.includes('veloz') || titleLower.includes('fast')) suggestedIcon = 'bolt';
        else if (titleLower.includes('agua') || titleLower.includes('hidra')) suggestedIcon = 'water_drop';
        else if (titleLower.includes('amor') || titleLower.includes('cuidado')) suggestedIcon = 'favorite';
        else if (titleLower.includes('tiempo') || titleLower.includes('min')) suggestedIcon = 'timer';
        else if (titleLower.includes('mejor') || titleLower.includes('top')) suggestedIcon = 'diamond';
        
        if (suggestedIcon && suggestedIcon !== newFeature.icon) {
             setNewFeature({ ...newFeature, icon: suggestedIcon });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newFeature.title]);

    const handleEditFeature = (idx: number) => {
        if (activeSection.features) {
            setNewFeature(activeSection.features[idx]);
            setEditingIndex(idx);
        }
    };

    const handleSaveFeature = () => {
        if (!activeSection.features) return;
        
        if (editingIndex !== null) {
            // Update existing
            const updatedFeatures = [...activeSection.features];
            updatedFeatures[editingIndex] = newFeature;
            updateActiveSection('features', updatedFeatures);
            setEditingIndex(null);
            setNewFeature({ icon: 'star', title: '', description: '' });
        } else {
            // Add new
            addFeature();
        }
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setNewFeature({ icon: 'star', title: '', description: '' });
    };

    const handleAddPreset = (preset: PublicServiceFeature) => {
        const currentFeatures = activeSection.features || [];
        updateActiveSection('features', [...currentFeatures, preset]);
    };

    // --- PROTOCOL HANDLERS ---
    const addProtocolStep = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = e.currentTarget.value.trim();
            if (val) {
                const currentProtocol = activeSection.protocol || [];
                updateActiveSection('protocol', [...currentProtocol, val]);
                e.currentTarget.value = '';
            }
        }
    };

    const removeProtocolStep = (idx: number) => {
        const currentProtocol = activeSection.protocol || [];
        updateActiveSection('protocol', currentProtocol.filter((_, i) => i !== idx));
    };

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-surface-dark overflow-hidden">
            
            {/* Tabs Header - Full Width */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark shrink-0 px-4 md:px-8">
                <div className="flex w-full max-w-2xl mx-auto">
                    <button 
                        onClick={() => setEditTab('content')}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${editTab === 'content' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Contenido
                    </button>
                    <button 
                        onClick={() => setEditTab('design')}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${editTab === 'design' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Diseño
                    </button>
                    <button 
                        onClick={() => setEditTab('features')}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${editTab === 'features' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Extras
                    </button>
                </div>
            </div>

            {/* Content Container - Centered */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="max-w-2xl mx-auto space-y-6 pb-20 h-full">
                
                {/* TAB: CONTENT */}
                {editTab === 'content' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Título Público</label>
                            <input 
                                value={activeSection.title}
                                onChange={(e) => updateActiveSection('title', e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-bold outline-none focus:border-primary focus:bg-white dark:focus:bg-black/30 transition-all"
                                placeholder="Ej: Faciales Premium"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block">Descripción</label>
                                <button 
                                    onClick={generateAIDescription}
                                    disabled={activeSection.serviceIds.length === 0 || isGenerating}
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-all
                                        ${isGenerating ? 'bg-purple-100 text-purple-400 animate-pulse' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 cursor-pointer'}
                                    `}
                                >
                                    <span className="material-icons text-[10px]">{isGenerating ? 'hourglass_empty' : 'auto_awesome'}</span> 
                                    {isGenerating ? 'Redactando...' : 'Redactar con IA'}
                                </button>
                            </div>
                            <textarea 
                                value={activeSection.description}
                                onChange={(e) => updateActiveSection('description', e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white dark:focus:bg-black/30 h-32 resize-none transition-all"
                                placeholder="Describe esta colección de servicios..."
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] font-bold text-primary uppercase flex items-center gap-2">
                                    <span className="material-icons text-sm">checklist</span> Servicios ({activeSection.serviceIds.length})
                                </label>
                                
                                {/* Smart Select Dropdown */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowSmartSelect(!showSmartSelect)}
                                        className="text-[10px] font-bold text-gray-500 hover:text-gray-800 bg-gray-100 dark:bg-white/10 dark:text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <span className="material-icons text-[12px]">flash_on</span> Acciones Rápidas
                                    </button>
                                    {showSmartSelect && (
                                        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-surface-dark shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                            <div className="p-2 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-700 text-[9px] font-bold text-gray-400 uppercase">
                                                Seleccionar por Categoría
                                            </div>
                                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                {availableCategories.map(cat => (
                                                    <button 
                                                        key={cat}
                                                        onClick={() => { autoSelectByCategory(cat); setShowSmartSelect(false); }}
                                                        className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 truncate"
                                                    >
                                                        Todo: {cat}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="border-t border-gray-100 dark:border-gray-700">
                                                <button 
                                                    onClick={() => { clearSelection(); setShowSmartSelect(false); }}
                                                    className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    Limpiar Selección
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Analytics Mini-Bar */}
                            {activeSection.serviceIds.length > 0 && (
                                <div className="flex gap-3 mb-4">
                                    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex-1 text-center shadow-sm">
                                        <span className="block text-[9px] text-gray-400 uppercase font-bold tracking-wider">Rango Precios</span>
                                        <span className="text-sm font-mono font-bold text-gray-800 dark:text-white">${sectionStats.min} - ${sectionStats.max}</span>
                                    </div>
                                    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex-1 text-center shadow-sm">
                                        <span className="block text-[9px] text-gray-400 uppercase font-bold tracking-wider">Ticket Promedio</span>
                                        <span className="text-sm font-mono font-bold text-primary">${sectionStats.avg}</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mb-3 relative group">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                                <input 
                                    value={serviceSearch}
                                    onChange={(e) => setServiceSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="Buscar servicio para agregar..."
                                />
                            </div>

                            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden h-[320px] overflow-y-auto custom-scrollbar shadow-sm">
                                {availableServices.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                                        <span className="material-icons text-3xl mb-2 opacity-30">search_off</span>
                                        No se encontraron servicios.
                                    </div>
                                ) : (
                                    availableServices.map(srv => {
                                        const isSelected = activeSection.serviceIds.includes(String(srv.id));
                                        return (
                                            <div 
                                                key={srv.id} 
                                                onClick={() => toggleService(srv.id)}
                                                className={`flex items-center gap-3 p-3 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'}`}>
                                                    {isSelected && <span className="material-icons text-white text-[12px] font-bold">check</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}>{srv.title}</p>
                                                    <div className="flex justify-between items-center mt-0.5">
                                                        <span className="text-[10px] text-gray-500 uppercase font-medium">{srv.category}</span>
                                                        <span className="text-[11px] font-mono font-bold text-gray-400">${srv.price}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: DESIGN (Existing content) */}
                {editTab === 'design' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        {/* Theme Variant Selector */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-3">Estilo Visual</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { id: 'clean', label: 'Clinical', bg: 'bg-white border-gray-200' },
                                    { id: 'soft_green', label: 'Organic', bg: 'bg-green-50 border-green-200' },
                                    { id: 'warm_gold', label: 'Warmth', bg: 'bg-orange-50 border-orange-200' },
                                    { id: 'luxury_dark', label: 'Luxury', bg: 'bg-gray-900 border-gray-800 text-white' },
                                ].map((variant) => (
                                    <button
                                        key={variant.id}
                                        onClick={() => updateActiveSection('variant', variant.id)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all hover:scale-105 ${
                                            activeSection.variant === variant.id 
                                            ? 'border-primary ring-2 ring-primary/20 shadow-md' 
                                            : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                        } ${variant.bg}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full mb-2 ${variant.id === 'luxury_dark' ? 'bg-white/20' : 'bg-gray-900/5'}`}></div>
                                        <span className={`text-xs font-bold ${variant.id === 'luxury_dark' ? 'text-white' : 'text-gray-800'}`}>
                                            {variant.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Layout Type & Prices */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Disposición Items</label>
                                <div className="space-y-2">
                                    {[
                                        { id: 'list', label: 'Lista Simple', icon: 'format_list_bulleted' },
                                        { id: 'grid_2', label: 'Grid (2 Col)', icon: 'grid_view' },
                                        { id: 'card_row', label: 'Tarjetas', icon: 'view_carousel' }
                                    ].map(layout => (
                                        <button
                                            key={layout.id}
                                            onClick={() => updateActiveSection('layoutType', layout.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                activeSection.layoutType === layout.id 
                                                ? 'bg-primary/5 border-primary text-primary shadow-sm' 
                                                : 'bg-white dark:bg-black/20 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="material-icons text-lg">{layout.icon}</span>
                                            <span className="text-sm font-bold">{layout.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Opciones</label>
                                    <label className="flex items-center p-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50">
                                        <input 
                                            type="checkbox" 
                                            checked={activeSection.showPrices}
                                            onChange={(e) => updateActiveSection('showPrices', e.target.checked)}
                                            className="rounded text-primary focus:ring-primary border-gray-300 w-4 h-4 mr-3"
                                        />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Mostrar Precios</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Hero Image Config */}
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-3">Imagen de Portada</label>
                            
                            {/* Position Selector */}
                            <div className="flex gap-2 mb-4 bg-white dark:bg-black/20 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-fit">
                                {[
                                    { id: 'left', icon: 'dock_to_right', label: 'Izq' },
                                    { id: 'right', icon: 'dock_to_left', label: 'Der' },
                                    { id: 'top', icon: 'splitscreen_top', label: 'Top' },
                                    { id: 'hidden', icon: 'hide_image', label: 'No' }
                                ].map((pos) => (
                                    <button
                                        key={pos.id}
                                        onClick={() => updateActiveSection('imagePosition', pos.id)}
                                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                            activeSection.imagePosition === pos.id 
                                            ? 'bg-primary text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                                        }`}
                                        title={pos.id}
                                    >
                                        <span className="material-icons text-sm">{pos.icon}</span>
                                        <span className="text-[10px] font-bold uppercase">{pos.label}</span>
                                    </button>
                                ))}
                            </div>

                            <input 
                                value={activeSection.heroImage || ''}
                                onChange={(e) => updateActiveSection('heroImage', e.target.value)}
                                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary mb-3"
                                placeholder="URL de la imagen..."
                            />
                            
                            {activeSection.heroImage && activeSection.imagePosition !== 'hidden' && (
                                <div className="h-40 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative group shadow-sm">
                                    <img src={activeSection.heroImage} className="w-full h-full object-cover" alt="Preview"/>
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">Vista Previa</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: EXTRAS / FEATURES (REMASTERED WITH SUB-TABS) */}
                {editTab === 'features' && (
                    <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        
                        {/* Sub-Navigation for Extras */}
                        <div className="flex p-1 bg-gray-100 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
                             <button 
                                 onClick={() => setExtrasSubTab('features')}
                                 className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1 ${extrasSubTab === 'features' ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                             >
                                 <span className="material-icons text-xs">stars</span> Beneficios
                             </button>
                             <button 
                                 onClick={() => setExtrasSubTab('protocol')}
                                 className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1 ${extrasSubTab === 'protocol' ? 'bg-white dark:bg-surface-dark shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                             >
                                 <span className="material-icons text-xs">format_list_numbered</span> Protocolo
                             </button>
                             <button 
                                 onClick={() => setExtrasSubTab('banner')}
                                 className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1 ${extrasSubTab === 'banner' ? 'bg-white dark:bg-surface-dark shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                             >
                                 <span className="material-icons text-xs">campaign</span> Avisos
                             </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            
                            {/* SUB-TAB: FEATURES (Original List) */}
                            {extrasSubTab === 'features' && (
                                <div className="space-y-6">
                                    {/* 1. Presets */}
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Sugerencias Inteligentes</p>
                                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                            {FEATURE_PRESETS.map((preset, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => handleAddPreset(preset)}
                                                    className="shrink-0 flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700 px-3 py-2 rounded-xl text-xs font-bold hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all whitespace-nowrap"
                                                >
                                                    <span className="material-icons text-sm opacity-70">{preset.icon}</span>
                                                    {preset.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. Builder Card */}
                                    <div className={`bg-white dark:bg-surface-dark p-5 rounded-2xl border ${editingIndex !== null ? 'border-primary/50 ring-2 ring-primary/10' : 'border-gray-200 dark:border-gray-700'} shadow-sm transition-all`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">{editingIndex !== null ? 'Editando Característica' : 'Nueva Característica'}</p>
                                            {editingIndex !== null && (
                                                <button onClick={handleCancelEdit} className="text-xs text-red-500 font-bold hover:underline">Cancelar Edición</button>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="flex gap-3 items-start">
                                                {/* Icon Picker Trigger */}
                                                <div className="relative">
                                                    <button 
                                                        onClick={() => setShowIconGrid(!showIconGrid)}
                                                        className="w-12 h-12 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                                    >
                                                        <span className="material-icons text-xl">{newFeature.icon}</span>
                                                    </button>
                                                    
                                                    {/* Icon Popover Grid */}
                                                    {showIconGrid && (
                                                        <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-surface-dark shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl z-50 grid grid-cols-4 gap-1 w-48 animate-in zoom-in-95 origin-top-left">
                                                            {AVAILABLE_ICONS.map(icon => (
                                                                <button 
                                                                    key={icon} 
                                                                    onClick={() => { setNewFeature({...newFeature, icon}); setShowIconGrid(false); }}
                                                                    className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center ${newFeature.icon === icon ? 'bg-primary/10 text-primary' : 'text-gray-500'}`}
                                                                >
                                                                    <span className="material-icons text-lg">{icon}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Inputs */}
                                                <div className="flex-1 space-y-2">
                                                    <input 
                                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary transition-all" 
                                                        placeholder="Título (Ej: Sin Dolor)"
                                                        value={newFeature.title}
                                                        onChange={e => setNewFeature({...newFeature, title: e.target.value})}
                                                    />
                                                    <input 
                                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary transition-all" 
                                                        placeholder="Descripción breve..."
                                                        value={newFeature.description}
                                                        onChange={e => setNewFeature({...newFeature, description: e.target.value})}
                                                    />
                                                </div>
                                            </div>

                                            <button 
                                                onClick={handleSaveFeature} 
                                                disabled={!newFeature.title}
                                                className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2
                                                    ${editingIndex !== null 
                                                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20' 
                                                        : 'bg-primary hover:bg-green-800 text-white shadow-primary/20'} 
                                                    disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                <span className="material-icons text-sm">{editingIndex !== null ? 'save' : 'add_circle'}</span>
                                                {editingIndex !== null ? 'Actualizar Cambios' : 'Agregar a la Lista'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 3. List */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block ml-1">Lista Actual</label>
                                        {(!activeSection.features || activeSection.features.length === 0) ? (
                                            <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400">
                                                <span className="material-icons text-3xl mb-1 opacity-30">list</span>
                                                <p className="text-xs">No hay características añadidas.</p>
                                            </div>
                                        ) : (
                                            activeSection.features.map((feat, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => handleEditFeature(idx)}
                                                    className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md
                                                        ${editingIndex === idx 
                                                            ? 'bg-primary/5 border-primary shadow-sm' 
                                                            : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                                                        ${editingIndex === idx ? 'bg-primary text-white' : 'bg-gray-50 dark:bg-black/20 text-gray-500 group-hover:text-primary group-hover:bg-primary/10'}`}>
                                                        <span className="material-icons text-lg">{feat.icon}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-bold truncate ${editingIndex === idx ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>{feat.title}</p>
                                                        <p className="text-xs text-gray-500 truncate">{feat.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleEditFeature(idx); }}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10"
                                                        >
                                                            <span className="material-icons text-sm">edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); removeFeature(idx); }} 
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            <span className="material-icons text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* SUB-TAB: PROTOCOL (Steps) */}
                            {extrasSubTab === 'protocol' && (
                                <div className="h-full">
                                    <ServiceProtocolManager 
                                        protocolSteps={activeSection.protocol || []}
                                        addProtocolStep={addProtocolStep}
                                        removeProtocolStep={removeProtocolStep}
                                    />
                                </div>
                            )}

                            {/* SUB-TAB: BANNER (Promo) */}
                            {extrasSubTab === 'banner' && (
                                <div className="space-y-4">
                                    <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                                                <span className="material-icons">campaign</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-orange-800 dark:text-orange-200">Aviso Promocional</h4>
                                                <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70">Mensaje destacado en la sección.</p>
                                            </div>
                                        </div>
                                        
                                        <textarea 
                                            value={activeSection.promoBanner || ''}
                                            onChange={(e) => updateActiveSection('promoBanner', e.target.value)}
                                            className="w-full bg-white dark:bg-black/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none placeholder:text-gray-400"
                                            placeholder="Ej: Oferta de Verano - 20% OFF en todos los tratamientos."
                                        />
                                    </div>
                                    
                                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Vista Previa</p>
                                        {activeSection.promoBanner ? (
                                            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-3 rounded-lg text-center text-sm font-bold shadow-sm">
                                                {activeSection.promoBanner}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic text-center">Escribe un mensaje arriba para ver la vista previa.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default SectionEditor;
