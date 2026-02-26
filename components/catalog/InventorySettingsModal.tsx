
import React, { useState, useEffect, useMemo } from 'react';
import { GlobalInventorySettings, ServiceGroup } from '../../types';
import { useData } from '../../context/DataContext';

interface InventorySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: GlobalInventorySettings;
    onUpdate: (settings: Partial<GlobalInventorySettings>) => void;
}

const InventorySettingsModal: React.FC<InventorySettingsModalProps> = ({ isOpen, onClose, settings, onUpdate }) => {
    const { fixedExpenses } = useData();
    const [localSettings, setLocalSettings] = useState<GlobalInventorySettings>(settings);
    
    // Group Management State
    const [newGroupName, setNewGroupName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLocalSettings({
                ...settings,
                fixedCostAllocationPercent: settings.fixedCostAllocationPercent ?? 0.20,
                averageMonthlySessions: settings.averageMonthlySessions ?? 208,
                serviceGroups: settings.serviceGroups || [],
                defaultServiceMargin: settings.defaultServiceMargin ?? 0.6,
                defaultHourlyRate: settings.defaultHourlyRate ?? 50
            });
        }
    }, [isOpen, settings]);

    // --- CALCULATOR LOGIC ---
    const totalMonthlyExpenses = useMemo(() => {
        return fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    }, [fixedExpenses]);

    const allocationPercent = localSettings.fixedCostAllocationPercent || 0.20;
    const avgSessions = localSettings.averageMonthlySessions || 208;
    
    const allocatedAmount = totalMonthlyExpenses * allocationPercent;
    const calculatedFixedCost = avgSessions > 0 ? allocatedAmount / avgSessions : 0;

    // Update the calculated fixed cost in local state whenever factors change
    useEffect(() => {
        if (isOpen) {
            setLocalSettings(prev => ({
                ...prev,
                defaultFixedCost: parseFloat(calculatedFixedCost.toFixed(2))
            }));
        }
    }, [calculatedFixedCost, isOpen]);

    // --- GROUP ACTIONS ---
    const handleAddGroup = () => {
        if (newGroupName.trim()) {
            const newGroup: ServiceGroup = {
                id: `grp-${Date.now()}`,
                name: newGroupName.trim(),
                color: 'bg-blue-100 text-blue-800' // Default color
            };
            setLocalSettings(prev => ({
                ...prev,
                serviceGroups: [...(prev.serviceGroups || []), newGroup]
            }));
            setNewGroupName('');
        }
    };

    const handleRemoveGroup = (id: string) => {
        setLocalSettings(prev => ({
            ...prev,
            serviceGroups: prev.serviceGroups.filter(g => g.id !== id)
        }));
    };

    const handleSave = () => {
        onUpdate(localSettings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col" onClick={e => e.stopPropagation()}>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Configuración General</h3>
                
                <div className="space-y-6 flex-1">
                    
                    {/* 1. GRUPOS DE SERVICIO */}
                    <div className="border-b border-gray-100 dark:border-gray-700 pb-5">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Grupos de Servicio</label>
                        <div className="flex gap-2 mb-3">
                            <input 
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Nuevo Grupo..."
                                className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 dark:bg-black/20 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                            />
                            <button onClick={handleAddGroup} className="bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-600 dark:text-gray-200 rounded-xl px-3 transition-colors">
                                <span className="material-icons text-lg">add</span>
                            </button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                            {localSettings.serviceGroups?.length === 0 && <p className="text-[10px] text-gray-400 italic">No hay grupos definidos.</p>}
                            {localSettings.serviceGroups?.map(group => (
                                <div key={group.id} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 group">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{group.name}</span>
                                    <button onClick={() => handleRemoveGroup(group.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                        <span className="material-icons text-sm">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. ESTRATEGIA DE PRECIOS */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Estrategia de Precios</label>
                        
                        {/* Rentabilidad Deseada (Slider) */}
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase flex items-center gap-1">
                                    <span className="material-icons text-sm">trending_up</span> Rentabilidad Deseada
                                </label>
                                <span className="text-base font-bold text-emerald-800 dark:text-emerald-200 bg-white dark:bg-black/20 px-2 py-0.5 rounded shadow-sm border border-emerald-100 dark:border-emerald-900/50">
                                    {Math.round((localSettings.defaultServiceMargin || 0) * 100)}%
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min="0" max="100" step="5"
                                value={Math.round((localSettings.defaultServiceMargin || 0) * 100)}
                                onChange={(e) => setLocalSettings({ ...localSettings, defaultServiceMargin: parseFloat(e.target.value) / 100 })}
                                className="w-full h-2 bg-emerald-200 dark:bg-emerald-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            <div className="flex justify-between text-[9px] text-emerald-600/60 mt-1 font-medium">
                                <span>Conservador (20%)</span>
                                <span>Agresivo (80%)</span>
                            </div>
                        </div>

                        {/* Valor Hora Operativo (Input) */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 flex items-center justify-between">
                            <div>
                                <label className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase block flex items-center gap-1">
                                    <span className="material-icons text-sm">schedule</span> Valor Hora Operativo
                                </label>
                                <p className="text-[10px] text-blue-500/70 mt-0.5">Costo base por tiempo de servicio</p>
                            </div>
                            <div className="relative w-28">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-bold">$</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={localSettings.defaultHourlyRate}
                                    onChange={(e) => setLocalSettings({ ...localSettings, defaultHourlyRate: parseFloat(e.target.value) })}
                                    className="w-full bg-white dark:bg-black/20 border border-blue-200 dark:border-blue-700/50 rounded-lg py-2 pl-6 pr-3 text-sm font-bold text-blue-800 dark:text-blue-200 outline-none focus:border-blue-500 text-right transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. STOCK RATIO SLIDER */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Distribución Stock (Mixtos)</label>
                        <div className="relative pt-1 pb-2">
                             <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1"
                                value={localSettings.defaultRetailRatio} 
                                onChange={(e) => setLocalSettings({ ...localSettings, defaultRetailRatio: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                <span>Cabina: {Math.round((1 - localSettings.defaultRetailRatio) * 100)}%</span>
                                <span>Retail: {Math.round(localSettings.defaultRetailRatio * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. CALCULADORA DE COSTOS FIJOS */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Costo Fijo Base (Calculadora)</label>
                        
                        <div className="bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800/50 space-y-4">
                            
                            {/* Total Expenses Display */}
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-purple-800 dark:text-purple-300">Gastos Fijos (Núcleo)</span>
                                <span className="font-bold text-purple-900 dark:text-purple-200">${totalMonthlyExpenses.toLocaleString()}</span>
                            </div>

                            {/* Allocation Slider */}
                            <div>
                                <div className="flex justify-between text-[10px] mb-1.5 font-bold text-purple-600/80 dark:text-purple-400">
                                    <span>Asignación Servicios</span>
                                    <span>{Math.round(allocationPercent * 100)}% (${allocatedAmount.toLocaleString(undefined, {maximumFractionDigits:0})})</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.05" 
                                    max="1" 
                                    step="0.05"
                                    value={allocationPercent}
                                    onChange={(e) => setLocalSettings({ ...localSettings, fixedCostAllocationPercent: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-purple-200 dark:bg-purple-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                            </div>

                            {/* Sessions Input */}
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Sesiones Prom. Mensual</span>
                                <div className="w-20">
                                    <input 
                                        type="number"
                                        value={avgSessions}
                                        onChange={(e) => setLocalSettings({ ...localSettings, averageMonthlySessions: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-white dark:bg-black/20 border border-purple-200 dark:border-purple-700 rounded-lg px-2 py-1 text-xs font-bold text-center outline-none focus:ring-1 focus:ring-purple-500 text-purple-900 dark:text-purple-100"
                                    />
                                </div>
                            </div>

                            {/* Result */}
                            <div className="border-t border-purple-200/50 dark:border-purple-700/50 pt-3 flex justify-between items-center">
                                <span className="text-[10px] uppercase font-bold text-purple-900 dark:text-purple-100">Costo Fijo / Cita</span>
                                <span className="text-xl font-mono font-bold text-purple-700 dark:text-purple-300">${calculatedFixedCost.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-bold text-xs transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-green-800 transition-all transform hover:-translate-y-0.5">
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventorySettingsModal;
