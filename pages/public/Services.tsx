
import React from 'react';
import { Link } from 'react-router-dom';
import { useData, AppointmentItem } from '../../context/DataContext';
import ServiceSectionRenderer from '../../components/public/ServiceSectionRenderer';

const Services: React.FC = () => {
  const { serviceSections, catalog } = useData();

  // Filter out sections that are drafts (isActive === false)
  // We treat undefined as true for backwards compatibility if needed, but Context now sets default true.
  const activeSections = serviceSections.filter(s => s.isActive !== false);

  return (
    <div className="w-full">
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 z-0">
          <img alt="Woman with glowing skin" className="w-full h-full object-cover object-top opacity-30 dark:opacity-20 blur-[2px]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuANwzZ1xkDq5LHp1oIe1o9rcLG9bEDc2sfjik9F-NEGMFPAsP6AjDkVpl6QU6eLYenxDrI7J65BSsq7Fh2Ma4Q2g-B4OwYa9n12kxTpWQt1wkeXRk0Hu3FKGeqxUboJQjBOTcRK0IW5FxmkL6pQ9seFEiLaF1f2Y2dGdD0XEJbvWE5ANvL6gwO-R_yxEtHZzLWhsYfNJhDfD6BEHALQE4uW9i87cywlMHVdeGuKRjdHxk7BHXRabSmrkBYCXCrkzz2D3WDVHKC2ua2l" />
          <div className="absolute inset-0 bg-gradient-to-b from-background-light/80 via-background-light/50 to-background-light dark:from-background-dark/80 dark:via-background-dark/50 dark:to-background-dark"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-green-300 text-xs font-bold tracking-wider uppercase border border-primary/20 mb-6">
            Premium Care
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight text-gray-900 dark:text-white mb-6">
            Our Service Menu
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Explore our curated selection of treatments designed to enhance your natural beauty. From organic sugaring to Brazilian knot extensions, every service is tailored to your unique needs.
          </p>
        </div>
      </header>

      {/* DYNAMIC SECTIONS RENDERER */}
      {activeSections.length === 0 ? (
        <div className="py-24 text-center text-gray-400">
            <span className="material-icons text-5xl opacity-30 mb-2">web_asset_off</span>
            <p className="text-sm">El menú de servicios se está actualizando. Por favor revisa más tarde.</p>
        </div>
      ) : (
        activeSections.map(section => {
            // Resolve full service objects from catalog
            const sectionServices = section.serviceIds
                .map(id => catalog.find(item => item.id === id))
                .filter((item): item is AppointmentItem => !!item);

            return (
                <ServiceSectionRenderer 
                    key={section.id} 
                    section={section} 
                    services={sectionServices} 
                />
            );
        })
      )}

      <section className="py-20 bg-primary dark:bg-primary/20 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Unsure what you need?</h2>
          <p className="text-gray-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Every individual is different. We offer complimentary 15-minute phone consultations to help you choose the right service for your skin or hair goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="px-8 py-4 bg-white text-primary text-lg font-bold rounded-full shadow-lg hover:bg-gray-100 hover:scale-105 transition-all duration-300">
              Schedule a Call
            </Link>
            <Link to="/about" className="px-8 py-4 bg-transparent border border-white text-white text-lg font-bold rounded-full hover:bg-white/10 transition-all duration-300">
              View FAQ
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/60">
            * Prices subject to change. A 24-hour cancellation notice is required for all appointments.
          </p>
        </div>
      </section>

      <Link to="/contact" className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all duration-300 z-50 flex items-center gap-2 group">
        <span className="material-icons">chat</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap">Contact Us</span>
      </Link>
    </div>
  );
};

export default Services;
