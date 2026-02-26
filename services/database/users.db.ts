
import { User } from '../../types';

const DB_NAME = 'Dermibelle_Users';
const DB_VERSION = 3;
const STORE_NAME = 'users';

const SEED_USERS: User[] = [
  {
    id: '1',
    name: 'Ray Q.',
    email: 'admin@dermibelle.com',
    role: 'Admin',
    status: 'Activo',
    lastAccess: 'Hace 5 minutos',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTmbtnThyRcY-UuQYkb8xakqYr1Qeq6qEHsmBipiX7Jfzu8bQi29NVIWIXKzAXC3nACR8G1hVZqov325385Vb1oKji3TCl-FamPm-bZ0hBv7-cOeeA5oaZM5QVV2b6tONpZA_Ekn9VBZqAQUOI2KtkHZeuRQXHJfXPqFPKwLnqZyYSrcZaG-XIZzTeM8Ea_hnYPpD_Xb5Lu8HMn_t2PkUs1PNDd-NetN1qm8Sou6FIkuEYL5syn9cWf0YHLVib0hErULA6SfeMQrz8',
    isAutoLoginEnabled: true
  },
  {
    id: '2',
    name: 'Jennifer Lopez',
    email: 'jen@dermibelle.com',
    role: 'Asistente',
    status: 'Activo',
    lastAccess: 'Hoy, 09:30 AM',
    avatar: null,
    initials: 'JL'
  },
  {
    id: '3',
    name: 'Sofia Vergara',
    email: 'sofia.v@dermibelle.com',
    role: 'Recepcionista',
    status: 'Ausente',
    lastAccess: 'Ayer, 18:45 PM',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3uzUrmW0WBJPpGKXPIZB8lQpBCU-NR87amocmNg3XuclXUOEPXk1l5aO0zITr56r9SINtzQ4NWrmQF2yTrPvTFOBlEd-_VfXzwXYUeKdYLWMlr8i4Ar-aecTV26Do2zyUAaMm7QuQMwRjlRWI-1LRcSITPjcuQz47C5VuftInza7UIsrNpdwk1XIBKHfE7ev1gs9nP1si2Zl6o5R1DDbV9apEDsgU-p2GyT--4SrMpIzfZbbYXucJe4w4581J_IopL0JMSvhfQX6w'
  },
  {
    id: '4',
    name: 'Marco Polo',
    email: 'marco@dermibelle.com',
    role: 'Asistente',
    status: 'Inactivo',
    lastAccess: '20 Feb, 2025',
    avatar: null,
    initials: 'MP'
  }
];

class UsersDatabase {
  private db: IDBDatabase | null = null;

  private async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        let store: IDBObjectStore;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        } else {
          store = (event.target as IDBOpenDBRequest).transaction!.objectStore(STORE_NAME);
          // Clear existing data to ensure seed data is fresh
          store.clear();
        }
        
        // Populate with seed data
        SEED_USERS.forEach(u => store.add(u));
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async getAll(): Promise<User[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(user: User): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(user);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async update(user: Partial<User> & { id: string }): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      // First get the existing user to merge
      const getReq = store.get(user.id);
      
      getReq.onsuccess = () => {
        const existingUser = getReq.result;
        if (existingUser) {
          const updatedUser = { ...existingUser, ...user };
          const putReq = store.put(updatedUser);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          reject(new Error(`User with id ${user.id} not found`));
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
}

export const usersDB = new UsersDatabase();
