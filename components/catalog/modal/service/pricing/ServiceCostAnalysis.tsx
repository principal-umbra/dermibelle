
import React from 'react';
import { GlobalInventorySettings } from '../../../../../types';

interface ServiceCostAnalysisProps {
    updateField: (field: string, value: any) => void;
    finalRecipeCost: number;
    totalRecipeCost: number;
    wastePercent: number;
    commissionAmount: number;
    commissionType: 'percent' | 'fixed';
    commissionValue: number;
    fixedCost: number;
    isFixedGlobal: boolean;
    totalMonthlyExpenses: number;
    globalSettings?: GlobalInventorySettings;
    benefitAmount: number;
    targetMargin: number;
    serviceGroupId?: string;
}

const ServiceCostAnalysis: React.FC<ServiceCostAnalysisProps> = ({
    updateField,
    finalRecipeCost, totalRecipeCost, wastePercent,
    commissionAmount, commissionType, commissionValue,
    fixedCost, totalMonthlyExpenses, globalSettings,
    benefitAmount, targetMargin,
    serviceGroupId
}) => {
    
    const money = (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const allocPercent = globalSettings?.fixedCostAllocationPercent ?? 0.20;
    const avgSessions = globalSettings?.averageMonthlySessions ?? 208;
    const calculatedFixed = (totalMonthlyExpenses * allocPercent) / avgSessions;
    
    const isProjected = benefitAmount < 0;
    const currentTotalCost = Math.abs(benefitAmount); 
    const targetProfitValue = (currentTotalCost / (1 - targetMargin)) * targetMargin;

    const availableGroups = globalSettings?.serviceGroups || [];

    return (
        <div className="space-y-2">
            {/* COSTO INSUMOS */}
            <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-2.5 border border-orange-100 dark:border-orange-800/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center shrink-0">
                        <span className="material-icons text-base">science</span>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-orange-700/70 dark:text-orange-300 uppercase tracking-wider">Costo Insumos</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white leading-none mt-0.5">${money(finalRecipeCost)}</p>
                    </div>
                </div>
                
                {/* Slider Merma */}
                <div className="flex-1 max-w-[150px] bg-white/60 dark:bg-black/20 rounded-lg p-2 border border-orange-100/50 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] text-gray-400 font-bold uppercase">Base: ${money(totalRecipeCost)}</span>
                        <span className="text-[8px] font-bold text-orange-600 bg-orange-100 px-1 rounded">Merma {wastePercent}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="30" step="1"
                        value={wastePercent}
                        onChange={(e) => updateField('wastePercent', parseFloat(e.target.value))}
                        className="w-full h-1 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>
            </div>

            {/* INDICADORES INFERIORES */}
            <div className="grid grid-cols-3 gap-2">
                
                {/* GRUPO (Replaces Staff) */}
                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-2.5 border border-blue-100 dark:border-blue-800/30 flex flex-col justify-between group hover:border-blue-200 transition-all min-h-[80px]">
                    <div className="flex justify-between items-start mb-0.5">
                        <span className="text-[9px] font-bold text-blue-700/70 dark:text-blue-300 uppercase tracking-wider">Grupo</span>
                        <span className="material-icons text-blue-400 text-xs">group_work</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center">
                        <select 
                            value={serviceGroupId || ''}
                            onChange={(e) => updateField('serviceGroupId', e.target.value)}
                            className="w-full bg-white dark:bg-black/20 border border-blue-200 dark:border-blue-900/50 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 py-1 px-2 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="">Sin Grupo</option>
                            {availableGroups.map(grp => (
                                <option key={grp.id} value={grp.id}>{grp.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {serviceGroupId && (
                        <div className="mt-1 flex justify-end">
                            <span className="text-[8px] text-blue-500 font-bold bg-blue-100 px-1.5 py-0.5 rounded-full">
                                {availableGroups.find(g => g.id === serviceGroupId)?.name || 'Seleccionado'}
                            </span>
                        </div>
                    )}
                </div>

                {/* FIJOS */}
                <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-xl p-2.5 border border-purple-100 dark:border-purple-800/30 flex flex-col justify-between relative group cursor-help transition-all min-h-[80px]">
                    <div className="flex justify-between items-start mb-0.5">
                        <span className="text-[9px] font-bold text-purple-700/70 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1">
                            Fijos <span className="bg-purple-200 text-purple-800 text-[7px] px-1 rounded">AUTO</span>
                        </span>
                        <span className="material-icons text-purple-400 text-xs">store</span>
                    </div>
                    
                    <div className="text-base font-bold text-purple-800 dark:text-white tracking-tight">
                        ${money(calculatedFixed)}
                    </div>
                    
                    <div className="text-[7px] text-purple-600/70 dark:text-purple-400/70 leading-tight border-t border-purple-200/50 pt-1 mt-auto">
                        <span className="block font-medium truncate">Global: ${totalMonthlyExpenses.toLocaleString()}</span>
                    </div>
                </div>

                {/* BENEFICIO */}
                <div className={`rounded-xl p-2.5 border flex flex-col justify-between transition-colors relative overflow-hidden min-h-[80px] ${isProjected ? 'bg-gray-50 border-gray-200' : 'bg-emerald-50/50 border-emerald-100'}`}>
                    <div className="flex justify-between items-start mb-0.5 relative z-10">
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isProjected ? 'text-gray-400' : 'text-emerald-700/70'}`}>
                            {isProjected ? 'Proyección' : 'Beneficio'}
                        </span>
                        <span className={`material-icons text-xs ${isProjected ? 'text-gray-300' : 'text-emerald-400'}`}>
                            {isProjected ? 'auto_graph' : 'trending_up'}
                        </span>
                    </div>
                    
                    <div className={`text-base font-bold tracking-tight relative z-10 ${isProjected ? 'text-gray-400' : 'text-emerald-800'}`}>
                         {isProjected ? `$${money(targetProfitValue)}` : `$${money(benefitAmount)}`}
                    </div>

                    <div className={`text-center rounded p-0.5 text-[8px] font-bold relative z-10 mt-auto ${isProjected ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                        Meta: {((targetMargin || 0) * 100).toFixed(0)}%
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ServiceCostAnalysis;
