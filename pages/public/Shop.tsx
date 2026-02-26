
import React from 'react';
import { Link } from 'react-router-dom';
import { useData, AppointmentItem } from '../../context/DataContext';
import ProductSectionRenderer from '../../components/public/ProductSectionRenderer';

const Shop: React.FC = () => {
  const { productSections, catalog } = useData();

  // Filter out sections that are drafts (isActive === false)
  const activeSections = productSections.filter(s => s.isActive !== false);

  return (
    <div className="w-full">
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 z-0">
          <img alt="Natural Skincare Products" className="w-full h-full object-cover object-center opacity-30 dark:opacity-20 blur-[2px]" src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=2070&auto=format&fit=crop" />
          <div className="absolute inset-0 bg-gradient-to-b from-background-light/80 via-background-light/50 to-background-light dark:from-background-dark/80 dark:via-background-dark/50 dark:to-background-dark"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs font-bold tracking-wider uppercase border border-orange-200 dark:border-orange-800 mb-6">
            Boutique Online
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight text-gray-900 dark:text-white mb-6">
            Dermibelle Essentials
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Extiende los beneficios de tus tratamientos en casa. Productos orgánicos seleccionados por nuestros expertos para tu rutina diaria.
          </p>
        </div>
      </header>

      {/* DYNAMIC SECTIONS RENDERER */}
      {activeSections.length === 0 ? (
        <div className="py-24 text-center text-gray-400">
            <span className="material-icons text-5xl opacity-30 mb-2">storefront</span>
            <p className="text-sm">La tienda se está actualizando. Vuelve pronto.</p>
        </div>
      ) : (
        activeSections.map(section => {
            // Resolve full product objects from catalog
            const sectionProducts = section.productIds
                .map(id => catalog.find(item => item.id === id))
                .filter((item): item is AppointmentItem => !!item);

            return (
                <ProductSectionRenderer 
                    key={section.id} 
                    section={section} 
                    products={sectionProducts} 
                />
            );
        })
      )}

      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Rutinas Personalizadas</h2>
          <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            ¿No estás segura de qué productos son ideales para tu tipo de piel? Reserva una consulta de diagnóstico gratuita.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="px-8 py-4 bg-white text-gray-900 text-lg font-bold rounded-full shadow-lg hover:bg-gray-200 hover:scale-105 transition-all duration-300">
              Agendar Diagnóstico
            </Link>
          </div>
        </div>
      </section>

      <Link to="/contact" className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all duration-300 z-50 flex items-center gap-2 group">
        <span className="material-icons">chat</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap">Contact Us</span>
      </Link>
    </div>
  );
};

export default Shop;
