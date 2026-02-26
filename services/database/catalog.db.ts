
import { AppointmentItem } from '../../types';
import { openStockDB } from './open_stock.db';

const DB_NAME = 'Dermibelle_Catalog';
const DB_VERSION = 12; // Incremented to force image refresh and schema update
const STORE_NAME = 'items';

const INITIAL_CATALOG: AppointmentItem[] = [
  // --- RETAIL PRODUCTS (Venta) ---
  { 
      id: 'prod-1', 
      title: 'Serum Vitamina C Radiance', 
      price: 45, 
      type: 'product', 
      subtype: 'retail', 
      category: 'Skincare', 
      description: 'Potente antioxidante para iluminar y proteger la piel.',
      tags: ['Retail', 'Popular', 'Face'], 
      sku: 'SKU-001', 
      stock: 15,
      cost: 22.50,
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80'
  },
  { 
      id: 'prod-face-2', 
      title: 'Hidratante Hyaluronic Cloud', 
      price: 52, 
      type: 'product', 
      subtype: 'retail', 
      category: 'Skincare', 
      description: 'Crema ligera de hidratación profunda con ácido hialurónico.',
      tags: ['Retail', 'Face', 'Hydration'], 
      sku: 'SKU-FACE-02', 
      stock: 20,
      cost: 25.00,
      image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=500&q=80'
  },
  { 
      id: 'prod-face-3', 
      title: 'Limpiador Gentle Foam', 
      price: 28, 
      type: 'product', 
      subtype: 'retail', 
      category: 'Skincare', 
      description: 'Espuma limpiadora suave que no reseca la piel.',
      tags: ['Retail', 'Face', 'Cleanser'], 
      sku: 'SKU-FACE-03', 
      stock: 12,
      cost: 12.00,
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=500&q=80'
  },
  { 
      id: 'prod-face-4', 
      title: 'Tónico de Agua de Rosas', 
      price: 24, 
      type: 'product', 
      subtype: 'retail', 
      category: 'Skincare', 
      description: 'Equilibra el pH y calma la piel después de la limpieza.',
      tags: ['Retail', 'Face', 'Toner'], 
      sku: 'SKU-FACE-04', 
      stock: 18,
      cost: 10.00,
      image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=500&q=80'
  },
  
  // --- BODY PRODUCTS ---
  { 
      id: 'prod-body-1', 
      title: 'Exfoliante Corporal de Azúcar', 
      price: 35, 
      type: 'product', 
      subtype: 'retail', 
      category: 'Body Care', 
      description: 'Exfoliación natural para una piel suave y renovada.',
      tags: ['Retail', 'Body', 'Scrub'], 
      sku: 'SKU-BODY-01', 
      stock: 10,
      cost: 15.00,
      image: 'https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=500&q=80'
  },
  { 
      id: 'prod-body-2', 
      title: 'Aceite Corporal Nutritivo', 
      price: 42, 
      type: 'product', 
      subtype: 'retail', 
      category: 'Body Care', 
      description: 'Mezcla de aceites botánicos para hidratación intensa.',
      tags: ['Retail', 'Body', 'Oil'], 
      sku: 'SKU-BODY-02', 
      stock: 8,
      cost: 18.00,
      image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=500&q=80',
      allowFractionalSale: true,
      fractionalPrice: 12,
      packageInfo: { purchaseUnit: 'Caja', consumptionUnit: 'Unidad', unitsPerPackage: 4, contentPerUnit: 1, usageType: 'whole' }
  },

  // --- ACCESSORIES & LIFESTYLE ---
  { 
      id: 'prod-tool-1', 
      title: 'Rodillo Facial de Jade', 
      price: 25, 
      type: 'product', 
      subtype: 'retail', 
      category: 'Herramientas', 
      description: 'Herramienta de masaje para reducir la hinchazón y mejorar la circulación.',
      tags: ['Retail', 'Tool', 'Accessory'], 
      sku: 'SKU-TOOL-01', 
      stock: 25,
      cost: 8.00,
      image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=500&q=80'
  },
  { 
      id: 'prod-tool-2', 
      title: 'Gua Sha Stone', 
      price: 20, 
      type: 'product', 
      subtype: 'retail', 
      category: 'Herramientas', 
      description: 'Piedra esculpidora para lifting facial natural.',
      tags: ['Retail', 'Tool', 'Accessory'], 
      sku: 'SKU-TOOL-02', 
      stock: 30,
      cost: 6.00,
      image: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=500&q=80'
  },
  { 
      id: 'prod-2', 
      title: 'E-book: Cuidados Post-Sugaring', 
      price: 15, 
      type: 'product', 
      subtype: 'retail', 
      category: 'Digital', 
      description: 'Guía completa para mantener tu piel perfecta después de la depilación.',
      tags: ['E-book', 'Digital'], 
      sku: 'DIG-002', 
      stock: 999,
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=500&q=80'
  },
  { 
      id: 'mk-1', 
      title: 'Supreme Hydrating Lipstick', 
      price: 20, 
      type: 'product', 
      subtype: 'retail', 
      category: 'Maquillaje', 
      description: 'Color intenso con hidratación duradera.',
      sku: 'MK-LIP-01', 
      stock: 20,
      cost: 10.00,
      image: 'https://images.unsplash.com/photo-1591360236480-9495d115dd33?auto=format&fit=crop&w=500&q=80'
  },

  // --- INSUMOS EXISTENTES (Consumibles) ---
  {
      id: 'cons-gloves', 
      title: 'Guantes de Nitrilo (Caja)', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Generales',
      price: 0, 
      cost: 12.00, 
      sku: 'GLOVE-M', 
      stock: 10, 
      minStock: 2,
      packageInfo: { purchaseUnit: 'Caja', consumptionUnit: 'par', unitsPerPackage: 50, contentPerUnit: 1, usageType: 'whole' }
  },
  {
      id: 'cons-sugar-paste', 
      title: 'Pasta Orgánica de Azúcar (Pro)', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Depilación',
      price: 0, 
      cost: 45.00, 
      sku: 'SUGAR-PASTE-1KG', 
      stock: 5, 
      minStock: 1,
      packageInfo: { purchaseUnit: 'Tarro', consumptionUnit: 'g', unitsPerPackage: 1, contentPerUnit: 1000, usageType: 'bulk' }
  },
  {
      id: 'cons-thread', 
      title: 'Hilo Elástico (Brazilian Knot)', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Cabello',
      price: 0, 
      cost: 8.50, 
      sku: 'ELASTIC-THREAD', 
      stock: 20, 
      minStock: 5,
      packageInfo: { purchaseUnit: 'Rollo', consumptionUnit: 'm', unitsPerPackage: 1, contentPerUnit: 500, usageType: 'bulk' }
  },
  {
      id: 'cons-peptides', 
      title: 'Serum Péptidos Concentrado', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Facial',
      price: 0, 
      cost: 65.00, 
      sku: 'SERUM-PEP', 
      stock: 4, 
      minStock: 1,
      packageInfo: { purchaseUnit: 'Botella', consumptionUnit: 'ml', unitsPerPackage: 1, contentPerUnit: 250, usageType: 'bulk' }
  },
  {
      id: 'cons-mask-sulfur', 
      title: 'Mascarilla Sulfuro (Acne)', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Facial',
      price: 0, 
      cost: 40.00, 
      sku: 'MASK-SULFUR', 
      stock: 3, 
      minStock: 1,
      packageInfo: { purchaseUnit: 'Tubo', consumptionUnit: 'g', unitsPerPackage: 1, contentPerUnit: 500, usageType: 'bulk' }
  },
  {
      id: 'cons-dermablade', 
      title: 'Hoja Dermaplaning Estéril', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Facial',
      price: 0, 
      cost: 25.00, 
      sku: 'BLADE-10', 
      stock: 5, 
      minStock: 1,
      packageInfo: { purchaseUnit: 'Caja', consumptionUnit: 'unid', unitsPerPackage: 50, contentPerUnit: 1, usageType: 'whole' }
  },
  {
      id: 'cons-cleanser', 
      title: 'Limpiador Facial Profundo', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Facial',
      price: 0, 
      cost: 30.00, 
      sku: 'CLEANSER-PRO', 
      stock: 6, 
      minStock: 2,
      packageInfo: { purchaseUnit: 'Botella', consumptionUnit: 'ml', unitsPerPackage: 1, contentPerUnit: 1000, usageType: 'bulk' }
  },

  // --- NUEVOS INSUMOS FALTANTES (Agregados) ---
  {
      id: 'cons-bed-roll', 
      title: 'Sábana Camilla Desechable', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Generales',
      price: 0, 
      cost: 18.00, 
      sku: 'BED-ROLL', 
      stock: 10, 
      minStock: 2,
      packageInfo: { purchaseUnit: 'Rollo', consumptionUnit: 'servicio', unitsPerPackage: 1, contentPerUnit: 50, usageType: 'yield' }
  },
  {
      id: 'cons-cotton-pads', 
      title: 'Discos Algodón (Paq. 500)', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Generales',
      price: 0, 
      cost: 8.00, 
      sku: 'COTTON-500', 
      stock: 5, 
      minStock: 1,
      packageInfo: { purchaseUnit: 'Paquete', consumptionUnit: 'unidad', unitsPerPackage: 1, contentPerUnit: 500, usageType: 'bulk' }
  },
  {
      id: 'cons-talc', 
      title: 'Polvo Pre-Depilación', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Depilación',
      price: 0, 
      cost: 15.00, 
      sku: 'TALC-PRO', 
      stock: 3, 
      minStock: 1,
      packageInfo: { purchaseUnit: 'Bote', consumptionUnit: 'g', unitsPerPackage: 1, contentPerUnit: 400, usageType: 'bulk' }
  },
  {
      id: 'cons-tonic', 
      title: 'Tónico Calmante Post-Depil', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Depilación',
      price: 0, 
      cost: 22.00, 
      sku: 'TONIC-POST', 
      stock: 4, 
      minStock: 1,
      packageInfo: { purchaseUnit: 'Botella', consumptionUnit: 'ml', unitsPerPackage: 1, contentPerUnit: 500, usageType: 'bulk' }
  },
  {
      id: 'cons-exfoliant', 
      title: 'Exfoliante Suave (Intimo)', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Piel',
      price: 0, 
      cost: 28.00, 
      sku: 'EXFO-GENTLE', 
      stock: 4, 
      minStock: 1,
      packageInfo: { purchaseUnit: 'Tarro', consumptionUnit: 'g', unitsPerPackage: 1, contentPerUnit: 350, usageType: 'bulk' }
  },
  {
      id: 'cons-hydro-mask', 
      title: 'Mascarilla Hidroplástica', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Piel',
      price: 0, 
      cost: 55.00, 
      sku: 'HYDRO-MASK', 
      stock: 2, 
      minStock: 1,
      packageInfo: { purchaseUnit: 'Bolsa', consumptionUnit: 'g', unitsPerPackage: 1, contentPerUnit: 1000, usageType: 'bulk' }
  },
  {
      id: 'cons-lift-kit', 
      title: 'Kit Lifting Pestañas (Sobres)', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Ojos',
      price: 0, 
      cost: 45.00, 
      sku: 'LIFT-BOX', 
      stock: 5, 
      minStock: 1,
      packageInfo: { purchaseUnit: 'Caja', consumptionUnit: 'servicio', unitsPerPackage: 10, contentPerUnit: 1, usageType: 'whole' }
  },
  {
      id: 'cons-tint', 
      title: 'Tinte Híbrido Cejas/Pestañas', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Ojos',
      price: 0, 
      cost: 18.00, 
      sku: 'TINT-HYBRID', 
      stock: 6, 
      minStock: 2,
      packageInfo: { purchaseUnit: 'Tubo', consumptionUnit: 'ml', unitsPerPackage: 1, contentPerUnit: 15, usageType: 'bulk' }
  },
  {
      id: 'cons-applicators', 
      title: 'Microaplicadores Desechables', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Generales',
      price: 0, 
      cost: 9.00, 
      sku: 'MICRO-APP', 
      stock: 8, 
      minStock: 2,
      packageInfo: { purchaseUnit: 'Tubo', consumptionUnit: 'unidad', unitsPerPackage: 1, contentPerUnit: 100, usageType: 'bulk' }
  },
  {
      id: 'cons-eye-pads', 
      title: 'Parches Hidrogel Ojos', 
      type: 'product', 
      subtype: 'consumable', 
      category: 'Insumos Ojos',
      price: 0, 
      cost: 12.00, 
      sku: 'EYE-PADS', 
      stock: 10, 
      minStock: 2,
      packageInfo: { purchaseUnit: 'Paquete', consumptionUnit: 'par', unitsPerPackage: 50, contentPerUnit: 1, usageType: 'whole' }
  },


  // --- SERVICIOS ---
  // 1. SKINCARE
  { 
    id: 'skin-sig', 
    title: 'Signature Custom Facial', 
    price: 120, 
    type: 'service', 
    category: 'Skincare',
    description: '60 min. Tratamiento totalmente personalizado. Incluye limpieza profunda, exfoliación, extracciones y mascarilla.',
    cost: 14.50, // Cost updated manually or calculated dynamically
    recipe: [
        { id: 'cons-cleanser', qty: 10, consumptionMode: 'measurement' },
        { id: 'cons-gloves', qty: 2, consumptionMode: 'unit' },
        { id: 'cons-bed-roll', qty: 1, consumptionMode: 'yield' },
        { id: 'cons-cotton-pads', qty: 6, consumptionMode: 'measurement' },
        { id: 'cons-hydro-mask', qty: 25, consumptionMode: 'measurement' } // 25g mascarilla
    ]
  },
  { 
    id: 'skin-anti', 
    title: 'Anti-Aging Peptide Boost', 
    price: 150, 
    type: 'service', 
    category: 'Skincare',
    description: '75 min. Restaura elasticidad y firmeza con péptidos potentes y terapia de luz LED.',
    cost: 21.00,
    recipe: [
        { id: 'cons-cleanser', qty: 10, consumptionMode: 'measurement' },
        { id: 'cons-peptides', qty: 5, consumptionMode: 'measurement' }, 
        { id: 'cons-gloves', qty: 2, consumptionMode: 'unit' },
        { id: 'cons-bed-roll', qty: 1, consumptionMode: 'yield' },
        { id: 'cons-cotton-pads', qty: 8, consumptionMode: 'measurement' }
    ]
  },
  { 
    id: 'skin-acne', 
    title: 'Clear Skin Acne Treatment', 
    price: 130, 
    type: 'service', 
    category: 'Skincare',
    description: '60 min. Enfocado en calmar inflamación y limpiar bacterias. Incluye alta frecuencia y mascarilla de azufre.',
    cost: 16.50,
    recipe: [
        { id: 'cons-cleanser', qty: 15, consumptionMode: 'measurement' },
        { id: 'cons-mask-sulfur', qty: 20, consumptionMode: 'measurement' }, 
        { id: 'cons-gloves', qty: 3, consumptionMode: 'unit' }, // Más cambios de guantes
        { id: 'cons-bed-roll', qty: 1, consumptionMode: 'yield' },
        { id: 'cons-cotton-pads', qty: 10, consumptionMode: 'measurement' }
    ]
  },
  { 
    id: 'skin-derma', 
    title: 'Dermaplaning Add-On', 
    price: 45, 
    type: 'service', 
    category: 'Skincare',
    description: 'Remueve células muertas y vello facial para un brillo instantáneo.',
    cost: 6.50,
    recipe: [
        { id: 'cons-dermablade', qty: 1, consumptionMode: 'unit' },
        { id: 'cons-gloves', qty: 1, consumptionMode: 'unit' },
        { id: 'cons-cotton-pads', qty: 4, consumptionMode: 'measurement' },
        { id: 'cons-cleanser', qty: 5, consumptionMode: 'measurement' }
    ]
  },

  // 2. VAJACIAL (Previously Legacy, now Updated)
  { 
      id: 'skin-1', 
      title: 'Vajacial', 
      price: 60, 
      type: 'service', 
      category: 'Piel y Belleza', 
      tags: ['Íntimo'], 
      description: 'Tratamiento calmante y exfoliante para el área del bikini post-depilación.',
      cost: 12.00,
      recipe: [
          { id: 'cons-cleanser', qty: 10, consumptionMode: 'measurement' },
          { id: 'cons-exfoliant', qty: 15, consumptionMode: 'measurement' },
          { id: 'cons-hydro-mask', qty: 30, consumptionMode: 'measurement' },
          { id: 'cons-tonic', qty: 5, consumptionMode: 'measurement' },
          { id: 'cons-gloves', qty: 2, consumptionMode: 'unit' },
          { id: 'cons-bed-roll', qty: 1, consumptionMode: 'yield' }
      ]
  },

  // 3. LASHES & BROWS (Previously Legacy, now Updated)
  { 
      id: 'skin-2', 
      title: 'Eyelashes & Eyebrow Treatment', 
      price: 70, 
      type: 'service', 
      category: 'Piel y Belleza', 
      description: 'Lifting de pestañas y laminado de cejas con tinte.',
      cost: 15.50,
      recipe: [
          { id: 'cons-lift-kit', qty: 1, consumptionMode: 'unit' }, // 1 sachet set
          { id: 'cons-tint', qty: 2, consumptionMode: 'measurement' }, // 2ml tint
          { id: 'cons-eye-pads', qty: 1, consumptionMode: 'unit' }, // 1 par
          { id: 'cons-applicators', qty: 4, consumptionMode: 'measurement' },
          { id: 'cons-cotton-pads', qty: 4, consumptionMode: 'measurement' },
          { id: 'cons-gloves', qty: 1, consumptionMode: 'unit' }
      ]
  },

  // 4. HAIR REMOVAL (SUGARING)
  { 
    id: 'rem-braz', 
    title: 'Brazilian', 
    price: 65, 
    type: 'service', 
    category: 'Hair Removal',
    description: 'Remoción completa del vello del área del bikini.',
    cost: 5.80,
    recipe: [
        { id: 'cons-sugar-paste', qty: 80, consumptionMode: 'measurement' },
        { id: 'cons-talc', qty: 5, consumptionMode: 'measurement' },
        { id: 'cons-tonic', qty: 5, consumptionMode: 'measurement' },
        { id: 'cons-gloves', qty: 2, consumptionMode: 'unit' },
        { id: 'cons-bed-roll', qty: 1, consumptionMode: 'yield' }
    ]
  },
  { 
    id: 'rem-bikini', 
    title: 'Bikini Line', 
    price: 45, 
    type: 'service', 
    category: 'Hair Removal',
    description: 'Limpieza de la línea del panty.',
    cost: 3.90,
    recipe: [
        { id: 'cons-sugar-paste', qty: 50, consumptionMode: 'measurement' },
        { id: 'cons-talc', qty: 3, consumptionMode: 'measurement' },
        { id: 'cons-tonic', qty: 3, consumptionMode: 'measurement' },
        { id: 'cons-gloves', qty: 1, consumptionMode: 'unit' },
        { id: 'cons-bed-roll', qty: 1, consumptionMode: 'yield' }
    ]
  },
  { 
    id: 'rem-under', 
    title: 'Underarms', 
    price: 25, 
    type: 'service', 
    category: 'Hair Removal',
    description: 'Rápido y efectivo. La depilación regular puede llevar a reducción permanente.',
    cost: 2.50,
    recipe: [
        { id: 'cons-sugar-paste', qty: 30, consumptionMode: 'measurement' },
        { id: 'cons-talc', qty: 2, consumptionMode: 'measurement' },
        { id: 'cons-tonic', qty: 2, consumptionMode: 'measurement' },
        { id: 'cons-gloves', qty: 1, consumptionMode: 'unit' }
    ]
  },
  { 
    id: 'rem-legs', 
    title: 'Full Legs', 
    price: 85, 
    type: 'service', 
    category: 'Hair Removal',
    description: 'Piernas suaves por semanas. Incluye pies y dedos.',
    cost: 14.50,
    recipe: [
        { id: 'cons-sugar-paste', qty: 200, consumptionMode: 'measurement' },
        { id: 'cons-talc', qty: 10, consumptionMode: 'measurement' },
        { id: 'cons-tonic', qty: 10, consumptionMode: 'measurement' },
        { id: 'cons-gloves', qty: 2, consumptionMode: 'unit' },
        { id: 'cons-bed-roll', qty: 1, consumptionMode: 'yield' }
    ]
  },
  { 
    id: 'rem-face', 
    title: 'Full Face', 
    price: 55, 
    type: 'service', 
    category: 'Hair Removal',
    description: 'Remoción suave para vello facial y pelusa. Incluye cejas, labio, mentón.',
    cost: 4.20,
    recipe: [
        { id: 'cons-sugar-paste', qty: 40, consumptionMode: 'measurement' },
        { id: 'cons-talc', qty: 2, consumptionMode: 'measurement' },
        { id: 'cons-tonic', qty: 2, consumptionMode: 'measurement' },
        { id: 'cons-gloves', qty: 1, consumptionMode: 'unit' },
        { id: 'cons-bed-roll', qty: 0.5, consumptionMode: 'yield' } // Media sábana cabezal
    ]
  },
  { 
    id: 'rem-brow', 
    title: 'Brow Shape', 
    price: 25, 
    type: 'service', 
    category: 'Hair Removal',
    description: 'Esculpido y diseño para enmarcar tu rostro perfectamente.',
    cost: 1.80,
    recipe: [
        { id: 'cons-sugar-paste', qty: 15, consumptionMode: 'measurement' },
        { id: 'cons-talc', qty: 1, consumptionMode: 'measurement' },
        { id: 'cons-tonic', qty: 1, consumptionMode: 'measurement' },
        { id: 'cons-gloves', qty: 1, consumptionMode: 'unit' }
    ]
  },

  // 5. HAIR EXTENSIONS (Updated)
  { 
    id: 'ext-consult', 
    title: 'Initial Consultation', 
    price: 30, 
    type: 'service', 
    category: 'Hair Extensions',
    description: 'Requerido para nuevos clientes. Analizamos textura y objetivos.',
    cost: 0.50, // Solo costo administrativo/papelería
    recipe: []
  },
  { 
    id: 'ext-install', 
    title: 'Full Installation', 
    price: 450, 
    type: 'service', 
    category: 'Hair Extensions',
    description: 'El precio varía según el largo y volumen deseado.',
    cost: 26.50,
    recipe: [
        { id: 'cons-thread', qty: 15, consumptionMode: 'measurement' },
        { id: 'cons-bed-roll', qty: 1, consumptionMode: 'yield' } // Capa protectora
    ]
  },
  { 
    id: 'ext-maint', 
    title: 'Maintenance / Tightening', 
    price: 150, 
    type: 'service', 
    category: 'Hair Extensions',
    description: 'Recomendado cada 6-8 semanas para asegurar la salud del cabello natural.',
    cost: 10.50,
    recipe: [
        { id: 'cons-thread', qty: 5, consumptionMode: 'measurement' },
        { id: 'cons-bed-roll', qty: 0.5, consumptionMode: 'yield' }
    ]
  }
];

