
export interface OrderLine {
    itemId: string | number;
    title: string;
    qty: number;
    receivedQty?: number;
    price: number;
    confirmed?: boolean;
    discountValue?: number;
    discountType?: 'percent' | 'fixed';
    stockAtOrder?: number;
    unitAtOrder?: string;
    unitAtReception?: string;
    priceAtReception?: number;
    receptionDate?: string;
}

export interface Order {
  id: string;
  idDisplay: string;
  clientName: string;
  supplierId?: string;
  items: string;
  total: number;
  status: 'Draft' | 'Placed' | 'In Transit' | 'Delivered' | 'Partially Received' | 'Pending Approval' | 'Completed' | 'Cancelled' | 'Scheduled' | 'Revision Sent';
  date: string;
  scheduledTime?: string;
  type: 'physical' | 'digital';
  lines?: OrderLine[];
  originalLines?: OrderLine[];
  initialLines?: OrderLine[];
  shippingMethod?: string;
  paymentTerms?: string;
  notes?: string;
  inDispute?: boolean;
  isArchived?: boolean;
  
  // Logistics Fields
  carrier?: string;
  trackingNumber?: string;
  shippingCost?: number;
  eta?: string;
  driverName?: string;
  vehiclePlate?: string;
  driverPhone?: string;
  pickupReference?: string;
  pickupHours?: string;
  pickupAddress?: string;
}

// ... rest of the file remains unchanged ...
export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
}

export interface PublicServiceItem {
  id: string;
  name: string;
  price: string;
  description: string;
}

export interface PublicServiceFeature {
    icon: string;
    title: string;
    description: string;
}

export interface PublicServiceSection {
  id: string;
  title: string;
  description: string;
  serviceIds: string[]; // Explicit list of services to show
  isActive?: boolean; // Visibility Status
  
  // Config Fields
  layoutType: 'list' | 'grid_2' | 'card_row';
  showPrices: boolean;
  heroImage?: string;
  features?: PublicServiceFeature[];
  protocol?: string[];
  promoBanner?: string;
  
  // Styling Fields
  variant: 'clean' | 'soft_green' | 'warm_gold' | 'luxury_dark';
  imagePosition: 'left' | 'right' | 'top' | 'hidden';
}

// NEW: Identical structure for Products/Shop CMS
export interface PublicProductSection {
  id: string;
  title: string;
  description: string;
  productIds: string[]; 
  isActive?: boolean; // Visibility Status
  
  layoutType: 'grid_3' | 'grid_4' | 'showcase'; // Slight variation for products
  showPrices: boolean;
  heroImage?: string;
  features?: PublicServiceFeature[];
  promoBanner?: string;
  
  variant: 'clean' | 'soft_green' | 'warm_gold' | 'luxury_dark';
  imagePosition: 'left' | 'right' | 'top' | 'hidden';
}

export interface PackageInfo {
  purchaseUnit?: string;
  consumptionUnit?: string;
  unitsPerPackage?: number;
  contentPerUnit?: number;
  usageType?: 'bulk' | 'whole' | 'yield';
  requiresBatch?: boolean;
  currentBatch?: string;
  expiryDate?: string;
}

export interface ProductConsumable {
  id: string;
  qty: number;
  consumptionMode?: 'unit' | 'measurement' | 'percentage' | 'yield';
  waste?: number;
}

export interface StockConfig {
  isCustom: boolean;
  retailRatio: number;
}

export interface AppointmentItem {
  id: string | number;
  title: string;
  price: number;
  type: 'service' | 'product';
  subtype?: 'retail' | 'consumable' | 'asset' | 'both';
  category?: string;
  sku?: string;
  cost?: number;
  stock?: number;
  minStock?: number;
  reserved?: number;
  supplierId?: string;
  packageInfo?: PackageInfo;
  qualityStatus?: 'damaged' | 'expired' | 'good' | 'finished';
  recipe?: ProductConsumable[];
  stockConfig?: StockConfig;
  allowFractionalSale?: boolean;
  fractionalPrice?: number;
  saleUnit?: 'pack' | 'unit';
  packageCost?: number;
  description?: string;
  image?: string;
  tags?: string[];
  duration?: number;
  bufferTime?: number;
  commissionType?: 'percent' | 'fixed';
  commissionValue?: number;
  wastePercent?: number;
  fixedCostOverride?: number;
  serviceGroupId?: string;
  quantity?: number; // For usage in orders/invoices where item is a line item
  isEProduct?: boolean; // New field for digital/infinite products
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  initials: string;
  status: 'New' | 'Recurring' | 'Inactive' | string;
  lastVisit: string;
  lastVisitTimeAgo?: string;
  totalSpent: number;
  address?: string;
  tags?: string[];
  notes?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  client?: string;
  clientAvatar: string | null;
  avatar?: string | null;
  service: string;
  items: AppointmentItem[];
  date: string;
  time: string;
  specialistName: string;
  total: number;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Finalized' | 'Cancelled';
  notes?: string;
  createdAt?: number;
  isArchived?: boolean;
  wasReactivated?: boolean;
}

