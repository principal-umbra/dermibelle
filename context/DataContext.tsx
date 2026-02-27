
import React, { createContext, useContext, useEffect, ReactNode, useMemo, useState } from 'react';
import {
    Invoice, Appointment, AppointmentItem, Client, Supplier, Order, User, WikiArticle,
    SupplierContact, SupplierInvoice, Notification, ClientLog, Toast, InvoiceHistoryEvent, OrderTemplate, GlobalInventorySettings, FixedExpense, OpenStockItem, StockLog, PublicServiceSection, PublicProductSection
} from '../types';
import { invoicesDB } from '../services/database/invoices.db';
import { catalogDB } from '../services/database/catalog.db';
import { orderTemplatesDB } from '../services/database/order_templates.db';

// Level 1: Domain Hooks
import { useSystemUI } from '../hooks/useSystemUI';
import { useCatalogData } from '../hooks/useCatalogData';
import { useCRM } from '../hooks/useCRM';
import { useOperations } from '../hooks/useOperations';
import { useFinance } from '../hooks/useFinance';

// Level 2: Business Logic Managers
import { useAppointmentManager } from '../hooks/logic/useAppointmentManager';
import { useFinanceManager } from '../hooks/logic/useFinanceManager';
import { generateId } from '../utils/helpers';

// Re-export types
export type { AppointmentItem, Client, Appointment, Invoice, Supplier, Order, User, WikiArticle, SupplierContact, SupplierInvoice, Notification, ClientLog, Toast, InvoiceHistoryEvent, OrderTemplate, GlobalInventorySettings, FixedExpense, OpenStockItem, StockLog, PublicServiceSection, PublicProductSection };

// INITIAL SEED FOR SERVICE MENU
const INITIAL_SECTIONS: PublicServiceSection[] = [
    {
        id: 'sec-skincare',
        title: 'Radiant, Healthy Skin',
        description: 'Our facial treatments combine the potency of clinical-grade ingredients with the gentleness of organic botanicals. Each session begins with a detailed skin analysis to ensure the perfect customized regimen.',
        layoutType: 'list',
        showPrices: true,
        heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBR3X9uHVowwfSTLphQ2DL-1Ar0rOrmjVY-YbwwiIdJQWKFzSn-AaP7W-dCtb42YIgGg3N5xJdRzWk1Oe7o4SXUManeuAGGPWyPcM35PlxhLVLlUH6x_PrzmbnIAJk4beCarUgr9t0QOc12XAO9n3-I3YY4oVglDq_IzENBn84MnO-ba33F11UQxprL4qF4IDsD7PkEEILMa-Y29cZx19xGDPH0IA3JlXyFGhdEn779iTWgH4I9zL9ELvC7em8HZp4cTTxccn1u4WiS',
        serviceIds: ['skin-sig', 'skin-anti', 'skin-acne', 'skin-derma'],
        variant: 'clean',
        imagePosition: 'left',
        promoBanner: 'Oferta de Verano - 20% OFF',
        protocol: ['Análisis de Piel Digital', 'Limpieza Profunda & Exfoliación', 'Tratamiento Personalizado', 'Hidratación & Protección'],
        isActive: true
    },
    {
        id: 'sec-removal',
        title: 'Organic Sugaring',
        description: 'An ancient, all-natural method of hair removal using only sugar, lemon, and water.',
        layoutType: 'grid_2',
        showPrices: true,
        heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvCB9EtqSiYmrMnb4gpcrhJM0LKnPmSTAPnbFp7TsV_7DF1zvBfX6VenGodYn9iuqCEcjoV2DEfKmQm1WXfKFu1EGIvitjBZkyAfMpPu-tjk5z-BS8JILuWGq7IQONn7PPvBRKEdUzyfrup2NsijnBBwT5mgDo0v3539HU_RfHYG_5s0jVNVAjwNQSjQeXIUTxXN0LU6z4cyVC4-7M07S9cR9QoKI9MCjwdOIlrDdv-Eglz7Lq_tBbyBJkLL5cqOhsgU9OQmb9yU6m',
        serviceIds: ['rem-braz', 'rem-bikini', 'rem-under', 'rem-legs', 'rem-face', 'rem-brow'],
        variant: 'warm_gold',
        imagePosition: 'right',
        protocol: ['Limpieza del área', 'Aplicación de talco', 'Técnica de pasta de azúcar', 'Gel calmante post-depil'],
        isActive: true
    },
    {
        id: 'sec-extensions',
        title: 'Seamless Volume & Length',
        description: 'Specializing in the Brazilian Knot technique—a healthy, long-lasting extension method.',
        layoutType: 'list',
        showPrices: true,
        heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3kh8KRbFtviSrY-t6Al8_8snHJu5qiOnVSkjJj0zL8T7gyScw1vFYnsV0VGX-YPQZd1D-F5ncFNAWs4jXoGng5p_mVWXJDMp1UVRGRwEb1UZwRKBxEYl1HSv4CFXgDtBesSWBtgJGapIM8R73avRy9IkarskgSSIhMkqFgEaYugv3gRUxKr3b9rTB2wx3RBw0g_3UeXkbEeOMOOab9034QGQDE2hVogmNFO2JnqB4ScWstRsnan3PhdazrzTI38kAWyoBDFDbgeZ6',
        serviceIds: ['ext-consult', 'ext-install', 'ext-maint'],
        features: [
            { icon: 'check_circle', title: 'No Damage', description: 'No glue, heat, or chemicals used.' },
            { icon: 'check_circle', title: 'Versatile', description: 'Easy to wash, style, and maintain.' },
            { icon: 'check_circle', title: 'Long Lasting', description: 'Typically lasts 3-4 months.' },
        ],
        variant: 'clean',
        imagePosition: 'left',
        isActive: true
    }
];

