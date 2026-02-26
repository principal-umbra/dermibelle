import React from 'react';
import { Link } from 'react-router-dom';

const FAQ: React.FC = () => {
  return (
    <div className="w-full bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body transition-colors duration-300">
      
      {/* Header Section */}
      <header className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="text-primary font-bold tracking-wider text-sm uppercase mb-3 block">Soporte y Ayuda</span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 dark:text-white mb-6">
            Preguntas Frecuentes
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Todo lo que necesitas saber sobre nuestros servicios de extensiones, sugaring y cuidado de la piel.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-16 md:py-24 bg-background-light dark:bg-background-dark hero-pattern">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Extensiones Section */}
          <div className="mb-16">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8 border-b border-primary/20 pb-4 inline-block">
              Servicios de Extensiones
            </h2>
            <div className="space-y-4">
              <details className="group bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 open:shadow-md">
                <summary className="flex items-center justify-between p-6 cursor-pointer select-none">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary transition-colors">¿Cuánto tiempo duran las extensiones de nudo brasileño?</h3>
                  <span className="material-icons text-primary transition-transform duration-300 group-open:rotate-180">expand_more</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-transparent group-open:border-gray-100 dark:group-open:border-gray-700 animate-fadeIn">
                  <p className="mt-4">Nuestras extensiones de nudo brasileño suelen durar entre 3 y 4 meses con el cuidado adecuado. A diferencia de otros métodos, esta técnica no utiliza pegamento ni calor, lo que permite que tu cabello crezca de forma natural y saludable mientras llevas las extensiones.</p>
                </div>
              </details>
              
              <details className="group bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 open:shadow-md">
                <summary className="flex items-center justify-between p-6 cursor-pointer select-none">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary transition-colors">¿El proceso daña mi cabello natural?</h3>
                  <span className="material-icons text-primary transition-transform duration-300 group-open:rotate-180">expand_more</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-transparent group-open:border-gray-100 dark:group-open:border-gray-700">
                  <p className="mt-4">En absoluto. La técnica de nudo brasileño es una de las más seguras del mercado porque se realiza únicamente con hilo elástico especial. No hay químicos, adhesivos ni herramientas térmicas involucradas, protegiendo la integridad de tu fibra capilar.</p>
                </div>
              </details>
              
              <details className="group bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 open:shadow-md">
                <summary className="flex items-center justify-between p-6 cursor-pointer select-none">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary transition-colors">¿Puedo teñir las extensiones?</h3>
                  <span className="material-icons text-primary transition-transform duration-300 group-open:rotate-180">expand_more</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-transparent group-open:border-gray-100 dark:group-open:border-gray-700">
                  <p className="mt-4">Sí, utilizamos cabello humano 100% natural de alta calidad que puede ser teñido. Sin embargo, recomendamos que cualquier proceso químico sea realizado por nuestros profesionales certificados en el estudio para garantizar que el tono coincida perfectamente y la calidad del cabello se mantenga.</p>
                </div>
              </details>
            </div>
          </div>

          {/* Sugaring Section */}
          <div className="mb-16">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8 border-b border-primary/20 pb-4 inline-block">
              Depilación con Sugaring
            </h2>
            <div className="space-y-4">
              <details className="group bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 open:shadow-md">
                <summary className="flex items-center justify-between p-6 cursor-pointer select-none">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary transition-colors">¿Es doloroso el sugaring comparado con la cera?</h3>
                  <span className="material-icons text-primary transition-transform duration-300 group-open:rotate-180">expand_more</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-transparent group-open:border-gray-100 dark:group-open:border-gray-700">
                  <p className="mt-4">La mayoría de nuestros clientes encuentran el sugaring significativamente menos doloroso que la cera tradicional. La pasta de azúcar se adhiere solo al vello y a las células muertas de la piel, no a la piel viva, lo que reduce la irritación y el dolor al retirar el vello.</p>
                </div>
              </details>
              
              <details className="group bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 open:shadow-md">
                <summary className="flex items-center justify-between p-6 cursor-pointer select-none">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary transition-colors">¿Qué largo debe tener el vello?</h3>
                  <span className="material-icons text-primary transition-transform duration-300 group-open:rotate-180">expand_more</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-transparent group-open:border-gray-100 dark:group-open:border-gray-700">
                  <p className="mt-4">Para obtener los mejores resultados, recomendamos que el vello tenga al menos el tamaño de un grano de arroz (aproximadamente 3-5 mm). Esto suele ocurrir unas 2 semanas después del afeitado o 3-4 semanas después de tu última sesión de depilación.</p>
                </div>
              </details>
            </div>
          </div>

          {/* Citas y Pagos Section */}
          <div className="mb-16">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8 border-b border-primary/20 pb-4 inline-block">
              Citas y Pagos
            </h2>
            <div className="space-y-4">
              <details className="group bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 open:shadow-md">
                <summary className="flex items-center justify-between p-6 cursor-pointer select-none">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary transition-colors">¿Se requiere un depósito para reservar?</h3>
                  <span className="material-icons text-primary transition-transform duration-300 group-open:rotate-180">expand_more</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-transparent group-open:border-gray-100 dark:group-open:border-gray-700">
                  <p className="mt-4">Sí, requerimos un depósito no reembolsable del 20% para asegurar tu cita. Este monto se descontará del total de tu servicio el día de tu visita. Puedes realizar el pago de forma segura a través de nuestra plataforma de reservas en línea.</p>
                </div>
              </details>
              
              <details className="group bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 open:shadow-md">
                <summary className="flex items-center justify-between p-6 cursor-pointer select-none">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary transition-colors">¿Cuál es su política de cancelación?</h3>
                  <span className="material-icons text-primary transition-transform duration-300 group-open:rotate-180">expand_more</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-transparent group-open:border-gray-100 dark:group-open:border-gray-700">
                  <p className="mt-4">Entendemos que surgen imprevistos. Si necesitas cancelar o reprogramar, te pedimos que nos avises con al menos 24 horas de antelación. Las cancelaciones con menos de 24 horas de aviso perderán el depósito realizado.</p>
                </div>
              </details>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-center bg-primary/5 dark:bg-primary/10 rounded-2xl p-8 md:p-12 border border-primary/10">
            <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-4">¿No encuentras tu respuesta?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">Nuestro equipo está listo para ayudarte con cualquier consulta específica que tengas sobre nuestros tratamientos.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="px-8 py-3 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-green-800 transition-all duration-300 hover:shadow-primary/40">
                Contáctanos
              </Link>
              <a href="tel:+19415550123" className="px-8 py-3 bg-white dark:bg-surface-dark border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
                Llámanos
              </a>
            </div>
          </div>
        </div>
      </div>

      <Link to="/contact" className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all duration-300 z-50 flex items-center gap-2 group">
        <span className="material-icons">chat</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap">Contact Us</span>
      </Link>
    </div>
  );
};

export default FAQ;