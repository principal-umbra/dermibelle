
import React, { useState, useEffect } from 'react';

interface ServiceSellingPriceProps {
    price: number;
    updateField: (field: string, value: any) => void;
    hardCosts: number; 
    commissionType: 'percent' | 'fixed';
    commissionValue: number;
    actualMarginPercent: number;
    actualProfit: number;
}

const ServiceSellingPrice: React.FC<ServiceSellingPriceProps> = ({ 
    price, updateField, hardCosts, commissionType, commissionValue, actualMarginPercent, actualProfit 
}) => {
    
    // Proyección de ventas mensual estimada (simulada para la "predicción")
    const estimatedSalesPerMonth = 15; 

    // --- CÁLCULO DE ESCENARIOS SUGERIDOS ---
    const calcPriceForMargin = (targetMargin: number) => {
        const commRate = commissionType === 'percent' ? (commissionValue / 100) : 0;
        const fixedComm = commissionType === 'fixed' ? commissionValue : 0;
        
        const totalBaseCost = hardCosts + fixedComm;
        const divisor = 1 - targetMargin - commRate;
        
        if (divisor <= 0.1) return 0;
        return totalBaseCost / divisor;
    };

    const priceCompetitive = calcPriceForMargin(0.30);
    let priceRecommended = calcPriceForMargin(0.55);
    priceRecommended = Math.ceil(priceRecommended / 5) * 5 - 0.01; 
    const pricePremium = calcPriceForMargin(0.75);

    const strategies = [
        { 
            id: 'competitive', 
            label: 'Competitivo', 
            desc: 'Maximizar volumen', 
            price: priceCompetitive,
            margin: 30,
            color: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400'
        },
        { 
            id: 'smart', 
            label: 'Recomendado', 
            desc: 'Equilibrio ideal', 
            price: priceRecommended,
            margin: 55,
            color: 'border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-400 ring-1 ring-purple-200 shadow-sm'
        },
        { 
            id: 'premium', 
            label: 'Exclusivo', 
            desc: 'Posicionamiento alto', 
            price: pricePremium,
            margin: 75,
            color: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400'
        }
    ];

    const getClosestStrategyId = () => {
        if (!price || price <= 0) return null;
        return strategies.reduce((prev, curr) => {
            return (Math.abs(curr.price - price) < Math.abs(prev.price - price) ? curr : prev);
        }).id;
    };

    const activeStrategyId = getClosestStrategyId();

    return (
        <div className="space-y-3">
            
            {/* Header: Input Manual Limpio + Contexto */}
            <div className="flex items-end justify-between gap-3">
                <div className="flex-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                        Precio de Venta Público
                    </label>
                    <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-lg">$</span>
                        <input 
                            type="number" 
                            step="0.01"
                            value={price || ''}
                            onChange={(e) => updateField('price', parseFloat(e.target.value))}
                            className="w-full h-11 bg-white dark:bg-black/20 border border-gray-300 dark:border-gray-600 rounded-xl pl-7 pr-4 font-display font-bold text-2xl text-gray-900 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-300"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                
                {/* Micro-Indicador Predictivo Inline */}
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-1.5 flex flex-col justify-center items-end min-w-[120px] h-11">
                    <span className="text-[8px] text-gray-400 uppercase font-bold mb-0.5">Proyección Mensual</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            +${(actualProfit * estimatedSalesPerMonth).toLocaleString('en-US', {maximumFractionDigits:0})}
                        </span>
                        <span className="text-[8px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-full">
                            Profit
                        </span>
                    </div>
                </div>
            </div>

            {/* Selector de Escenarios (Sugerencias Inteligentes) */}
            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 ml-1">
                        <span className="material-icons text-[10px]">auto_awesome</span> Sugerencias IA
                    </p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                    {strategies.map((strat) => {
                        const isSelected = activeStrategyId === strat.id;
                        
                        return (
                            <button
                                key={strat.id}
                                onClick={() => updateField('price', parseFloat(strat.price.toFixed(2)))}
                                className={`relative rounded-xl p-2.5 border-2 text-left transition-all duration-200 group flex flex-col justify-between min-h-[70px]
                                    ${isSelected ? strat.color + ' shadow-md scale-[1.01]' : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-700 hover:border-gray-300 text-gray-500'}
                                `}
                            >
                                {isSelected && (
                                    <div className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full p-0.5 shadow-sm z-10">
                                        <span className="material-icons text-[10px] block">check</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-start w-full">
                                    <span className="text-[9px] font-bold uppercase tracking-wide">{strat.label}</span>
                                    <span className="text-[8px] opacity-70 font-mono font-medium">{strat.margin}% Mg.</span>
                                </div>
                                <div className="text-base font-bold group-hover:opacity-100 transition-opacity">
                                    ${strat.price.toFixed(2)}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default ServiceSellingPrice;
