
import { AppointmentItem, Client, Appointment, Invoice, Supplier, Order, SupplierInvoice } from '../types';

// Database Constants
const DB_NAME = 'DermibelleDB';
const DB_VERSION = 3; // Incremented for stock_logs

// Initial Seed Data (Moved from Context)
const SEED_CATALOG: AppointmentItem[] = [
  { id: 'srv-1', title: 'Sugaring Brazilian', price: 65, type: 'service', category: 'Depilación', tags: ['Popular'] },
  { id: 'srv-2', title: 'Brazilian Knots (Instalación)', price: 450, type: 'service', category: 'Cabello', tags: ['Extensiones'] },
  { id: 'srv-3', title: 'Facial Anti-Aging', price: 120, type: 'service', category: 'Facial', tags: ['Skincare'] },
  { id: 'prod-1', title: 'Serum Vitamina C', price: 45, type: 'product', category: 'Producto', tags: ['Skincare'], sku: 'SKU-001', stock: 15 },
  { id: 'prod-2', title: 'E-book: Cuidados Post-Sugaring', price: 15, type: 'product', category: 'Digital', tags: ['E-book', 'Digital'], sku: 'DIG-002', stock: 999 },
  { id: 'skin-1', title: 'Vajacial', price: 60, type: 'service', category: 'Piel y Belleza', tags: ['Íntimo'] },
  { id: 'skin-2', title: 'Eyelashes & Eyebrow Treatment', price: 70, type: 'service', category: 'Piel y Belleza', description: 'Tratamiento de pestañas y cejas' },
  { id: 'mk-1', title: 'Mary Kay® Supreme Hydrating Lipstick', price: 20, type: 'product', category: 'Maquillaje', sku: 'MK-LIP-01', stock: 20 },
];

const SEED_CLIENTS: Client[] = [
  { id: 'C-001', name: 'Sarah Jenkins', email: 'sarah.j@example.com', phone: '(555) 123-4567', avatar: null, initials: 'SJ', status: 'Recurring', lastVisit: '10 Feb, 2026', totalSpent: 1250 },
  { id: 'C-002', name: 'Maria Rodriguez', email: 'maria.r@example.com', phone: '(555) 987-6543', avatar: null, initials: 'MR', status: 'New', lastVisit: '-', totalSpent: 0 },
];

class DatabaseService {
  private db: IDBDatabase | null = null;

  constructor() {
    this.init();
  }

  // Initialize DB and Seed Data if empty
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database error:', request.error);
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create Object Stores
        if (!db.objectStoreNames.contains('catalog')) {
          db.createObjectStore('catalog', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('appointments')) {
          const store = db.createObjectStore('appointments', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('invoices')) {
          db.createObjectStore('invoices', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('suppliers')) {
          db.createObjectStore('suppliers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('supplier_invoices')) {
          const store = db.createObjectStore('supplier_invoices', { keyPath: 'id' });
          store.createIndex('supplierId', 'supplierId', { unique: false });
        }
        // New Store for Stock Logs
        if (!db.objectStoreNames.contains('stock_logs')) {
          const store = db.createObjectStore('stock_logs', { keyPath: 'id' });
          store.createIndex('itemId', 'itemId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        await this.checkAndSeedData();
        resolve();
      };
    });
  }

  private async checkAndSeedData() {
    const catalog = await this.getAll('catalog');
    if (catalog.length === 0) {
      const tx = this.db!.transaction(['catalog', 'clients'], 'readwrite');
      SEED_CATALOG.forEach(item => tx.objectStore('catalog').add(item));
      SEED_CLIENTS.forEach(client => tx.objectStore('clients').add(client));
    }
  }

  // Generic Helpers
  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly') {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.transaction(storeName, mode).objectStore(storeName);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add<T>(storeName: string, item: T): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName, 'readwrite').add(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async update<T>(storeName: string, item: T): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName, 'readwrite').put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string | number): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName, 'readwrite').delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- SPECIALIZED BUSINESS LOGIC ---

  // Transaction: Process Stock Movement
  async processStockMovement(items: AppointmentItem[], mode: 'decrease' | 'increase'): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['catalog'], 'readwrite');
      const store = tx.objectStore('catalog');

      items.forEach(item => {
        if (item.type === 'product') {
          const req = store.get(item.id);
          req.onsuccess = () => {
            const dbItem = req.result as AppointmentItem;
            if (dbItem) {
              const qty = item.quantity || 1;
              const currentStock = dbItem.stock || 0;
              dbItem.stock = mode === 'decrease' 
                ? Math.max(0, currentStock - qty) 
                : currentStock + qty;
              store.put(dbItem);
            }
          };
        }
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Transaction: Create Appointment AND Deduct Stock
  async createAppointmentWithStock(appointment: Appointment): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['appointments', 'catalog'], 'readwrite');
      
      // 1. Add Appointment
      tx.objectStore('appointments').add(appointment);

      // 2. Deduct Stock for products
      const catalogStore = tx.objectStore('catalog');
      appointment.items.forEach(item => {
        if (item.type === 'product') {
          const req = catalogStore.get(item.id);
          req.onsuccess = () => {
            const dbItem = req.result as AppointmentItem;
            if (dbItem) {
              const qty = item.quantity || 1;
              dbItem.stock = Math.max(0, (dbItem.stock || 0) - qty);
              catalogStore.put(dbItem);
            }
          };
        }
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Transaction: Cancel Appointment AND Restore Stock
  async cancelAppointmentWithRestock(appointmentId: string, items: AppointmentItem[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['appointments', 'catalog', 'invoices'], 'readwrite');
      
      // 1. Update Appointment Status
      const apptStore = tx.objectStore('appointments');
      const apptReq = apptStore.get(appointmentId);
      
      apptReq.onsuccess = () => {
        const appt = apptReq.result as Appointment;
        if (appt) {
          appt.status = 'Cancelled';
          apptStore.put(appt);
        }
      };

      // 2. Restore Stock
      const catalogStore = tx.objectStore('catalog');
      items.forEach(item => {
        if (item.type === 'product') {
          const req = catalogStore.get(item.id);
          req.onsuccess = () => {
            const dbItem = req.result as AppointmentItem;
            if (dbItem) {
              dbItem.stock = (dbItem.stock || 0) + (item.quantity || 1);
              catalogStore.put(dbItem);
            }
          };
        }
      });

      // 3. Void Linked Invoices (Optional but good practice)
      // Logic handled in UI, but could be here.

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const db = new DatabaseService();
