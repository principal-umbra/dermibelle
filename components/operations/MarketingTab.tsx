
import React, { useState } from 'react';
import { useMarketing } from '../../hooks/operations/useMarketing';

const MarketingTab: React.FC = () => {
  const { activeCampaigns, generatedQR, generateQR, viewMode, setViewMode, calendarEvents } = useMarketing();
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-2 custom-scrollbar pb-4">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full min-h-[500px]">
         
         {/* Column 1: Campaign Manager */}
         <div className="lg:col-span-2 flex flex-col gap-4">
            
            {/* Header / Quick Actions - Compact */}
            <div className="bg-white dark:bg-surface-dark px-5 py-3 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
               <div>
                  <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Content Studio</h2>
               </div>
               <div className="flex gap-2 bg-gray-50 dark:bg-black/20 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
                   <div className="flex">
                       <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>Tablero</button>
                       <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>Calendario</button>
                   </div>
                   <button onClick={() => setIsStudioOpen(true)} className="bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-lg font-bold text-xs hover:scale-105 transition-transform flex items-center gap-1 shadow-sm ml-1">
                      <span className="material-icons text-xs">add</span> Crear
                   </button>
               </div>
            </div>

            {/* MAIN CONTENT AREA */}
            {viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                   {/* Card 1: Active */}
                   <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all h-full">
                      <div className="relative z-10 flex justify-between items-start mb-6">
                          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase backdrop-blur-sm border border-white/10 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> En Circulación
                          </span>
                      </div>
                      
                      <div className="relative z-10 mb-4">
                          <h3 className="text-2xl font-display font-bold leading-tight mb-1">Verano<br/>Radiante</h3>
                          <p className="text-xs text-indigo-100 opacity-80">Promo estacional skincare 20% OFF.</p>
                      </div>
                      
                      <div className="relative z-10 flex gap-4 border-t border-white/10 pt-3">
                         <div><p className="text-[9px] text-indigo-200 font-bold uppercase mb-0.5">ALCANCE</p><p className="text-lg font-bold">1.2k</p></div>
                         <div><p className="text-[9px] text-indigo-200 font-bold uppercase mb-0.5">CONV.</p><p className="text-lg font-bold">3.5%</p></div>
                      </div>
                   </div>
    
                   {/* Card 2: Draft */}
                   <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col justify-between hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer h-full min-h-[200px]">
                      <div>
                         <span className="bg-gray-100 dark:bg-white/10 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Borrador</span>
                         <h3 className="text-xl font-display font-bold text-gray-300 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors mt-4">Brazilian<br/>First-Timer</h3>
                      </div>
                      <button className="flex items-center gap-2 text-xs font-bold text-gray-400 group-hover:text-primary transition-colors bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-lg w-full justify-center mt-4">
                          <span className="material-icons text-sm">calendar_today</span> Programar
                      </button>
                   </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex-1 flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-7 grid-rows-5 gap-px bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 opacity-50">
                        {[...Array(35)].map((_, i) => <div key={i} className="bg-white dark:bg-surface-dark relative p-1"></div>)}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md px-6 py-4 rounded-2xl text-center shadow-xl border border-gray-100 dark:border-gray-700 pointer-events-auto">
                            <span className="material-icons text-2xl mb-2 text-primary">calendar_month</span>
                            <p className="font-bold text-gray-800 dark:text-white text-sm">Vista Calendario</p>
                            <p className="text-[10px] text-gray-500 mb-2">3 eventos programados</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Social Post Preview Strip - Compact */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shrink-0">
               <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Feed Preview</h3>
               <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {[1,2,3].map(i => (
                      <div key={i} className="w-20 aspect-square bg-gray-200 rounded-lg shrink-0 overflow-hidden relative group cursor-pointer">
                         {i === 1 ? (
                             <img src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=150&q=80" className="w-full h-full object-cover"/>
                         ) : i === 2 ? (
                             <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center"><span className="text-white text-[8px] font-bold">PROMO</span></div>
                         ) : (
                             <div onClick={() => setIsStudioOpen(true)} className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-white text-gray-400"><span className="material-icons text-sm">add</span></div>
                         )}
                      </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Column 2: Tools (QR & Links) - Compact */}
         <div className="flex flex-col gap-4">
            
            {/* QR Generator Card */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center h-full">
               <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center mb-4 shadow-lg">
                  <span className="material-icons text-2xl">qr_code_2</span>
               </div>
               
               <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">QR Generator</h3>
               <p className="text-[10px] text-gray-500 mb-6 max-w-[150px]">Códigos rastreables para marketing físico.</p>
               
               <div className="w-full space-y-2 bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-gray-700 mb-auto">
                  <input 
                     type="text" 
                     placeholder="Campaña..."
                     value={newCampaignName}
                     onChange={(e) => setNewCampaignName(e.target.value)}
                     className="w-full bg-white dark:bg-surface-dark border-none rounded-lg px-3 py-2 text-xs font-bold shadow-sm outline-none focus:ring-1 focus:ring-primary/20"
                  />
                  <button 
                     onClick={() => generateQR(newCampaignName || 'General')}
                     className="w-full py-2 bg-primary text-white rounded-lg font-bold text-xs hover:bg-green-700 transition-colors shadow-sm"
                  >
                     Generar
                  </button>
               </div>

               {generatedQR && (
                  <div className="mt-4 p-3 bg-white rounded-xl shadow-inner border border-gray-200 w-full animate-in fade-in slide-in-from-bottom-2">
                     <img src={generatedQR} alt="QR" className="w-24 h-24 mix-blend-multiply mx-auto" />
                     <div className="grid grid-cols-2 gap-2 mt-3">
                         <button className="text-[9px] font-bold bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">PNG</button>
                         <button className="text-[9px] font-bold bg-black text-white px-2 py-1 rounded hover:opacity-80">PDF</button>
                     </div>
                  </div>
               )}
            </div>
         </div>

      </div>

      {/* Content Studio Modal */}
      {isStudioOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsStudioOpen(false)}>
              <div className="bg-white dark:bg-surface-dark w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                  <div className="w-48 bg-gray-50 dark:bg-black/20 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase">Plantillas</h3>
                      <div className="space-y-2">
                          {['Story Promo', 'Post Feed'].map(t => (
                              <button key={t} className="w-full text-left px-3 py-2 bg-white dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold hover:border-primary transition-all">
                                  {t}
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="flex-1 flex flex-col bg-gray-100 dark:bg-[#121212] items-center justify-center relative">
                      <button onClick={() => setIsStudioOpen(false)} className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-400 shadow-sm hover:text-red-500"><span className="material-icons text-sm">close</span></button>
                      <div className="bg-white w-[250px] h-[444px] shadow-xl flex items-center justify-center text-gray-300 font-bold text-lg border-2 border-dashed border-gray-300">
                          CANVAS
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default MarketingTab;
