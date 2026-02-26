
import React, { useState } from 'react';
import { useData, AppointmentItem } from '../../context/DataContext';
import { useCatalogLogic } from '../../hooks/useCatalogLogic';

// Sub-components
import CatalogHeader from '../../components/catalog/layout/CatalogHeader';
import CatalogTabs from '../../components/catalog/layout/CatalogTabs';
import CatalogFilters from '../../components/catalog/layout/CatalogFilters';
import CatalogPagination from '../../components/catalog/layout/CatalogPagination';

// Content Views
import ServiceCard from '../../components/catalog/ServiceCard';
import ProductCard from '../../components/catalog/ProductCard';
import OperationsView from '../../components/catalog/OperationsView';
import OpenProductView from '../../components/catalog/OpenProductView';

// Modals
import CatalogModal from '../../components/catalog/CatalogModal';
import InventorySettingsModal from '../../components/catalog/InventorySettingsModal';
import ServiceDetailModal from '../../components/catalog/modals/ServiceDetailModal';
import RetailProductModal from '../../components/catalog/modals/RetailProductModal';
import ConsumableProductModal from '../../components/catalog/modals/ConsumableProductModal';
import MixedProductModal from '../../components/catalog/modals/MixedProductModal';
import ServiceMenuManagerModal from '../../components/catalog/modals/ServiceMenuManagerModal';
import ProductMenuManagerModal from '../../components/catalog/modals/ProductMenuManagerModal'; 
import ArchivedProductModal from '../../components/catalog/modals/ArchivedProductModal'; // New Import

