
import React, { useState, useEffect } from 'react';
import { PublicProductSection, PublicServiceFeature, AppointmentItem } from '../../../../types';
// Reusing ServiceProtocolManager for simplicity as logic is identical
import ServiceProtocolManager from '../service_menu/ServiceProtocolManager';

interface ProductSectionEditorProps {
    activeSection: PublicProductSection;
    updateActiveSection: (field: keyof PublicProductSection, value: any) => void;
    editTab: 'content' | 'design' | 'features';
    setEditTab: (tab: 'content' | 'design' | 'features') => void;
    
    // Product Selection
    availableProducts: AppointmentItem[];
    productSearch: string;
    setProductSearch: (val: string) => void;
    toggleProduct: (id: string | number) => void;

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

const FEATURE_PRESETS = [
    { icon: 'local_shipping', title: 'Envío Rápido', description: 'Entrega en 24-48 horas.' },
    { icon: 'verified', title: 'Auténtico', description: 'Garantía de originalidad.' },
    { icon: 'eco', title: 'Orgánico', description: 'Ingredientes 100% naturales.' },
    { icon: 'card_giftcard', title: 'Regalo', description: 'Empaquetado especial disponible.' },
];

const AVAILABLE_ICONS = [
    'shopping_bag', 'local_shipping', 'verified', 'eco', 'card_giftcard', 'favorite', 
    'star', 'check_circle', 'bolt', 'water_drop', 'clean_hands', 'face', 'diamond'
];

const ProductSectionEditor: React.FC<ProductSectionEditorProps> = ({
    activeSection, updateActiveSection, editTab, setEditTab,
    availableProducts, productSearch, setProductSearch, toggleProduct,
    availableCategories, sectionStats, isGenerating, autoSelectByCategory, clearSelection, generateAIDescription,
    newFeature, setNewFeature, addFeature, removeFeature
}) => {
    
    const [showSmartSelect, setShowSmartSelect] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showIconGrid, setShowIconGrid] = useState(false);
    
    // Feature editing logic (same as service)
    const handleEditFeature = (idx: number) => {
        if (activeSection.features) {
            setNewFeature(activeSection.features[idx]);
            setEditingIndex(idx);
        }
    };

