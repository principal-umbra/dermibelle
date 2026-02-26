import { GlobalInventorySettings } from '../../types';

const DB_NAME = 'Dermibelle_Settings';
const DB_VERSION = 1;
const STORE_NAME = 'global_settings';
const SETTINGS_KEY = 'inventory_config';

const DEFAULT_SETTINGS: GlobalInventorySettings = {
    defaultRetailRatio: 0.5,
    defaultServiceMargin: 0.6, // 60% Target Margin by default
    defaultFixedCost: 5.00, // Default $5 overhead per service
    defaultHourlyRate: 50, // Default Target $/hr
    fixedCostAllocationPercent: 0.2, // Default 20%
    averageMonthlySessions: 208, // Default monthly sessions
    serviceGroups: [
        { id: 'g1', name: 'Grupo A', color: 'bg-blue-100 text-blue-800' },
        { id: 'g2', name: 'Grupo B', color: 'bg-purple-100 text-purple-800' },
        { id: 'g3', name: 'Grupo C', color: 'bg-orange-100 text-orange-800' }
    ]
};

class SettingsDatabase {
  private db: IDBDatabase | null = null;

  private async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async getInventorySettings(): Promise<GlobalInventorySettings> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(SETTINGS_KEY);
      request.onsuccess = () => {
          // Merge with defaults to ensure new keys exist
          resolve({ ...DEFAULT_SETTINGS, ...request.result });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveInventorySettings(settings: GlobalInventorySettings): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(settings, SETTINGS_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const settingsDB = new SettingsDatabase();