const Catalog: React.FC = () => {
  const { 
      catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem, suppliers, 
      appointments, globalInventorySettings, updateGlobalInventorySettings, openStock 
  } = useData();

  // Custom Logic Hook
  const {
      activeTab, setActiveTab,
      searchTerm, setSearchTerm,
      sortBy, setSortBy,
      sortOrder, setSortOrder,
      selectedCategory, setSelectedCategory,
      currentPage, itemsPerPage, setItemsPerPage,
      services, retailProducts, consumableProducts, allProducts, damagedExpiredProducts,
      availableCategories, currentItems, paginatedItems, totalPages,
      indexOfFirstItem, indexOfLastItem, paginate,
      calculateServiceCost, checkServiceAvailability
  } = useCatalogLogic(catalog);

  // Modal States
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isProductMenuModalOpen, setIsProductMenuModalOpen] = useState(false);
  
  const [selectedDetailItem, setSelectedDetailItem] = useState<AppointmentItem | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<AppointmentItem> | null>(null);
  const [tempRecipe, setTempRecipe] = useState<any[]>([]);

  // --- HANDLERS ---
  const handleOpenDetail = (item: AppointmentItem) => setSelectedDetailItem(item);
  const handleCloseDetail = () => setSelectedDetailItem(null);

  const handleOpenCatalogModal = (item?: AppointmentItem) => {
      // If we are in damaged tab, standard edit might not be what we want, but "Edit" button on card calls this.
      // However, ProductCard calls onEdit which triggers this.
      // If it's a damaged item, we might want to prevent editing core details or show a warning.
      // For now, standard behavior is preserved for "Edit", but "View" opens the specific modal.
      
      setSelectedDetailItem(null);
      if (item) {
          setEditingItem({ ...item });
          setTempRecipe(item.recipe || []);
      } else {
          setEditingItem({ 
              type: activeTab === 'services' ? 'service' : 'product',
              subtype: activeTab === 'retail' ? 'retail' : activeTab === 'consumables' ? 'consumable' : undefined,
              stockConfig: { isCustom: false, retailRatio: globalInventorySettings.defaultRetailRatio }
          });
          setTempRecipe([]);
      }
      setIsCatalogModalOpen(true);
  };

  const handleSaveCatalogItem = () => {
      if (editingItem && editingItem.title) {
          const safePrice = editingItem.price ?? 0;
          let finalCost = editingItem.cost ?? 0;
          if (editingItem.type === 'service') {
              finalCost = calculateServiceCost(tempRecipe, allProducts);
          }
          const finalItem = { 
              ...editingItem, 
              price: safePrice,
              cost: finalCost,
              recipe: tempRecipe
          };
          if (finalItem.id) {
              updateCatalogItem(finalItem.id, finalItem);
          } else {
              addCatalogItem(finalItem);
          }
          setIsCatalogModalOpen(false);
          setEditingItem(null);
      }
  };

  const isGridView = activeTab !== 'operations' && activeTab !== 'open_products';

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-background-dark p-6 sm:p-8">
        
        <CatalogHeader 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenNew={() => handleOpenCatalogModal()}
            onOpenMenuManager={() => setIsMenuModalOpen(true)} 
            onOpenProductMenuManager={() => setIsProductMenuModalOpen(true)} 
        />

        <CatalogTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            counts={{
                services: services.length,
                retail: retailProducts.length,
                consumables: consumableProducts.length,
                damaged: damagedExpiredProducts.length
            }}
        />

        <CatalogFilters 
            show={isGridView}
            activeTab={activeTab}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={availableCategories}
        />

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col min-h-0">
            
            {activeTab === 'open_products' && <OpenProductView />}

            {activeTab === 'operations' && (
                <OperationsView 
                    appointments={appointments} 
                    allProducts={allProducts} 
                    searchTerm={searchTerm} 
                />
            )}

            {isGridView && (
                <div className="flex flex-col h-full">
                    {/* Items Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {currentItems.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                                <span className="material-icons text-4xl mb-2 opacity-50">search_off</span>
                                <p>No se encontraron items en esta categoría.</p>
                                {activeTab === 'damaged' && (
                                    <p className="text-xs mt-1 text-green-500">¡Excelente! Tu inventario está saludable.</p>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-4 pb-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {activeTab === 'services' && paginatedItems.map((item: any) => 
                                    <ServiceCard 
                                        key={item.id} 
                                        item={item} 
                                        onView={handleOpenDetail} 
                                        onEdit={handleOpenCatalogModal} 
                                        onDelete={deleteCatalogItem} 
                                        calculateCost={(recipe) => calculateServiceCost(recipe, allProducts)} 
                                        checkAvailability={checkServiceAvailability}
                                    />
                                )}
                                {(activeTab === 'retail' || activeTab === 'consumables' || activeTab === 'damaged') && paginatedItems.map((item: any) => 
                                    <ProductCard 
                                        key={item.id} 
                                        item={item} 
                                        context={activeTab === 'retail' ? 'retail' : 'consumable'} 
                                        globalSettings={globalInventorySettings} 
                                        onView={handleOpenDetail} 
                                        onEdit={handleOpenCatalogModal} 
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <CatalogPagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                        paginate={paginate}
                        totalItems={currentItems.length}
                        indexOfFirstItem={indexOfFirstItem}
                        indexOfLastItem={indexOfLastItem}
                    />
                </div>
            )}
        </div>

        {/* --- MODALS --- */}
        <CatalogModal 
            isOpen={isCatalogModalOpen}
            onClose={() => setIsCatalogModalOpen(false)}
            editingItem={editingItem || {}}
            setEditingItem={setEditingItem}
            onSave={handleSaveCatalogItem}
            tempRecipe={tempRecipe}
            setTempRecipe={setTempRecipe}
            allProducts={allProducts}
            suppliers={suppliers}
            calculateServiceCost={(recipe) => calculateServiceCost(recipe, allProducts)}
            globalSettings={globalInventorySettings}
        />

        {/* Detail Modals Logic */}
        
        {/* 1. SERVICE */}
        {selectedDetailItem?.type === 'service' && (
            <ServiceDetailModal isOpen={true} onClose={handleCloseDetail} item={selectedDetailItem} onEdit={handleOpenCatalogModal} suppliers={suppliers} allProducts={allProducts} openStock={openStock} />
        )}
        
        {/* 2. PRODUCT - RETAIL (Active) */}
        {selectedDetailItem?.type === 'product' && selectedDetailItem.subtype === 'retail' && !selectedDetailItem.qualityStatus && (
            <RetailProductModal isOpen={true} onClose={handleCloseDetail} item={selectedDetailItem} onEdit={handleOpenCatalogModal} />
        )}
        
        {/* 3. PRODUCT - CONSUMABLE/ASSET (Active) */}
        {selectedDetailItem?.type === 'product' && (selectedDetailItem.subtype === 'consumable' || selectedDetailItem.subtype === 'asset') && !selectedDetailItem.qualityStatus && (
            <ConsumableProductModal isOpen={true} onClose={handleCloseDetail} item={selectedDetailItem} onEdit={handleOpenCatalogModal} suppliers={suppliers} />
        )}
        
        {/* 4. PRODUCT - MIXED (Active) */}
        {selectedDetailItem?.type === 'product' && selectedDetailItem.subtype === 'both' && !selectedDetailItem.qualityStatus && (
            <MixedProductModal isOpen={true} onClose={handleCloseDetail} item={selectedDetailItem} onEdit={handleOpenCatalogModal} />
        )}

        {/* 5. ARCHIVED / DAMAGED / FINISHED (New Modal) */}
        {selectedDetailItem?.type === 'product' && !!selectedDetailItem.qualityStatus && (
            <ArchivedProductModal isOpen={true} onClose={handleCloseDetail} item={selectedDetailItem} />
        )}

        <InventorySettingsModal 
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            settings={globalInventorySettings}
            onUpdate={updateGlobalInventorySettings}
        />

        <ServiceMenuManagerModal 
            isOpen={isMenuModalOpen}
            onClose={() => setIsMenuModalOpen(false)}
        />
        
        <ProductMenuManagerModal 
            isOpen={isProductMenuModalOpen}
            onClose={() => setIsProductMenuModalOpen(false)}
        />
    </div>
  );
};

export default Catalog;
