
import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="w-full bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body transition-colors duration-300">
      {/* Main Container - matches the HTML structure provided */}
      <div className="pt-24 pb-20 md:pt-32 md:pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary font-bold tracking-wider text-sm uppercase mb-2 block">Ponte en contacto</span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">Contacta con Dermibelle Studio</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">Estamos aquí para ayudarte a resaltar tu belleza natural. Escríbenos para consultas o reservas.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            <div className="space-y-8">
              <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow duration-300">
                <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">Información de Contacto</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-icons">location_on</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">Ubicación</h4>
                      <p className="text-gray-600 dark:text-gray-400">123 Beauty Lane,<br/>Port Charlotte, FL 33952</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-icons">phone</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">Teléfono</h4>
                      <a className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors" href="tel:+19415550123">
                        (941) 555-0123
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-icons">email</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">Email</h4>
                      <a className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors" href="mailto:hello@dermibelle.com">
                        hello@dermibelle.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-icons">schedule</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">Horario de Atención</h4>
                      <p className="text-gray-600 dark:text-gray-400">Lunes a Viernes<br/>8:00 am - 6:00 pm</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl overflow-hidden shadow-lg h-64 relative">
                <img alt="Interior del estudio Dermibelle" className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDseqVkG_gWSg6CilVwy99n1hgnPRTEz0zXMz9PsKjW9ItsVrlYcCOqLZ3KByFMvjd79nsYKD0zVF9pT4XibgCQQ2AdHLKnvAV1U_o8G5Hk_bLceyeA9dVuUf-6dg0pN3V0pGxVW9AbHqcOd67YKih6oWn8dd1B8-W1dDyAqU8n1rbsX-oIE72qBFp62T831PwxKlBK_v2-tYSn5_Yc4cdzsCkTL1tLIQUVm7rYJSk9qkSYB-vC1f5DiD2fC5zrekVEysPPJ5kooTHb"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <p className="text-white font-display text-xl italic">"Tu santuario de belleza en Port Charlotte"</p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-surface-light dark:bg-surface-dark p-8 md:p-10 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">Envíanos un mensaje</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">Completa el formulario y nos pondremos en contacto contigo lo antes posible.</p>
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="name">Nombre completo</label>
                    <input className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary py-3 px-4 sm:text-sm" id="name" name="name" placeholder="Tu nombre" type="text"/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">Correo electrónico</label>
                      <input className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary py-3 px-4 sm:text-sm" id="email" name="email" placeholder="tucorreo@ejemplo.com" type="email"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="phone">Teléfono</label>
                      <input className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary py-3 px-4 sm:text-sm" id="phone" name="phone" placeholder="(941) 555-0123" type="tel"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="subject">Asunto</label>
                    <select className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary py-3 px-4 sm:text-sm" id="subject" name="subject">
                      <option>Consulta general</option>
                      <option>Reserva de cita</option>
                      <option>Pedido de productos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="message">Mensaje</label>
                    <textarea className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary py-3 px-4 sm:text-sm" id="message" name="message" placeholder="¿En qué podemos ayudarte?" rows={4}></textarea>
                  </div>
                  <div className="pt-4">
                    <button className="w-full inline-flex justify-center items-center px-8 py-4 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-green-800 transition-all duration-300 hover:shadow-primary/40 hover:-translate-y-1" type="submit">
                      Enviar Mensaje
                      <span className="material-icons ml-2 text-sm">send</span>
                    </button>
                  </div>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                    Al contactarnos, aceptas nuestra <a className="text-primary hover:underline" href="#">Política de Privacidad</a>.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all duration-300 z-50 flex items-center gap-2 group">
        <span className="material-icons">chat</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap">Contact Us</span>
      </button>
    </div>
  );
};

export default Contact;
