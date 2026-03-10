import { User } from '../../types';
import { supabase } from '../supabase';

const DB_NAME = 'Dermibelle_Users';
const DB_VERSION = 7; // Incremented for non-destructive seeding
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
    password: 'Comandoz1',
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
    initials: 'JL',
    password: 'Comandoz1'
  },
  {
    id: '3',
    name: 'Sofia Vergara',
    email: 'sofia.v@dermibelle.com',
    role: 'Recepcionista',
    status: 'Ausente',
    lastAccess: 'Ayer, 18:45 PM',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3uzUrmW0WBJPpGKXPIZB8lQpBCU-NR87amocmNg3XuclXUOEPXk1l5aO0zITr56r9SINtzQ4NWrmQF2yTrPvTFOBlEd-_VfXzwXYUeKdYLWMlr8i4Ar-aecTV26Do2zyUAaMm7QuQMwRjlRWI-1LRcSITPjcuQz47C5VuftInza7UIsrNpdwk1XIBKHfE7ev1gs9nP1si2Zl6o5R1DDbV9apEDsgU-p2GyT--4SrMpIzfZbbYXucJe4w4581J_IopL0JMSvhfQX6w',
    password: 'Comandoz1'
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
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async getAll(): Promise<User[]> {
    // 1. Try to get from Supabase first
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) {
        // Sync local cache
        const db = await this.open();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        data.forEach(u => store.put(u));
        return data as User[];
      }
    } catch (e) {
      console.warn("Could not sync with Supabase, using local data", e);
    }

    // 2. Fallback to local IndexedDB
    const db = await this.open();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const users = request.result;
        if (users.length === 0) {
          resolve(SEED_USERS);
        } else {
          resolve(users);
        }
      };
    });
  }

  async add(user: User): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(user);

    // Sync to Cloud
    supabase.from('users').insert(user).then(({ error }) => {
      if (error) console.error("Error adding user to Supabase:", error);
    });
  }

  async update(user: Partial<User> & { id: string }): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const getReq = store.get(user.id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (existing) {
        const updated = { ...existing, ...user };
        store.put(updated);

        // Sync to Cloud
        supabase.from('users').update(user).eq('id', user.id).then(({ error }) => {
          if (error) console.error("Error updating user in Supabase:", error);
        });
      }
    };
  }

  async delete(id: string): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);

    // Sync to Cloud
    supabase.from('users').delete().eq('id', id).then(({ error }) => {
      if (error) console.error("Error deleting user from Supabase:", error);
    });
  }
}

export const usersDB = new UsersDatabase();
