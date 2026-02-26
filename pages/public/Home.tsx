import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="w-full">
      <header className="relative pt-20 overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Woman with glowing skin and beautiful hair" 
            className="w-full h-full object-cover object-center opacity-90 dark:opacity-60" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuANwzZ1xkDq5LHp1oIe1o9rcLG9bEDc2sfjik9F-NEGMFPAsP6AjDkVpl6QU6eLYenxDrI7J65BSsq7Fh2Ma4Q2g-B4OwYa9n12kxTpWQt1wkeXRk0Hu3FKGeqxUboJQjBOTcRK0IW5FxmkL6pQ9seFEiLaF1f2Y2dGdD0XEJbvWE5ANvL6gwO-R_yxEtHZzLWhsYfNJhDfD6BEHALQE4uW9i87cywlMHVdeGuKRjdHxk7BHXRabSmrkBYCXCrkzz2D3WDVHKC2ua2l"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background-light via-background-light/80 to-transparent dark:from-background-dark dark:via-background-dark/90 dark:to-background-dark/40"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 md:py-0">
          <div className="md:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-green-300 text-xs font-bold tracking-wider uppercase border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Port Charlotte's Premier Studio
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-gray-900 dark:text-white">
              Natural Beauty,<br/>
              <span className="text-primary italic">Elevated.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed">
              Discover your radiance with personalized skincare, expert sugaring, and Brazilian knot extensions. Where wellness meets luxury.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/booking" className="inline-flex justify-center items-center px-8 py-4 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-green-800 transition-all duration-300 hover:shadow-primary/40 hover:-translate-y-1">
                Book Appointment
                <span className="material-icons ml-2 text-sm">arrow_forward</span>
              </Link>
              <Link to="/services" className="inline-flex justify-center items-center px-8 py-4 bg-white dark:bg-surface-dark text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-lg font-medium rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
                View Services
              </Link>
            </div>
            <div className="flex items-center gap-4 pt-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-dark object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTmbtnThyRcY-UuQYkb8xakqYr1Qeq6qEHsmBipiX7Jfzu8bQi29NVIWIXKzAXC3nACR8G1hVZqov325385Vb1oKji3TCl-FamPm-bZ0hBv7-cOeeA5oaZM5QVV2b6tONpZA_Ekn9VBZqAQUOI2KtkHZeuRQXHJfXPqFPKwLnqZyYSrcZaG-XIZzTeM8Ea_hnYPpD_Xb5Lu8HMn_t2PkUs1PNDd-NetN1qm8Sou6FIkuEYL5syn9cWf0YHLVib0hErULA6SfeMQrz8" alt="Client" />
                    <img className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-dark object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3uzUrmW0WBJPpGKXPIZB8lQpBCU-NR87amocmNg3XuclXUOEPXk1l5aO0zITr56r9SINtzQ4NWrmQF2yTrPvTFOBlEd-_VfXzwXYUeKdYLWMlr8i4Ar-aecTV26Do2zyUAaMm7QuQMwRjlRWI-1LRcSITPjcuQz47C5VuftInza7UIsrNpdwk1XIBKHfE7ev1gs9nP1si2Zl6o5R1DDbV9apEDsgU-p2GyT--4SrMpIzfZbbYXucJe4w4581J_IopL0JMSvhfQX6w" alt="Client" />
                    <img className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-dark object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxK_wSkgs4ZVZXxbeSOLbsReX7pjZtF98-IWvUv79pMKq8j4Wf2PnOru8JnVoJElYMspGhM_7QHnqU2SAJorQLDXSczzu1kIz07yZWiJPL_ccpaY7_rlAjYWsEGdGM46DeVWWN905kgpwtmF3XP9u6t_inQgoB_DUXsego3SqfVbX2SfcTezq1MOStp3pCHtd769aLLrdsRr5eRZCwNJg01q5bQJ38iPcD2d9cxxtEXZLtYZrFJMjJwHLg10lqECCRs8kdC2E8hEdt" alt="Client" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white flex items-center">4.9/5 <span className="material-icons text-yellow-400 text-sm ml-1">star</span></span>
                    <span>Trusted by 500+ clients</span>
                </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-12 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-6 rounded-2xl hover:bg-background-light dark:hover:bg-background-dark transition-colors duration-300">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-icons">spa</span>
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Organic Products</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">We use only the finest organic, cruelty-free products that nurture your skin and respect the environment.</p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-6 rounded-2xl hover:bg-background-light dark:hover:bg-background-dark transition-colors duration-300">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-icons">verified</span>
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Certified Experts</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Our team is rigorously trained and certified in the latest techniques for skincare and hair extensions.</p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-6 rounded-2xl hover:bg-background-light dark:hover:bg-background-dark transition-colors duration-300">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-icons">favorite</span>
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Personalized Care</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Every treatment is customized to your unique needs, ensuring results that enhance your natural beauty.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-background-light dark:bg-background-dark relative hero-pattern" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-primary font-bold tracking-wider text-sm uppercase mb-2 block">Our Expertise</span>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Curated Treatments</h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">Indulge in our range of specialized services designed to rejuvenate and enhance.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    { title: "Custom Skincare", desc: "Revitalize your complexion with facials tailored to your skin type. From hydration to anti-aging, we bring out your glow.", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBR3X9uHVowwfSTLphQ2DL-1Ar0rOrmjVY-YbwwiIdJQWKFzSn-AaP7W-dCtb42YIgGg3N5xJdRzWk1Oe7o4SXUManeuAGGPWyPcM35PlxhLVLlUH6x_PrzmbnIAJk4beCarUgr9t0QOc12XAO9n3-I3YY4oVglDq_IzENBn84MnO-ba33F11UQxprL4qF4IDsD7PkEEILMa-Y29cZx19xGDPH0IA3JlXyFGhdEn779iTWgH4I9zL9ELvC7em8HZp4cTTxccn1u4WiS" },
                    { title: "Sugaring Wax", desc: "Experience the gentle, all-natural alternative to traditional waxing. Smoother skin with less irritation for long-lasting results.", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvCB9EtqSiYmrMnb4gpcrhJM0LKnPmSTAPnbFp7TsV_7DF1zvBfX6VenGodYn9iuqCEcjoV2DEfKmQm1WXfKFu1EGIvitjBZkyAfMpPu-tjk5z-BS8JILuWGq7IQONn7PPvBRKEdUzyfrup2NsijnBBwT5mgDo0v3539HU_RfHYG_5s0jVNVAjwNQSjQeXIUTxXN0LU6z4cyVC4-7M07S9cR9QoKI9MCjwdOIlrDdv-Eglz7Lq_tBbyBJkLL5cqOhsgU9OQmb9yU6m" },
                    { title: "Brazilian Knots", desc: "Achieve volume and length seamlessly. Our Brazilian knot technique uses no glue or heat, protecting your natural hair.", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3kh8KRbFtviSrY-t6Al8_8snHJu5qiOnVSkjJj0zL8T7gyScw1vFYnsV0VGX-YPQZd1D-F5ncFNAWs4jXoGng5p_mVWXJDMp1UVRGRwEb1UZwRKBxEYl1HSv4CFXgDtBesSWBtgJGapIM8R73avRy9IkarskgSSIhMkqFgEaYugv3gRUxKr3b9rTB2wx3RBw0g_3UeXkbEeOMOOab9034QGQDE2hVogmNFO2JnqB4ScWstRsnan3PhdazrzTI38kAWyoBDFDbgeZ6" }
                ].map((s, i) => (
                    <div key={i} className="group bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border border-gray-100 dark:border-gray-800">
                        <div className="h-64 overflow-hidden relative">
                            <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors z-10"></div>
                            <img src={s.img} alt={s.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-8">
                            <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-3">{s.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">{s.desc}</p>
                            <Link to="/services" className="inline-flex items-center text-primary font-semibold group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                                Learn More <span className="material-icons ml-1 text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-16 text-center">
                <Link to="/services" className="inline-flex justify-center items-center px-8 py-3 border border-primary text-primary dark:text-green-300 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white rounded-full transition-all duration-300 font-medium">
                    See All Services
                </Link>
            </div>
        </div>
      </section>

      <section className="py-20 bg-surface-light dark:bg-surface-dark overflow-hidden" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="w-full lg:w-1/2 relative">
                    <div className="grid grid-cols-2 gap-4">
                        <img alt="Salon Interior detail" className="rounded-2xl shadow-lg mt-12 w-full h-64 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDseqVkG_gWSg6CilVwy99n1hgnPRTEz0zXMz9PsKjW9ItsVrlYcCOqLZ3KByFMvjd79nsYKD0zVF9pT4XibgCQQ2AdHLKnvAV1U_o8G5Hk_bLceyeA9dVuUf-6dg0pN3V0pGxVW9AbHqcOd67YKih6oWn8dd1B8-W1dDyAqU8n1rbsX-oIE72qBFp62T831PwxKlBK_v2-tYSn5_Yc4cdzsCkTL1tLIQUVm7rYJSk9qkSYB-vC1f5DiD2fC5zrekVEysPPJ5kooTHb"/>
                        <img alt="Beauty Product" className="rounded-2xl shadow-lg w-full h-64 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfdQgDzjI5LPFN3DLuPRo4wPT4GPy1b7iTNtmNM63s61QNueakLxzHjIEnAMTIYZOzSdLgAwNPLJvLs-5Lnh8EacR1DBv8m6Vou8dip0-mjYtCptBc0yjzOx3kxRkQpS5iI3TkRzGT-KpmtfNZ1-OADBZad07iBLaX3ieHSgc-KHusLHrJFgwNVzJQBdg_bWFLU3dYRmf-PktcBVKuzrtqB2wRjPZp9LeSI1Qcbbg6OOoC-knx5f4-xl36kuKrE0jm6Dacx2un1HR7"/>
                    </div>
                    <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-3xl"></div>
                </div>
                <div className="w-full lg:w-1/2">
                    <span className="text-primary font-bold tracking-wider text-sm uppercase mb-2 block">Our Philosophy</span>
                    <h2 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-6">More Than Just a Salon. <br/>A Sanctuary.</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                        At Dermibelle Studio, we believe beauty is a feeling. Founded with a mission to bring high-end, personalized wellness to Port Charlotte, we've created a space where you can unwind and transform.
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                        We don't just follow trends; we focus on what works best for <em>you</em>. From our meticulous hygiene standards to our ongoing education in the latest beauty science, your trust is our most valuable asset.
                    </p>
                    <div className="flex items-center gap-8 mb-8">
                        <div>
                            <span className="block text-3xl font-display font-bold text-primary">5+</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Years Exp.</span>
                        </div>
                        <div>
                            <span className="block text-3xl font-display font-bold text-primary">1k+</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Happy Clients</span>
                        </div>
                        <div>
                            <span className="block text-3xl font-display font-bold text-primary">100%</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Satisfaction</span>
                        </div>
                    </div>
                    <Link to="/about" className="text-gray-900 dark:text-white font-semibold border-b-2 border-primary hover:text-primary transition-colors pb-1 inline-flex items-center">
                        Read Our Story
                    </Link>
                </div>
            </div>
        </div>
      </section>

      <section className="py-20 bg-primary dark:bg-primary/20 text-white relative overflow-hidden" id="testimonials">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-6 inline-block backdrop-blur-sm">Client Love</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-12">"The best decision I made for my skin."</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:bg-white/20 transition-all duration-300">
                    <div className="flex items-center mb-4 text-yellow-300">
                        {[...Array(5)].map((_,i) => <span key={i} className="material-icons text-sm">star</span>)}
                    </div>
                    <p className="text-gray-100 mb-6 text-lg italic">"I've tried so many places for sugaring, but Dermibelle is on another level. Virtually painless and the results last so long!"</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">S</div>
                        <div>
                            <p className="font-bold text-sm">Sarah Jenkins</p>
                            <p className="text-xs text-white/60">Regular Client</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:bg-white/20 transition-all duration-300 transform md:-translate-y-4 shadow-xl">
                    <div className="flex items-center mb-4 text-yellow-300">
                        {[...Array(5)].map((_,i) => <span key={i} className="material-icons text-sm">star</span>)}
                    </div>
                    <p className="text-gray-100 mb-6 text-lg italic">"The Brazilian knots transformed my hair. They look so natural, nobody believes they aren't mine. Truly an artist's touch."</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">M</div>
                        <div>
                            <p className="font-bold text-sm">Maria Rodriguez</p>
                            <p className="text-xs text-white/60">Hair Services</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:bg-white/20 transition-all duration-300">
                    <div className="flex items-center mb-4 text-yellow-300">
                        {[...Array(5)].map((_,i) => <span key={i} className="material-icons text-sm">star</span>)}
                    </div>
                    <p className="text-gray-100 mb-6 text-lg italic">"Professional, clean, and incredibly relaxing. The facial was customized perfectly for my sensitive skin. Highly recommend."</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">J</div>
                        <div>
                            <p className="font-bold text-sm">Jessica Tan</p>
                            <p className="text-xs text-white/60">Skincare</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section className="py-24 bg-background-light dark:bg-background-dark text-center">
        <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Ready for your transformation?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">Book your appointment today and take the first step towards a more radiant you.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/booking" className="px-10 py-4 bg-primary text-white text-lg font-bold rounded-full shadow-lg hover:bg-green-800 hover:scale-105 transition-all duration-300">
                    Book Now
                </Link>
                <Link to="/contact" className="px-10 py-4 bg-white dark:bg-surface-dark border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-lg font-bold rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
                    Contact Us
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

export default Home;