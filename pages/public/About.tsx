import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  shortBio: string;
  fullBio: string[];
  tags: string[];
  specialties: { icon: string; text: string }[];
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Isabella Rossi",
    role: "Founder & Lead Esthetician",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBR3X9uHVowwfSTLphQ2DL-1Ar0rOrmjVY-YbwwiIdJQWKFzSn-AaP7W-dCtb42YIgGg3N5xJdRzWk1Oe7o4SXUManeuAGGPWyPcM35PlxhLVLlUH6x_PrzmbnIAJk4beCarUgr9t0QOc12XAO9n3-I3YY4oVglDq_IzENBn84MnO-ba33F11UQxprL4qF4IDsD7PkEEILMa-Y29cZx19xGDPH0IA3JlXyFGhdEn779iTWgH4I9zL9ELvC7em8HZp4cTTxccn1u4WiS",
    shortBio: "With over 12 years of experience in clinical skincare, Isabella founded Dermibelle to bridge the gap between medical results and spa luxury.",
    fullBio: [
      "With over 12 years of dedicated experience in clinical skincare, Isabella founded Dermibelle to bridge the gap between medical-grade results and the luxurious experience of a high-end spa.",
      "She believes that true radiance comes from a personalized approach, combining advanced technology with holistic wellness practices."
    ],
    tags: ["Licensed Esthetician", "Acne Specialist"],
    specialties: [
      { icon: "spa", text: "Advanced Chemical Peels & Resurfacing" },
      { icon: "face", text: "Holistic Acne Treatment Protocols" },
      { icon: "auto_awesome", text: "Anti-Aging Microcurrent Therapy" }
    ]
  },
  {
    name: "Sarah Chen",
    role: "Hair Extension Specialist",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3kh8KRbFtviSrY-t6Al8_8snHJu5qiOnVSkjJj0zL8T7gyScw1vFYnsV0VGX-YPQZd1D-F5ncFNAWs4jXoGng5p_mVWXJDMp1UVRGRwEb1UZwRKBxEYl1HSv4CFXgDtBesSWBtgJGapIM8R73avRy9IkarskgSSIhMkqFgEaYugv3gRUxKr3b9rTB2wx3RBw0g_3UeXkbEeOMOOab9034QGQDE2hVogmNFO2JnqB4ScWstRsnan3PhdazrzTI38kAWyoBDFDbgeZ6",
    shortBio: "A master of the Brazilian Knot technique, Sarah is dedicated to hair health. She creates seamless, voluminous looks without heat or glue.",
    fullBio: [
      "Sarah is a master artisan in the world of hair restoration and extensions. With a background in trichology basics, she prioritizes the integrity of your natural hair above all else.",
      "Her specialty lies in the Brazilian Knot technique—a meticulous, strand-by-strand application that offers unparalleled movement and versatility without the damage associated with glue or heat."
    ],
    tags: ["Hair Specialist", "Extension Certified"],
    specialties: [
      { icon: "content_cut", text: "Brazilian Knot Installation" },
      { icon: "palette", text: "Custom Texture & Color Matching" },
      { icon: "health_and_safety", text: "Scalp Health & Maintenance" }
    ]
  },
  {
    name: "Elena Rodriguez",
    role: "Sugaring & Body Expert",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvCB9EtqSiYmrMnb4gpcrhJM0LKnPmSTAPnbFp7TsV_7DF1zvBfX6VenGodYn9iuqCEcjoV2DEfKmQm1WXfKFu1EGIvitjBZkyAfMpPu-tjk5z-BS8JILuWGq7IQONn7PPvBRKEdUzyfrup2NsijnBBwT5mgDo0v3539HU_RfHYG_5s0jVNVAjwNQSjQeXIUTxXN0LU6z4cyVC4-7M07S9cR9QoKI9MCjwdOIlrDdv-Eglz7Lq_tBbyBJkLL5cqOhsgU9OQmb9yU6m",
    shortBio: "Elena's gentle touch and speed make her the most sought-after sugaring expert in the county. She ensures every client feels comfortable.",
    fullBio: [
      "Known for her incredibly gentle hand and efficient technique, Elena has revolutionized the hair removal experience for hundreds of clients in Port Charlotte.",
      "She specializes in organic sugaring, focusing on techniques that minimize discomfort and prevent ingrown hairs, leaving your skin flawlessly smooth and cared for."
    ],
    tags: ["Cosmetologist", "Sugaring Pro"],
    specialties: [
      { icon: "water_drop", text: "Full Body Organic Sugaring" },
      { icon: "healing", text: "Ingrown Hair Treatment & Prevention" },
      { icon: "self_improvement", text: "Body Contouring Wraps" }
    ]
  }
];

