
import React, { useState, useEffect, useMemo } from 'react';
import { AppointmentItem, PackageInfo, Supplier } from '../../../types';
import ProductDefinition from './product/ProductDefinition';
import ProductInventory from './product/ProductInventory';
import ProductPricing from './product/ProductPricing';

interface CatalogProductConfigProps {
    editingItem: Partial<AppointmentItem>;
    setEditingItem: (item: Partial<AppointmentItem>) => void;
    suppliers: Supplier[];
    lockedSupplierId?: string;
}

const CatalogProductConfig: React.FC<CatalogProductConfigProps> = ({ editingItem, setEditingItem, suppliers, lockedSupplierId }) => {
    
    // --- LOCAL STATE (Orchestrator) ---
    const [purchaseMode, setPurchaseMode] = useState<'unit' | 'pack'>('unit');
    const [acquisitionCost, setAcquisitionCost] = useState<number>(0);
    const [unitsPerPack, setUnitsPerPack] = useState<number>(1);
    const [containerType, setContainerType] = useState<string>('Unidad');

    const [usageMode, setUsageMode] = useState<'piece' | 'bulk'>('piece'); 
    const [netContent, setNetContent] = useState<number>(1);
    const [measureUnit, setMeasureUnit] = useState<string>('ml');

    const [trackBatch, setTrackBatch] = useState(false);
    const [expiryDate, setExpiryDate] = useState('');
    const [currentBatch, setCurrentBatch] = useState('');

    const [retailRatio, setRetailRatio] = useState<number>(0.5); 
    const [boxPrice, setBoxPrice] = useState<number>(0); 
    
    const [distributionMode, setDistributionMode] = useState<'ratio' | 'manual'>('ratio');
    
    const [allowFractionalSale, setAllowFractionalSale] = useState(false);

    // --- TAB STATE ---
    const [activeTab, setActiveTab] = useState<'definition' | 'inventory' | 'pricing'>('definition');

    // --- INITIALIZATION ---
    useEffect(() => {
        const info = (editingItem.packageInfo || {}) as Partial<PackageInfo> & { currentBatch?: string, expiryDate?: string };
        const isPack = (info.unitsPerPackage || 1) > 1;
        setPurchaseMode(isPack ? 'pack' : 'unit');
        setUnitsPerPack(info.unitsPerPackage || 1);
        setContainerType(info.purchaseUnit || 'Unidad');
        
        // Correct cost initialization based on mode
        if (isPack && editingItem.packageCost) {
            setAcquisitionCost(editingItem.packageCost);
        } else {
            setAcquisitionCost(editingItem.cost || 0);
        }

        const unit = info.consumptionUnit || 'Unidad';
        const isBulk = !['Unidad', 'Pza', 'Par'].includes(unit);
        setUsageMode(isBulk ? 'bulk' : 'piece');
        setMeasureUnit(isBulk ? unit : 'ml'); 
        setNetContent(info.contentPerUnit || 1);

        setTrackBatch(info.requiresBatch || false);
        setExpiryDate(info.expiryDate || '');
        setCurrentBatch(info.currentBatch || '');

        if (editingItem.stockConfig?.isCustom) setRetailRatio(editingItem.stockConfig.retailRatio);
        
        setAllowFractionalSale(editingItem.allowFractionalSale || false);

        if (isPack && editingItem.price) {
            // Estimate box price for retail display if not saved
            setBoxPrice(editingItem.price * (info.unitsPerPackage || 1));
        }

        // Lock supplier if provided
        if (lockedSupplierId && editingItem.supplierId !== lockedSupplierId) {
            setEditingItem({ ...editingItem, supplierId: lockedSupplierId });
        }

    }, [editingItem.id, lockedSupplierId]);

    // --- CALCULATIONS ---
    const unitCost = useMemo(() => {
        if (purchaseMode === 'unit') return acquisitionCost;
        return unitsPerPack > 0 ? acquisitionCost / unitsPerPack : acquisitionCost; // Prevent infinity
    }, [acquisitionCost, purchaseMode, unitsPerPack]);

    const sellingPrice = editingItem.price || 0;
    
    // Profit & Margin Calc (Per Unit)
    const displayProfit = purchaseMode === 'pack' 
        ? boxPrice - acquisitionCost 
        : sellingPrice - unitCost;
        
    const marginPercent = purchaseMode === 'pack'
        ? (acquisitionCost > 0 ? ((boxPrice - acquisitionCost) / acquisitionCost) * 100 : 0)
        : (unitCost > 0 ? ((sellingPrice - unitCost) / unitCost) * 100 : 0);

    // --- STRATEGIC METRICS ---
    const totalStock = editingItem.stock || 0;
    const isMix = editingItem.subtype === 'both';
    
    // Allocation
    let retailStock = 0;
    if (editingItem.subtype === 'retail') {
        retailStock = totalStock;
    } else if (isMix) {
        retailStock = Math.floor(totalStock * retailRatio);
    }
    
    const internalStock = totalStock - retailStock;

    // Financial KPIs
    const totalInvestment = totalStock * unitCost; 
    const retailRevenue = retailStock * sellingPrice;
    const breakEvenUnits = sellingPrice > 0 ? totalInvestment / sellingPrice : 0;
    const investmentEfficiency = totalInvestment > 0 ? retailRevenue / totalInvestment : 0;

    // --- HANDLERS ---
    const handleBoxPriceChange = (val: number) => {
        setBoxPrice(val);
        // Auto update unit price
        if (unitsPerPack > 0) setEditingItem({ ...editingItem, price: parseFloat((val / unitsPerPack).toFixed(2)) });
    };

    const applyMarkup = (percent: number) => {
        if (purchaseMode === 'pack') {
            const newBoxPrice = acquisitionCost * (1 + percent / 100);
            handleBoxPriceChange(parseFloat(newBoxPrice.toFixed(2)));
        } else {
            const newPrice = unitCost * (1 + percent / 100);
            setEditingItem({ ...editingItem, price: parseFloat(newPrice.toFixed(2)) });
        }
    };

    const handleManualInternalChange = (val: number) => {
        if (totalStock === 0) return;
        const safeVal = Math.max(0, Math.min(val, totalStock));
        const newRetail = totalStock - safeVal;
        setRetailRatio(newRetail / totalStock);
    };

    const handleManualRetailChange = (val: number) => {
        if (totalStock === 0) return;
        const safeVal = Math.max(0, Math.min(val, totalStock));
        setRetailRatio(safeVal / totalStock);
    };

    // --- SYNC ---
    useEffect(() => {
        const finalConsumptionUnit = usageMode === 'piece' ? 'Unidad' : measureUnit;
        const finalContent = usageMode === 'piece' ? 1 : netContent;
        
        // Critical: Determine exact units per package to save
        // If mode is pack, use input value. If mode is unit, force 1.
        // If input is empty/0 in pack mode, use 1 to avoid DB errors but it will revert to 'unit' visual on reload.
        const finalUnitsPerPack = purchaseMode === 'pack' ? (unitsPerPack > 0 ? unitsPerPack : 1) : 1;

        setEditingItem({
            ...editingItem,
            cost: unitCost,
            packageCost: purchaseMode === 'pack' ? acquisitionCost : undefined,
            stockConfig: editingItem.subtype === 'both' ? { isCustom: true, retailRatio: retailRatio } : undefined,
            packageInfo: {
                ...editingItem.packageInfo,
                purchaseUnit: containerType,
                unitsPerPackage: finalUnitsPerPack,
                consumptionUnit: finalConsumptionUnit,
                contentPerUnit: finalContent,
                requiresBatch: trackBatch,
                currentBatch: trackBatch ? currentBatch : undefined,
                expiryDate: trackBatch ? expiryDate : undefined,
            } as any,
            allowFractionalSale: allowFractionalSale
        });
    }, [unitCost, acquisitionCost, purchaseMode, unitsPerPack, usageMode, netContent, measureUnit, trackBatch, expiryDate, currentBatch, retailRatio, containerType, allowFractionalSale]);

    const isRetail = editingItem.subtype === 'retail' || isMix;
    const isConsumable = editingItem.subtype === 'consumable' || isMix;

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in slide-in-from-right-4">
            
            {/* Header Info Block */}
            <div className="shrink-0 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-3xl p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                    {/* 1. NOMBRE COMERCIAL */}
                    <div className="min-w-0">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Nombre Comercial</label>
                        <input 
                            value={editingItem.title || ''}
                            onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                            className="w-full text-sm font-bold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                            placeholder="Ej: Shampoo Keratina 500ml"
                            autoFocus
                        />
                    </div>

                    {/* 2. CATEGORÍA */}
                    <div className="min-w-0">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Categoría</label>
                        <div className="relative">
                            <input 
                                value={editingItem.category || ''}
                                onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                                className="w-full text-xs font-medium bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-8 py-2 outline-none focus:border-primary transition-all"
                                placeholder="Ej: Capilar"
                                list="categories-list"
                            />
                             <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] pointer-events-none">category</span>
                        </div>
                        <datalist id="categories-list">
                            <option value="Faciales" />
                            <option value="Capilar" />
                            <option value="Corporal" />
                            <option value="Venta" />
                        </datalist>
                    </div>

                    {/* 3. SKU */}
                    <div className="min-w-0">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">SKU / Código</label>
                        <div className="relative">
                            <input 
                                value={editingItem.sku || ''}
                                onChange={e => setEditingItem({...editingItem, sku: e.target.value})}
                                className="w-full text-xs font-mono font-bold uppercase bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-7 py-2 outline-none focus:border-primary transition-all"
                                placeholder="AUTO"
                            />
                            <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] pointer-events-none">qr_code</span>
                        </div>
                    </div>

                    {/* 4. PROVEEDOR */}
                    <div className="min-w-0">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Proveedor</label>
                        <div className="relative">
                            <select 
                                value={editingItem.supplierId || ''}
                                onChange={e => setEditingItem({...editingItem, supplierId: e.target.value})}
                                disabled={!!lockedSupplierId}
                                className={`w-full text-xs font-medium bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-6 py-2 outline-none focus:border-primary appearance-none transition-all ${lockedSupplierId ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                            >
                                <option value="">Seleccionar...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                            </select>
                            {!lockedSupplierId && <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">expand_more</span>}
                            {lockedSupplierId && <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">lock</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-2 px-1">
                <button 
                    onClick={() => setActiveTab('definition')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${activeTab === 'definition' ? 'bg-white dark:bg-surface-dark shadow-sm border-gray-200 dark:border-gray-700 text-blue-600' : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                    <span className="material-icons text-sm">shopping_bag</span> Definición de Compra
                </button>
                <button 
                    onClick={() => setActiveTab('inventory')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${activeTab === 'inventory' ? 'bg-white dark:bg-surface-dark shadow-sm border-gray-200 dark:border-gray-700 text-purple-600' : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                    <span className="material-icons text-sm">inventory_2</span> Control & Inventario
                </button>
                <button 
                    onClick={() => setActiveTab('pricing')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${activeTab === 'pricing' ? 'bg-white dark:bg-surface-dark shadow-sm border-gray-200 dark:border-gray-700 text-green-600' : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                    <span className="material-icons text-sm">monetization_on</span> Estrategia de Precios
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1">
                {activeTab === 'definition' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <ProductDefinition 
                            editingItem={editingItem}
                            setEditingItem={setEditingItem}
                            purchaseMode={purchaseMode}
                            setPurchaseMode={setPurchaseMode}
                            acquisitionCost={acquisitionCost}
                            setAcquisitionCost={setAcquisitionCost}
                            unitsPerPack={unitsPerPack}
                            setUnitsPerPack={setUnitsPerPack}
                            unitCost={unitCost}
                            containerType={containerType}
                            setContainerType={setContainerType}
                        />
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <ProductInventory 
                            editingItem={editingItem}
                            setEditingItem={setEditingItem}
                            isMix={isMix}
                            isConsumable={isConsumable}
                            usageMode={usageMode}
                            setUsageMode={setUsageMode}
                            netContent={netContent}
                            setNetContent={setNetContent}
                            measureUnit={measureUnit}
                            setMeasureUnit={setMeasureUnit}
                            trackBatch={trackBatch}
                            setTrackBatch={setTrackBatch}
                            expiryDate={expiryDate}
                            setExpiryDate={setExpiryDate}
                            currentBatch={currentBatch}
                            setCurrentBatch={setCurrentBatch}
                            retailRatio={retailRatio}
                            setRetailRatio={setRetailRatio}
                            distributionMode={distributionMode}
                            setDistributionMode={setDistributionMode}
                            internalStock={internalStock}
                            retailStock={retailStock}
                            unitCost={unitCost}
                            handleManualInternalChange={handleManualInternalChange}
                            handleManualRetailChange={handleManualRetailChange}
                            isStockReadOnly={true}
                            isRetail={isRetail}
                            allowFractionalSale={allowFractionalSale}
                            setAllowFractionalSale={setAllowFractionalSale}
                        />
                    </div>
                )}

                {activeTab === 'pricing' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <ProductPricing 
                            editingItem={editingItem}
                            setEditingItem={setEditingItem}
                            purchaseMode={purchaseMode}
                            boxPrice={boxPrice}
                            handleBoxPriceChange={handleBoxPriceChange}
                            marginPercent={marginPercent}
                            displayProfit={displayProfit}
                            unitCost={unitCost}
                            unitsPerPack={unitsPerPack}
                            applyMarkup={applyMarkup}
                            acquisitionCost={acquisitionCost}
                            isRetail={isRetail}
                            breakEvenUnits={breakEvenUnits}
                            investmentEfficiency={investmentEfficiency}
                            retailStock={retailStock}
                        />
                    </div>
                )}
            </div>

        </div>
    );
};

export default CatalogProductConfig;
