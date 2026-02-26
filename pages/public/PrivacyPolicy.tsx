import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body transition-colors duration-300">
      
      {/* Header Section */}
      <div className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden bg-background-light dark:bg-background-dark">
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-background-light/50 via-background-light/80 to-background-light dark:from-background-dark/50 dark:via-background-dark/80 dark:to-background-dark"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-green-300 text-xs font-bold tracking-wider uppercase border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Legal & Privacidad
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 dark:text-white mb-6">
                Política de Privacidad
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                En Dermibelle Studio, la transparencia es tan importante como la belleza. Descubra cómo protegemos y gestionamos sus datos personales.
            </p>
        </div>
      </div>

      <section className="pb-24 pt-8 bg-background-light dark:bg-background-dark relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Sidebar Navigation */}
                <aside className="hidden lg:block lg:col-span-4">
                    <div className="sticky top-28 space-y-6">
                        <nav className="bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">Índice</h3>
                            <ul className="space-y-3">
                                <li>
                                    <a href="#intro" onClick={scrollToSection('intro')} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-green-300 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 group-hover:bg-primary transition-colors"></span>
                                        1. Introducción
                                    </a>
                                </li>
                                <li>
                                    <a href="#collection" onClick={scrollToSection('collection')} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-green-300 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 group-hover:bg-primary transition-colors"></span>
                                        2. Información que Recopilamos
                                    </a>
                                </li>
                                <li>
                                    <a href="#usage" onClick={scrollToSection('usage')} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-green-300 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 group-hover:bg-primary transition-colors"></span>
                                        3. Uso de la Información
                                    </a>
                                </li>
                                <li>
                                    <a href="#sharing" onClick={scrollToSection('sharing')} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-green-300 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 group-hover:bg-primary transition-colors"></span>
                                        4. Compartir Información
                                    </a>
                                </li>
                                <li>
                                    <a href="#rights" onClick={scrollToSection('rights')} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-green-300 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 group-hover:bg-primary transition-colors"></span>
                                        5. Sus Derechos
                                    </a>
                                </li>
                                <li>
                                    <a href="#security" onClick={scrollToSection('security')} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-green-300 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 group-hover:bg-primary transition-colors"></span>
                                        6. Seguridad
                                    </a>
                                </li>
                                <li>
                                    <a href="#contact" onClick={scrollToSection('contact')} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-green-300 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 group-hover:bg-primary transition-colors"></span>
                                        7. Contacto
                                    </a>
                                </li>
                            </ul>
                        </nav>
                        <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/10">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">¿Tienes dudas sobre tus datos?</p>
                            <Link to="/contact" className="text-primary font-bold text-sm hover:underline">Contáctanos directamente →</Link>
                        </div>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="lg:col-span-8">
                    
                    {/* Disclaimer Box */}
                    <div className="bg-primary/5 dark:bg-surface-dark border border-primary/20 dark:border-primary/20 rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <span className="material-icons">info</span>
                        </div>
                        <div>
                            <h4 className="font-display font-bold text-lg text-primary dark:text-white mb-1">Aviso Importante</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                Nota: Este es un documento de ejemplo. Para una versión precisa y vinculante, consulta con un asesor legal.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-16">
                        
                        <div className="scroll-mt-32" id="intro">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6">1. Introducción</h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                Bienvenido a Dermibelle Studio. Respetamos su privacidad y nos comprometemos a proteger su información personal. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y salvaguardamos su información cuando visita nuestro sitio web o utiliza nuestros servicios de belleza y bienestar.
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                Al acceder o utilizar nuestro servicio, usted indica que ha leído, comprendido y aceptado nuestra recopilación, almacenamiento, uso y divulgación de su información personal como se describe en esta Política de Privacidad y en nuestros Términos de Servicio.
                            </p>
                        </div>

                        <div className="scroll-mt-32" id="collection">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6">2. Información que Recopilamos</h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                Podemos recopilar información sobre usted de diversas maneras. La información que podemos recopilar a través del sitio web incluye:
                            </p>
                            <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <span className="material-icons text-primary text-sm mt-1">check_circle</span>
                                        <div>
                                            <strong className="block text-gray-900 dark:text-white font-bold mb-1">Datos Personales</strong>
                                            <span className="text-gray-600 dark:text-gray-400">Información de identificación personal, como su nombre, dirección de envío, dirección de correo electrónico y número de teléfono, que usted nos proporciona voluntariamente al registrarse o reservar una cita.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="material-icons text-primary text-sm mt-1">check_circle</span>
                                        <div>
                                            <strong className="block text-gray-900 dark:text-white font-bold mb-1">Datos de Derivados</strong>
                                            <span className="text-gray-600 dark:text-gray-400">Información que nuestros servidores recopilan automáticamente cuando accede al Sitio, como su dirección IP, tipo de navegador, sistema operativo y tiempos de acceso.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="material-icons text-primary text-sm mt-1">check_circle</span>
                                        <div>
                                            <strong className="block text-gray-900 dark:text-white font-bold mb-1">Datos Financieros</strong>
                                            <span className="text-gray-600 dark:text-gray-400">Información financiera, como datos relacionados con su método de pago, que podemos recopilar cuando compra, ordena, devuelve o intercambia servicios.</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="scroll-mt-32" id="usage">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6">3. Uso de la Información</h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                Tener información precisa sobre usted nos permite brindarle una experiencia fluida, eficiente y personalizada. Específicamente, podemos utilizar la información recopilada para:
                            </p>
                            <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 text-lg leading-relaxed marker:text-primary">
                                <li>Crear y administrar su cuenta personal en Dermibelle Studio.</li>
                                <li>Procesar sus reservas de citas para servicios como Sugaring y Brazilian Knots.</li>
                                <li>Enviarle confirmaciones de citas y recordatorios.</li>
                                <li>Mejorar la eficiencia y el funcionamiento de nuestro sitio web.</li>
                                <li>Supervisar y analizar el uso y las tendencias para mejorar su experiencia.</li>
                            </ul>
                        </div>

                        <div className="scroll-mt-32" id="sharing">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6">4. Compartir Información</h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                Podemos compartir información que hemos recopilado sobre usted en ciertas situaciones. Su información puede ser divulgada de la siguiente manera:
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                <strong>Por Ley o para Proteger Derechos:</strong> Si creemos que la divulgación de información sobre usted es necesaria para responder a un proceso legal, para investigar o remediar posibles violaciones de nuestras políticas, o para proteger los derechos, la propiedad y la seguridad de otros.
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                <strong>Proveedores de Servicios Externos:</strong> Podemos compartir su información con terceros que realizan servicios para nosotros o en nuestro nombre, incluido el procesamiento de pagos, análisis de datos, entrega de correo electrónico y servicios de alojamiento.
                            </p>
                        </div>

                        <div className="scroll-mt-32" id="rights">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6">5. Sus Derechos</h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                Dependiendo de su ubicación, usted puede tener los siguientes derechos con respecto a sus datos personales:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-background-light dark:bg-background-dark/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Acceso</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Derecho a solicitar copias de sus datos personales.</p>
                                </div>
                                <div className="p-6 bg-background-light dark:bg-background-dark/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Rectificación</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Derecho a solicitar que corrijamos cualquier información inexacta.</p>
                                </div>
                                <div className="p-6 bg-background-light dark:bg-background-dark/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Eliminación</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Derecho a solicitar que borremos sus datos personales bajo ciertas condiciones.</p>
                                </div>
                                <div className="p-6 bg-background-light dark:bg-background-dark/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Restricción</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Derecho a solicitar que restrinjamos el procesamiento de sus datos.</p>
                                </div>
                            </div>
                        </div>

                        <div className="scroll-mt-32" id="security">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6">6. Seguridad de los Datos</h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                Utilizamos medidas de seguridad administrativas, técnicas y físicas para ayudar a proteger su información personal. Si bien hemos tomado medidas razonables para asegurar la información personal que nos proporciona, tenga en cuenta que a pesar de nuestros esfuerzos, ninguna medida de seguridad es perfecta o impenetrable, y no se puede garantizar ningún método de transmisión de datos contra cualquier intercepción u otro tipo de uso indebido.
                            </p>
                        </div>

                        <div className="scroll-mt-32" id="contact">
                            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6">7. Contacto</h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                                Si tiene preguntas o comentarios sobre esta Política de Privacidad, por favor contáctenos en:
                            </p>
                            <div className="flex flex-col md:flex-row gap-8">
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Correo Electrónico</h4>
                                    <a className="text-primary hover:underline" href="mailto:privacy@dermibelle.com">privacy@dermibelle.com</a>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Teléfono</h4>
                                    <span className="text-gray-600 dark:text-gray-400">(941) 555-0123</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Dirección</h4>
                                    <span className="text-gray-600 dark:text-gray-400">123 Beauty Lane, Port Charlotte, FL 33952</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
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

export default PrivacyPolicy;