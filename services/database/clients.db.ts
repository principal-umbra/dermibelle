
import { Client } from '../../types';

const DB_NAME = 'Dermibelle_Clients';
const DB_VERSION = 1;
const STORE_NAME = 'clients';

const SEED_CLIENTS: Client[] = [
  { id: 'C-001', name: 'Sarah Jenkins', email: 'sarah.j@example.com', phone: '(555) 123-4567', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTmbtnThyRcY-UuQYkb8xakqYr1Qeq6qEHsmBipiX7Jfzu8bQi29NVIWIXKzAXC3nACR8G1hVZqov325385Vb1oKji3TCl-FamPm-bZ0hBv7-cOeeA5oaZM5QVV2b6tONpZA_Ekn9VBZqAQUOI2KtkHZeuRQXHJfXPqFPKwLnqZyYSrcZaG-XIZzTeM8Ea_hnYPpD_Xb5Lu8HMn_t2PkUs1PNDd-NetN1qm8Sou6FIkuEYL5syn9cWf0YHLVib0hErULA6SfeMQrz8', initials: 'SJ', status: 'Recurring', lastVisit: '10 Feb, 2026', lastVisitTimeAgo: 'Hace 3 días', totalSpent: 1250, address: '123 Palm St, Port Charlotte', tags: ['VIP'], notes: 'Prefiere citas por la mañana.' },
  { id: 'C-002', name: 'Maria Rodriguez', email: 'maria.r@example.com', phone: '(555) 987-6543', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3uzUrmW0WBJPpGKXPIZB8lQpBCU-NR87amocmNg3XuclXUOEPXk1l5aO0zITr56r9SINtzQ4NWrmQF2yTrPvTFOBlEd-_VfXzwXYUeKdYLWMlr8i4Ar-aecTV26Do2zyUAaMm7QuQMwRjlRWI-1LRcSITPjcuQz47C5VuftInza7UIsrNpdwk1XIBKHfE7ev1gs9nP1si2Zl6o5R1DDbV9apEDsgU-p2GyT--4SrMpIzfZbbYXucJe4w4581J_IopL0JMSvhfQX6w', initials: 'MR', status: 'New', lastVisit: '-', lastVisitTimeAgo: 'Nuevo', totalSpent: 0, address: '456 Oak Ave, Port Charlotte' },
];

class ClientsDatabase {
  private db: IDBDatabase | null = null;

  private async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          SEED_CLIENTS.forEach(client => store.add(client));
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async getAll(): Promise<Client[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(client: Client): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(client);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async update(client: Client): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(client); // Put updates if key exists
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const clientsDB = new ClientsDatabase();
