
import { OrderTemplate } from '../../types';

const DB_NAME = 'Dermibelle_OrderTemplates';
const DB_VERSION = 1;
const STORE_NAME = 'order_templates';

const SEED_ORDER_TEMPLATES: OrderTemplate[] = [
    { 
        id: 't1', 
        name: 'Reposición Mensual Skincare', 
        supplierId: 'sup-1',
        items: [
            { itemId: 'prod-d-1', quantity: 5 },
            { itemId: 'prod-d-2', quantity: 3 },
            { itemId: 'prod-d-3', quantity: 2 }
        ] 
    },
    { 
        id: 't2', 
        name: 'Kit Básico Cabina', 
        supplierId: 'sup-2',
        items: [
            { itemId: 'prod-m-1', quantity: 1 },
            { itemId: 'prod-m-5', quantity: 2 },
            { itemId: 'prod-d-6', quantity: 5 }
        ] 
    },
];

class OrderTemplatesDatabase {
  private db: IDBDatabase | null = null;

  private async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          SEED_ORDER_TEMPLATES.forEach(t => store.add(t));
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async getAll(): Promise<OrderTemplate[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(template: OrderTemplate): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(template);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const orderTemplatesDB = new OrderTemplatesDatabase();