// INITIAL SEED FOR PRODUCT/SHOP MENU
const INITIAL_PRODUCT_SECTIONS: PublicProductSection[] = [
    {
        id: 'sec-skincare-retail',
        title: 'Skincare Essentials',
        description: 'Mantén tu piel radiante en casa con nuestra selección de productos orgánicos de grado clínico.',
        layoutType: 'grid_4',
        showPrices: true,
        heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfdQgDzjI5LPFN3DLuPRo4wPT4GPy1b7iTNtmNM63s61QNueakLxzHjIEnAMTIYZOzSdLgAwNPLJvLs-5Lnh8EacR1DBv8m6Vou8dip0-mjYtCptBc0yjzOx3kxRkQpS5iI3TkRzGT-KpmtfNZ1-OADBZad07iBLaX3ieHSgc-KHusLHrJFgwNVzJQBdg_bWFLU3dYRmf-PktcBVKuzrtqB2wRjPZp9LeSI1Qcbbg6OOoC-knx5f4-xl36kuKrE0jm6Dacx2un1HR7',
        productIds: ['prod-1', 'prod-face-2', 'prod-face-3', 'prod-face-4'],
        variant: 'soft_green',
        imagePosition: 'top',
        promoBanner: 'Envío Gratis en compras mayores a $100',
        features: [
            { icon: 'water_drop', title: 'Hidratación', description: 'Fórmulas ligeras.' },
            { icon: 'eco', title: 'Orgánico', description: 'Ingredientes 100% naturales.' }
        ],
        isActive: true
    },
    {
        id: 'sec-body-retail',
        title: 'Cuidado Corporal',
        description: 'Exfoliantes y aceites nutritivos para una piel suave y saludable en todo el cuerpo.',
        layoutType: 'showcase',
        showPrices: true,
        heroImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80',
        productIds: ['prod-body-1', 'prod-body-2'],
        variant: 'warm_gold',
        imagePosition: 'right',
        features: [
            { icon: 'spa', title: 'Spa en Casa', description: 'Relajación total.' }
        ],
        isActive: true
    },
    {
        id: 'sec-tools-retail',
        title: 'Lifestyle & Complementos',
        description: 'Herramientas de bienestar, maquillaje orgánico y guías exclusivas para potenciar tu belleza.',
        layoutType: 'grid_4',
        showPrices: true,
        heroImage: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1000&q=80',
        productIds: ['prod-tool-1', 'prod-tool-2', 'mk-1', 'prod-2'],
        variant: 'clean',
        imagePosition: 'hidden',
        isActive: true
    }
];


// Define Context Interface (Aggregated)
interface DataContextType {
    // CRM
    clients: Client[];
    addClient: (client: Omit<Client, 'id'>) => string;
    updateClient: (id: string, data: Partial<Client>) => void;
    users: User[];
    addUser: (user: User) => void;
    updateUser: (id: string, data: Partial<User>) => void;
    deleteUser: (id: string) => void;
    wikiArticles: WikiArticle[];
    clientLogs: ClientLog[];
    addClientLog: (log: Omit<ClientLog, 'id' | 'timestamp'>) => void;
    currentUser: User | null;
    authLoading: boolean;
    login: (user: User) => void;
    logout: () => void;



