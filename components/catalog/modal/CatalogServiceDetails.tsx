
import React, { useMemo, useState } from 'react';
import { AppointmentItem, ProductConsumable, Supplier, GlobalInventorySettings } from '../../../types';
import { useData } from '../../../context/DataContext';
import ServicePricingEngine from './service/ServicePricingEngine';
import ServiceRecipeManager from './service/ServiceRecipeManager';
import ServiceScheduling from './service/ServiceScheduling';

interface CatalogServiceDetailsProps {
    editingItem: Partial<AppointmentItem>;
    setEditingItem: (item: Partial<AppointmentItem>) => void;
    tempRecipe: ProductConsumable[];
    setTempRecipe: (recipe: ProductConsumable[]) => void;
    allProducts: AppointmentItem[];
    calculateServiceCost: (recipe: any[]) => number;
    sellingPrice: number;
    suppliers: Supplier[];
    globalSettings?: GlobalInventorySettings;
}

type ConsumptionMode = 'unit' | 'measurement' | 'percentage' | 'yield';

const CatalogServiceDetails: React.FC<CatalogServiceDetailsProps> = ({ 
    editingItem,
    setEditingItem,
    tempRecipe, 
    setTempRecipe, 
    allProducts, 
    calculateServiceCost,
    sellingPrice,
    suppliers,
    globalSettings
}) => {
    const { fixedExpenses } = useData();
    
    // --- LOCAL STATE FOR NEW FIELDS ---
    const [duration, setDuration] = useState((editingItem as any).duration || 60);
    const [bufferTime, setBufferTime] = useState((editingItem as any).bufferTime || 15);

    // Derived state from editingItem
    const commissionType = (editingItem as any).commissionType || 'percent'; 
    const commissionValue = (editingItem as any).commissionValue || 0;
    const price = editingItem.price || 0;
    const wastePercent = (editingItem as any).wastePercent || 0;
    const serviceGroupId = (editingItem as any).serviceGroupId || '';
    
    // LOGIC: GLOBAL SETTINGS OVERRIDE
    const globalFixed = globalSettings?.defaultFixedCost ?? 5.00;
    const globalMargin = globalSettings?.defaultServiceMargin ?? 0.6;
    const globalHourlyRate = globalSettings?.defaultHourlyRate ?? 50;
    
    const fixedCostOverride = (editingItem as any).fixedCostOverride;
    
    const isFixedGlobal = fixedCostOverride === undefined;
    const fixedCost = isFixedGlobal ? globalFixed : fixedCostOverride;

    const totalMonthlyExpenses = useMemo(() => {
        return fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    }, [fixedExpenses]);

    const costPerMinute = globalHourlyRate > 0 ? (globalHourlyRate / 60) : 0;
    const timeCost = costPerMinute * duration;

    // --- ACTIONS ---

    const updateField = (field: string, value: any) => {
        setEditingItem({ ...editingItem, [field]: value });
    };

    const handleDurationChange = (val: number) => {
        setDuration(val);
        setEditingItem({ ...editingItem, ['duration' as any]: val });
    };
    const handleBufferChange = (val: number) => {
        setBufferTime(val);
        setEditingItem({ ...editingItem, ['bufferTime' as any]: val });
    };

    const addIngredient = (productId: string) => {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;
        const info = product.packageInfo || { consumptionUnit: 'Unidad', unitsPerPackage: 1, contentPerUnit: 1, usageType: 'whole' };
        let defaultMode: ConsumptionMode = 'unit';
        let defaultQty = 1;

        if (info.usageType === 'whole') {
             defaultMode = 'unit'; defaultQty = 1;
        } else {
            const isLiquid = ['ml', 'g', 'oz', 'lt'].includes(info.consumptionUnit || '');
            if (isLiquid) { defaultMode = 'measurement'; defaultQty = info.contentPerUnit ? parseFloat((info.contentPerUnit * 0.05).toFixed(1)) : 10; } 
            else { defaultMode = 'unit'; }
        }
        setTempRecipe([...tempRecipe, { id: productId, qty: defaultQty, consumptionMode: defaultMode }]);
    };

    const removeIngredient = (idx: number) => setTempRecipe(tempRecipe.filter((_, i) => i !== idx));
    const updateIngredient = (idx: number, updates: Partial<ProductConsumable>) => {
        const updated = [...tempRecipe];
        updated[idx] = { ...updated[idx], ...updates };
        setTempRecipe(updated);
    };

    const getIngredientCost = (prod: AppointmentItem, qty: number, mode: ConsumptionMode, waste: number = 0) => {
        if (!prod) return 0;
        const purchaseCost = prod.cost || 0;
        const pkg = prod.packageInfo || { unitsPerPackage: 1, contentPerUnit: 1, usageType: 'whole' };
        let baseCost = 0;

        if (pkg.usageType === 'whole') {
             baseCost = purchaseCost * qty;
        } else {
            const totalContent = (pkg.unitsPerPackage || 1) * (pkg.contentPerUnit || 1);
            const costPerMeasure = totalContent > 0 ? purchaseCost / totalContent : 0;
            let consumedAmount = 0;
            switch (mode) {
                case 'unit': consumedAmount = qty * (pkg.unitsPerPackage > 1 ? (pkg.contentPerUnit || 1) : 1); break;
                case 'measurement': consumedAmount = qty; break;
                case 'percentage': consumedAmount = totalContent * (qty / 100); break;
                case 'yield': consumedAmount = qty > 0 ? totalContent / qty : 0; break;
            }
            baseCost = costPerMeasure * consumedAmount;
        }
        if (waste > 0 && waste < 100) return baseCost / (1 - (waste / 100));
        return baseCost;
    };

    const totalRecipeCost = useMemo(() => {
        return tempRecipe.reduce((acc, item) => {
            const prod = allProducts.find(p => p.id === item.id);
            if (!prod) return acc;
            return acc + getIngredientCost(prod, item.qty, item.consumptionMode || 'unit', (item as any).waste || 0);
        }, 0);
    }, [tempRecipe, allProducts]);

    const commissionAmount = useMemo(() => {
        // Staff commission legacy logic (kept for fallback calculation but UI changed)
        if (commissionType === 'percent') return price * (commissionValue / 100);
        return commissionValue;
    }, [price, commissionType, commissionValue]);

    return (
        <div className="h-full flex flex-col lg:flex-row bg-[#F8F9FA] dark:bg-black/10 overflow-hidden relative">
            
            {/* COLUMNA IZQUIERDA: ESTRUCTURA PRINCIPAL */}
            <div className="lg:w-1/2 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/5 h-full overflow-hidden">
                
                {/* Scrollable Container - Compact Layout */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
                    
                    {/* 1. SECCIÓN PRINCIPAL (Growing) */}
                    <div className="flex-1">
                        <ServicePricingEngine 
                            title={editingItem.title || ''}
                            sku={editingItem.sku || ''}
                            category={editingItem.category || ''}
                            price={price}
                            updateField={updateField}
                            totalRecipeCost={totalRecipeCost}
                            commissionType={commissionType}
                            commissionValue={commissionValue}
                            commissionAmount={commissionAmount}
                            taxRate={0}
                            wastePercent={wastePercent}
                            fixedCost={fixedCost}
                            globalFixedCost={globalFixed}
                            targetMargin={globalMargin}
                            timeCost={timeCost}
                            isFixedGlobal={isFixedGlobal}
                            totalMonthlyExpenses={totalMonthlyExpenses}
                            globalSettings={globalSettings}
                            serviceGroupId={serviceGroupId}
                        />
                    </div>

                    {/* 2. LOGÍSTICA & TIEMPOS (Bottom fixed-like) */}
                    <div className="shrink-0">
                         <ServiceScheduling 
                            duration={duration}
                            setDuration={handleDurationChange}
                            bufferTime={bufferTime}
                            setBufferTime={handleBufferChange}
                            price={price}
                            targetHourlyRate={globalHourlyRate}
                        />
                    </div>
                    
                </div>
            </div>

            {/* COLUMNA DERECHA: RECETA */}
            <div className="lg:w-1/2 bg-white dark:bg-surface-dark flex flex-col h-full shadow-[inset_4px_0_15px_-4px_rgba(0,0,0,0.05)] z-10">
                <ServiceRecipeManager 
                    tempRecipe={tempRecipe}
                    allProducts={allProducts}
                    addIngredient={addIngredient}
                    removeIngredient={removeIngredient}
                    updateIngredient={updateIngredient}
                    getIngredientCost={getIngredientCost}
                    totalRecipeCost={totalRecipeCost}
                />
            </div>

        </div>
    );
};

export default CatalogServiceDetails;
