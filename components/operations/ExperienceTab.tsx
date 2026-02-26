
import React, { useState } from 'react';
import { useExperience } from '../../hooks/operations/useExperience';
import { useData } from '../../context/DataContext';

const ExperienceTab: React.FC = () => {
  const { status, checklist, toggleItem, progress, markAllReady } = useExperience();
  const { fixedExpenses, addFixedExpense, removeFixedExpense } = useData();
  const [subTab, setSubTab] = useState<'startup' | 'core'>('startup');

  // --- CORE STATE ---
  const [brandInfo, setBrandInfo] = useState({
      name: 'Dermibelle Studio',
      slogan: 'Natural Beauty, Elevated.',
      description: 'Estudio boutique especializado en tratamientos orgánicos y cuidado de la piel.',
      phone: '(941) 555-0123',
      email: 'hello@dermibelle.com',
      address: '123 Beauty Lane, Port Charlotte, FL',
      website: 'www.dermibelle.com',
      instagram: '@dermibelle',
      facebook: '/dermibellestudio'
  });

  const [newExpense, setNewExpense] = useState({ name: '', amount: '' });

  const [goals, setGoals] = useState({
      monthlyRevenue: 25000,
      breakEven: 6500,
      targetMargin: 35
  });

  // --- CORE ACTIONS ---
  const handleAddExpense = () => {
      if (newExpense.name && newExpense.amount) {
          addFixedExpense({ name: newExpense.name, amount: parseFloat(newExpense.amount) });
          setNewExpense({ name: '', amount: '' });
      }
  };

  const totalFixedCosts = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden relative">
      
      {/* 1. Sub-Navigation */}
      <div className="shrink-0 flex justify-center pb-2">
          <div className="bg-white dark:bg-surface-dark p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm inline-flex relative">
              <button 
                  onClick={() => setSubTab('startup')}
                  className={`relative px-6 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 z-10 ${subTab === 'startup' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400'}`}
              >
                  <span className="material-icons text-sm">rocket_launch</span> Arranque
              </button>
              <button 
                  onClick={() => setSubTab('core')}
                  className={`relative px-6 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 z-10 ${subTab === 'core' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400'}`}
              >
                  <span className="material-icons text-sm">business_center</span> Núcleo
              </button>
          </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
        
        {/* --- VISTA DE ARRANQUE (Checklist original) --- */}
        {subTab === 'startup' && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4">
                {/* Header Deck - Compact Layout */}
                <div className="flex flex-col lg:flex-row gap-4 shrink-0">
                    
                    {/* Status Dial - Resized */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-row lg:flex-col items-center justify-between lg:justify-center relative overflow-hidden group min-w-[200px]">
                        {progress === 100 && <div className="absolute inset-0 bg-green-500/5 animate-pulse pointer-events-none"></div>}
                        
                        <div className="relative w-24 h-24 lg:w-32 lg:h-32 lg:mb-2 shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                            <circle 
                                cx="50%" cy="50%" r="45%" 
                                stroke="currentColor" strokeWidth="8" fill="transparent" 
                                strokeDasharray={283} // Approx circumference for radius ~45% of 100px box
                                strokeDashoffset={283 - (283 * progress) / 100} 
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ease-out ${progress === 100 ? 'text-green-500' : 'text-primary'}`} 
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-display font-bold text-gray-900 dark:text-white">{progress}%</span>
                        </div>
                        </div>
                        
                        <div className="text-left lg:text-center pl-4 lg:pl-0">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                            {progress === 100 ? 'Studio Operativo ✨' : 'Preparación'}
                            </h2>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${progress === 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {progress === 100 ? 'READY' : 'EN CURSO'}
                            </span>
                        </div>
                    </div>

                    {/* Ambience Controls - Horizontal Strip */}
                    <div className="flex-1 bg-[#1e1e24] text-white rounded-2xl p-5 shadow-lg flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-1000"></div>
                        
                        <div className="flex justify-between items-center mb-4 relative z-10">
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ATMÓSFERA</h3>
                            <p className="text-xl font-display font-bold text-white tracking-tight">Modo "Morning Glow"</p>
                        </div>
                        <button className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors backdrop-blur-md">
                            <span className="material-icons text-white text-sm">settings</span>
                        </button>
                        </div>

                        <div className="flex gap-3 relative z-10 overflow-x-auto pb-1 custom-scrollbar">
                        {/* Temp Widget */}
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-colors flex-1 min-w-[120px]">
                            <div className="flex justify-between mb-2">
                                <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1"><span className="material-icons text-[10px] text-orange-400">thermostat</span> Temp</span>
                                <span className="text-sm font-mono font-bold">72°F</span>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-orange-400 to-red-400 w-[60%] h-full rounded-full"></div>
                            </div>
                        </div>
                        
                        {/* Music Widget */}
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-colors flex-[1.5] min-w-[150px] flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                                <span className="material-icons text-lg">play_arrow</span>
                            </div>
                            <div className="min-w-0">
                                <div className="flex gap-0.5 mb-0.5 h-2 items-end">
                                    <span className="w-0.5 h-1.5 bg-white/50 animate-pulse"></span>
                                    <span className="w-0.5 h-2.5 bg-white/50 animate-pulse delay-75"></span>
                                    <span className="w-0.5 h-1 bg-white/50 animate-pulse delay-150"></span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">NOW PLAYING</p>
                                <p className="text-xs font-bold truncate text-white">Chill Lo-Fi Beats</p>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>

                {/* Checklist Interactive Area - Dense List */}
                <div className="flex-1 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-0">
                    
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/10 shrink-0">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                            <span className="material-icons text-primary bg-primary/10 p-1 rounded-md text-sm">checklist</span>
                            Lista de Apertura
                        </h3>
                        
                        <div className="flex gap-2">
                        <button 
                            onClick={markAllReady}
                            className="text-[10px] font-bold text-white px-3 py-1.5 bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <span className="material-icons text-[10px]">done_all</span> Marcar Todo
                        </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50/20 dark:bg-transparent">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {checklist.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => toggleItem(item.id)}
                                className={`relative p-3 rounded-xl border cursor-pointer transition-all duration-200 group select-none flex items-center gap-3
                                    ${item.checked 
                                        ? 'bg-green-50/30 border-green-200 dark:bg-green-900/10 dark:border-green-900/30' 
                                        : 'bg-white dark:bg-white/5 border-gray-100 dark:border-gray-700 hover:border-gray-300'}
                                `}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0
                                        ${item.checked 
                                        ? 'bg-green-500 border-green-500' 
                                        : 'border-gray-300 group-hover:border-primary bg-white dark:bg-transparent'}
                                    `}>
                                        {item.checked && <span className="material-icons text-white text-[10px] font-bold">check</span>}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-xs truncate transition-colors ${item.checked ? 'text-green-800 dark:text-green-400 line-through opacity-60' : 'text-gray-800 dark:text-white'}`}>
                                        {item.label}
                                        </p>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <span className="text-[9px] text-gray-400">Responsable: Staff</span>
                                            {item.required && !item.checked && (
                                                <span className="text-[8px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded uppercase border border-red-100">
                                                    Requerido
                                                </span>
                                            )}
                                        </div>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- VISTA DE NÚCLEO (Nueva) --- */}
        {subTab === 'core' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 max-w-5xl mx-auto w-full">
                
                {/* 1. Brand Identity Card */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-[4rem] -mr-4 -mt-4 pointer-events-none"></div>
                    
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                        <span className="material-icons text-purple-600 bg-purple-50 p-1.5 rounded-lg text-sm">fingerprint</span> 
                        Identidad de Marca
                    </h3>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                         {/* Logo Placeholder */}
                         <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 shrink-0 cursor-pointer hover:border-purple-400 transition-colors group">
                             <span className="material-icons text-gray-400 group-hover:text-purple-500 transition-colors">add_photo_alternate</span>
                             <span className="text-[10px] text-gray-500 mt-1 font-bold">Logo</span>
                         </div>

                         <div className="flex-1 w-full space-y-4">
                             <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nombre del Negocio</label>
                                 <input 
                                     value={brandInfo.name}
                                     onChange={(e) => setBrandInfo({...brandInfo, name: e.target.value})}
                                     className="w-full text-xl font-display font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-purple-500 outline-none pb-1 transition-colors"
                                 />
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Slogan / Promesa</label>
                                 <input 
                                     value={brandInfo.slogan}
                                     onChange={(e) => setBrandInfo({...brandInfo, slogan: e.target.value})}
                                     className="w-full text-sm font-medium text-gray-600 dark:text-gray-300 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-purple-500 outline-none pb-1 transition-colors"
                                 />
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Descripción Corta</label>
                                 <textarea 
                                     value={brandInfo.description}
                                     onChange={(e) => setBrandInfo({...brandInfo, description: e.target.value})}
                                     className="w-full text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg p-2 border border-transparent focus:border-purple-500 focus:bg-white outline-none resize-none h-16 transition-all"
                                 />
                             </div>

                             {/* Contact & Socials Section */}
                             <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 mt-2">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-icons text-sm text-gray-400">contact_mail</span> Información de Contacto & Redes
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    {/* Contact */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Teléfono</label>
                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                                                <span className="material-icons text-gray-400 text-xs">phone</span>
                                                <input 
                                                    value={brandInfo.phone} 
                                                    onChange={(e) => setBrandInfo({...brandInfo, phone: e.target.value})} 
                                                    className="w-full bg-transparent border-none text-xs py-2 outline-none text-gray-700 dark:text-gray-300"
                                                    placeholder="(000) 000-0000"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Email</label>
                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                                                <span className="material-icons text-gray-400 text-xs">email</span>
                                                <input 
                                                    value={brandInfo.email} 
                                                    onChange={(e) => setBrandInfo({...brandInfo, email: e.target.value})} 
                                                    className="w-full bg-transparent border-none text-xs py-2 outline-none text-gray-700 dark:text-gray-300"
                                                    placeholder="contacto@empresa.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Dirección</label>
                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                                                <span className="material-icons text-gray-400 text-xs">place</span>
                                                <input 
                                                    value={brandInfo.address} 
                                                    onChange={(e) => setBrandInfo({...brandInfo, address: e.target.value})} 
                                                    className="w-full bg-transparent border-none text-xs py-2 outline-none text-gray-700 dark:text-gray-300"
                                                    placeholder="Calle, Ciudad, Estado"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Socials */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Sitio Web</label>
                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                                                <span className="material-icons text-gray-400 text-xs">language</span>
                                                <input 
                                                    value={brandInfo.website} 
                                                    onChange={(e) => setBrandInfo({...brandInfo, website: e.target.value})} 
                                                    className="w-full bg-transparent border-none text-xs py-2 outline-none text-gray-700 dark:text-gray-300"
                                                    placeholder="www.misitio.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Instagram</label>
                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                                                <span className="text-xs text-gray-400 font-bold">@</span>
                                                <input 
                                                    value={brandInfo.instagram} 
                                                    onChange={(e) => setBrandInfo({...brandInfo, instagram: e.target.value})} 
                                                    className="w-full bg-transparent border-none text-xs py-2 outline-none text-gray-700 dark:text-gray-300"
                                                    placeholder="usuario"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Facebook</label>
                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                                                <span className="text-xs text-gray-400 font-bold">/</span>
                                                <input 
                                                    value={brandInfo.facebook} 
                                                    onChange={(e) => setBrandInfo({...brandInfo, facebook: e.target.value})} 
                                                    className="w-full bg-transparent border-none text-xs py-2 outline-none text-gray-700 dark:text-gray-300"
                                                    placeholder="pagina"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* 2. Business Core: Expenses & Goals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Fixed Expenses */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons text-red-600 bg-red-50 p-1.5 rounded-lg text-sm">money_off</span> 
                                Gastos Fijos (Mensual)
                            </h3>
                            <span className="text-lg font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                                ${totalFixedCosts.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex-1 bg-gray-50 dark:bg-black/20 rounded-xl p-4 mb-4 overflow-y-auto max-h-[200px] custom-scrollbar border border-gray-100 dark:border-gray-800">
                             {fixedExpenses.length === 0 ? (
                                 <div className="text-center text-gray-400 py-4 text-xs">Sin gastos registrados.</div>
                             ) : (
                                 <div className="space-y-2">
                                     {fixedExpenses.map(expense => (
                                         <div key={expense.id} className="flex justify-between items-center bg-white dark:bg-surface-dark p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm group">
                                             <span className="text-xs font-medium text-gray-700 dark:text-gray-300 pl-2">{expense.name}</span>
                                             <div className="flex items-center gap-3">
                                                 <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">${expense.amount.toFixed(2)}</span>
                                                 <button onClick={() => removeFixedExpense(expense.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                     <span className="material-icons text-sm">remove_circle</span>
                                                 </button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>

                        <div className="flex gap-2">
                            <input 
                                placeholder="Concepto" 
                                value={newExpense.name}
                                onChange={e => setNewExpense({...newExpense, name: e.target.value})}
                                className="flex-[2] text-xs px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-400"
                            />
                            <input 
                                placeholder="Monto" 
                                type="number"
                                value={newExpense.amount}
                                onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                                className="flex-1 text-xs px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-400"
                            />
                            <button onClick={handleAddExpense} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 rounded-lg font-bold transition-colors">
                                <span className="material-icons text-sm">add</span>
                            </button>
                        </div>
                    </div>

                    {/* Goals & Targets */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-lg flex flex-col h-full relative overflow-hidden border border-slate-700">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>
                        
                        <h3 className="font-bold text-white flex items-center gap-2 mb-6 relative z-10">
                            <span className="material-icons text-emerald-400 bg-white/10 p-1.5 rounded-lg text-sm">flag</span> 
                            Objetivos & Metas
                        </h3>

                        <div className="space-y-6 relative z-10 flex-1">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <label>Meta Ingreso Mensual</label>
                                    <span className="text-emerald-400 material-icons text-sm">trending_up</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                    <input 
                                        type="number" 
                                        value={goals.monthlyRevenue} 
                                        onChange={e => setGoals({...goals, monthlyRevenue: parseFloat(e.target.value)})}
                                        className="w-full bg-slate-800/50 border border-slate-600 rounded-xl py-3 pl-8 pr-4 text-xl font-mono font-bold text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Punto Equilibrio Est.</p>
                                    <p className="text-lg font-mono font-bold text-white">${(totalFixedCosts * 1.2).toLocaleString()}</p> 
                                    <p className="text-[9px] text-slate-500 mt-1 italic">(Fijos + 20% Var)</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Margen Neto Objetivo</p>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            value={goals.targetMargin}
                                            onChange={e => setGoals({...goals, targetMargin: parseFloat(e.target.value)})}
                                            className="w-12 bg-transparent text-lg font-bold text-white outline-none border-b border-slate-600 focus:border-emerald-500 text-center p-0"
                                        />
                                        <span className="text-sm font-bold text-slate-400">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button className="px-6 py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white text-xs font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5">
                        Guardar Configuración
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default ExperienceTab;