    // Catalog
    catalog: AppointmentItem[];
    addCatalogItem: (item: Partial<AppointmentItem>) => void;
    updateCatalogItem: (id: string | number, item: Partial<AppointmentItem>) => void;
    deleteCatalogItem: (id: string | number) => void;
    suppliers: Supplier[];
    updateSupplier: (id: string, data: Partial<Supplier>) => void;

    // Service Menu (Web CMS)
    serviceSections: PublicServiceSection[];
    setServiceSections: (sections: PublicServiceSection[]) => void;

    // Product Menu (Web CMS - Shop)
    productSections: PublicProductSection[];
    setProductSections: (sections: PublicProductSection[]) => void;

    // Open Stock (NUEVO)
    openStock: OpenStockItem[];
    updateOpenStockItem: (id: string, data: Partial<OpenStockItem>) => void;
    deleteOpenStockItem: (id: string) => void;

    // Stock Logs (PREDICTIVO)
    stockLogs: StockLog[];
    addStockLog: (log: Omit<StockLog, 'id'>) => void;

    // Settings
    globalInventorySettings: GlobalInventorySettings;
    updateGlobalInventorySettings: (settings: Partial<GlobalInventorySettings>) => void;
    fixedExpenses: FixedExpense[];
    addFixedExpense: (expense: Omit<FixedExpense, 'id'>) => void;
    removeFixedExpense: (id: number) => void;

    // Operations
    appointments: Appointment[];
    addAppointment: (appt: Omit<Appointment, 'id' | 'createdAt' | 'isArchived'>) => string;
    updateAppointment: (id: string, data: Partial<Appointment>) => void;
    updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
    archiveFinishedAppointments: () => void;
    reactivateArchivedAppointment: (id: string, reason: string, newDate?: string, newTime?: string) => void;

    // Templates (New)
    orderTemplates: OrderTemplate[];
    addOrderTemplate: (template: Omit<OrderTemplate, 'id'>) => void;

    // Finance
    invoices: Invoice[];
    supplierInvoices: SupplierInvoice[];
    addSupplierInvoice: (invoice: SupplierInvoice) => void;
    updateSupplierInvoice: (id: string, data: Partial<SupplierInvoice>) => void;
    createManualInvoice: (data: any, options?: { silent?: boolean }) => void;
    getInvoiceByAppointmentId: (apptId: string) => Invoice | undefined;
    payInvoice: (id: string, scope: 'services' | 'products' | 'total', method: string, txId?: string, options?: { silent?: boolean }) => void;
    confirmInTransitInvoice: (id: string, finalReference: string) => void;
    rejectInTransitInvoice: (id: string) => void;
    checkReferenceExists: (ref: string, method?: string) => boolean;
    linkInvoiceToAppointment: (invoiceId: string, appointmentId: string) => void;
    unlinkAndVoidInvoice: (invoiceId: string) => void;
    updateInvoice: (id: string, data: Partial<Invoice>) => void;
    orders: Order[];
    addOrder: (order: Order) => void;
    updateOrder: (id: string, data: Partial<Order>) => void;
    archiveFinishedOrders: () => void;
    reactivateArchivedOrder: (id: string, reason: string) => void;

    // System
    notifications: Notification[];
    markAllNotificationsAsRead: () => void;
    markNotificationAsRead: (id: string) => void;
    markNotificationsAsRead: (ids: string[]) => void;
    markNotificationsAsUnread: (ids: string[]) => void;
    toasts: Toast[];
    addToast: (type: 'success' | 'error' | 'info', message: string) => void;
    removeToast: (id: number) => void;
    performGlobalSearch: (query: string) => { clients: Client[], appointments: any[], invoices: Invoice[], suppliers: Supplier[], orders: Order[] };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 1. Initialize State Hooks (Data Owners)
    const system = useSystemUI();
    const catalogData = useCatalogData(system.addToast);
    const crm = useCRM(system.addToast);
    const operations = useOperations(system.addToast, system.addNotification);
    const finance = useFinance(system.addToast);

    // New State for Templates
    const [orderTemplates, setOrderTemplates] = useState<OrderTemplate[]>([]);

    // New State for Service Menu Sections (CMS)
    const [serviceSections, setServiceSections] = useState<PublicServiceSection[]>(INITIAL_SECTIONS);

