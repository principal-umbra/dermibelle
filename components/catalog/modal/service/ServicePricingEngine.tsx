
import React from 'react';
import { GlobalInventorySettings } from '../../../../types';
import ServiceIdentity from './pricing/ServiceIdentity';
import ServiceSellingPrice from './pricing/ServiceSellingPrice';
import ServiceCostAnalysis from './pricing/ServiceCostAnalysis';

interface ServicePricingEngineProps {
    title: string;
    sku: string;
    category: string;
    
    price: number;
    updateField: (field: string, value: any) => void;
    totalRecipeCost: number;
    commissionType: 'percent' | 'fixed';
    commissionValue: number;
    commissionAmount: number;
    wastePercent?: number;
    fixedCost?: number;
    
    taxRate?: number;
    transactionFee?: number;
    tempRecipeCount?: number;
    
    targetMargin?: number;
    globalFixedCost?: number;
    timeCost?: number; 
    
    isFixedGlobal?: boolean;
    totalMonthlyExpenses?: number;
    globalSettings?: GlobalInventorySettings;
    
    serviceGroupId?: string;
}

const ServicePricingEngine: React.FC<ServicePricingEngineProps> = (props) => {
    
    const {
        title, sku, category, updateField,
        price, totalRecipeCost, commissionType, commissionValue,
        commissionAmount, wastePercent = 0, fixedCost = 0, targetMargin = 0.6,
        timeCost = 0, isFixedGlobal = true, totalMonthlyExpenses = 0, globalSettings,
        serviceGroupId
    } = props;
    
    // --- CÁLCULOS CENTRALIZADOS ---
    const wasteAmount = totalRecipeCost * ((wastePercent || 0) / 100);
    const finalRecipeCost = totalRecipeCost + wasteAmount;
    
    const effectiveFixed = fixedCost || 0;
    const effectiveTime = timeCost || 0;
    // Commission is now removed from "Hard Costs" as it's replaced by Group (Metadata)
    // If the group doesn't have a cost attached, we assume 0 for "Staff Cost" in this view.
    // FixedComm was previously used. We set it to 0 for calculation purposes in this new mode.
    const fixedComm = 0; 
    
    const hardCosts = finalRecipeCost + effectiveTime + effectiveFixed + fixedComm;

    // Variable Commission is also 0 in this new mode unless reintroduced later
    const actualVariableComm = 0; 
    const totalCostForProfit = hardCosts + actualVariableComm;
    const actualProfit = price - totalCostForProfit;
    const actualMarginPercent = price > 0 ? (actualProfit / price) : 0;

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col gap-4 h-full">
            
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>

            {/* SECCIÓN 1: IDENTIDAD */}
            <ServiceIdentity 
                title={title}
                sku={sku}
                category={category}
                updateField={updateField}
            />

            {/* SECCIÓN 2: PRECIO INTELIGENTE (Flex grow para ocupar espacio) */}
            <div className="flex-1 flex flex-col justify-center">
                <ServiceSellingPrice 
                    price={price}
                    updateField={updateField}
                    hardCosts={hardCosts}
                    commissionType={commissionType}
                    commissionValue={commissionValue}
                    actualMarginPercent={actualMarginPercent}
                    actualProfit={actualProfit}
                />
            </div>

            {/* SECCIÓN 3: ANÁLISIS DE COSTOS (Footer del card) */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <ServiceCostAnalysis 
                    updateField={updateField}
                    finalRecipeCost={finalRecipeCost}
                    totalRecipeCost={totalRecipeCost}
                    wastePercent={wastePercent}
                    commissionAmount={commissionAmount}
                    commissionType={commissionType}
                    commissionValue={commissionValue}
                    fixedCost={fixedCost}
                    isFixedGlobal={isFixedGlobal}
                    totalMonthlyExpenses={totalMonthlyExpenses}
                    globalSettings={globalSettings}
                    benefitAmount={actualProfit}
                    targetMargin={targetMargin}
                    serviceGroupId={serviceGroupId}
                />
            </div>

        </div>
    );
};

export default ServicePricingEngine;
