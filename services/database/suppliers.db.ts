
import { Supplier } from '../../types';

const DB_NAME = 'Dermibelle_Suppliers';
const DB_VERSION = 5; // Version bumped to force data update (Shipping Costs)
const STORE_NAME = 'suppliers';

const SEED_SUPPLIERS: Supplier[] = [
    { 
      id: 'sup-1', 
      companyName: 'Dermalux Professional Supplies', 
      contactPerson: 'Elena Nunez', 
      email: 'ventas@dermalux.com', 
      phone: '(555) 101-2020', 
      website: 'dermalux.pro',
      contacts: [
        { id: 'c1', name: 'Elena Nunez', role: 'Gerente de Cuenta', email: 'elena@dermalux.com', phone: '(555) 101-2020' }
      ],
      address: 'Parque Industrial Norte, Nave 4', 
      taxId: 'DX-889900', 
      paymentTerms: 'Net 30', 
      status: 'Active', 
      initials: 'DL', 
      leadTime: 3,
      rating: 4.8,
      nextDelivery: '15 Oct', 
      totalSpendYTD: '$12,450', 
      tags: ['Cosmética', 'Cabina', 'Facial'],
      shippingCosts: {
          standard: 15.00,
          express: 35.00,
          pickup: 0.00
      }
    },
    { 
      id: 'sup-2', 
      companyName: 'MedCare Clinic Solutions', 
      contactPerson: 'Dr. Marco Rivera', 
      email: 'pedidos@medcare.com', 
      phone: '(555) 303-4040', 
      website: 'medcare.solutions',
      // Added contacts
      contacts: [
        { id: 'c2', name: 'Dr. Marco Rivera', role: 'Director Comercial', email: 'marco@medcare.com', phone: '(555) 303-4040' },
        { id: 'c3', name: 'Ana Logística', role: 'Despachos', email: 'ana@medcare.com', phone: '(555) 303-4041' }
      ],
      address: 'Av. Salud 500, Edificio Médico', 
      taxId: 'MC-776655', 
      paymentTerms: 'Contado', 
      status: 'Active', 
      initials: 'MC', 
      leadTime: 1,
      rating: 4.9,
      nextDelivery: 'Mañana', 
      totalSpendYTD: '$8,200', 
      tags: ['Médico', 'Descartables', 'Insumos'],
      shippingCosts: {
          standard: 12.50,
          express: 25.00,
          pickup: 0.00
      }
    },
    { 
      id: 'sup-3', 
      companyName: 'AestheInject Pharma', 
      contactPerson: 'Sofia Valderrama', 
      email: 'sofia.v@aestheinject.com', 
      phone: '(555) 505-6060', 
      website: 'aestheinject.pharma',
      // Added contacts
      contacts: [
        { id: 'c4', name: 'Sofia Valderrama', role: 'Ventas Pharma', email: 'sofia@aestheinject.com', phone: '(555) 505-6060' }
      ],
      address: 'Centro Corporativo Pharma, Piso 8', 
      taxId: 'AI-112233', 
      paymentTerms: 'Net 15', 
      status: 'Active', 
      initials: 'AI', 
      leadTime: 5,
      rating: 5.0,
      nextDelivery: '-', 
      totalSpendYTD: '$45,000', 
      tags: ['Inyectables', 'Estética Avanzada', 'Toxinas'],
      shippingCosts: {
          standard: 20.00,
          express: 55.00,
          pickup: 0.00
      }
    },
    { 
      id: 'sup-4', 
      companyName: 'TechBeauty Devices', 
      contactPerson: 'Ing. Carlos Ruiz', 
      email: 'soporte@techbeauty.com', 
      phone: '(555) 707-8080', 
      website: 'techbeauty.dev',
      contacts: [
          { id: 'c5', name: 'Ing. Carlos Ruiz', role: 'Soporte Técnico', email: 'carlos@techbeauty.com', phone: '(555) 707-8080' }
      ],
      address: 'Zona Tecnológica, Lote 12', 
      taxId: 'TB-445566', 
      paymentTerms: 'Net 60', 
      status: 'Active', 
      initials: 'TB', 
      leadTime: 14,
      rating: 4.2,
      nextDelivery: '20 Nov', 
      totalSpendYTD: '$15,300', 
      tags: ['Equipos', 'Tecnología', 'Repuestos'],
      shippingCosts: {
          standard: 45.00,
          express: 120.00,
          pickup: 0.00
      }
    },
    { 
      id: 'sup-5', 
      companyName: 'Dermibelle Retail Lab', 
      contactPerson: 'Logística Interna', 
      email: 'stock@dermibelle.com', 
      phone: '(555) 000-1111',
      website: 'dermibelle.com/lab',
      contacts: [
          { id: 'c6', name: 'Almacén Central', role: 'Logística', email: 'stock@dermibelle.com', phone: '(555) 000-1111' }
      ],
      address: 'Almacén Central', 
      taxId: 'INT-0001', 
      paymentTerms: 'Contado', 
      status: 'Active', 
      initials: 'DR', 
      leadTime: 2,
      rating: 4.7,
      nextDelivery: 'Viernes', 
      totalSpendYTD: '$5,000', 
      tags: ['Retail', 'Venta Cliente', 'Marca Propia'],
      shippingCosts: {
          standard: 5.00,
          express: 15.00,
          pickup: 0.00
      }
    },
    { 
      id: 'sup-6', 
      companyName: 'BrandPack Solutions', 
      contactPerson: 'Ana Design', 
      email: 'ana@brandpack.com', 
      phone: '(555) 222-3333', 
      website: 'brandpack.com',
      contacts: [
          { id: 'c7', name: 'Ana Design', role: 'Diseñadora', email: 'ana@brandpack.com', phone: '(555) 222-3333' }
      ],
      address: 'Calle Gráfica 22', 
      taxId: 'BP-998877', 
      paymentTerms: 'Net 30', 
      status: 'Active', 
      initials: 'BP', 
      leadTime: 10,
      rating: 4.5,
      nextDelivery: '-', 
      totalSpendYTD: '$3,200', 
      tags: ['Packaging', 'Branding', 'Imprenta'],
      shippingCosts: {
          standard: 12.00,
          express: 28.00,
          pickup: 0.00
      }
    }
];

class SuppliersDatabase {
  private db: IDBDatabase | null = null;

  private async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Force re-seed on version upgrade
        if (event.oldVersion < DB_VERSION && db.objectStoreNames.contains(STORE_NAME)) {
             db.deleteObjectStore(STORE_NAME);
        }

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          SEED_SUPPLIERS.forEach(s => store.add(s));
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async getAll(): Promise<Supplier[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(supplier: Supplier): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(supplier);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const suppliersDB = new SuppliersDatabase();
