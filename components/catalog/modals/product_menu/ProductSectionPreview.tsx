
import React, { useState } from 'react';
import { PublicProductSection, AppointmentItem } from '../../../../types';
import ProductSectionRenderer from '../../../public/ProductSectionRenderer';

interface ProductSectionPreviewProps {
    activeSection: PublicProductSection;
    linkedProducts: AppointmentItem[];
    allSections?: PublicProductSection[]; 
    catalog?: AppointmentItem[];
    onSelectSection?: (id: string) => void;
}

const ProductSectionPreview: React.FC<ProductSectionPreviewProps> = ({ activeSection, linkedProducts, allSections, catalog, onSelectSection }) => {
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [previewScope, setPreviewScope] = useState<'single' | 'full'>('single');
    const [zoomLevel, setZoomLevel] = useState<number>(0.8);

    return (
        <div className="flex-1 bg-gray-200 dark:bg-[#0a0a0a] overflow-hidden relative flex flex-col items-center">
            
            {/* FLOATING TOOLBAR */}
            <div className="absolute top-6 z-30 flex items-center gap-4 bg-white/90 dark:bg-black/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-4">
                <div className="flex bg-gray-100 dark:bg-white/10 rounded-xl p-1">
                    <button onClick={() => setViewMode('desktop')} className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'desktop' ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}><span className="material-icons text-sm">desktop_windows</span></button>
                    <button onClick={() => setViewMode('mobile')} className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'mobile' ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}><span className="material-icons text-sm">smartphone</span></button>
                </div>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex bg-gray-100 dark:bg-white/10 rounded-xl p-1">
                    <button onClick={() => setPreviewScope('single')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${previewScope === 'single' ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}>Sección</button>
                    <button onClick={() => setPreviewScope('full')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${previewScope === 'full' ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}>Página</button>
                </div>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex items-center gap-2 px-2">
                    <span className="material-icons text-gray-400 text-sm">zoom_out</span>
                    <input type="range" min="0.5" max="1" step="0.1" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"/>
                </div>
            </div>

            {/* FLOATING NAVIGATION CARDS (Only in Single View) */}
            {previewScope === 'single' && allSections && onSelectSection && (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 max-h-[70vh] overflow-y-auto no-scrollbar py-4 animate-in fade-in slide-in-from-left-4">
                    {allSections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => onSelectSection(section.id)}
                            className={`w-56 text-left p-4 rounded-2xl shadow-lg backdrop-blur-md border transition-all duration-300 transform hover:scale-105 group relative overflow-hidden
                                ${activeSection.id === section.id 
                                    ? 'bg-orange-600/90 text-white border-orange-500' 
                                    : 'bg-white/70 dark:bg-surface-dark/70 text-gray-500 dark:text-gray-400 border-white/40 dark:border-gray-700 hover:bg-white hover:text-gray-800'
                                }
                            `}
                        >
                            {activeSection.id === section.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
                            )}
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                                    {activeSection.id === section.id ? 'Editando' : 'Colección'}
                                </span>
                                {activeSection.id === section.id && <span className="material-icons text-[12px] text-white">edit</span>}
                            </div>
                            <p className="text-sm font-bold truncate leading-tight font-display">{section.title}</p>
                            <p className="text-[10px] mt-1 opacity-60 font-medium truncate">{section.productIds.length} productos</p>
                        </button>
                    ))}
                </div>
            )}

            {/* VIEWPORT */}
            <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-8 flex justify-center bg-dots-pattern">
                <div 
                    className="origin-top transition-transform duration-300 ease-out"
                    style={{ 
                        transform: `scale(${zoomLevel})`,
                        width: viewMode === 'mobile' ? '375px' : '100%',
                        maxWidth: viewMode === 'mobile' ? '375px' : '1200px'
                    }}
                >
                    <div className={`bg-white shadow-2xl overflow-hidden ${viewMode === 'mobile' ? 'rounded-[2.5rem] border-[8px] border-gray-800 min-h-[800px]' : 'rounded-none shadow-none min-h-screen'}`}>
                        {viewMode === 'desktop' && (
                            <div className="bg-gray-100 border-b border-gray-200 p-2 flex gap-2 items-center px-4 sticky top-0 z-20">
                                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-yellow-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div></div>
                                <div className="flex-1 bg-white rounded-md h-6 mx-4 shadow-sm flex items-center px-3 text-xs text-gray-400">dermibelle.com/shop</div>
                            </div>
                        )}

                        {previewScope === 'single' ? (
                             <ProductSectionRenderer section={activeSection} products={linkedProducts} viewMode={viewMode} />
                        ) : (
                            <div className="flex flex-col">
                                <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 px-6 md:px-12 py-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2"><span className="material-icons text-primary text-3xl">spa</span><span className="font-display font-bold text-xl text-primary">Dermibelle</span></div>
                                    {viewMode === 'desktop' && <div className="flex gap-8 text-sm font-medium text-gray-600"><span>Inicio</span><span>Servicios</span><span className="text-orange-600 font-bold">Tienda</span></div>}
                                    <button className="bg-primary text-white px-5 py-2 rounded-full text-xs font-bold shadow-lg">Carrito (0)</button>
                                </nav>
                                <div className="bg-[#f8f9fa] py-16 px-6 text-center border-b border-gray-100">
                                    <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-orange-200">Shop Online</span>
                                    <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Dermibelle Essentials</h1>
                                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">Productos seleccionados para tu cuidado en casa.</p>
                                </div>
                                {allSections?.map(section => {
                                    const prods = section.productIds.map(id => catalog?.find(item => item.id === id)).filter((item): item is AppointmentItem => !!item);
                                    return <ProductSectionRenderer key={section.id} section={section} products={prods} viewMode={viewMode} />;
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductSectionPreview;