const About: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (selectedMember) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedMember]);

  return (
    <div className="w-full">
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img alt="Salon Interior Texture" className="w-full h-full object-cover object-center opacity-30 dark:opacity-20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDseqVkG_gWSg6CilVwy99n1hgnPRTEz0zXMz9PsKjW9ItsVrlYcCOqLZ3KByFMvjd79nsYKD0zVF9pT4XibgCQQ2AdHLKnvAV1U_o8G5Hk_bLceyeA9dVuUf-6dg0pN3V0pGxVW9AbHqcOd67YKih6oWn8dd1B8-W1dDyAqU8n1rbsX-oIE72qBFp62T831PwxKlBK_v2-tYSn5_Yc4cdzsCkTL1tLIQUVm7rYJSk9qkSYB-vC1f5DiD2fC5zrekVEysPPJ5kooTHb"/>
          <div className="absolute inset-0 bg-gradient-to-b from-background-light/90 to-background-light dark:from-background-dark/95 dark:to-background-dark"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-primary font-bold tracking-wider text-sm uppercase mb-4 block animate-fade-in-up">Our Story</span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            Glow From The <br/><span className="text-primary italic">Inside Out</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to Dermibelle Studio. We are a sanctuary of beauty and wellness in Port Charlotte, dedicated to revealing your natural radiance through expert care and genuine connection.
          </p>
        </div>
      </header>

      <section className="py-16 md:py-24 bg-surface-light dark:bg-surface-dark relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2 relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-500 rounded-bl-[4rem]"></div>
              <img alt="Dermibelle Philosophy" className="relative z-10 rounded-2xl shadow-xl w-full h-[500px] object-cover rounded-bl-[4rem]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuANwzZ1xkDq5LHp1oIe1o9rcLG9bEDc2sfjik9F-NEGMFPAsP6AjDkVpl6QU6eLYenxDrI7J65BSsq7Fh2Ma4Q2g-B4OwYa9n12kxTpWQt1wkeXRk0Hu3FKGeqxUboJQjBOTcRK0IW5FxmkL6pQ9seFEiLaF1f2Y2dGdD0XEJbvWE5ANvL6gwO-R_yxEtHZzLWhsYfNJhDfD6BEHALQE4uW9i87cywlMHVdeGuKRjdHxk7BHXRabSmrkBYCXCrkzz2D3WDVHKC2ua2l"/>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-background-light dark:bg-background-dark rounded-full flex items-center justify-center p-4 shadow-lg z-20 hidden md:flex">
                <div className="text-center">
                  <span className="block text-primary font-display font-bold text-3xl">Est.</span>
                  <span className="block text-gray-600 dark:text-gray-300 font-bold">2019</span>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <h2 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-6">More Than Just Appointments. <br/>We Build Confidence.</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                At Dermibelle Studio, we believe that true beauty is a reflection of inner health and confidence. Our philosophy is rooted in the concept of "holistic elegance"—combining advanced technical skill with a nurturing environment.
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                Whether you're visiting us for Brazilian knot extensions that protect your natural hair, a sugaring session that leaves your skin silky smooth, or a personalized facial, our goal remains the same: to have you leave feeling empowered and radiant.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-icons text-xl">verified_user</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Safety First</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Hospital-grade hygiene standards for your peace of mind.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-icons text-xl">school</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Continuous Education</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Our team constantly trains in the latest beauty techniques.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background-light dark:bg-background-dark border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-primary font-bold tracking-wider text-sm uppercase mb-3 block">Why Choose Us</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-16">The Dermibelle Standard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="relative p-8 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-primary text-white w-20 h-20 rounded-2xl rotate-45 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-icons text-3xl -rotate-45">eco</span>
              </div>
              <div className="mt-8">
                <h3 className="font-display font-bold text-xl mb-3 text-gray-900 dark:text-white">Clean &amp; Conscious</h3>
                <p className="text-gray-600 dark:text-gray-400">We exclusively use products that are free from harsh chemicals, cruelty-free, and ethically sourced. Your skin deserves the best of nature.</p>
              </div>
            </div>
            <div className="relative p-8 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-secondary text-white w-20 h-20 rounded-2xl rotate-45 flex items-center justify-center shadow-lg shadow-secondary/20">
                <span className="material-icons text-3xl -rotate-45">favorite</span>
              </div>
              <div className="mt-8">
                <h3 className="font-display font-bold text-xl mb-3 text-gray-900 dark:text-white">Personalized Care</h3>
                <p className="text-gray-600 dark:text-gray-400">No two clients are alike. We begin every appointment with a consultation to tailor our techniques to your unique needs.</p>
              </div>
            </div>
            <div className="relative p-8 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-600 text-white w-20 h-20 rounded-2xl rotate-45 flex items-center justify-center shadow-lg shadow-gray-800/20">
                <span className="material-icons text-3xl -rotate-45">diamond</span>
              </div>
              <div className="mt-8">
                <h3 className="font-display font-bold text-xl mb-3 text-gray-900 dark:text-white">Lasting Results</h3>
                <p className="text-gray-600 dark:text-gray-400">From 6-month Brazilian knots to sugaring that reduces growth over time, we focus on treatments that offer long-term benefits.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEET THE TEAM SECTION */}
      <section className="py-24 bg-surface-light dark:bg-surface-dark overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary font-bold tracking-wider text-sm uppercase mb-2 block">Our Experts</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Meet The Team</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Talented professionals passionate about elevating your natural beauty.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TEAM_MEMBERS.map((member) => (
              <div 
                key={member.name} 
                className="group relative cursor-pointer"
                onClick={() => setSelectedMember(member)}
              >
                <div className={`aspect-w-3 aspect-h-4 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 transition-all ${selectedMember?.name === member.name ? 'ring-4 ring-primary ring-offset-4 ring-offset-white dark:ring-offset-surface-dark' : ''}`}>
                  <img 
                    alt={member.name} 
                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0" 
                    src={member.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="font-display text-2xl font-bold mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-3 uppercase tracking-wide text-xs">{member.role}</p>
                  <div className="h-0 overflow-hidden group-hover:h-auto transition-all duration-300 opacity-0 group-hover:opacity-100">
                    <p className="text-sm text-gray-200 mb-3 line-clamp-3">{member.shortBio}</p>
                    <div className="flex gap-2 text-xs font-semibold text-secondary">
                      {member.tags.map(tag => (
                        <span key={tag} className="bg-white/10 px-2 py-1 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
            <div className="p-4">
              <span className="block text-4xl md:text-5xl font-display font-bold mb-2">5+</span>
              <span className="text-sm uppercase tracking-wider text-green-100">Years in Business</span>
            </div>
            <div className="p-4">
              <span className="block text-4xl md:text-5xl font-display font-bold mb-2">2k+</span>
              <span className="text-sm uppercase tracking-wider text-green-100">Clients Served</span>
            </div>
            <div className="p-4">
              <span className="block text-4xl md:text-5xl font-display font-bold mb-2">15</span>
              <span className="text-sm uppercase tracking-wider text-green-100">Certifications</span>
            </div>
            <div className="p-4">
              <span className="block text-4xl md:text-5xl font-display font-bold mb-2">100%</span>
              <span className="text-sm uppercase tracking-wider text-green-100">Organic Promise</span>
            </div>
          </div>
        </div>
      </section>

      <Link to="/contact" className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all duration-300 z-50 flex items-center gap-2 group">
        <span className="material-icons">chat</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap">Contact Us</span>
      </Link>

      {/* TEAM MEMBER MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setSelectedMember(null)}></div>
          
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark text-left shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all sm:my-8 w-full max-w-4xl border border-gray-100 dark:border-gray-700 animate-fade-in-up">
              
              <button 
                type="button" 
                className="absolute right-4 top-4 z-20 rounded-full bg-white/80 dark:bg-black/50 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none transition-colors"
                onClick={() => setSelectedMember(null)}
              >
                <span className="sr-only">Close</span>
                <span className="material-icons text-2xl">close</span>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                {/* Image Side */}
                <div className="relative h-64 md:h-full min-h-[450px]">
                  <img className="absolute inset-0 h-full w-full object-cover" src={selectedMember.image} alt={selectedMember.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
                </div>

                {/* Content Side */}
                <div className="p-8 md:p-12 flex flex-col h-full relative">
                  <div className="mb-6">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{selectedMember.name}</h2>
                    <p className="text-primary font-bold uppercase tracking-widest text-xs">{selectedMember.role}</p>
                  </div>
                  
                  <div className="prose prose-sm dark:prose-invert text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    {selectedMember.fullBio.map((paragraph, index) => (
                      <p key={index} className={index > 0 ? "mt-4" : ""}>{paragraph}</p>
                    ))}
                  </div>

                  <div className="mb-8">
                    <h3 className="font-display font-bold text-lg mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2 inline-block">Key Specialties</h3>
                    <ul className="space-y-3">
                      {selectedMember.specialties.map((spec, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                          <span className="material-icons text-secondary text-lg">{spec.icon}</span>
                          <span>{spec.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex gap-4">
                      <a href="#" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1 group">
                        <span className="material-icons text-xl group-hover:scale-110 transition-transform">email</span>
                      </a>
                      <a href="#" className="text-gray-400 hover:text-secondary transition-colors flex items-center gap-1 group">
                        <span className="material-icons text-xl group-hover:scale-110 transition-transform">photo_camera</span>
                      </a>
                      <a href="#" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1 group">
                        <span className="material-icons text-xl group-hover:scale-110 transition-transform">language</span>
                      </a>
                    </div>
                    <Link 
                      to="/booking"
                      className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-primary/30 hover:bg-opacity-90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 transform text-sm whitespace-nowrap"
                    >
                       Request Appointment with {selectedMember.name.split(' ')[0]}
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default About;