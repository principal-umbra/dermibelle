
import { WikiArticle } from '../../types';

const DB_NAME = 'Dermibelle_Wiki';
const DB_VERSION = 1;
const STORE_NAME = 'articles';

const SEED_ARTICLES: WikiArticle[] = [
    { id: 1, title: 'Protocolo: Brazilian Knot', category: 'Servicio', type: 'protocol', views: 45, lastUpdate: 'Hace 2 días', content: 'Pasos detallados para la instalación...' },
    { id: 2, title: 'Ingredientes Prohibidos', category: 'Producto', type: 'list', views: 120, lastUpdate: 'Hace 1 mes', content: 'Lista negra de sulfatos y parabenos...' },
    { id: 3, title: 'Script: Bienvenida Telefónica', category: 'Procesos', type: 'script', views: 80, lastUpdate: 'Hace 1 semana', content: '"Hola, gracias por llamar a Dermibelle..."' },
    { id: 4, title: 'Nuestra Historia', category: 'ADN Marca', type: 'story', views: 12, lastUpdate: 'Ayer', content: 'Fundada con la visión de...' },
];

class WikiDatabase {
  private db: IDBDatabase | null = null;

  private async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          SEED_ARTICLES.forEach(a => store.add(a));
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async getAll(): Promise<WikiArticle[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const wikiDB = new WikiDatabase();
