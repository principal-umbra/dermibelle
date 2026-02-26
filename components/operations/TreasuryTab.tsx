
import React, { useState } from 'react';
import { useTreasury } from '../../hooks/operations/useTreasury';

const TreasuryTab: React.FC = () => {
  const { stats, forecast, transitItems, goalProgress, financialGoal, updateGoal, breakevenDay, confirmInTransitInvoice, rejectInTransitInvoice, reserves, liquidityAlert } = useTreasury();
  
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(financialGoal);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  // Pagination for Transit Items (Simple)
  const [transitPage, setTransitPage] = useState(1);
  const transitPerPage = 5;
  const transitTotalPages = Math.ceil(transitItems.length / transitPerPage);
  const paginatedTransit = transitItems.slice((transitPage - 1) * transitPerPage, transitPage * transitPerPage);

  const handleGoalSave = () => {
      updateGoal(tempGoal);
      setIsGoalModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-2 custom-scrollbar pb-4">
      
      {/* Top Deck: Financial Health & Main KPIs - COMPACTADO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
        
        {/* Main Balance Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#0f172a] to-[#334155] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <p className="text-emerald-100/70 font-bold tracking-widest text-[10px] uppercase">Flujo de Caja</p>
                </div>
                <h2 className="text-4xl font-display font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-100">
                  ${stats.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              
              <div className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 backdrop-blur-md ${
                  liquidityAlert.level === 'critical' ? 'bg-red-500/20 border-red-500/30 text-red-200' :
                  liquidityAlert.level === 'warning' ? 'bg-amber-500/20 border-amber-500/30 text-amber-200' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}>
                <span className="material-icons text-xs">
                    {liquidityAlert.level === 'critical' ? 'dangerous' : liquidityAlert.level === 'warning' ? 'warning' : 'trending_up'}
                </span>
                <span className="text-[10px] font-bold">{liquidityAlert.message}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="w-full">
                    <div className="flex justify-between items-end mb-1">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-medium">Meta: ${financialGoal.toLocaleString()}</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-300">{goalProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-400" style={{ width: `${goalProgress}%` }}></div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={() => setIsGoalModalOpen(true)} className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/5 text-white">
                        Ajustar Meta
                    </button>
                </div>
            </div>
          </div>
        </div>

        {/* Breakeven & Reserves - COMPACTADO */}
        <div className="flex flex-col gap-3">
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 relative overflow-hidden h-24">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <span className="material-icons text-2xl">flag</span>
                </div>
                <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Punto de Equilibrio</p>
                    <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">Día {breakevenDay}</p>
                    <p className="text-[10px] text-gray-500">Faltan 2 días para utilidad neta.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Reservas</p>
                    <span className="material-icons text-gray-300 text-sm">savings</span>
                </div>
                <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[120px]">
                    {reserves.map(res => (
                        <div key={res.id} className="flex justify-between items-center p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 group">
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full bg-${res.color}-500`}></div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{res.name}</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">${res.amount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        
        {/* Left: Forecast Cards - Vertical List Compacta */}
        <div className="lg:col-span-4 flex flex-col gap-3">
           <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group">
              <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Pesimista</p>
                 <p className="text-xl font-bold text-gray-700 dark:text-gray-300">${forecast.pessimistic.toLocaleString()}</p>
              </div>
              <span className="material-icons text-gray-300">cloud_queue</span>
           </div>

           <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-600/20 text-white relative overflow-hidden group">
              <div className="relative z-10 flex justify-between items-center">
                  <div>
                     <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[10px] font-bold text-blue-100 uppercase">Realista</p>
                        <span className="bg-white/20 text-[9px] px-1.5 rounded font-bold">Probable</span>
                     </div>
                     <p className="text-2xl font-bold">${forecast.realistic.toLocaleString()}</p>
                  </div>
                  <span className="material-icons text-white/50 text-3xl">trending_up</span>
              </div>
           </div>

           <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group">
              <div>
                 <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Optimista</p>
                 <p className="text-xl font-bold text-gray-700 dark:text-gray-300">${forecast.optimistic.toLocaleString()}</p>
              </div>
              <span className="material-icons text-emerald-400">rocket_launch</span>
           </div>
        </div>

        {/* Right: The "Conciliation Deck" - LISTA MAS DENSA */}
        <div className="lg:col-span-8 flex flex-col bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
           <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-surface-dark">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-orange-500"></span> En Tránsito ({transitItems.length})
              </h3>
              <p className="text-[10px] text-gray-400">Pagos pendientes de validación.</p>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {transitItems.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 min-h-[200px]">
                    <span className="material-icons text-3xl mb-2">check_circle</span>
                    <p className="text-xs">Todo conciliado.</p>
                 </div>
              ) : (
                 paginatedTransit.map(item => (
                    <div key={item.id} className="bg-white dark:bg-surface-dark p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 items-start sm:items-center hover:border-orange-200 transition-colors">
                       <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
                              {item.clientInitials}
                          </div>
                          <div className="min-w-0">
                             <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-900 dark:text-white text-xs truncate">{item.client}</h4>
                                <span className="text-[10px] text-gray-400">• {item.date}</span>
                             </div>
                             <p className="text-[10px] text-orange-600 dark:text-orange-400 font-mono truncate">Ref: {item.transactionReference || 'N/A'}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                           <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">${item.amount.toFixed(2)}</span>
                           <div className="flex gap-1">
                               <button onClick={() => rejectInTransitInvoice(item.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Rechazar">
                                   <span className="material-icons text-base">close</span>
                               </button>
                               <button onClick={() => confirmInTransitInvoice(item.id, item.transactionReference || 'CONFIRMADO')} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1 transition-colors">
                                   <span className="material-icons text-[10px]">check</span> Aprobar
                               </button>
                           </div>
                       </div>
                    </div>
                 ))
              )}
           </div>
           
           {/* Simple Pagination Footer for Transit */}
           {transitItems.length > 0 && (
                <div className="bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                        {Math.min((transitPage - 1) * transitPerPage + 1, transitItems.length)} - {Math.min(transitPage * transitPerPage, transitItems.length)} de {transitItems.length}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setTransitPage(p => Math.max(1, p - 1))}
                            disabled={transitPage === 1}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <span className="material-icons text-sm">chevron_left</span>
                        </button>
                        <span className="font-bold text-gray-700 dark:text-gray-300 self-center">{transitPage} / {transitTotalPages}</span>
                        <button 
                            onClick={() => setTransitPage(p => Math.min(transitTotalPages, p + 1))}
                            disabled={transitPage === transitTotalPages}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <span className="material-icons text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
           )}
        </div>
      </div>

      {/* MODAL */}
      {isGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsGoalModalOpen(false)}>
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 text-center">Ajustar Meta</h3>
                  <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                      <input 
                          type="number" 
                          value={tempGoal} 
                          onChange={(e) => setTempGoal(Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-xl font-bold font-mono text-center outline-none focus:border-emerald-500 transition-colors"
                      />
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setIsGoalModalOpen(false)} className="flex-1 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">Cancelar</button>
                      <button onClick={handleGoalSave} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md">Guardar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TreasuryTab;
