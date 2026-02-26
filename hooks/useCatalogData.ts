
import { useState, useEffect } from 'react';
import { AppointmentItem, Supplier, GlobalInventorySettings, OpenStockItem, StockLog } from '../types';
import { catalogDB } from '../services/database/catalog.db';
import { suppliersDB } from '../services/database/suppliers.db';
import { settingsDB } from '../services/database/settings.db';
import { openStockDB } from '../services/database/open_stock.db';
import { stockLogsDB } from '../services/database/stock_logs.db';
import { generateId } from '../utils/helpers';

export const useCatalogData = (addToast: (type: 'success'|'error'|'info', msg: string) => void) => {
  const [catalog, setCatalog] = useState<AppointmentItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [openStock, setOpenStock] = useState<OpenStockItem[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  
  const [globalInventorySettings, setGlobalInventorySettings] = useState<GlobalInventorySettings>({ 
    defaultRetailRatio: 0.5,
    defaultServiceMargin: 0.6,
    defaultFixedCost: 5.00,
    defaultHourlyRate: 50, // Default Target $/hr
    fixedCostAllocationPercent: 0.2, // Default 20%
    averageMonthlySessions: 208, // Default monthly sessions
    serviceGroups: [
        { id: 'g1', name: 'Grupo A', color: 'bg-blue-100 text-blue-800' },
        { id: 'g2', name: 'Grupo B', color: 'bg-purple-100 text-purple-800' },
        { id: 'g3', name: 'Grupo C', color: 'bg-orange-100 text-orange-800' }
    ]
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [dbCatalog, dbSuppliers, dbSettings, dbOpenStock, dbLogs] = await Promise.all([
          catalogDB.getAll(),
          suppliersDB.getAll(),
          settingsDB.getInventorySettings(),
          openStockDB.getAll(),
          stockLogsDB.getAll()
        ]);
        setCatalog(dbCatalog);
        setSuppliers(dbSuppliers);
        setOpenStock(dbOpenStock);
        setStockLogs(dbLogs.reverse()); // Newest first
        // Merge defaults in case dbSettings is partial
        setGlobalInventorySettings(prev => ({
             ...prev, 
             ...dbSettings,
             serviceGroups: dbSettings.serviceGroups || prev.serviceGroups 
        }));
      } catch (e) {
        console.error("Error loading catalog data", e);
      }
    };
    load();
  }, []);

  const addCatalogItem = (item: Partial<AppointmentItem>) => {
      const newItem = { ...item, id: generateId('ITM') } as AppointmentItem;
      catalogDB.add(newItem).then(() => {
          setCatalog(prev => [...prev, newItem]);
          addToast('success', 'Item añadido al catálogo');
      });
  };

  const updateCatalogItem = (id: string | number, item: Partial<AppointmentItem>) => {
      const fullItem = { ...catalog.find(i => i.id === id), ...item } as AppointmentItem;
      if (fullItem) {
          catalogDB.update(fullItem).then(() => {
              setCatalog(prev => prev.map(i => i.id === id ? fullItem : i));
          });
      }
  };

  const deleteCatalogItem = (id: string | number) => {
      catalogDB.delete(id).then(() => {
          setCatalog(prev => prev.filter(i => i.id !== id));
          addToast('info', 'Item eliminado');
      });
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
      const supplier = suppliers.find(s => s.id === id);
      if (supplier) {
          const updated = { ...supplier, ...data };
          suppliersDB.update(updated).then(() => {
              setSuppliers(prev => prev.map(s => s.id === id ? updated : s));
          });
      }
  };

  const updateGlobalInventorySettings = (settings: Partial<GlobalInventorySettings>) => {
      const newSettings = { ...globalInventorySettings, ...settings };
      settingsDB.saveInventorySettings(newSettings).then(() => {
          setGlobalInventorySettings(newSettings);
          addToast('success', 'Configuración de inventario actualizada.');
      });
  };

  // --- Open Stock Management ---
  
  const addOpenStockItem = (item: OpenStockItem) => {
      openStockDB.add(item).then(() => {
          setOpenStock(prev => [...prev, item]);
      });
  };

  const updateOpenStockItem = (id: string, data: Partial<OpenStockItem>) => {
      const item = openStock.find(i => i.id === id);
      if (item) {
          const updated = { ...item, ...data };
          openStockDB.update(updated).then(() => {
              setOpenStock(prev => prev.map(i => i.id === id ? updated : i));
          });
      }
  };

  const deleteOpenStockItem = (id: string) => {
      openStockDB.delete(id).then(() => {
          setOpenStock(prev => prev.filter(i => i.id !== id));
          addToast('info', 'Producto abierto eliminado / agotado.');
      });
  };

  // --- Stock Logging ---
  const addStockLog = (logData: Omit<StockLog, 'id'>) => {
      const newLog: StockLog = {
          ...logData,
          id: generateId('LOG-STK')
      };
      stockLogsDB.add(newLog).then(() => {
          setStockLogs(prev => [newLog, ...prev]);
          // No toast here usually to keep it background, but can add if needed
      });
  };

  return {
    catalog,
    setCatalog,
    suppliers,
    setSuppliers,
    openStock,
    setOpenStock,
    stockLogs,
    addStockLog,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    updateSupplier,
    addOpenStockItem,
    updateOpenStockItem,
    deleteOpenStockItem,
    globalInventorySettings,
    updateGlobalInventorySettings
  };
};
