
import React, { useState, useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    TrendingUp, AlertTriangle, Package, Truck, Calendar, 
    ArrowRight, RefreshCw, Zap, ShoppingCart, CheckCircle2, 
    Clock, ShieldAlert, ArrowUpRight
} from 'lucide-react';

interface SupplyPredictiveProps {
    kpis: {
        stockoutRate: string;
        inventoryValue: number;
        avgLeadTime: string;
        dailyConsumptionValue?: number;
        financialHealth?: number;
    };
    forecastImpact: {
        message: string;
        riskLevel?: string;
        trend?: string;
    };
    risks: any[];
    suppliers: any[];
    onReorder: (supplierId: string) => void;
}

const SupplyPredictive: React.FC<SupplyPredictiveProps> = ({ kpis, forecastImpact, risks, suppliers, onReorder }) => {
    const [scenario, setScenario] = useState<'normal' | 'high_demand' | 'low_demand'>('normal');
    
    // Calculate "Days Remaining" based on real data (bottleneck item or financial runway)
    const daysRemaining = useMemo(() => {
        if (risks.length > 0) {
            // If there are risks, the "days remaining" is determined by the item running out soonest
            return Math.min(...risks.map(r => r.daysRemaining));
        }
        // Otherwise, use financial runway (Total Value / Daily Consumption)
        const dailyBurn = kpis.dailyConsumptionValue || 1;
        return Math.floor(kpis.inventoryValue / dailyBurn);
    }, [risks, kpis]);

    const projectionData = useMemo(() => {
        const data = [];
        const daysToProject = 30;
        
        // Calculate decay rate based on daysRemaining
        // If we have 10 days remaining, we burn 10% per day (starting from 100%)
        // If we have 100 days, we burn 1% per day.
        let baseDecay = daysRemaining > 0 ? 100 / daysRemaining : 0;
        
        // Apply scenario modifiers
        if (scenario === 'high_demand') baseDecay *= 1.5;
        if (scenario === 'low_demand') baseDecay *= 0.7;

        for (let i = 0; i <= daysToProject; i++) {
            const projectedStock = Math.max(0, 100 - (baseDecay * i));
            data.push({
                day: `Día ${i}`,
                stock: Math.round(projectedStock),
                safety: 20 // Visual safety threshold
            });
        }
        return data;
    }, [daysRemaining, scenario]);

    const getScenarioLabel = () => {
        switch(scenario) {
            case 'high_demand': return 'Si las ventas aumentan un 50%...';
            case 'low_demand': return 'Si las ventas bajan un 30%...';
            default: return 'Con el ritmo de ventas actual...';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
            
            {/* 1. HEADER & SUMMARY HERO */}
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-amber-500" />
                        Centro de Predicción
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Visión clara de tu futuro operativo.
                    </p>
                </div>

                {/* HERO CARD: The "Big Picture" */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Tiempo de Vida del Inventario
                                </span>
                            </div>
                            <h3 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
                                Tienes stock para <br/>
                                <span className="text-amber-300">{daysRemaining} días</span> más.
                            </h3>
                            <p className="text-indigo-100 text-lg max-w-md leading-relaxed">
                                {daysRemaining < 10 
                                    ? "¡Cuidado! Estás entrando en zona crítica. Deberías reponer inventario esta semana."
                                    : "Tu salud de inventario es buena. No se prevén quiebres inmediatos."}
                            </p>
                            
                            <div className="mt-8 flex flex-wrap gap-3">
                                <button 
                                    onClick={() => setScenario('normal')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${scenario === 'normal' ? 'bg-white text-indigo-600 shadow-lg' : 'bg-indigo-800/50 text-indigo-200 hover:bg-indigo-800'}`}
                                >
                                    Escenario Normal
                                </button>
                                <button 
                                    onClick={() => setScenario('high_demand')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${scenario === 'high_demand' ? 'bg-white text-indigo-600 shadow-lg' : 'bg-indigo-800/50 text-indigo-200 hover:bg-indigo-800'}`}
                                >
                                    🔥 Si vendemos más (+50%)
                                </button>
                                <button 
                                    onClick={() => setScenario('low_demand')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${scenario === 'low_demand' ? 'bg-white text-indigo-600 shadow-lg' : 'bg-indigo-800/50 text-indigo-200 hover:bg-indigo-800'}`}
                                >
                                    🧊 Si vendemos menos (-30%)
                                </button>
                            </div>
                        </div>

                        {/* Visual Projection (Simple Area Chart) */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 h-[280px] flex flex-col">
                            <p className="text-sm font-bold text-indigo-200 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                {getScenarioLabel()}
                            </p>
                            <div className="flex-1 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={projectionData}>
                                        <defs>
                                            <linearGradient id="colorStockSimple" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="day" hide />
                                        <YAxis hide domain={[0, 110]} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '8px', border: 'none', color: '#fff' }}
                                            itemStyle={{ color: '#fbbf24' }}
                                            formatter={(value: any) => [`${value}%`, 'Nivel de Stock']}
                                            labelStyle={{ display: 'none' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="stock" 
                                            stroke="#fbbf24" 
                                            strokeWidth={3}
                                            fill="url(#colorStockSimple)" 
                                        />
                                        {/* Safety Line */}
                                        <Area 
                                            type="monotone" 
                                            dataKey="safety" 
                                            stroke="rgba(255,255,255,0.3)" 
                                            strokeDasharray="5 5"
                                            fill="none" 
                                            strokeWidth={1}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between text-xs text-indigo-300 mt-2 font-medium">
                                <span>Hoy</span>
                                <span>En 15 días</span>
                                <span>En 30 días</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ACTIONABLE INSIGHTS (Simple Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Urgent Actions */}
                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Acciones Urgentes</h3>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2">
                        <span className="text-4xl font-display font-bold text-gray-900 dark:text-white">{risks.length}</span>
                        <p className="text-sm text-gray-500">Productos en riesgo de quiebre</p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> Requieren atención inmediata
                        </p>
                    </div>
                </div>

                {/* Card 2: Money on the Table */}
                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Salud Financiera</h3>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2">
                        <span className="text-4xl font-display font-bold text-gray-900 dark:text-white">{kpis.financialHealth || 100}%</span>
                        <p className="text-sm text-gray-500">Eficiencia de compra</p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p className={`text-xs font-bold flex items-center gap-1 ${(kpis.financialHealth || 100) >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            <CheckCircle2 className="w-3 h-3" /> 
                            {(kpis.financialHealth || 100) >= 80 ? 'Tu flujo de caja es óptimo' : 'Revisa tu sobrestock'}
                        </p>
                    </div>
                </div>

                {/* Card 3: Supplier Status */}
                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Truck className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Proveedores</h3>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2">
                        <span className="text-4xl font-display font-bold text-gray-900 dark:text-white">{suppliers.length}</span>
                        <p className="text-sm text-gray-500">Activos y confiables</p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-blue-600 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Lead time promedio: {kpis.avgLeadTime} días
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. SMART SHOPPING LIST (Radically Simple) */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-indigo-600" />
                            Sugerencias de Compra
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Basado en tu velocidad de venta actual.</p>
                    </div>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                        {risks.length} Items
                    </span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {risks.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-200" />
                            <p className="font-medium">¡Todo está bajo control!</p>
                            <p className="text-sm">No necesitas comprar nada por ahora.</p>
                        </div>
                    ) : (
                        risks.map((item, idx) => (
                            <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 shrink-0">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
                                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                                                Quedan {item.stock} un.
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                Se agota en {item.daysRemaining} días
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Sugerido</p>
                                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">+{Math.ceil(item.velocity * 30)}</p>
                                    </div>
                                    <button 
                                        onClick={() => item.supplierId && onReorder(item.supplierId)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
                                    >
                                        Reponer Ahora <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 4. SUPPLIER RANKING (Simplified) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        Proveedores en Riesgo
                    </h3>
                    <div className="space-y-3">
                        {suppliers.filter((s: any) => parseFloat(s.rating) < 4.5 || parseInt(s.leadTime) > 7).slice(0, 3).map((sup: any) => (
                            <div key={sup.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-amber-600 font-bold text-xs">
                                        !
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{sup.companyName}</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">Retrasos frecuentes</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold bg-white dark:bg-black/20 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                    Rating: {sup.rating}
                                </span>
                            </div>
                        ))}
                        {suppliers.filter((s: any) => parseFloat(s.rating) < 4.5 || parseInt(s.leadTime) > 7).length === 0 && (
                            <p className="text-sm text-gray-400 italic text-center py-4">Todos tus proveedores están operando bien.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Mejores Proveedores
                    </h3>
                    <div className="space-y-3">
                        {suppliers.filter((s: any) => parseFloat(s.rating) >= 4.5).slice(0, 3).map((sup: any) => (
                            <div key={sup.id} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                        ★
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{sup.companyName}</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Siempre a tiempo</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold bg-white dark:bg-black/20 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                    Rating: {sup.rating}
                                </span>
                            </div>
                        ))}
                         {suppliers.filter((s: any) => parseFloat(s.rating) >= 4.5).length === 0 && (
                            <p className="text-sm text-gray-400 italic text-center py-4">No hay proveedores destacados aún.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplyPredictive;
