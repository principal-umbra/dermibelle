
import React, { useState } from 'react';
import { PublicServiceSection, AppointmentItem } from '../../../../types';
import ServiceSectionRenderer from '../../../public/ServiceSectionRenderer';

interface SectionPreviewProps {
    activeSection: PublicServiceSection;
    linkedServices: AppointmentItem[];
    allSections?: PublicServiceSection[]; // Optional for full page preview
    catalog?: AppointmentItem[]; // Needed to resolve services in full page mode
    onSelectSection?: (id: string) => void;
}

const SectionPreview: React.FC<SectionPreviewProps> = ({ activeSection, linkedServices, allSections, catalog, onSelectSection }) => {
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [previewScope, setPreviewScope] = useState<'single' | 'full'>('single');
    const [zoomLevel, setZoomLevel] = useState<number>(0.8);

    return (
        <div className="flex-1 bg-gray-200 dark:bg-[#0a0a0a] overflow-hidden relative flex flex-col items-center">
            
            {/* FLOATING TOOLBAR */}
            <div className="absolute top-6 z-30 flex items-center gap-4 bg-white/90 dark:bg-black/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-4">
                
                {/* Viewport Controls */}
                <div className="flex bg-gray-100 dark:bg-white/10 rounded-xl p-1">
                    <button 
                        onClick={() => setViewMode('desktop')}
                        className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'desktop' ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Desktop"
                    >
                        <span className="material-icons text-sm">desktop_windows</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('mobile')}
                        className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'mobile' ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Mobile"
                    >
                        <span className="material-icons text-sm">smartphone</span>
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>

                {/* Scope Switcher */}
                <div className="flex bg-gray-100 dark:bg-white/10 rounded-xl p-1">
                    <button 
                        onClick={() => setPreviewScope('single')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${previewScope === 'single' ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Sección Actual
                    </button>
                    <button 
                        onClick={() => setPreviewScope('full')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${previewScope === 'full' ? 'bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Página Completa
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>

                {/* Zoom Slider */}
                <div className="flex items-center gap-2 px-2">
                    <span className="material-icons text-gray-400 text-sm">zoom_out</span>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="1" 
                        step="0.1" 
                        value={zoomLevel} 
                        onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                        className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
                    />
                    <span className="text-[10px] font-bold text-gray-500 w-8 text-right">{Math.round(zoomLevel * 100)}%</span>
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
                                    ? 'bg-gray-900/90 text-white border-gray-800 dark:bg-white/90 dark:text-black dark:border-white' 
                                    : 'bg-white/70 dark:bg-surface-dark/70 text-gray-500 dark:text-gray-400 border-white/40 dark:border-gray-700 hover:bg-white hover:text-gray-800'
                                }
                            `}
                        >
                            {activeSection.id === section.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                            )}
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                                    {activeSection.id === section.id ? 'Editando' : 'Sección'}
                                </span>
                                {activeSection.id === section.id && <span className="material-icons text-[12px] text-primary">edit</span>}
                            </div>
                            <p className="text-sm font-bold truncate leading-tight font-display">{section.title}</p>
                            <p className="text-[10px] mt-1 opacity-60 font-medium truncate">{section.serviceIds.length} servicios</p>
                        </button>
                    ))}
                </div>
            )}

            {/* SCROLLABLE VIEWPORT */}
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
                        
                        {/* Fake Browser Header (Desktop Only) */}
                        {viewMode === 'desktop' && (
                            <div className="bg-gray-100 border-b border-gray-200 p-2 flex gap-2 items-center px-4 sticky top-0 z-20">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="flex-1 bg-white rounded-md h-6 mx-4 shadow-sm flex items-center px-3 text-xs text-gray-400">
                                    dermibelle.com/services
                                </div>
                            </div>
                        )}

                        {previewScope === 'single' ? (
                             <ServiceSectionRenderer section={activeSection} services={linkedServices} viewMode={viewMode} />
                        ) : (
                            <div className="flex flex-col">
                                {/* SIMULATED WEBSITE HEADER */}
                                <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 px-6 md:px-12 py-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons text-primary text-3xl">spa</span>
                                        <div className="flex flex-col">
                                            <span className="font-display font-bold text-xl text-primary leading-none">Dermibelle</span>
                                            <span className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">Studio</span>
                                        </div>
                                    </div>
                                    
                                    {viewMode === 'desktop' && (
                                        <div className="flex gap-8 text-sm font-medium text-gray-600">
                                            <span className="hover:text-primary cursor-pointer">Inicio</span>
                                            <span className="text-primary font-bold">Servicios</span>
                                            <span className="hover:text-primary cursor-pointer">Nosotros</span>
                                            <span className="hover:text-primary cursor-pointer">Contacto</span>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        {viewMode === 'desktop' && <button className="text-sm font-bold text-gray-500 hover:text-primary">Entrar</button>}
                                        <button className="bg-primary text-white px-5 py-2 rounded-full text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                                            Reservar
                                        </button>
                                    </div>
                                </nav>

                                {/* SIMULATED HERO BANNER */}
                                <div className="bg-[#f8f9fa] py-16 md:py-24 px-6 text-center border-b border-gray-100">
                                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-primary/20">
                                        Premium Care
                                    </span>
                                    <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Service Menu</h1>
                                    <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
                                        Explore our curated selection of treatments designed to enhance your natural beauty. From organic sugaring to Brazilian knot extensions, every service is tailored to your unique needs.
                                    </p>
                                </div>

                                {/* SECTIONS LOOP */}
                                {allSections?.map(section => {
                                    // Resolve services for each section
                                    const sectionServices = section.serviceIds
                                        .map(id => catalog?.find(item => item.id === id))
                                        .filter((item): item is AppointmentItem => !!item);
                                    
                                    return <ServiceSectionRenderer key={section.id} section={section} services={sectionServices} viewMode={viewMode} />;
                                })}
                                
                                {/* SIMULATED FOOTER */}
                                <footer className="bg-gray-900 text-white pt-16 pb-8 px-6 md:px-12">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                                        <div className="col-span-1 md:col-span-1">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="material-icons text-primary text-2xl">spa</span>
                                                <span className="font-display font-bold text-xl">Dermibelle</span>
                                            </div>
                                            <p className="text-gray-400 text-sm leading-relaxed">
                                                Elevando los estándares de belleza en Port Charlotte con cuidado experto y pasión por tu bienestar.
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Menú</h4>
                                            <ul className="space-y-2 text-sm text-gray-400">
                                                <li>Inicio</li>
                                                <li>Servicios</li>
                                                <li>Nosotros</li>
                                                <li>Reservar</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Contacto</h4>
                                            <ul className="space-y-2 text-sm text-gray-400">
                                                <li className="flex items-center gap-2"><span className="material-icons text-xs text-primary">place</span> 123 Beauty Lane</li>
                                                <li className="flex items-center gap-2"><span className="material-icons text-xs text-primary">phone</span> (941) 555-0123</li>
                                                <li className="flex items-center gap-2"><span className="material-icons text-xs text-primary">email</span> hello@dermibelle.com</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Horario</h4>
                                            <p className="text-sm text-gray-400">Lunes - Viernes: 9am - 6pm</p>
                                            <p className="text-sm text-gray-400">Sábado: 10am - 4pm</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                                        <p>© 2024 Dermibelle Studio. Todos los derechos reservados.</p>
                                        <div className="flex gap-4 mt-4 md:mt-0">
                                            <span>Privacidad</span>
                                            <span>Términos</span>
                                        </div>
                                    </div>
                                </footer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SectionPreview;
