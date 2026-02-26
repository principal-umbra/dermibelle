import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body transition-colors duration-300 flex flex-col min-h-screen">
      
      {/* Header Section */}
      <header className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 hero-pattern">
        <div className="absolute inset-0 bg-background-light/90 dark:bg-background-dark/95"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-light dark:to-background-dark"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-primary font-bold tracking-wider text-sm uppercase mb-3 block">Legal</span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Términos de Servicio
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Por favor, lee estos términos y condiciones cuidadosamente antes de utilizar nuestro sitio web y servicios.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Última actualización: 24 de Mayo, 2024
            </p>
        </div>
      </header>

      <main className="flex-grow py-12 md:py-20 bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">
                
                {/* Sidebar Navigation */}
                <aside className="hidden lg:block w-1/4">
                    <div className="sticky top-28">
                        <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-6 pl-4 border-l-4 border-primary">Contenido</h3>
                        <nav className="space-y-1">
                            <a onClick={scrollToSection('section-1')} href="#section-1" className="block px-4 py-2 text-sm font-medium text-primary bg-primary/5 rounded-r-lg border-l-2 border-primary transition-colors cursor-pointer">
                                1. Aceptación
                            </a>
                            <a onClick={scrollToSection('section-2')} href="#section-2" className="block px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-surface-dark rounded-r-lg transition-colors cursor-pointer">
                                2. Servicios
                            </a>
                            <a onClick={scrollToSection('section-3')} href="#section-3" className="block px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-surface-dark rounded-r-lg transition-colors cursor-pointer">
                                3. Reservas y Cancelaciones
                            </a>
                            <a onClick={scrollToSection('section-4')} href="#section-4" className="block px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-surface-dark rounded-r-lg transition-colors cursor-pointer">
                                4. Propiedad Intelectual
                            </a>
                            <a onClick={scrollToSection('section-5')} href="#section-5" className="block px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-surface-dark rounded-r-lg transition-colors cursor-pointer">
                                5. Privacidad
                            </a>
                            <a onClick={scrollToSection('section-6')} href="#section-6" className="block px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-surface-dark rounded-r-lg transition-colors cursor-pointer">
                                6. Contacto
                            </a>
                        </nav>
                    </div>
                </aside>

                {/* Content Area */}
                <article className="w-full lg:w-3/4">
                    
                    {/* Disclaimer Box */}
                    <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700 p-6 md:p-8 rounded-2xl shadow-lg shadow-primary/5 flex flex-col sm:flex-row gap-6 items-start mb-12 relative overflow-hidden group hover:border-primary/20 transition-colors duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <span className="material-icons">gavel</span>
                        </div>
                        <div>
                            <h4 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Nota Importante</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                Nota: Este es un documento de ejemplo. Para una versión precisa y vinculante, consulta con un asesor legal. El contenido a continuación tiene fines únicamente ilustrativos para el diseño de la interfaz.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-12">
                        
                        <section className="scroll-mt-28" id="section-1">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-body font-bold">1</span>
                                Aceptación de los Términos
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                Al acceder y utilizar el sitio web de Dermibelle Studio ("Servicio"), usted acepta y se compromete a cumplir los términos y disposiciones de este acuerdo. Asimismo, al utilizar estos servicios particulares, usted estará sujeto a toda regla o guía de uso correspondiente que se haya publicado para dichos servicios.
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                Cualquier participación en este servicio constituirá la aceptación de este acuerdo. Si no acepta cumplir con lo anterior, por favor, no lo utilice.
                            </p>
                        </section>

                        <div className="w-full h-px bg-gray-200 dark:bg-gray-800"></div>

                        <section className="scroll-mt-28" id="section-2">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-body font-bold">2</span>
                                Descripción de Servicios
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                Dermibelle Studio ofrece servicios de belleza y bienestar, incluyendo pero no limitado a: depilación con azúcar (sugaring), extensiones de cabello (Brazilian knots) y tratamientos faciales personalizados.
                            </p>
                            <ul className="space-y-4 text-gray-600 dark:text-gray-300 text-lg ml-2">
                                <li className="flex items-start gap-3">
                                    <span className="material-icons text-primary text-sm mt-1.5">check_circle</span>
                                    <span>Nos reservamos el derecho de negar el servicio a cualquier persona por cualquier motivo en cualquier momento.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-icons text-primary text-sm mt-1.5">check_circle</span>
                                    <span>Los precios de nuestros servicios están sujetos a cambios sin previo aviso.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-icons text-primary text-sm mt-1.5">check_circle</span>
                                    <span>Nos reservamos el derecho de modificar o interrumpir el Servicio (o cualquier parte del contenido) en cualquier momento sin previo aviso.</span>
                                </li>
                            </ul>
                        </section>

                        <div className="w-full h-px bg-gray-200 dark:bg-gray-800"></div>

                        <section className="scroll-mt-28" id="section-3">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-body font-bold">3</span>
                                Reservas y Cancelaciones
                            </h2>
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6">
                                <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-4">Política de 24 Horas</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    Entendemos que pueden surgir imprevistos. Sin embargo, solicitamos respetuosamente un aviso de al menos 24 horas para cancelar o reprogramar su cita.
                                </p>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                Las cancelaciones realizadas con menos de 24 horas de antelación estarán sujetas a un cargo del 50% del servicio reservado. La no asistencia sin aviso previo ("No Show") resultará en un cargo del 100% del servicio.
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                Para citas que requieran un tiempo prolongado (como los Brazilian Knots), se requerirá un depósito no reembolsable al momento de la reserva.
                            </p>
                        </section>

                        <div className="w-full h-px bg-gray-200 dark:bg-gray-800"></div>

                        <section className="scroll-mt-28" id="section-4">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-body font-bold">4</span>
                                Propiedad Intelectual
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                El Sitio y su contenido original, características y funcionalidad son propiedad de Dermibelle Studio y están protegidos por derechos de autor internacionales, marcas registradas, patentes, secretos comerciales y otras leyes de propiedad intelectual o derechos de propiedad.
                            </p>
                        </section>

                        <div className="w-full h-px bg-gray-200 dark:bg-gray-800"></div>

                        <section className="scroll-mt-28" id="section-5">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-body font-bold">5</span>
                                Privacidad
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                Su uso del sitio también se rige por nuestra Política de Privacidad. Por favor, revise nuestra Política de Privacidad, que también rige el Sitio e informa a los usuarios de nuestras prácticas de recolección de datos.
                            </p>
                            <Link to="/privacy-policy" className="inline-flex items-center text-primary font-semibold hover:text-green-700 dark:hover:text-green-400 transition-colors group">
                                Ver Política de Privacidad <span className="material-icons ml-1 text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                        </section>

                        <div className="w-full h-px bg-gray-200 dark:bg-gray-800"></div>

                        <section className="scroll-mt-28" id="section-6">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-body font-bold">6</span>
                                Contacto
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                Si tiene alguna pregunta sobre estos Términos, por favor contáctenos:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                                        <span className="material-icons text-xl">email</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase tracking-wider font-bold">Email</span>
                                        <span className="text-gray-900 dark:text-white font-medium">legal@dermibelle.com</span>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                                        <span className="material-icons text-xl">location_on</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase tracking-wider font-bold">Oficina</span>
                                        <span className="text-gray-900 dark:text-white font-medium">Port Charlotte, FL</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                </article>
            </div>
        </div>
      </main>

      <Link to="/contact" className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all duration-300 z-50 flex items-center gap-2 group">
        <span className="material-icons">chat</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap">Contáctanos</span>
      </Link>
    </div>
  );
};

export default TermsOfService;