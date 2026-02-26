
import React from 'react';
import { PublicServiceSection, AppointmentItem } from '../../types';
import { Link } from 'react-router-dom';

interface ServiceSectionRendererProps {
    section: PublicServiceSection;
    services: AppointmentItem[];
    viewMode?: 'desktop' | 'mobile'; // Optional for preview usage
}

const ServiceSectionRenderer: React.FC<ServiceSectionRendererProps> = ({ section, services, viewMode = 'desktop' }) => {
    // Theme Logic
    const themeStyles = {
        clean: {
            bg: 'bg-white dark:bg-surface-dark',
            text: 'text-gray-900 dark:text-white',
            subtext: 'text-gray-600 dark:text-gray-300',
            accent: 'text-primary dark:text-green-400',
            cardBg: 'bg-white dark:bg-white/5',
            border: 'border-gray-100 dark:border-gray-700',
            featureBg: 'bg-[#fdfbf7] dark:bg-white/5',
            listDivider: 'border-gray-300 dark:border-gray-600'
        },
        soft_green: {
            bg: 'bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] dark:from-green-900/30 dark:to-green-900/10',
            text: 'text-green-900 dark:text-green-50',
            subtext: 'text-green-800 dark:text-green-200',
            accent: 'text-green-700 dark:text-green-300',
            cardBg: 'bg-white/80 dark:bg-black/20',
            border: 'border-green-200 dark:border-green-800',
            featureBg: 'bg-white/60 dark:bg-white/5',
            listDivider: 'border-green-300 dark:border-green-700'
        },
        warm_gold: {
            bg: 'bg-gradient-to-br from-[#fffbeb] to-[#fed7aa] dark:from-orange-900/20 dark:to-yellow-900/10',
            text: 'text-amber-900 dark:text-amber-50',
            subtext: 'text-amber-800 dark:text-amber-200',
            accent: 'text-amber-700 dark:text-amber-300',
            cardBg: 'bg-white/80 dark:bg-black/20',
            border: 'border-amber-200 dark:border-amber-800',
            featureBg: 'bg-white/60 dark:bg-white/5',
            listDivider: 'border-amber-300 dark:border-amber-700'
        },
        luxury_dark: {
            bg: 'bg-gradient-to-br from-gray-900 to-gray-800',
            text: 'text-white',
            subtext: 'text-gray-300',
            accent: 'text-yellow-400',
            cardBg: 'bg-white/10',
            border: 'border-white/10',
            featureBg: 'bg-white/5',
            listDivider: 'border-gray-600'
        }
    };

    const currentTheme = themeStyles[section.variant || 'clean'];
    
    // Layout Logic
    const isSplit = section.imagePosition === 'left' || section.imagePosition === 'right';
    const isReverse = section.imagePosition === 'right';
    const showHero = section.imagePosition !== 'hidden' && section.heroImage;

    // Helper to guess icon based on title if not provided
    const getSectionIcon = (title: string) => {
        const lower = title.toLowerCase();
        if (lower.includes('facial') || lower.includes('skin')) return 'face_retouching_natural';
        if (lower.includes('wax') || lower.includes('sugaring') || lower.includes('depil')) return 'water_drop';
        if (lower.includes('hair') || lower.includes('cabello') || lower.includes('brazilian')) return 'content_cut';
        if (lower.includes('body') || lower.includes('cuerpo')) return 'accessibility_new';
        return 'spa';
    };

    const sectionIcon = getSectionIcon(section.title);

    return (
        <section className={`py-16 md:py-24 relative overflow-hidden ${currentTheme.bg}`}>
            
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`}>
                <div className={`flex flex-col gap-12 lg:gap-20 ${isSplit ? (isReverse ? 'lg:flex-row-reverse' : 'lg:flex-row') : ''} ${viewMode === 'mobile' ? 'flex-col' : ''} items-center`}>
                    
                    {/* HERO IMAGE CARD */}
                    {showHero && (
                        <div className={`
                            relative overflow-hidden shrink-0 rounded-[2.5rem] shadow-2xl group
                            ${isSplit && viewMode !== 'mobile'
                                ? 'w-full lg:w-[45%] aspect-[3/4]' 
                                : 'w-full aspect-[4/3] md:aspect-[16/9]'
                            }
                        `}>
                            {/* Decorative backing for rotation effect if desired, slightly visible on hover */}
                            <div className="absolute -inset-1 bg-gradient-to-tr from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-lg"></div>

                            {/* Main Image with Zoom Effect */}
                            <img 
                                src={section.heroImage} 
                                alt={section.title} 
                                className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-110"
                            />
                            
                            {/* Dark Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80"></div>

                            {/* Content Overlay (Icon & Title) */}
                            <div className="absolute bottom-0 left-0 p-8 md:p-10 text-white w-full">
                                <div className="transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4 shadow-lg">
                                        <span className="material-icons text-3xl">{sectionIcon}</span>
                                    </div>
                                    <h3 className="font-display font-bold text-3xl md:text-4xl leading-none mb-3 drop-shadow-lg tracking-tight">
                                        {section.title}
                                    </h3>
                                    <div className="h-1 w-16 bg-white/60 rounded-full mt-4 group-hover:w-24 transition-all duration-700"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONTENT AREA */}
                    <div className={`flex-1 flex flex-col justify-center ${isSplit && viewMode !== 'mobile' ? 'lg:py-4' : ''}`}>
                        
                        {/* Integrated Promo Banner */}
                        {section.promoBanner && (
                            <div className="mb-8 animate-in slide-in-from-left-4 fade-in duration-500">
                                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 text-[11px] font-bold uppercase tracking-wider transform -rotate-1 origin-left hover:rotate-0 transition-transform cursor-default border border-white/20">
                                    <span className="material-icons text-[16px]">campaign</span>
                                    {section.promoBanner}
                                </span>
                            </div>
                        )}

                        {/* Section Header */}
                        <div className="mb-10">
                            <div className="flex items-center gap-4 mb-4">
                                <span className={`h-px w-16 ${currentTheme.accent.replace('text-', 'bg-')}`}></span>
                                <span className={`${currentTheme.accent} font-bold tracking-[0.2em] text-xs uppercase`}>
                                    {section.title?.split(' ')[0] || 'SECTION'}
                                </span>
                            </div>
                            
                            <h2 className={`font-display font-bold text-4xl md:text-5xl mb-6 leading-tight ${currentTheme.text}`}>
                                {section.title}
                            </h2>
                            <p className={`leading-relaxed text-lg ${currentTheme.subtext}`}>
                                {section.description}
                            </p>
                        </div>

                        {/* Protocol Steps */}
                        {section.protocol && section.protocol.length > 0 && (
                            <div className="mb-10">
                                <h4 className={`font-display font-bold text-xs uppercase tracking-[0.2em] mb-6 ${currentTheme.accent}`}>Proceso del Servicio</h4>
                                <div className="space-y-4">
                                    {section.protocol.map((step, idx) => (
                                        <div key={idx} className="flex items-center gap-4 group">
                                            <div className={`w-10 h-10 rounded-full border-2 bg-white dark:bg-surface-dark flex items-center justify-center shrink-0 z-10 text-sm font-bold shadow-sm transition-transform group-hover:scale-110 ${currentTheme.border} ${currentTheme.accent}`}>
                                                {idx + 1}
                                            </div>
                                            <p className={`text-sm font-medium ${currentTheme.subtext}`}>{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Services Layout */}
                        <div className={`grid gap-x-8 gap-y-8 ${
                            viewMode === 'mobile' ? 'grid-cols-1' :
                            section.layoutType === 'grid_2' ? 'grid-cols-1 md:grid-cols-2' : 
                            section.layoutType === 'card_row' ? 'grid-cols-1 md:grid-cols-3' : 
                            'grid-cols-1'
                        }`}>
                            {services.length === 0 ? (
                                <div className={`col-span-full py-12 text-center border-2 border-dashed rounded-xl ${currentTheme.border} ${currentTheme.subtext}`}>
                                    <span className="material-icons text-4xl mb-2 opacity-50">playlist_add_check</span>
                                    <p className="text-sm">Selecciona servicios para verlos aquí.</p>
                                </div>
                            ) : (
                                services.map(item => (
                                    <div key={item.id} className={`group relative ${section.layoutType === 'card_row' ? `${currentTheme.cardBg} p-6 rounded-2xl shadow-sm border ${currentTheme.border} hover:shadow-md transition-shadow` : 'py-2'}`}>
                                        <div className={`flex items-end justify-between font-display font-bold text-xl md:text-2xl mb-2 ${currentTheme.text}`}>
                                            <span>{item.title}</span>
                                            {section.layoutType === 'list' && (
                                                <span className={`flex-grow border-b-2 border-dotted mx-4 relative top-[-6px] opacity-30 ${currentTheme.listDivider.replace('border-', 'border-')}`}></span>
                                            )}
                                            {section.showPrices && <span>${item.price}</span>}
                                        </div>
                                        <p className={`text-sm leading-relaxed ${currentTheme.subtext}`}>
                                            {item.description || 'Sin descripción'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* CTA */}
                        <div className="mt-10 pt-8 border-t border-gray-200/20">
                            <Link to="/booking" className={`inline-flex items-center gap-3 text-sm font-bold uppercase tracking-wider border-b-2 pb-1 transition-all ${currentTheme.accent} border-current hover:opacity-70 group`}>
                                Reservar Cita <span className="material-icons text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default ServiceSectionRenderer;