export interface PaymentBreakdown {
  servicesTotal: number;
  productsTotal: number;
  servicesPaid: boolean;
  productsPaid: boolean;
}

export interface Discount {
  type: 'percent' | 'fixed';
  value: number;
}

export interface Invoice {
  id: string;
  idDisplay: string;
  clientId: string;
  client: string;
  clientInitials?: string;
  service: string;
  items: AppointmentItem[];
  amount: number;
  date: string;
  time?: string;
  status: 'Pendiente' | 'Pagada' | 'Parcial' | 'Cotización' | 'En Tránsito' | 'Anulada' | 'Scheduled' | 'Draft' | 'Approved' | 'Disputed';
  appointmentId?: string;
  paymentBreakdown?: PaymentBreakdown;
  paymentMethod?: string;
  transactionReference?: string;
  discount?: Discount;
  notes?: string;
}

export interface SupplierContact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  contacts?: SupplierContact[];
  websites?: string[];
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  status: 'Active' | 'Review' | 'Inactive';
  initials?: string;
  leadTime?: number;
  rating?: number;
  nextDelivery?: string;
  totalSpendYTD?: string;
  tags?: string[];
  notes?: string;
  logo?: string;
  category?: string;
  shippingCosts?: {
      standard: number;
      express: number;
      pickup: number;
  };
}

export interface InvoiceHistoryEvent {
  date: string;
  action: string;
  user: string;
  note?: string;
}

export interface SupplierInvoice {
  id: string;
  supplierId: string;
  supplierName: string;
  displayId: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'In Transit' | 'Partially Received' | 'Pending Approval' | 'Approved' | 'Disputed' | 'Scheduled' | 'Paid' | 'Overdue' | 'Cancelled';
  itemsDescription: string;
  linkedOrderId?: string;
  matchStatus: 'Unlinked' | 'Matched' | 'Discrepancy';
  discrepancyNotes?: string;
  history?: InvoiceHistoryEvent[];
  scheduledDate?: string;
  
  // Enhanced Fields
  paymentMethod?: string;
  taxAmount?: number;
  shippingCost?: number;
  subtotal?: number;
  notes?: string;
  attachments?: string[];
  category?: string;
  paymentDate?: string;
  transactionReference?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Asistente' | 'Recepcionista';
  status: 'Activo' | 'Ausente' | 'Inactivo';
  lastAccess: string;
  avatar: string | null;
  initials?: string;
  password?: string;
  isAutoLoginEnabled?: boolean;
}

export interface WikiArticle {
  id: number;
  title: string;
  category: string;
  type: string;
  views: number;
  lastUpdate: string;
  content: string;
}

export interface Notification {
  id: string;
  type: 'new_appointment' | 'payment_received' | 'new_product_physical' | 'new_product_digital' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

export interface ClientLog {
  id: string;
  clientId: string;
  type: 'interaction' | 'note' | 'system' | 'finance';
  action: string;
  description: string;
  timestamp: number;
  date: string;
}

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface OrderTemplateItem {
    itemId: string | number;
    quantity: number;
}

export interface OrderTemplate {
  id: string;
  name: string;
  supplierId?: string;
  items: OrderTemplateItem[];
}

export interface ServiceGroup {
    id: string;
    name: string;
    color: string;
}

export interface GlobalInventorySettings {
  defaultRetailRatio: number;
  defaultServiceMargin: number;
  defaultFixedCost: number;
  defaultHourlyRate: number;
  fixedCostAllocationPercent: number;
  averageMonthlySessions: number;
  serviceGroups: ServiceGroup[];
}

export interface FixedExpense {
  id: number;
  name: string;
  amount: number;
}

export interface OpenStockItem {
  id: string;
  productId: string | number;
  productName: string;
  total: number;
  remaining: number;
  unit: string;
  openedDate: string;
  associatedRecipe: string;
}

export interface StockLog {
  id: string;
  date: string;
  itemId: string | number;
  itemName: string;
  action: 'Adjustment' | 'Discard' | string;
  reasonCategory: 'manual_correction' | 'finished' | 'expired' | 'damaged' | 'quality' | string;
  quantityChange: number;
  unit: string;
  costImpact: number;
  notes: string;
  batchId?: string;
}