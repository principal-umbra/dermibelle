
import React, { useState } from 'react';
import { useLab } from '../../hooks/operations/useLab';

const LabTab: React.FC = () => {
  const { ideas, simValues, setSimValues, simResult, calculate, vault } = useLab();
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-2 custom-scrollbar pb-4">
      
      {/* Top Split */}
      <div className="flex flex-col lg:flex-row gap-4 shrink-0 h-auto lg:h-[400px]">
          
          {/* Left: Idea Pipeline - Compact List */}
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
             <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Pipeline Ideas
                </h3>
                <button onClick={() => setShowWizard(true)} className="text-xs bg-gray-100 dark:bg-white/10 hover:bg-gray-200 px-2 py-1 rounded font-bold transition-colors">
                   + Nueva
                </button>
             </div>
    
             <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar border border-gray-100 dark:border-gray-800 rounded-2xl p-2 bg-white dark:bg-surface-dark">
                {ideas.map(idea => (
                   <div key={idea.id} className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-white/5 transition-colors cursor-pointer group relative">
                      <div className="flex justify-between items-start mb-1">
                         <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{idea.title}</h4>
                         {idea.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500">
                         <div className="flex gap-1">
                             <span className="bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 uppercase font-bold">{idea.status}</span>
                             <span className="px-1.5 py-0.5 rounded border border-purple-200 bg-purple-50 text-purple-700 font-bold uppercase">{idea.impact}</span>
                         </div>
                         <span>{idea.owner}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
    
          {/* Right: Simulation Dashboard - Compact */}
          <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col border border-slate-700">
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
             
             <div className="relative z-10 mb-4 flex justify-between items-center border-b border-white/10 pb-2">
                <h2 className="text-lg font-bold">Simulador</h2>
                <span className="material-icons text-white/20">science</span>
             </div>
             
             <div className="flex flex-col md:flex-row gap-8 relative z-10 flex-1 items-center">
                {/* Controls */}
                <div className="flex-1 w-full space-y-6">
                   <div className="space-y-2">
                      <label className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                         <span>Precio</span>
                         <span className="text-white font-mono">${simValues.price}</span>
                      </label>
                      <input type="range" min="0" max="500" step="5" value={simValues.price} onChange={e => setSimValues({...simValues, price: Number(e.target.value)})} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                   </div>
                   <div className="space-y-2">
                      <label className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                         <span>Clientes</span>
                         <span className="text-white font-mono">{simValues.customers}</span>
                      </label>
                      <input type="range" min="0" max="200" step="1" value={simValues.customers} onChange={e => setSimValues({...simValues, customers: Number(e.target.value)})} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                   </div>
                   <button onClick={calculate} className="w-full py-2 bg-white text-black hover:bg-gray-200 rounded-lg font-bold text-xs shadow-md transition-colors mt-2">
                        Calcular
                   </button>
                </div>
    
                {/* Results Display */}
                <div className="w-full md:w-48 bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col items-center justify-center text-center">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">PROYECCIÓN</p>
                   <span className="text-3xl font-display font-bold text-white tracking-tight">
                      ${simResult ? simResult.toLocaleString() : '0'}
                   </span>
                </div>
             </div>
          </div>
      </div>

      {/* Bottom: Learning Vault */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shrink-0">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-icons text-gray-400 text-sm">archive</span> Bóveda
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vault.map(v => (
                  <div key={v.id} className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <div>
                          <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200">{v.title}</h4>
                          <p className="text-[10px] text-gray-500 italic truncate max-w-[200px]">"{v.insight}"</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${v.result === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {v.result}
                      </span>
                  </div>
              ))}
          </div>
      </div>

      {/* Wizard Modal */}
      {showWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowWizard(false)}>
              <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-xl p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Diseñar Experimento</h3>
                  <div className="space-y-3">
                      <input className="w-full p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700 dark:text-white" placeholder="Hipótesis" />
                      <div className="grid grid-cols-2 gap-3">
                          <input className="w-full p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700 dark:text-white" placeholder="Métrica" />
                          <input className="w-full p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700 dark:text-white" placeholder="Días" type="number" />
                      </div>
                      <textarea className="w-full p-2 border rounded-lg text-sm dark:bg-black/20 dark:border-gray-700 dark:text-white h-20 resize-none" placeholder="Descripción..." />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={() => setShowWizard(false)} className="px-4 py-2 rounded-lg font-bold text-xs text-gray-500 hover:bg-gray-100">Cancelar</button>
                      <button className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg font-bold text-xs">Lanzar</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default LabTab;
