
import React from 'react';
import { Order, Supplier, useData } from '../../../../../context/DataContext';
import { useTransitLogic } from '../../../../../hooks/useTransitLogic';
import { TransitHero } from './TransitHero';
import { TransitPreparation } from './TransitPreparation';
import { TransitCarrierCard, TransitResponsibleCard } from './TransitLogisticsCards';
import { TransitPaymentInfo, TransitFinancialSummary, TransitNotes } from './TransitAdvancedWidgets';

interface TransitDashboardProps {
    order: Order;
    supplier: Supplier;
    isPickup: boolean;
    onContact: (method: 'email' | 'phone' | 'whatsapp') => void;
    onCopyTracking: () => void;
    onChangeView: (mode: 'items' | 'report') => void;
    // onOpenReception removed from props
}

export const TransitDashboard: React.FC<TransitDashboardProps> = ({ 
    order, supplier, isPickup, onCopyTracking, onChangeView
}) => {
    
    const { timeMetrics, financeStatus, logisticsData } = useTransitLogic(order);
    const { updateOrder } = useData();
    
    const etaDate = new Date(order.eta || new Date().setDate(new Date().getDate() + 3)); 
    const startDate = new Date(order.date);

    const handleSaveNotes = (notes: string) => {
        if (notes !== order.notes) {
            updateOrder(order.id, { notes });
        }
    };

    return (
        <div className="flex flex-col gap-3 h-full overflow-hidden p-1">
            
            {/* ROW 1: HERO + PAYMENT INFO (Header Row) */}
            {/* Alineación consistente con la fila inferior */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch shrink-0">
                <div className="lg:w-[58%] min-w-0 [&>div]:h-full">
                    <TransitHero 
                        status={timeMetrics.daysLeft < 0 ? 'overdue' : timeMetrics.daysLeft < 3 ? 'warning' : 'normal'}
                        label={timeMetrics.statusLabel}
                        diffDays={timeMetrics.daysLeft}
                        etaDate={etaDate}
                        departureDate={startDate}
                        orderDate={startDate}
                        progress={Math.round(timeMetrics.progress)}
                        onUpdateEta={() => {}} 
                        isPickup={isPickup}
                        serviceLevel={isPickup ? 'Retiro en Tienda' : 'Envío Estándar'}
                    />
                </div>
                <div className="lg:w-[42%] min-w-0 [&>div]:h-full">
                     <TransitPaymentInfo finance={financeStatus} />
                </div>
            </div>

            {/* ROW 2: CARRIER + FINANCIAL SUMMARY (Critical Alignment Row) */}
            {/* Proporción 58% / 42% con altura forzada para evitar huecos */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch shrink-0">
                <div className="lg:w-[58%] min-w-0 flex flex-col [&>div]:h-full">
                    <TransitCarrierCard 
                        carrier={logisticsData.carrier}
                        trackingNumber={logisticsData.trackingNumber}
                        onCopy={onCopyTracking}
                    />
                </div>
                <div className="lg:w-[42%] min-w-0 flex flex-col [&>div]:h-full">
                    <TransitFinancialSummary total={order.total} />
                </div>
            </div>

            {/* ROW 3: RESPONSIBLE + ACTION BUTTONS */}
            <div className="flex flex-col lg:flex-row gap-3 shrink-0">
                <div className="lg:w-[58%] min-w-0">
                    <TransitResponsibleCard 
                        name={supplier.contactPerson || "Elena Nunez"} 
                        email={supplier.email || "elena@dermibelle.com"}
                        phone={supplier.phone || "(555) 101-2020"}
                    />
                </div>
                {/* Botones de Acción (Reemplazan al Spacer) */}
                <div className="lg:w-[42%] min-w-0 flex gap-3">
                    <button 
                        onClick={() => onChangeView('report')}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md h-full min-h-[80px]"
                    >
                        <span className="material-icons text-xl">report_problem</span>
                        Reportar Problema
                    </button>
                    <button 
                        onClick={() => onChangeView('items')}
                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 dark:border-indigo-900/30 dark:bg-indigo-900/10 dark:text-indigo-400 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md h-full min-h-[80px]"
                    >
                        <span className="material-icons text-xl">list_alt</span>
                        Ver Manifiesto
                    </button>
                </div>
            </div>

            {/* ROW 4: NOTES + CHECKLIST (Fills remaining space) */}
            <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
                <div className="lg:w-[58%] min-w-0 h-full [&>div]:h-full">
                    <TransitNotes notes={order.notes || ''} onSave={handleSaveNotes} />
                </div>
                <div className="lg:w-[42%] min-w-0 h-full [&>div]:h-full">
                    <TransitPreparation />
                </div>
            </div>

        </div>
    );
};