    // New State for Product Menu Sections (CMS)
    const [productSections, setProductSections] = useState<PublicProductSection[]>(INITIAL_PRODUCT_SECTIONS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Initial Auth Load
    useEffect(() => {
        const savedUser = localStorage.getItem('dermibelle_auth_user');
        if (savedUser) {
            try {
                setCurrentUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Error parsing saved user", e);
                localStorage.removeItem('dermibelle_auth_user');
            }
        }
        setAuthLoading(false);
    }, []);


    const login = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('dermibelle_auth_user', JSON.stringify(user));
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('dermibelle_auth_user');
    };


    // New State for Fixed Expenses (Global)
    const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([
        { id: 1, name: 'Alquiler Local', amount: 1200 },
        { id: 2, name: 'Internet & Servicios', amount: 150 },
        { id: 3, name: 'Nómina Base', amount: 4500 },
        { id: 4, name: 'Software CRM', amount: 49 },
    ]);

    const addFixedExpense = (expense: Omit<FixedExpense, 'id'>) => {
        setFixedExpenses(prev => [...prev, { ...expense, id: Date.now() }]);
    };

    const removeFixedExpense = (id: number) => {
        setFixedExpenses(prev => prev.filter(e => e.id !== id));
    };

    // 2. Initialize Logic Managers (Orchestrators)
    const apptManager = useAppointmentManager(operations, finance, catalogData, crm, system);
    const financeManager = useFinanceManager(finance, operations, catalogData, crm, system);

    // 3. View Logic Helpers
    const safeClients = useMemo(() => crm.clients.map(c => ({ ...c, name: c.name || '', email: c.email || '', id: c.id || '' })), [crm.clients]);
    const safeAppointments = useMemo(() => operations.appointments.map(a => ({ ...a, clientName: a.clientName || '', id: a.id || '', service: a.service || '', items: (a.items || []).map(i => ({ ...i, title: i.title || '' })) })), [operations.appointments]);
    const safeInvoices = useMemo(() => finance.invoices.map(i => ({ ...i, client: i.client || '', idDisplay: i.idDisplay || '', status: i.status || 'Pendiente' })), [finance.invoices]);
    const safeSuppliers = useMemo(() => catalogData.suppliers.map(s => ({ ...s, companyName: s.companyName || '', contactPerson: s.contactPerson || '' })), [catalogData.suppliers]);
    const safeOrders = useMemo(() => finance.orders.map(o => ({ ...o, clientName: o.clientName || '', idDisplay: o.idDisplay || '' })), [finance.orders]);
    const safeCatalog = useMemo(() => catalogData.catalog.map(c => ({ ...c, title: c.title || '', sku: c.sku || '' })), [catalogData.catalog]);
    const safeNotifications = useMemo(() => system.notifications.map(n => ({ ...n, message: n.message || '', title: n.title || '' })), [system.notifications]);

    const performGlobalSearch = (query: string) => {
        const q = (query || '').toLowerCase();
        return {
            clients: safeClients.filter(c => (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)),
            appointments: safeAppointments.filter(a => (a.clientName || '').toLowerCase().includes(q) || (a.id || '').toLowerCase().includes(q)),
            invoices: safeInvoices.filter(i => (i.idDisplay || '').toLowerCase().includes(q) || (i.client || '').toLowerCase().includes(q)),
            suppliers: safeSuppliers.filter(s => (s.companyName || '').toLowerCase().includes(q)),
            orders: safeOrders.filter(o => (o.idDisplay || '').toLowerCase().includes(q))
        };
    };

    // Load Order Templates
    useEffect(() => {
        orderTemplatesDB.getAll().then(setOrderTemplates);
    }, []);

    const addOrderTemplate = (template: Omit<OrderTemplate, 'id'>) => {
        const newTemplate = { ...template, id: generateId('TMP') };
        orderTemplatesDB.add(newTemplate).then(() => {
            setOrderTemplates(prev => [...prev, newTemplate]);
        });
    };

