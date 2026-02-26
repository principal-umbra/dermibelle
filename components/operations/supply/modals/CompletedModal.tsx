
import React, { useMemo, useState, useRef } from 'react';
import { OrderModalProps } from './OrderModalTypes';
import { useData } from '../../../../context/DataContext';

export const CompletedModal: React.FC<OrderModalProps> = ({ order, onClose }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { suppliers } = useData();

    // Calcular métricas de la orden
    const totalQty = order.lines?.reduce((acc, line) => acc + (line.receivedQty || 0), 0) || 0;
    const totalLines = order.lines?.length || 0;

    // Obtener datos completos del proveedor
    const fullSupplier = useMemo(() => 
        suppliers.find(s => s.id === order.supplierId) || { 
            id: 'UNK', 
            companyName: order.clientName, 
            contactPerson: 'No registrado', 
            rating: 4.5, 
            leadTime: 3,
            email: 'contacto@proveedor.com' 
        }, 
    [suppliers, order.supplierId, order.clientName]);

    // --- CÁLCULOS INTELIGENTES ---
    const stats = useMemo(() => {
        // 1. Lead Time Real
        const createdDate = new Date(order.date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - createdDate.getTime());
        const leadTimeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // 2. Cobertura
        const coverageDays = Math.floor(totalQty * 1.5); 

        return { leadTimeDays, coverageDays };
    }, [order.date, totalQty]);

    // Detectar si fue cierre forzoso
    const isShortageClosed = useMemo(() => (order.notes || '').includes('[SHORTAGE_CLOSED]'), [order.notes]);

    // Estado de Documentos
    const [documents, setDocuments] = useState([
        { id: '1', name: `Orden_Compra_${order.idDisplay}.pdf`, type: 'pdf', source: 'Sistema', date: new Date(order.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) },
        { id: '2', name: 'Albarán_Recepción.pdf', type: 'pdf', source: 'Almacén', date: 'Hoy' },
        { id: '3', name: 'Factura_Final.pdf', type: 'pdf', source: 'Finanzas', date: 'Hoy' }
    ]);

    // Handler para subir nuevos documentos
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newDoc = {
                id: `new-${Date.now()}`,
                name: file.name,
                type: file.name.split('.').pop()?.toLowerCase() || 'file',
                source: 'Usuario',
                date: 'Ahora'
            };
            setDocuments(prev => [...prev, newDoc]);
        }
    };

    // Generar línea de tiempo
    const timelineEvents = [
        { label: 'Creación de Orden', date: new Date(order.date).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'}), icon: 'edit_document', done: true },
        { label: 'Confirmación Proveedor', date: new Date(order.date).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'}), icon: 'thumb_up', done: true },
        { label: 'Despacho & Tránsito', date: 'Procesado', icon: 'local_shipping', done: true },
        { label: 'Inspección Calidad', date: 'Hoy', icon: 'fact_check', done: true },
        { label: 'Ingreso a Inventario', date: 'Ahora mismo', icon: 'inventory_2', done: true, current: true }
    ];

    const getDocIcon = (type: string) => {
        if (type.includes('pdf')) return 'picture_as_pdf';
        if (type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return 'image';
        return 'description';
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            {/* Contenedor Principal */}
            <div className="bg-[#F0FDF4] dark:bg-surface-dark w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-green-100 dark:border-green-900/30 h-[85vh] md:h-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* 1. HEADER HERO - Sello de Garantía */}
                <div className={`${isShortageClosed ? 'bg-amber-500 dark:bg-amber-700' : 'bg-green-500 dark:bg-green-700'} p-8 text-center relative overflow-hidden shrink-0 transition-colors duration-500`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="mb-4 animate-bounce drop-shadow-2xl">
                            {/* Icono verificado sólido con bordes dentados */}
                            <span 
                                className="material-symbols-outlined text-[7rem] text-white leading-none select-none" 
                                style={{ fontVariationSettings: "'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 48" }}
                            >
                                {isShortageClosed ? 'rule' : 'verified'}
                            </span>
                        </div>
                        <h2 className="text-3xl font-display font-black text-white uppercase tracking-widest mb-2 drop-shadow-sm">
                            {isShortageClosed ? 'CERRADA CON FALTANTES' : '¡ORDEN CERRADA!'}
                        </h2>
                        <p className={`${isShortageClosed ? 'text-amber-50' : 'text-green-50'} font-medium text-sm max-w-lg mx-auto`}>
                            {isShortageClosed 
                                ? <span>La orden <span className="font-mono bg-white/20 px-2 py-0.5 rounded font-bold text-white">#{order.idDisplay}</span> se cerró administrativamente ajustando los saldos pendientes.</span>
                                : <span>La recepción de la orden <span className="font-mono bg-white/20 px-2 py-0.5 rounded font-bold text-white">#{order.idDisplay}</span> ha sido procesada exitosamente.</span>
                            }
                        </p>
                    </div>
                </div>

                {/* 2. BODY - Fondo más oscuro para contraste */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#F3F4F6] dark:bg-black/40">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                        
                        {/* COLUMNA IZQUIERDA (Principal - Ancha) */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            
                            {/* A. Tarjeta Resumen - ALINEACIÓN CORREGIDA */}
                            <div className={`bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] border border-gray-200 dark:border-gray-700 border-t-4 ${isShortageClosed ? 'border-t-amber-500' : 'border-t-emerald-500'} shrink-0`}>
                                <div className="flex items-center gap-2 mb-5 pb-2 border-b border-gray-100 dark:border-gray-800">
                                    <div className={`w-6 h-6 rounded-full ${isShortageClosed ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'} flex items-center justify-center`}>
                                        <span className="material-icons text-xs">analytics</span>
                                    </div>
                                    <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        Resumen Operativo
                                    </h3>
                                </div>
                                
                                {/* Grid de KPIs Alineado */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 items-center">
                                    
                                    {/* 1. Total */}
                                    <div className="col-span-2 md:col-span-1 pr-4 md:border-r border-gray-100 dark:border-gray-700">
                                        <span className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Total Procesado</span>
                                        <span className="text-3xl font-display font-bold text-gray-900 dark:text-white tracking-tight">${order.total.toFixed(0)}</span>
                                    </div>

                                    {/* 2. Units / SKUs */}
                                    <div className="col-span-2 md:col-span-1 flex gap-2 justify-start">
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-2 text-center border border-green-100 dark:border-green-800/30 flex flex-col justify-center min-w-[70px]">
                                            <span className="block text-xl font-bold text-green-700 dark:text-green-300 leading-none">{totalQty}</span>
                                            <span className="text-[8px] text-green-600 dark:text-green-400 font-bold uppercase mt-1">Unidades</span>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2 text-center border border-blue-100 dark:border-blue-800/30 flex flex-col justify-center min-w-[70px]">
                                            <span className="block text-xl font-bold text-blue-700 dark:text-blue-300 leading-none">{totalLines}</span>
                                            <span className="text-[8px] text-blue-600 dark:text-blue-400 font-bold uppercase mt-1">SKUs</span>
                                        </div>
                                    </div>

                                    {/* 3. KPI: Entrega */}
                                    <div className="col-span-1 md:col-span-1 md:pl-6 md:border-l border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Entrega</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.leadTimeDays}d</span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${stats.leadTimeDays <= 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {stats.leadTimeDays <= 3 ? 'Rápido' : 'Normal'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 4. KPI: Cobertura */}
                                    <div className="col-span-1 md:col-span-1 md:pl-6 md:border-l border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cobertura</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.coverageDays}d</span>
                                            <span className="material-icons text-sm text-purple-400" title="Días estimados de stock">inventory</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* B. Bloque Inferior: Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[220px]">
                                
                                {/* 1. PROVEEDOR - Borde Azul */}
                                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] border border-gray-200 dark:border-gray-700 border-t-4 border-t-blue-500 flex flex-col justify-between relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none"></div>
                                    
                                    <div>
                                        <div className="flex justify-between items-start mb-4 relative z-10 border-b border-gray-100 dark:border-gray-800 pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <span className="material-icons text-xs">store</span>
                                                </div>
                                                <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Origen</h3>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-100 dark:border-blue-800">
                                                {fullSupplier.companyName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{fullSupplier.companyName}</h3>
                                                <p className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 rounded w-fit mt-1 border border-gray-100 dark:border-gray-700">ID: {fullSupplier.id}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Contacto Principal</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="material-icons text-gray-400 text-sm">person</span>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{fullSupplier.contactPerson}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Email</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="material-icons text-gray-400 text-sm">email</span>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{fullSupplier.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
                                        <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <p className="text-[9px] text-gray-400 uppercase font-bold">Rating</p>
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-sm font-bold text-gray-800 dark:text-white">{fullSupplier.rating}</span>
                                                <span className="material-icons text-yellow-400 text-[12px]">star</span>
                                            </div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <p className="text-[9px] text-gray-400 uppercase font-bold">Lead Time</p>
                                            <p className="text-sm font-bold text-gray-800 dark:text-white">~{fullSupplier.leadTime || 3} Días</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. DOCUMENTOS - Borde Naranja */}
                                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] border border-gray-200 dark:border-gray-700 border-t-4 border-t-orange-500 flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                                <span className="material-icons text-xs">folder</span>
                                            </div>
                                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                                Archivo
                                            </h3>
                                        </div>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-blue-100"
                                        >
                                            <span className="material-icons text-xs">upload</span> Subir
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            onChange={handleFileUpload} 
                                        />
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                                        {documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500">
                                                    <span className="material-icons text-sm">{getDocIcon(doc.type)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{doc.name}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase">{doc.source} • {doc.date}</p>
                                                </div>
                                                <span className="material-icons text-gray-300 text-sm opacity-0 group-hover:opacity-100 hover:text-blue-600">download</span>
                                            </div>
                                        ))}
                                        
                                        {/* Espacio vacío relleno si hay pocos docs */}
                                        {documents.length < 4 && (
                                            <div className="h-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 text-[10px] italic bg-gray-50/50 dark:bg-black/10">
                                                Zona de carga
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA - Bitácora (Borde Morado) */}
                        <div className="lg:col-span-4 h-full">
                            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] border border-gray-200 dark:border-gray-700 border-t-4 border-t-purple-500 h-full flex flex-col">
                                <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <span className="material-icons text-xs">history</span>
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        Bitácora
                                    </h3>
                                </div>
                                
                                <div className="flex-1 relative pl-2 overflow-y-auto custom-scrollbar">
                                    <div className="absolute left-[11px] top-2 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                                    <div className="space-y-6">
                                        {timelineEvents.map((step, idx) => (
                                            <div key={idx} className={`flex items-start gap-4 relative group ${step.current ? 'opacity-100' : 'opacity-70'}`}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-all shrink-0 mt-0.5
                                                    ${step.current ? 'bg-green-500 border-green-500 text-white shadow-lg' : step.done ? 'bg-white border-green-500 text-green-600' : 'bg-white border-gray-300 text-gray-300'}
                                                `}>
                                                    <span className="material-icons text-[10px] font-bold">{step.done ? 'check' : step.icon}</span>
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-bold leading-tight ${step.current ? 'text-green-700' : 'text-gray-700 dark:text-gray-300'}`}>{step.label}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 font-medium">{step.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 text-center shrink-0">
                                     <p className="text-[10px] text-gray-400 italic">
                                        "Stock disponible para venta/uso inmediato."
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 3. FOOTER */}
                <div className="p-5 bg-white dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 flex justify-center shrink-0">
                    <button 
                        onClick={onClose}
                        className="w-full max-w-sm py-3.5 bg-[#1A1D21] hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white font-bold rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 text-sm"
                    >
                        <span className="material-icons">done_all</span>
                        Finalizar Proceso
                    </button>
                </div>

            </div>
        </div>
    );
};
