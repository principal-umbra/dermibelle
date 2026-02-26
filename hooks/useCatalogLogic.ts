
import { useState, useMemo, useEffect } from 'react';
import { AppointmentItem } from '../types';

export const useCatalogLogic = (catalog: AppointmentItem[]) => {
  // Tabs State
  const [activeTab, setActiveTab] = useState<'services' | 'retail' | 'consumables' | 'open_products' | 'operations' | 'damaged'>('services');
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'price' | 'stock'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // --- HELPER LOGIC ---
  const isItemProblematic = (item: AppointmentItem) => {
      const today = new Date();
      if (item.packageInfo?.expiryDate) {
          const expDate = new Date(item.packageInfo.expiryDate);
          if (expDate < today) return true;
      }
      // Added 'finished' to the problematic list so they appear in the archive tab
      if (item.qualityStatus === 'damaged' || item.qualityStatus === 'expired' || item.qualityStatus === 'finished') return true;
      return false;
  };

  // Derived Data (Moved up for availability check)
  const allProducts = useMemo(() => catalog.filter(i => i.type === 'product'), [catalog]);

  const checkServiceAvailability = (service: AppointmentItem) => {
      if (!service.recipe || service.recipe.length === 0) return true;
      // Check if ANY ingredient has 0 stock
      const hasMissingIngredient = service.recipe.some(ingredient => {
          const product = allProducts.find(p => p.id === ingredient.id);
          // If product exists and stock is <= 0, service is unavailable
          return product ? (product.stock || 0) <= 0 : false; 
      });
      return !hasMissingIngredient;
  };

  const calculateServiceCost = (recipe: any[], allProducts: AppointmentItem[]) => {
      if (!recipe || recipe.length === 0) return 0;
      return recipe.reduce((total, ingredient) => {
          const product = allProducts.find(p => p.id === ingredient.id);
          if (!product) return total;
          
          const purchaseCost = product.cost || 0;
          const pkg = product.packageInfo || { unitsPerPackage: 1, contentPerUnit: 1, usageType: 'whole' };
          const mode = ingredient.consumptionMode || 'unit';
          
          let ingredientCost = 0;
          if (pkg.usageType === 'whole') {
               ingredientCost = purchaseCost * ingredient.qty;
          } else {
              const totalContent = (pkg.unitsPerPackage || 1) * (pkg.contentPerUnit || 1);
              const costPerMeasure = totalContent > 0 ? purchaseCost / totalContent : 0;
              let consumedAmount = ingredient.qty;
              if (mode === 'unit') consumedAmount = ingredient.qty * (pkg.contentPerUnit || 1);
              else if (mode === 'percentage') consumedAmount = totalContent * (ingredient.qty / 100);
              else if (mode === 'yield') consumedAmount = ingredient.qty > 0 ? totalContent / ingredient.qty : 0;
              
              ingredientCost = costPerMeasure * consumedAmount;
          }
          return total + ingredientCost;
      }, 0);
  };

  // --- DATA DERIVATION ---
  const services = useMemo(() => catalog.filter(i => i.type === 'service'), [catalog]);
  
  const retailProducts = useMemo(() => 
      catalog.filter(i => 
          i.type === 'product' && 
          (i.subtype === 'retail' || i.subtype === 'both') &&
          !isItemProblematic(i)
      ), 
  [catalog]);
  
  const consumableProducts = useMemo(() => 
      catalog.filter(i => 
          i.type === 'product' && 
          (i.subtype === 'consumable' || i.subtype === 'asset' || i.subtype === 'both') &&
          !isItemProblematic(i)
      ), 
  [catalog]);

  // (allProducts already defined above)
  const damagedExpiredProducts = useMemo(() => catalog.filter(i => i.type === 'product' && isItemProblematic(i)), [catalog]);

  // --- FILTERING & SORTING ---
  
  // 1. Get Base Items for current tab
  const baseItems = useMemo(() => {
      switch(activeTab) {
          case 'services': return services;
          case 'retail': return retailProducts;
          case 'consumables': return consumableProducts;
          case 'damaged': return damagedExpiredProducts;
          default: return []; 
      }
  }, [activeTab, services, retailProducts, consumableProducts, damagedExpiredProducts]);

  // 2. Extract Categories
  const availableCategories = useMemo(() => {
      const cats = new Set(baseItems.map(i => i.category || 'General'));
      return ['all', ...Array.from(cats)].sort();
  }, [baseItems]);

  // 3. Apply Filters & Sorting
  const currentItems = useMemo(() => {
      let data = [...baseItems];

      // Search
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          data = data.filter(item => 
              item.title.toLowerCase().includes(lower) || 
              (item.sku && item.sku.toLowerCase().includes(lower)) ||
              (item.category && item.category.toLowerCase().includes(lower))
          );
      }

      // Category Filter
      if (selectedCategory !== 'all') {
          data = data.filter(item => (item.category || 'General') === selectedCategory);
      }

      // Sorting
      data.sort((a, b) => {
          // PRIORITY RULE: Items with issues come first (Stock 0 for products, Missing ingredients for services)
          
          const isOutA = a.type === 'product' ? (a.stock || 0) <= 0 : !checkServiceAvailability(a);
          const isOutB = b.type === 'product' ? (b.stock || 0) <= 0 : !checkServiceAvailability(b);

          // If A is out/unavailable but B is available, A comes first (-1)
          if (isOutA && !isOutB) return -1;
          // If B is out/unavailable but A is available, B comes first (1)
          if (!isOutA && isOutB) return 1;

          // Standard Sort (User Selected)
          let valA: any = a[sortBy as keyof AppointmentItem] || 0;
          let valB: any = b[sortBy as keyof AppointmentItem] || 0;

          if (sortBy === 'title') {
              valA = a.title.toLowerCase();
              valB = b.title.toLowerCase();
              return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }

          // Numeric Sort (Price/Stock)
          return sortOrder === 'asc' ? valA - valB : valB - valA;
      });

      return data;
  }, [baseItems, searchTerm, selectedCategory, sortBy, sortOrder, allProducts]);

  // --- PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedItems = currentItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
          setCurrentPage(pageNumber);
      }
  };

  // Reset pagination when tab/filter changes
  useEffect(() => {
    setCurrentPage(1);
    if (activeTab !== 'services' && activeTab !== 'retail' && activeTab !== 'consumables' && activeTab !== 'damaged') {
        // Reset specific tab states if needed
    } else {
        // When switching between grid tabs, reset category
        setSelectedCategory('all');
        setSortBy('title');
    }
  }, [activeTab]);

  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, selectedCategory, itemsPerPage]);

  return {
    // State
    activeTab, setActiveTab,
    searchTerm, setSearchTerm,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    selectedCategory, setSelectedCategory,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,

    // Derived Data
    services,
    retailProducts,
    consumableProducts,
    allProducts,
    damagedExpiredProducts,
    availableCategories,
    currentItems, // Full filtered list
    paginatedItems, // Sliced list for view
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,

    // Methods
    paginate,
    calculateServiceCost,
    checkServiceAvailability
  };
};
