
import React, { useState, useEffect } from 'react';
import TreasuryTab from '../../components/operations/TreasuryTab';
import SupplyTab from '../../components/operations/SupplyTab';
import ExperienceTab from '../../components/operations/ExperienceTab';
import MarketingTab from '../../components/operations/MarketingTab';
import WikiTab from '../../components/operations/WikiTab';
import LabTab from '../../components/operations/LabTab';
import { useData } from '../../context/DataContext';

type TabType = 'treasury' | 'supply' | 'experience' | 'marketing' | 'wiki' | 'lab';

const DevelopmentOverlay: React.FC<{ title: string; description: string; icon: string }> = ({ title, description, icon }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-md rounded-3xl transition-all duration-500 animate-in fade-in">
    <div className="bg-white dark:bg-surface-dark p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-md text-center transform scale-100 hover:scale-105 transition-transform duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 dark:bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      
      <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-gray-700 relative z-10">
        <span className="material-icons text-4xl text-gray-400 dark:text-gray-500">{icon}</span>
      </div>
      
      <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2 relative z-10">{title}</h3>
      
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-4 border border-amber-100 dark:border-amber-900/30 relative z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        En Desarrollo
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed relative z-10">
        {description}
      </p>
    </div>
  </div>
);

const History: React.FC = () => {
  const { addToast } = useData();
  const [activeTab, setActiveTab] = useState<TabType>('treasury');
  
  // --- Settings State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Configuration State (Persisted in session for demo)
  const [config, setConfig] = useState({
      modules: {
          treasury: true,
          supply: true,
          experience: true,
          marketing: true,
          wiki: true,
          lab: true
      },
      thresholds: {
          monthlyGoal: 25000,
          lowStockWarning: 10
      },
      preferences: {
          defaultExport: 'pdf',
          autoSave: true
      }
  });

  const [tempConfig, setTempConfig] = useState(config);

  // Tab Definitions with Theme Colors
  const allTabs = [
    { id: 'treasury', label: 'Tesorería', icon: 'account_balance', theme: 'emerald' },
    { id: 'supply', label: 'Suministros', icon: 'inventory_2', theme: 'blue' },
    { id: 'experience', label: 'Arranque/Núcleo', icon: 'rocket_launch', theme: 'purple' },
    { id: 'marketing', label: 'Difusión', icon: 'campaign', theme: 'orange' },
    { id: 'wiki', label: 'Wiki', icon: 'menu_book', theme: 'gray' },
    { id: 'lab', label: 'Lab', icon: 'science', theme: 'pink' },
  ];

  const visibleTabs = allTabs.filter(tab => config.modules[tab.id as TabType]);

  const openSettings = () => {
      setTempConfig(config);
      setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
      setConfig(tempConfig);
      setIsSettingsOpen(false);
      
      if (!tempConfig.modules[activeTab]) {
          const firstAvailable = allTabs.find(t => tempConfig.modules[t.id as TabType])?.id as TabType;
          if (firstAvailable) setActiveTab(firstAvailable);
      }

      addToast('success', 'Configuración operativa actualizada');
  };

  const toggleModule = (id: TabType) => {
      setTempConfig(prev => ({
          ...prev,
          modules: { ...prev.modules, [id]: !prev.modules[id] }
      }));
  };

  // Helper for Dynamic Styles - HIGH IMPACT DESIGN
  const getTabClasses = (isActive: boolean, theme: string) => {
      const themes: Record<string, string> = {
          emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/40',
          blue: 'from-blue-500 to-indigo-600 shadow-blue-500/40',
          purple: 'from-purple-500 to-violet-600 shadow-purple-500/40',
          orange: 'from-orange-500 to-amber-600 shadow-orange-500/40',
          gray: 'from-gray-700 to-gray-900 shadow-gray-500/40',
          pink: 'from-pink-500 to-rose-600 shadow-pink-500/40',
      };

      const activeGradient = themes[theme] || themes.gray;
      
      return `
          relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap select-none
          ${isActive 
              ? `bg-gradient-to-r ${activeGradient} text-white shadow-lg scale-105 z-10 -translate-y-0.5 ring-1 ring-white/20` 
              : `text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white`
          }
      `;
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-background-dark">
      
      {/* Header & Nav - Floating Dock Style */}
      <div className="px-6 pt-6 pb-2 flex-shrink-0 z-20 relative">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 max-w-[1920px] mx-auto">
          
          {/* Title Area */}
          <div className="shrink-0 flex items-center gap-4 pl-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xl shadow-gray-900/20 dark:shadow-white/10">
                <span className="material-icons text-2xl">hub</span>
            </div>
            <div>
                <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white leading-tight">Centro de Operaciones</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">Gestión Integral & Estrategia</p>
            </div>
          </div>
          
          {/* Navigation Dock - FLOATING ISLAND */}
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 -mb-4 xl:pb-0 xl:mb-0 xl:justify-end flex-1 pl-2">
             
             {/* Tabs Container */}
             <div className="flex items-center p-1.5 bg-white dark:bg-surface-dark/90 backdrop-blur-xl rounded-full border border-gray-200/60 dark:border-gray-700/60 shadow-xl shadow-gray-200/40 dark:shadow-black/40 ring-1 ring-white/50 dark:ring-white/5">
                {visibleTabs.length === 0 ? (
                    <div className="px-6 py-2 text-sm text-gray-400 italic">Sin módulos visibles</div>
                ) : (
                    visibleTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={getTabClasses(activeTab === tab.id, tab.theme)}
                        >
                            <span className={`material-icons text-[18px] transition-transform duration-300 ${activeTab === tab.id ? '' : 'opacity-70 group-hover:scale-110'}`}>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))
                )}
             </div>

             {/* Settings Trigger - Matching Style */}
             <button 
                onClick={openSettings}
                className={`p-3 rounded-full transition-all duration-300 shrink-0 border shadow-lg ${isSettingsOpen 
                    ? 'bg-gray-900 text-white border-gray-900 rotate-90' 
                    : 'bg-white dark:bg-surface-dark text-gray-400 border-gray-200 dark:border-gray-700 hover:text-primary hover:border-primary hover:shadow-xl'}`}
                title="Configuración de Módulos"
             >
                <span className="material-icons text-xl block">tune</span>
             </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6 relative">
        <div className="h-full animate-in fade-in slide-in-from-bottom-6 duration-500">
          {visibleTabs.length > 0 ? (
              <>
                {activeTab === 'treasury' && <TreasuryTab />}
                {activeTab === 'supply' && <SupplyTab />}
                {activeTab === 'experience' && <ExperienceTab />}
                {activeTab === 'marketing' && (
                    <div className="relative h-full">
                        <MarketingTab />
                        <DevelopmentOverlay 
                            title="Centro de Difusión" 
                            description="Gestiona campañas, redes sociales y promociones desde un solo lugar. Próximamente podrás crear contenido y medir su impacto." 
                            icon="campaign" 
                        />
                    </div>
                )}
                {activeTab === 'wiki' && (
                    <div className="relative h-full">
                        <WikiTab />
                        <DevelopmentOverlay 
                            title="Wiki Corporativa" 
                            description="Base de conocimiento centralizada para protocolos, documentación y guías operativas. Tu manual de operaciones digital." 
                            icon="menu_book" 
                        />
                    </div>
                )}
                {activeTab === 'lab' && (
                    <div className="relative h-full">
                        <LabTab />
                        <DevelopmentOverlay 
                            title="Laboratorio de Innovación" 
                            description="Espacio experimental para probar nuevas fórmulas, servicios y estrategias antes de lanzarlos al mercado." 
                            icon="science" 
                        />
                    </div>
                )}
              </>
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-surface-dark shadow-inner">
                    <span className="material-icons text-4xl opacity-20">visibility_off</span>
                  </div>
                  <p className="font-bold text-lg text-gray-600 dark:text-gray-300">Todos los módulos están ocultos</p>
                  <p className="text-sm mt-1">Habilita las secciones desde configuración.</p>
                  <button onClick={openSettings} className="mt-6 px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform">Abrir Configuración</button>
              </div>
          )}
        </div>
      </div>

      {/* Settings Modal (Unchanged content, kept for context) */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsSettingsOpen(false)}>
              <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                              <span className="material-icons text-gray-400">tune</span>
                              Configuración Operativa
                          </h3>
                          <p className="text-sm text-gray-500">Personaliza tu espacio de trabajo.</p>
                      </div>
                      <button onClick={() => setIsSettingsOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                          <span className="material-icons text-lg">close</span>
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                      <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Visibilidad de Módulos</h4>
                          <div className="grid grid-cols-1 gap-3">
                              {allTabs.map(tab => (
                                  <label key={tab.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/5 cursor-pointer hover:border-primary/50 transition-all group hover:shadow-md">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-white/10 transition-colors text-gray-500 shadow-sm`}>
                                              <span className="material-icons text-xl">{tab.icon}</span>
                                          </div>
                                          <span className="font-bold text-base text-gray-700 dark:text-gray-200">{tab.label}</span>
                                      </div>
                                      <div className="relative inline-flex items-center cursor-pointer">
                                          <input type="checkbox" className="sr-only peer" checked={tempConfig.modules[tab.id as TabType]} onChange={() => toggleModule(tab.id as TabType)}/>
                                          <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                      </div>
                                  </label>
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 flex justify-end gap-3">
                      <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancelar</button>
                      <button onClick={handleSaveSettings} className="px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-green-800 transition-all hover:-translate-y-0.5">Guardar Cambios</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default History;
