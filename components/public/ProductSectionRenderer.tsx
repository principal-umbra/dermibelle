
import React, { useState } from 'react';
import { PublicProductSection, AppointmentItem } from '../../types';
import { Link } from 'react-router-dom';

interface ProductSectionRendererProps {
    section: PublicProductSection;
    products: AppointmentItem[];
    viewMode?: 'desktop' | 'mobile'; // Optional for preview usage
}

// Internal component to handle image errors gracefully
const ProductImage = ({ src, alt, className }: { src?: string, alt: string, className?: string }) => {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-white/5 relative overflow-hidden group ${className}`}>
                 {/* Decorative background pattern for placeholder */}
                 <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px'}}></div>
                 
                 <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-3 z-10 transform group-hover:scale-110 transition-transform duration-500">
                    <span className="material-icons text-3xl text-gray-300 dark:text-gray-600">inventory_2</span>
                 </div>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">Dermibelle</span>
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className={className}
            onError={() => setError(true)}
            loading="lazy"
        />
    );
};

const ProductSectionRenderer: React.FC<ProductSectionRendererProps> = ({ section, products, viewMode = 'desktop' }) => {
    // Theme Logic (Shared themes but adapted for products)
    const themeStyles = {
        clean: {
            bg: 'bg-white dark:bg-surface-dark',
            text: 'text-gray-900 dark:text-white',
            subtext: 'text-gray-600 dark:text-gray-300',
            accent: 'text-primary dark:text-green-400',
            cardBg: 'bg-white dark:bg-white/5',
            border: 'border-gray-100 dark:border-gray-700',
            featureBg: 'bg-[#fdfbf7] dark:bg-white/5',
        },
        soft_green: {
            bg: 'bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] dark:from-green-900/30 dark:to-green-900/10',
            text: 'text-green-900 dark:text-green-50',
            subtext: 'text-green-800 dark:text-green-200',
            accent: 'text-green-700 dark:text-green-300',
            cardBg: 'bg-white/80 dark:bg-black/20',
            border: 'border-green-200 dark:border-green-800',
            featureBg: 'bg-white/60 dark:bg-white/5',
        },
        warm_gold: {
            bg: 'bg-gradient-to-br from-[#fffbeb] to-[#fed7aa] dark:from-orange-900/20 dark:to-yellow-900/10',
            text: 'text-amber-900 dark:text-amber-50',
            subtext: 'text-amber-800 dark:text-amber-200',
            accent: 'text-amber-700 dark:text-amber-300',
            cardBg: 'bg-white/80 dark:bg-black/20',
            border: 'border-amber-200 dark:border-amber-800',
            featureBg: 'bg-white/60 dark:bg-white/5',
        },
        luxury_dark: {
            bg: 'bg-gradient-to-br from-gray-900 to-gray-800',
            text: 'text-white',
            subtext: 'text-gray-300',
            accent: 'text-yellow-400',
            cardBg: 'bg-white/10',
            border: 'border-white/10',
            featureBg: 'bg-white/5',
        }
    };

    const currentTheme = themeStyles[section.variant || 'clean'];
    
    // Layout Logic
    const isSplit = section.imagePosition === 'left' || section.imagePosition === 'right';
    const isReverse = section.imagePosition === 'right';
    const showHero = section.imagePosition !== 'hidden' && section.heroImage;

    return (
        <section className={`py-16 md:py-24 relative overflow-hidden ${currentTheme.bg}`}>
            
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`}>
                <div className={`flex flex-col gap-12 lg:gap-16 ${isSplit ? (isReverse ? 'lg:flex-row-reverse' : 'lg:flex-row') : ''} ${viewMode === 'mobile' ? 'flex-col' : ''}`}>
                    
                    {/* HERO IMAGE */}
                    {showHero && (
                        <div className={`
                            relative overflow-hidden shrink-0 rounded-[2rem] shadow-xl group
                            ${isSplit && viewMode !== 'mobile'
                                ? 'w-full lg:w-1/2 min-h-[400px]' 
                                : 'w-full h-64 md:h-80'
                            }
                        `}>
                            <img 
                                src={section.heroImage} 
                                alt={section.title} 
                                className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Overlay Gradient */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                             
                             {/* Optional: Text on Image if Top Layout */}
                             {!isSplit && (
                                <div className="absolute bottom-0 left-0 p-8">
                                    <h2 className="text-3xl font-display font-bold text-white mb-2 shadow-sm">{section.title}</h2>
                                    {section.promoBanner && (
                                        <span className="inline-block bg-white text-gray-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            {section.promoBanner}
                                        </span>
                                    )}
                                </div>
                             )}
                        </div>
                    )}

                    {/* CONTENT AREA */}
                    <div className={`flex-1 flex flex-col ${isSplit && viewMode !== 'mobile' ? 'justify-center' : ''}`}>
                        
                        {/* Section Header (If Split or No Image) */}
                        {(isSplit || !showHero) && (
                            <div className="mb-10">
                                {section.promoBanner && (
                                    <span className={`inline-block mb-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${currentTheme.border} ${currentTheme.accent} bg-white/50`}>
                                        {section.promoBanner}
                                    </span>
                                )}
                                <h2 className={`font-display font-bold text-3xl md:text-4xl mb-4 leading-tight ${currentTheme.text}`}>
                                    {section.title}
                                </h2>
                                <p className={`leading-relaxed text-base md:text-lg ${currentTheme.subtext}`}>
                                    {section.description}
                                </p>
                            </div>
                        )}

                        {/* Features List (Optional) */}
                        {section.features && section.features.length > 0 && (
                            <div className="flex flex-wrap gap-4 mb-10">
                                {section.features.map((feat, idx) => (
                                    <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${currentTheme.featureBg} ${currentTheme.border}`}>
                                        <span className={`material-icons text-sm ${currentTheme.accent}`}>{feat.icon}</span>
                                        <span className={`text-xs font-bold ${currentTheme.text}`}>{feat.title}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Products Grid */}
                        <div className={`grid gap-6 ${
                            viewMode === 'mobile' ? 'grid-cols-1' :
                            section.layoutType === 'grid_4' ? 'grid-cols-2 md:grid-cols-4' : 
                            section.layoutType === 'grid_3' ? 'grid-cols-1 md:grid-cols-3' : 
                            'grid-cols-1 md:grid-cols-2' // Showcase
                        }`}>
                            {products.length === 0 ? (
                                <div className={`col-span-full py-12 text-center border-2 border-dashed rounded-xl ${currentTheme.border} ${currentTheme.subtext}`}>
                                    <span className="material-icons text-4xl mb-2 opacity-50">production_quantity_limits</span>
                                    <p className="text-sm">Selecciona productos para verlos aquí.</p>
                                </div>
                            ) : (
                                products.map(item => (
                                    <div key={item.id} className={`group flex flex-col ${currentTheme.cardBg} rounded-2xl overflow-hidden border ${currentTheme.border} hover:shadow-lg transition-all duration-300`}>
                                        {/* Image Area with Fallback */}
                                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                            <ProductImage 
                                                src={item.image} 
                                                alt={item.title} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            />
                                            {/* Quick Add Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-xs shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    Ver Detalles
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 flex flex-col flex-1">
                                            <div className="flex-1">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">{item.category || 'Producto'}</span>
                                                <h3 className={`font-bold text-sm leading-tight mb-2 ${currentTheme.text} line-clamp-2`}>{item.title}</h3>
                                            </div>
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                {section.showPrices ? (
                                                    <span className={`font-display font-bold text-lg ${currentTheme.text}`}>${item.price}</span>
                                                ) : <span></span>}
                                                <button className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 ${currentTheme.accent}`}>
                                                    <span className="material-icons text-sm">add_shopping_cart</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductSectionRenderer;