class CatalogDatabase {
  private db: IDBDatabase | null = null;

  private async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Si existe, lo borramos para regenerar con la nueva estructura
        if (db.objectStoreNames.contains(STORE_NAME)) {
            db.deleteObjectStore(STORE_NAME);
        }
        
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        INITIAL_CATALOG.forEach(item => store.add(item));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async getAll(): Promise<AppointmentItem[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(item: AppointmentItem): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const newItem = { 
          ...item, 
          reserved: item.reserved || 0,
          packageInfo: item.packageInfo || { purchaseUnit: 'Unidad', consumptionUnit: 'Unidad', unitsPerPackage: 1, contentPerUnit: 1, usageType: 'whole' }
      };
      const request = store.add(newItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async update(item: AppointmentItem): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string | number): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- SMART INVENTORY LOGIC ---
  private calculateDeduction(item: AppointmentItem, recipeQty: number): number {
      const pkg = item.packageInfo || { usageType: 'whole', unitsPerPackage: 1, contentPerUnit: 1 };
      
      if (pkg.usageType === 'whole') {
          return recipeQty;
      }
      
      const totalContentPerPurchaseUnit = (pkg.unitsPerPackage || 1) * (pkg.contentPerUnit || 1);
      if (totalContentPerPurchaseUnit <= 0) return 0;
      
      return recipeQty / totalContentPerPurchaseUnit;
  }

  async reserveStock(items: AppointmentItem[]): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      items.forEach(item => {
        if (item.type === 'product') {
          // Skip reservation for fractional units to avoid blocking full boxes
          if (item.saleUnit === 'unit' && item.allowFractionalSale) {
              return;
          }

          const request = store.get(item.id);
          request.onsuccess = () => {
            const dbItem = request.result as AppointmentItem;
            if (dbItem) {
              const qty = item.quantity || 1;
              dbItem.reserved = (dbItem.reserved || 0) + qty;
              store.put(dbItem);
            }
          };
        } 
        else if (item.type === 'service' && item.recipe) {
             const serviceQty = item.quantity || 1;
             item.recipe.forEach(ingredient => {
                const request = store.get(ingredient.id);
                request.onsuccess = () => {
                    const dbIngredient = request.result as AppointmentItem;
                    if(dbIngredient) {
                        const deductionPerService = this.calculateDeduction(dbIngredient, ingredient.qty);
                        const totalDeduction = deductionPerService * serviceQty;
                        
                        dbIngredient.reserved = (dbIngredient.reserved || 0) + totalDeduction;
                        store.put(dbIngredient);
                    }
                }
             });
        }
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async finalizeSale(items: AppointmentItem[]): Promise<void> {
    // 1. Handle Fractional Sales (Open Stock) first
    const reservedDeductions: Map<string, number> = new Map(); // itemId -> qty to deduct from RESERVED stock (Packs)
    const freeStockDeductions: Map<string, number> = new Map(); // itemId -> qty to deduct from FREE stock (Opened Boxes)

    // We need to fetch catalog items to get unitsPerPackage for new open stock
    const allCatalogItems = await this.getAll();

    for (const item of items) {
        if (item.type === 'product') {
            const qty = item.quantity || 1;
            
            if (item.saleUnit === 'unit' && item.allowFractionalSale) {
                // Try to find open stock
                const allOpen = await openStockDB.getAll();
                const openItem = allOpen.find(o => o.productId === item.id && o.remaining >= qty);

                if (openItem) {
                    // Deduct from open stock
                    openItem.remaining -= qty;
                    if (openItem.remaining <= 0) {
                        await openStockDB.delete(openItem.id);
                    } else {
                        await openStockDB.update(openItem);
                    }
                    // No catalog deduction needed
                } else {
                    // Need to open a box -> Deduct from FREE stock
                    const current = freeStockDeductions.get(String(item.id)) || 0;
                    freeStockDeductions.set(String(item.id), current + 1);

                    // Create new open stock with remainder
                    const product = allCatalogItems.find(p => p.id === item.id);
                    if (product) {
                         const unitsPerPack = product.packageInfo?.unitsPerPackage || 1;
                         const remaining = unitsPerPack - qty;
                         
                         if (remaining > 0) {
                             await openStockDB.add({
                                 id: `open-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                 productId: item.id,
                                 productName: item.title,
                                 total: unitsPerPack,
                                 remaining: remaining,
                                 unit: 'unid',
                                 openedDate: new Date().toISOString(),
                                 associatedRecipe: 'retail'
                             });
                         }
                    }
                }
            } else {
                // Normal pack sale -> Deduct from RESERVED stock
                const current = reservedDeductions.get(String(item.id)) || 0;
                reservedDeductions.set(String(item.id), current + qty);
            }
        }
    }

    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Apply Reserved Deductions (Packs)
      reservedDeductions.forEach((qtyToDeduct, itemId) => {
          const request = store.get(itemId);
          request.onsuccess = () => {
             const dbItem = request.result as AppointmentItem;
             if (dbItem) {
                 dbItem.reserved = Math.max(0, (dbItem.reserved || 0) - qtyToDeduct);
                 dbItem.stock = Math.max(0, (dbItem.stock || 0) - qtyToDeduct);
                 store.put(dbItem);
             }
          };
      });

      // Apply Free Stock Deductions (Opened Boxes)
      freeStockDeductions.forEach((qtyToDeduct, itemId) => {
          const request = store.get(itemId);
          request.onsuccess = () => {
             const dbItem = request.result as AppointmentItem;
             if (dbItem) {
                 // Do NOT deduct from reserved, as it wasn't reserved
                 dbItem.stock = Math.max(0, (dbItem.stock || 0) - qtyToDeduct);
                 store.put(dbItem);
             }
          };
      });

      items.forEach(item => {
        // Services Logic (unchanged)
        if (item.type === 'service' && item.recipe) {
             const serviceQty = item.quantity || 1;
             item.recipe.forEach(ingredient => {
                const request = store.get(ingredient.id);
                request.onsuccess = () => {
                    const dbIngredient = request.result as AppointmentItem;
                    if(dbIngredient) {
                        const deductionPerService = this.calculateDeduction(dbIngredient, ingredient.qty);
                        const totalDeduction = deductionPerService * serviceQty;

                        // Release reservation BUT DO NOT DEDUCT MAIN STOCK
                        // Consumption is handled by OpenStock opening logic
                        dbIngredient.reserved = Math.max(0, (dbIngredient.reserved || 0) - totalDeduction);
                        store.put(dbIngredient);
                    }
                }
             });
        }
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async releaseReservation(items: AppointmentItem[]): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      items.forEach(item => {
        if (item.type === 'product') {
          // Skip release for fractional units as they were never reserved
          if (item.saleUnit === 'unit' && item.allowFractionalSale) {
              return;
          }

          const request = store.get(item.id);
          request.onsuccess = () => {
            const dbItem = request.result as AppointmentItem;
            if (dbItem) {
              const qty = item.quantity || 1;
              dbItem.reserved = Math.max(0, (dbItem.reserved || 0) - qty);
              store.put(dbItem);
            }
          };
        }
        else if (item.type === 'service' && item.recipe) {
             const serviceQty = item.quantity || 1;
             item.recipe.forEach(ingredient => {
                const request = store.get(ingredient.id);
                request.onsuccess = () => {
                    const dbIngredient = request.result as AppointmentItem;
                    if(dbIngredient) {
                        const deductionPerService = this.calculateDeduction(dbIngredient, ingredient.qty);
                        const totalDeduction = deductionPerService * serviceQty;
                        
                        dbIngredient.reserved = Math.max(0, (dbIngredient.reserved || 0) - totalDeduction);
                        store.put(dbIngredient);
                    }
                }
             });
        }
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const catalogDB = new CatalogDatabase();