    const handleSaveFeature = () => {
        if (!activeSection.features) return;
        
        if (editingIndex !== null) {
            const updatedFeatures = [...activeSection.features];
            updatedFeatures[editingIndex] = newFeature;
            updateActiveSection('features', updatedFeatures);
            setEditingIndex(null);
            setNewFeature({ icon: 'star', title: '', description: '' });
        } else {
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

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-surface-dark overflow-hidden">
            
            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark shrink-0 px-4 md:px-8">
                <div className="flex w-full max-w-2xl mx-auto">
                    <button onClick={() => setEditTab('content')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${editTab === 'content' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Contenido</button>
                    <button onClick={() => setEditTab('design')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${editTab === 'design' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Diseño</button>
                    <button onClick={() => setEditTab('features')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${editTab === 'features' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Beneficios</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="max-w-2xl mx-auto space-y-6 pb-20 h-full">
                
                {editTab === 'content' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Nombre Colección</label>
                            <input 
                                value={activeSection.title}
                                onChange={(e) => updateActiveSection('title', e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-black/30 transition-all"
                                placeholder="Ej: Best Sellers"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block">Descripción</label>
                                <button 
                                    onClick={generateAIDescription}
                                    disabled={activeSection.productIds.length === 0 || isGenerating}
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-all ${isGenerating ? 'bg-orange-100 text-orange-400 animate-pulse' : 'bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer'}`}
                                >
                                    <span className="material-icons text-[10px]">{isGenerating ? 'hourglass_empty' : 'auto_awesome'}</span> 
                                    {isGenerating ? 'Redactando...' : 'IA'}
                                </button>
                            </div>
                            <textarea 
                                value={activeSection.description}
                                onChange={(e) => updateActiveSection('description', e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-black/30 h-24 resize-none transition-all"
                                placeholder="Describe esta colección..."
                            />
                        </div>

                         <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] font-bold text-orange-600 uppercase flex items-center gap-2">
                                    <span className="material-icons text-sm">inventory_2</span> Productos ({activeSection.productIds.length})
                                </label>
                                
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowSmartSelect(!showSmartSelect)}
                                        className="text-[10px] font-bold text-gray-500 hover:text-gray-800 bg-gray-100 dark:bg-white/10 dark:text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <span className="material-icons text-[12px]">filter_list</span> Filtros
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
                                                        {cat}
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
                            
                            <div className="mb-3 relative group">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">search</span>
                                <input 
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    placeholder="Buscar producto..."
                                />
                            </div>

                            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden h-[320px] overflow-y-auto custom-scrollbar shadow-sm">
                                {availableProducts.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                                        <span className="material-icons text-3xl mb-2 opacity-30">search_off</span>
                                        No se encontraron productos.
                                    </div>
                                ) : (
                                    availableProducts.map(prod => {
                                        const isSelected = activeSection.productIds.includes(String(prod.id));
                                        return (
                                            <div 
                                                key={prod.id} 
                                                onClick={() => toggleProduct(prod.id)}
                                                className={`flex items-center gap-3 p-3 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isSelected ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'}`}>
                                                    {isSelected && <span className="material-icons text-white text-[12px] font-bold">check</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-200'}`}>{prod.title}</p>
                                                    <div className="flex justify-between items-center mt-0.5">
                                                        <span className="text-[10px] text-gray-500 uppercase font-medium">{prod.category}</span>
                                                        <span className="text-[11px] font-mono font-bold text-gray-400">${prod.price}</span>
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
                                            ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md' 
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

                        {/* Layout Type */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Disposición</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: 'grid_3', label: 'Grid (3 Col)', icon: 'grid_on' },
                                    { id: 'grid_4', label: 'Grid (4 Col)', icon: 'apps' },
                                    { id: 'showcase', label: 'Showcase', icon: 'view_carousel' }
                                ].map(layout => (
                                    <button
                                        key={layout.id}
                                        onClick={() => updateActiveSection('layoutType', layout.id)}
                                        className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                                            activeSection.layoutType === layout.id 
                                            ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' 
                                            : 'bg-white dark:bg-black/20 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="material-icons text-lg">{layout.icon}</span>
                                        <span className="text-sm font-bold">{layout.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Hero Image */}
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-3">Imagen Portada</label>
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
                                            ? 'bg-orange-500 text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                                        }`}
                                    >
                                        <span className="material-icons text-sm">{pos.icon}</span>
                                        <span className="text-[10px] font-bold uppercase">{pos.label}</span>
                                    </button>
                                ))}
                            </div>
                            <input 
                                value={activeSection.heroImage || ''}
                                onChange={(e) => updateActiveSection('heroImage', e.target.value)}
                                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500 mb-3"
                                placeholder="URL de la imagen..."
                            />
                        </div>
                    </div>
                )}

                {editTab === 'features' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                         {/* Promo Banner */}
                         <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                            <h4 className="font-bold text-orange-800 dark:text-orange-200 text-sm mb-2">Aviso Promocional</h4>
                            <textarea 
                                value={activeSection.promoBanner || ''}
                                onChange={(e) => updateActiveSection('promoBanner', e.target.value)}
                                className="w-full bg-white dark:bg-black/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-20 resize-none placeholder:text-gray-400"
                                placeholder="Ej: Envío gratis en órdenes sobre $50."
                            />
                        </div>

                        {/* Features List */}
                        <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Presets</p>
                             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {FEATURE_PRESETS.map((preset, i) => (
                                    <button key={i} onClick={() => handleAddPreset(preset)} className="shrink-0 flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700 px-3 py-2 rounded-xl text-xs font-bold hover:border-orange-400/50 hover:bg-orange-50 hover:text-orange-600 transition-all whitespace-nowrap">
                                        <span className="material-icons text-sm opacity-70">{preset.icon}</span>
                                        {preset.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feature Builder */}
                        <div className={`bg-white dark:bg-surface-dark p-5 rounded-2xl border ${editingIndex !== null ? 'border-orange-500/50 ring-2 ring-orange-500/10' : 'border-gray-200 dark:border-gray-700'} shadow-sm`}>
                             <div className="flex gap-3 items-start">
                                <div className="relative">
                                    <button onClick={() => setShowIconGrid(!showIconGrid)} className="w-12 h-12 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                                        <span className="material-icons text-xl">{newFeature.icon}</span>
                                    </button>
                                    {showIconGrid && (
                                        <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-surface-dark shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl z-50 grid grid-cols-4 gap-1 w-48 animate-in zoom-in-95">
                                            {AVAILABLE_ICONS.map(icon => (
                                                <button key={icon} onClick={() => { setNewFeature({...newFeature, icon}); setShowIconGrid(false); }} className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center ${newFeature.icon === icon ? 'bg-orange-100 text-orange-600' : 'text-gray-500'}`}>
                                                    <span className="material-icons text-lg">{icon}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-500 transition-all" placeholder="Título" value={newFeature.title} onChange={e => setNewFeature({...newFeature, title: e.target.value})}/>
                                    <input className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500 transition-all" placeholder="Descripción" value={newFeature.description} onChange={e => setNewFeature({...newFeature, description: e.target.value})}/>
                                </div>
                             </div>
                             <button onClick={handleSaveFeature} disabled={!newFeature.title} className="w-full mt-4 py-3 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50">
                                {editingIndex !== null ? 'Actualizar' : 'Agregar Beneficio'}
                             </button>
                        </div>
                        
                        {/* List */}
                        <div className="space-y-3">
                             {activeSection.features?.map((feat, idx) => (
                                <div key={idx} onClick={() => handleEditFeature(idx)} className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-orange-200 cursor-pointer bg-white dark:bg-surface-dark">
                                    <span className="material-icons text-orange-500">{feat.icon}</span>
                                    <div className="flex-1"><p className="text-sm font-bold text-gray-900 dark:text-white">{feat.title}</p><p className="text-xs text-gray-500">{feat.description}</p></div>
                                    <button onClick={(e) => { e.stopPropagation(); removeFeature(idx); }} className="text-gray-400 hover:text-red-500"><span className="material-icons text-sm">delete</span></button>
                                </div>
                             ))}
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default ProductSectionEditor;
