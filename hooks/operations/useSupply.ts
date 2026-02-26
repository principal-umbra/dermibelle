
import { useMemo } from 'react';
import { useData } from '../../context/DataContext';

export const useSupply = () => {
  // Import updateCatalogItem to ensure UI updates immediately upon reception
  const { suppliers, orders, catalog, appointments, updateOrder, updateCatalogItem } = useData();

  // --- 1. CORE: CALCULATE CONSUMPTION & FORECAST ---
  const consumptionStats = useMemo(() => {
    const stats: Record<string, { used: number, velocity: number }> = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // Analyze Appointments to calculate consumption via Recipes (BOM)
    appointments.forEach(appt => {
        if (appt.status === 'Cancelled' || new Date(appt.date) < thirtyDaysAgo) return;
        
        appt.items.forEach(apptItem => {
            // Direct Product Sale
            if (apptItem.type === 'product') {
                const id = String(apptItem.id);
                if (!stats[id]) stats[id] = { used: 0, velocity: 0 };
                stats[id].used += (apptItem.quantity || 1);
            }
            // Service Ingredient Consumption (Recipe)
            else if (apptItem.type === 'service' && apptItem.recipe) {
                apptItem.recipe.forEach(ingredient => {
                    if (!stats[ingredient.id]) stats[ingredient.id] = { used: 0, velocity: 0 };
                    stats[ingredient.id].used += ingredient.qty;
                });
            }
        });
    });

    // Calculate Daily Velocity
    Object.keys(stats).forEach(key => {
        stats[key].velocity = stats[key].used / 30; // Avg daily usage
    });

    return stats;
  }, [appointments]);

  // --- 2. RISK RADAR & ALERTS ---
  const risks = useMemo(() => {
    return catalog
      .filter(item => item.type === 'product' && (item.subtype === 'consumable' || item.subtype === 'retail') && !item.isEProduct)
      .map(item => {
        const stock = item.stock || 0;
        const velocity = consumptionStats[String(item.id)]?.velocity || 0.1; // Default low velocity
        const daysRemaining = velocity > 0 ? stock / velocity : 999;
        const leadTime = 5; // Mock lead time (days)
        
        let status: 'critical' | 'warning' | 'healthy' = 'healthy';
        let message = 'Stock Saludable';

        if (stock === 0) {
            status = 'critical';
            message = 'Stock Agotado (0)';
        } else if (daysRemaining <= leadTime + 2) {
            status = 'critical';
            message = `Riesgo de Rotura (${Math.floor(daysRemaining)} días)`;
        } else if (daysRemaining <= leadTime * 2) {
            status = 'warning';
            message = 'Reordenar pronto';
        }

        return {
          id: item.id,
          name: item.title,
          sku: item.sku || 'N/A',
          stock,
          minStock: item.minStock || 10,
          velocity: velocity.toFixed(1),
          daysRemaining: Math.floor(daysRemaining),
          supplierId: item.supplierId,
          status,
          message
        };
      })
      .filter(r => r.status !== 'healthy') // Only show risks
      .sort((a, b) => a.daysRemaining - b.daysRemaining) // Most urgent first
      .slice(0, 5); // Top 5
  }, [catalog, consumptionStats]);

  // --- 3. SUPPLIER SCORECARD ---
  const formattedSuppliers = useMemo(() => {
    return suppliers.map(s => {
        const supplierOrders = orders.filter(o => o.supplierId === s.id || o.clientName === s.companyName);
        const completedOrders = supplierOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed');
        
        // Calculate Real Lead Time
        let calculatedLeadTime = s.leadTime || 5;
        if (completedOrders.length > 0) {
            const totalDays = completedOrders.reduce((acc, o) => {
                const start = new Date(o.date).getTime();
                // Find last reception date from lines
                const lastReception = o.lines?.reduce((max, l) => {
                    return l.receptionDate ? Math.max(max, new Date(l.receptionDate).getTime()) : max;
                }, start) || start;
                
                // If no reception date (legacy), assume 3 days or use eta
                const end = lastReception === start && o.eta ? new Date(o.eta).getTime() : lastReception;
                
                const days = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
                return acc + days;
            }, 0);
            calculatedLeadTime = Math.round(totalDays / completedOrders.length);
        }

        // Calculate Rating based on reliability
        let calculatedRating = 5.0;
        if (supplierOrders.length > 0) {
            const lateOrders = completedOrders.filter(o => {
                if (!o.eta) return false;
                const eta = new Date(o.eta).getTime();
                const actual = o.lines?.reduce((max, l) => l.receptionDate ? Math.max(max, new Date(l.receptionDate).getTime()) : max, 0) || 0;
                return actual > eta;
            }).length;
            
            const cancelledOrders = supplierOrders.filter(o => o.status === 'Cancelled').length;
            
            // Penalize
            calculatedRating -= (lateOrders / supplierOrders.length) * 2; // Up to 2 points lost for lateness
            calculatedRating -= (cancelledOrders / supplierOrders.length) * 3; // Up to 3 points for cancellations
        }

        return {
            ...s,
            rating: Math.max(1, Math.min(5, calculatedRating)).toFixed(1), 
            leadTime: calculatedLeadTime,
            priceIndex: '$$' // Placeholder
        };
    });
  }, [suppliers, orders]);

  // --- 4. PREDICTIVE FORECAST ---
  const forecastImpact = useMemo(() => {
      // Logic: Look at future appointments
      const futureAppts = appointments.filter(a => {
          const d = new Date(a.date);
          return d > new Date() && a.status !== 'Cancelled';
      });
      
      const categoryCounts: Record<string, number> = {};
      futureAppts.forEach(a => {
          a.items.forEach(i => {
              if (i.category) categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
          });
      });

      // Find top trend
      let topCat = '';
      let max = 0;
      Object.entries(categoryCounts).forEach(([cat, count]) => {
          if (count > max) { max = count; topCat = cat; }
      });

      return {
        riskLevel: 'medium',
        message: topCat 
            ? `Alta demanda prevista en servicios de "${topCat}" para los próximos 14 días.` 
            : 'Demanda estable proyectada para la semana.',
        trend: topCat
      };
  }, [appointments]);

  // --- 5. SMART REORDER ---
  const getSmartReorderSuggestion = (supplierId: string) => {
      const supplier = suppliers.find(s => s.id === supplierId);
      if (!supplier) return [];

      // Find items from this supplier that are below reorder point or in risk
      const itemsToOrder = catalog.filter(item => 
          item.type === 'product' && 
          (item.supplierId === supplierId || (supplier.tags && supplier.tags.some(t => item.category?.includes(t))))
      );

      return itemsToOrder
          .map(item => {
              const currentStock = item.stock || 0;
              const velocity = consumptionStats[String(item.id)]?.velocity || 0.2;
              const idealStock = velocity * 30; // Aim for 30 days stock
              const suggestedQty = Math.max(0, Math.ceil(idealStock - currentStock));
              
              if (suggestedQty === 0) return null;

              return {
                  id: item.id,
                  name: item.title,
                  current: currentStock,
                  qty: suggestedQty,
                  price: item.cost || (item.price * 0.5) // Estimate cost if not set
              };
          })
          .filter(Boolean) as {id: string|number, name: string, qty: number, price: number, current: number}[];
  };

  // --- 6. RECEPTION & KPIs (Points 6 & 10) ---
  
  // Logic to process reception of a specific line item in an Order
  const processReception = async (orderId: string, lineItemId: string | number, receivedQty: number) => {
      // 1. Find Order
      const order = orders.find(o => o.id === orderId);
      if (!order || !order.lines) return;

      // 2. Update Order Line Logic (Immutable style for React state)
      const catalogItem = catalog.find(i => i.id === lineItemId);
      const updatedLines = order.lines.map(line => {
          if (line.itemId === lineItemId) {
              let currentCost = catalogItem?.cost;
              // If order unit matches package unit (case insensitive), use package cost
              const orderUnit = line.unitAtOrder?.toLowerCase() || '';
              const packageUnit = catalogItem?.packageInfo?.purchaseUnit?.toLowerCase() || '';
              
              if (packageUnit && orderUnit === packageUnit) {
                  currentCost = catalogItem.packageCost || ((catalogItem.cost || 0) * (catalogItem.packageInfo.contentPerUnit || 1));
              }

              return { 
                  ...line, 
                  receivedQty: (line.receivedQty || 0) + receivedQty,
                  unitAtReception: catalogItem?.packageInfo?.purchaseUnit || line.unitAtOrder,
                  priceAtReception: currentCost || line.price,
                  unitAtOrder: line.unitAtOrder || line.unitAtOrder || 'unid', // Fallback
                  stockAtOrder: line.stockAtOrder ?? catalogItem?.stock,
                  receptionDate: new Date().toISOString()
              };
          }
          return line;
      });

      // 3. Update Inventory (Add Stock) - VIA CONTEXT FOR UI REACTIVITY
      if (catalogItem) {
          // Use Context Update to ensure Risk Radar updates immediately
          updateCatalogItem(catalogItem.id, {
              stock: (catalogItem.stock || 0) + receivedQty
          });
      }

      // 4. Update Order Status Logic
      const fullyReceived = updatedLines.every(l => (l.receivedQty || 0) >= l.qty);
      const partiallyReceived = updatedLines.some(l => (l.receivedQty || 0) > 0);
      const newStatus = fullyReceived ? 'Delivered' : (partiallyReceived ? 'Partially Received' : order.status);
      
      // 5. Persist Order Changes via Context
      updateOrder(orderId, {
          lines: updatedLines,
          status: newStatus
      });
      
      return newStatus;
  };

  const processReceptionBatch = async (orderId: string, items: { lineItemId: string | number, qty: number }[]) => {
      const order = orders.find(o => o.id === orderId);
      if (!order || !order.lines) return;

      // Update all lines at once
      const updatedLines = order.lines.map(line => {
          const update = items.find(i => i.lineItemId === line.itemId);
          if (update) {
              const catalogItem = catalog.find(i => i.id === line.itemId);
              let currentCost = catalogItem?.cost;
              // If order unit matches package unit (case insensitive), use package cost
              const orderUnit = line.unitAtOrder?.toLowerCase() || '';
              const packageUnit = catalogItem?.packageInfo?.purchaseUnit?.toLowerCase() || '';
              
              if (packageUnit && orderUnit === packageUnit) {
                  currentCost = catalogItem.packageCost || ((catalogItem.cost || 0) * (catalogItem.packageInfo.contentPerUnit || 1));
              }

              return { 
                  ...line, 
                  receivedQty: (line.receivedQty || 0) + update.qty,
                  unitAtReception: catalogItem?.packageInfo?.purchaseUnit || line.unitAtOrder,
                  priceAtReception: currentCost || line.price,
                  unitAtOrder: line.unitAtOrder || line.unitAtOrder || 'unid',
                  stockAtOrder: line.stockAtOrder ?? catalogItem?.stock,
                  receptionDate: new Date().toISOString()
              };
          }
          return line;
      });

      // Update inventory for all items
      items.forEach(item => {
          const catalogItem = catalog.find(i => i.id === item.lineItemId);
          if (catalogItem) {
              updateCatalogItem(catalogItem.id, {
                  stock: (catalogItem.stock || 0) + item.qty
              });
          }
      });

      const fullyReceived = updatedLines.every(l => (l.receivedQty || 0) >= l.qty);
      const partiallyReceived = updatedLines.some(l => (l.receivedQty || 0) > 0);
      const newStatus = fullyReceived ? 'Delivered' : (partiallyReceived ? 'Partially Received' : order.status);

      updateOrder(orderId, {
          lines: updatedLines,
          status: newStatus
      });

      return newStatus;
  };

  const kpis = useMemo(() => {
      // 1. Stockout Rate (Exclude E-Products)
      const physicalProducts = catalog.filter(i => i.type === 'product' && !i.isEProduct);
      const totalProducts = physicalProducts.length;
      const outOfStock = physicalProducts.filter(i => (i.stock || 0) <= 0).length;
      const stockoutRate = totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0;

      // 2. Inventory Value (Exclude E-Products as they don't hold physical value)
      const inventoryValue = catalog.reduce((acc, item) => {
          if (item.type === 'product' && !item.isEProduct) {
              return acc + ((item.cost || item.price * 0.5) * (item.stock || 0));
          }
          return acc;
      }, 0);

      // 3. Lead Time Average (Real)
      const avgLeadTime = formattedSuppliers.reduce((acc, s) => acc + (Number(s.leadTime) || 0), 0) / (formattedSuppliers.length || 1);

      // 4. Global Daily Consumption Value
      const dailyConsumptionValue = Object.entries(consumptionStats).reduce((acc, [id, stat]) => {
          const item = catalog.find(i => String(i.id) === id);
          if (item) {
              return acc + (stat.velocity * (item.cost || item.price * 0.5));
          }
          return acc;
      }, 0);

      // 5. Financial Health (Efficiency)
      // Calculate ratio of "Healthy Stock" (items with 7-60 days coverage) vs Total Stock Value
      // Exclude E-Products
      let healthyStockValue = 0;
      let totalStockValue = 0;

      catalog.forEach(item => {
          if (item.type === 'product' && !item.isEProduct) {
              const stock = item.stock || 0;
              const cost = item.cost || (item.price * 0.5);
              const value = stock * cost;
              totalStockValue += value;

              const velocity = consumptionStats[String(item.id)]?.velocity || 0.1;
              const days = velocity > 0 ? stock / velocity : 999;

              // Consider "Healthy" if we have between 7 days (safety) and 60 days (2 months) of stock
              // Over 60 days is overstock (inefficient cash use)
              // Under 7 days is risk (potential lost sales)
              if (days >= 7 && days <= 60) {
                  healthyStockValue += value;
              }
          }
      });

      const financialHealth = totalStockValue > 0 ? Math.round((healthyStockValue / totalStockValue) * 100) : 100;

      return {
          stockoutRate: stockoutRate.toFixed(1),
          inventoryValue: inventoryValue,
          avgLeadTime: avgLeadTime.toFixed(1),
          dailyConsumptionValue: dailyConsumptionValue || 1, // Avoid division by zero
          financialHealth: financialHealth
      };
  }, [catalog, formattedSuppliers, consumptionStats]);

  return {
    risks,
    suppliers: formattedSuppliers,
    orders,
    forecastImpact,
    getSmartReorderSuggestion,
    processReception,
    processReceptionBatch,
    kpis,
    consumptionStats
  };
};