    // Maintenance Effect
    useEffect(() => {
        const checkExpirations = () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            let hasChanges = false;
            const updatedInvoices = finance.invoices.map(inv => {
                if (inv.status === 'Cotización') {
                    const [y, m, d] = inv.date.split('-').map(Number);
                    const creationDate = new Date(y, m - 1, d);
                    if (creationDate < thirtyDaysAgo) {
                        hasChanges = true;
                        invoicesDB.update({ ...inv, status: 'Anulada', notes: (inv.notes || '') + ' [Anulada por vencimiento de 30 días]' } as any);
                        catalogDB.releaseReservation(inv.items).then(() => { catalogDB.getAll().then(catalogData.setCatalog); });
                        return { ...inv, status: 'Anulada' as const };
                    }
                }
                return inv;
            });
            if (hasChanges) {
                finance.setInvoices(updatedInvoices);
                system.addToast('info', 'Algunas cotizaciones antiguas han sido anuladas automáticamente.');
            }
        };
        if (finance.invoices.length > 0) checkExpirations();
    }, [finance.invoices.length, finance.setInvoices, catalogData.setCatalog, system.addToast]);

    const updateUser = (id: string, data: Partial<User>) => {
        crm.updateUser(id, data);
        if (currentUser && currentUser.id === id) {
            const updated = { ...currentUser, ...data };
            setCurrentUser(updated);
            localStorage.setItem('dermibelle_auth_user', JSON.stringify(updated));
        }
    };

    return (

        <DataContext.Provider value={{
            // CRM
            clients: safeClients,
            addClient: crm.addClient,
            updateClient: crm.updateClient,
            users: crm.users,
            addUser: crm.addUser,
            updateUser,
            deleteUser: crm.deleteUser,

            wikiArticles: crm.wikiArticles,
            clientLogs: crm.clientLogs,
            addClientLog: crm.addClientLog,

            // Catalog
            catalog: safeCatalog,
            addCatalogItem: catalogData.addCatalogItem,
            updateCatalogItem: catalogData.updateCatalogItem,
            deleteCatalogItem: catalogData.deleteCatalogItem,
            suppliers: safeSuppliers,
            updateSupplier: catalogData.updateSupplier,

            // Service Menu
            serviceSections,
            setServiceSections,

            // Product Menu (Shop)
            productSections,
            setProductSections,

            // Settings (From useCatalogData hook)
            globalInventorySettings: catalogData.globalInventorySettings,
            updateGlobalInventorySettings: catalogData.updateGlobalInventorySettings,

            // Open Stock (NUEVO)
            openStock: catalogData.openStock,
            updateOpenStockItem: catalogData.updateOpenStockItem,
            deleteOpenStockItem: catalogData.deleteOpenStockItem,

            // Stock Logs (Predictivo)
            stockLogs: catalogData.stockLogs,
            addStockLog: catalogData.addStockLog,

            // Expenses
            fixedExpenses,
            addFixedExpense,
            removeFixedExpense,

            // Operations
            appointments: safeAppointments,
            addAppointment: apptManager.addAppointment,
            updateAppointment: operations.updateAppointment,
            updateAppointmentStatus: apptManager.updateAppointmentStatus,
            archiveFinishedAppointments: operations.archiveFinishedAppointments,
            reactivateArchivedAppointment: apptManager.reactivateArchivedAppointment,

            // Templates
            orderTemplates,
            addOrderTemplate,

            // Finance
            invoices: safeInvoices,
            orders: safeOrders,
            addOrder: finance.addOrder,
            updateOrder: finance.updateOrder,
            archiveFinishedOrders: finance.archiveFinishedOrders,
            reactivateArchivedOrder: finance.reactivateArchivedOrder,
            supplierInvoices: finance.supplierInvoices,
            addSupplierInvoice: finance.addSupplierInvoice,
            updateSupplierInvoice: finance.updateSupplierInvoice,
            updateInvoice: finance.updateInvoice,
            createManualInvoice: financeManager.createManualInvoice,
            payInvoice: financeManager.payInvoice,
            confirmInTransitInvoice: financeManager.confirmInTransitInvoice,
            rejectInTransitInvoice: financeManager.rejectInTransitInvoice,
            linkInvoiceToAppointment: financeManager.linkInvoiceToAppointment,
            unlinkAndVoidInvoice: financeManager.unlinkAndVoidInvoice,
            getInvoiceByAppointmentId: financeManager.getInvoiceByAppointmentId,
            checkReferenceExists: financeManager.checkReferenceExists,

            // System
            notifications: safeNotifications,
            markAllNotificationsAsRead: system.markAllNotificationsAsRead,
            markNotificationAsRead: system.markNotificationAsRead,
            markNotificationsAsRead: system.markNotificationsAsRead,
            markNotificationsAsUnread: system.markNotificationsAsUnread,
            toasts: system.toasts,
            addToast: system.addToast,
            removeToast: system.removeToast,
            currentUser,
            authLoading,
            login,
            logout,
            performGlobalSearch


        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
