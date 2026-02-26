
import React, { useState } from 'react';
import { Order } from '../../../../../context/DataContext';

interface TransitReportFlowProps {
    order: Order;
    onBack: () => void;
    onComplete: () => void;
    updateOrderCtx: (id: string, data: Partial<Order>) => void;
    addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

type ReportFlowStep = 'select_reason' | 'protocol_action';
type ProtocolLevel = 'follow_up' | 'formal_notice' | 'cancellation';
type DamageAction = 'resend' | 'cancel';
type OtherAction = 'wait' | 'investigate' | 'cancel';

export const TransitReportFlow: React.FC<TransitReportFlowProps> = ({ order, onBack, onComplete, updateOrderCtx, addToast }) => {
    const [reportStep, setReportStep] = useState<ReportFlowStep>('select_reason');
    const [reportReason, setReportReason] = useState<string>('');
    const [reportNotes, setReportNotes] = useState('');
    
    // Estados específicos del protocolo
    const [protocolLevel, setProtocolLevel] = useState<ProtocolLevel>('follow_up');
    const [newEta, setNewEta] = useState('');
    
    // Estados específicos para otros flujos
    const [damageAction, setDamageAction] = useState<DamageAction>('resend');
    const [otherAction, setOtherAction] = useState<OtherAction>('investigate');

    const REPORT_REASONS = [
        { id: 'delay', label: 'Retraso Excesivo', icon: 'schedule', desc: 'El pedido ha excedido la fecha límite.' },
        { id: 'missing', label: 'Incompleto / Perdido', icon: 'search_off', desc: 'No llegó la totalidad o se perdió.' },
        { id: 'wrong', label: 'Dirección Incorrecta', icon: 'wrong_location', desc: 'Error en ruta o destino.' },
        { id: 'damaged', label: 'Paquete Dañado', icon: 'broken_image', desc: 'Reporte visual de daños externos.' },
        { id: 'other', label: 'Otro Problema', icon: 'help_outline', desc: 'Motivo no listado.' }
    ];

    const handleReasonSelect = (reasonId: string) => {
        setReportReason(reasonId);
        setReportStep('protocol_action');
        setProtocolLevel('follow_up');
        setReportNotes('');
        setNewEta('');
    };

    const handleBackToReasons = () => {
        setReportStep('select_reason');
        setReportReason('');
    };

    const executeProtocolAction = () => {
        // 1. ESCENARIO PROGRESIVO (Delay, Missing, Wrong)
        if (['delay', 'missing', 'wrong'].includes(reportReason)) {
            if (protocolLevel === 'follow_up') {
                if (!newEta) {
                    addToast('error', 'Debes ingresar una nueva fecha tentativa para el seguimiento.');
                    return;
                }
                updateOrderCtx(order.id, { status: 'In Transit' } as any); // Mantiene estado, idealmente actualizaría ETA
                addToast('success', 'Nueva fecha tentativa registrada. Seguimiento activo.');
            } 
            else if (protocolLevel === 'formal_notice') {
                addToast('info', 'Notificación formal registrada en bitácora. Esperando respuesta final.');
            } 
            else if (protocolLevel === 'cancellation') {
                updateOrderCtx(order.id, { status: 'Cancelled' });
                addToast('info', 'Orden dada de baja por incidencia en tránsito.');
            }
        }
        
        // 2. ESCENARIO DAÑOS
        else if (reportReason === 'damaged') {
            if (!reportNotes) {
                addToast('error', 'Debes especificar los detalles del daño.');
                return;
            }

            if (damageAction === 'resend') {
                updateOrderCtx(order.id, { status: 'Placed' });
                addToast('success', 'Incidencia registrada. Orden reiniciada a estado "Enviada" para reposición.');
            } else {
                updateOrderCtx(order.id, { status: 'Cancelled' });
                addToast('info', 'Orden cancelada por daños irreparables.');
            }
        }

        // 3. ESCENARIO OTROS
        else if (reportReason === 'other') {
             if (otherAction === 'cancel') {
                updateOrderCtx(order.id, { status: 'Cancelled' });
                addToast('info', 'Orden cancelada manualmente.');
             } else {
                 addToast('success', `Incidencia registrada. Acción: ${otherAction === 'wait' ? 'Esperar' : 'Investigar'}`);
             }
        }

        onComplete();
    };

    return (
        <div className="h-full flex flex-col">
            <button 
                onClick={() => reportStep === 'select_reason' ? onBack() : handleBackToReasons()}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-4 self-start"
            >
                <span className="material-icons text-sm">arrow_back</span> 
                {reportStep === 'select_reason' ? 'Cancelar Reporte' : 'Cambiar Motivo'}
            </button>

            {/* STEP 1: SELECT REASON */}
            {reportStep === 'select_reason' && (
                <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Reportar Incidencia</h3>
                    <p className="text-xs text-gray-500 mb-6">Selecciona el motivo principal del problema con este envío.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {REPORT_REASONS.map((reason) => (
                            <button 
                                key={reason.id}
                                onClick={() => handleReasonSelect(reason.id)}
                                className="p-4 rounded-xl border text-left transition-all flex flex-col gap-2 bg-white dark:bg-white/5 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                                    <span className="material-icons text-sm">{reason.icon}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">{reason.label}</span>
                                    <span className="text-[10px] text-gray-500 leading-tight block mt-0.5">{reason.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* STEP 2: PROTOCOLS */}
            {reportStep === 'protocol_action' && (
                <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-right-4">
                    
                    {/* 1. PROTOCOLO PROGRESIVO */}
                    {['delay', 'missing', 'wrong'].includes(reportReason) && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="material-icons text-2xl">timeline</span>
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Protocolo de Incidencia</h3>
                                <p className="text-xs text-gray-500">Selecciona el nivel de intervención actual.</p>
                            </div>

                            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
                                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${protocolLevel === 'follow_up' ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'}`}>
                                    <input type="radio" name="proto" checked={protocolLevel === 'follow_up'} onChange={() => setProtocolLevel('follow_up')} className="mt-1" />
                                    <div>
                                        <span className="block text-sm font-bold text-blue-800 dark:text-blue-300">1. Follow Up (Nueva Fecha)</span>
                                        <span className="text-[10px] text-gray-500">Contacto con proveedor, reprogramar ETA. Orden se mantiene activa.</span>
                                    </div>
                                </label>

                                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${protocolLevel === 'formal_notice' ? 'bg-yellow-50 border-yellow-200' : 'hover:bg-gray-50 border-transparent'}`}>
                                    <input type="radio" name="proto" checked={protocolLevel === 'formal_notice'} onChange={() => setProtocolLevel('formal_notice')} className="mt-1" />
                                    <div>
                                        <span className="block text-sm font-bold text-yellow-800 dark:text-yellow-300">2. Notificación Formal</span>
                                        <span className="text-[10px] text-gray-500">Aviso de incumplimiento. No se ha recibido nueva fecha.</span>
                                    </div>
                                </label>

                                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${protocolLevel === 'cancellation' ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50 border-transparent'}`}>
                                    <input type="radio" name="proto" checked={protocolLevel === 'cancellation'} onChange={() => setProtocolLevel('cancellation')} className="mt-1" />
                                    <div>
                                        <span className="block text-sm font-bold text-red-800 dark:text-red-300">3. Cancelación Definitiva</span>
                                        <span className="text-[10px] text-gray-500">Baja de orden. El paquete será rechazado si llega.</span>
                                    </div>
                                </label>
                            </div>

                            {protocolLevel === 'follow_up' && (
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <label className="text-[10px] font-bold text-blue-700 uppercase mb-1 block">Nueva Fecha Tentativa (ETA)</label>
                                    <input type="date" value={newEta} onChange={e => setNewEta(e.target.value)} className="w-full bg-white border border-blue-200 rounded-lg p-2 text-sm" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Detalles / Bitácora</label>
                                <textarea 
                                    value={reportNotes}
                                    onChange={e => setReportNotes(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm h-20 resize-none outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="Detalla la comunicación con el proveedor..."
                                ></textarea>
                            </div>

                            <button onClick={executeProtocolAction} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-colors">
                                Confirmar Acción
                            </button>
                        </div>
                    )}

                    {/* 2. PROTOCOLO DAÑOS */}
                    {reportReason === 'damaged' && (
                        <div className="space-y-6">
                                <div className="text-center">
                                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="material-icons text-2xl">broken_image</span>
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Reporte de Daños</h3>
                                <p className="text-xs text-gray-500">Especifica el daño y la resolución acordada.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Detalles del Daño</label>
                                <textarea 
                                    value={reportNotes}
                                    onChange={e => setReportNotes(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm h-24 resize-none outline-none focus:ring-2 focus:ring-red-500/20"
                                    placeholder="Descripción del estado del paquete, fotos enviadas, etc..."
                                ></textarea>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">Resolución con Proveedor</p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setDamageAction('resend')}
                                        className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border transition-all ${damageAction === 'resend' ? 'bg-white border-green-500 text-green-700 shadow-sm ring-1 ring-green-500/20' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        Solicitar Reenvío
                                    </button>
                                    <button 
                                        onClick={() => setDamageAction('cancel')}
                                        className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border transition-all ${damageAction === 'cancel' ? 'bg-white border-red-500 text-red-700 shadow-sm ring-1 ring-red-500/20' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        Cancelar Orden
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 text-center">
                                    {damageAction === 'resend' 
                                        ? 'La orden se reiniciará al estado "Enviada" (Placed).' 
                                        : 'La orden se marcará como cancelada definitivamente.'}
                                </p>
                            </div>

                            <button onClick={executeProtocolAction} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-red-700 transition-colors">
                                Registrar Incidencia
                            </button>
                        </div>
                    )}

                    {/* 3. OTROS */}
                    {reportReason === 'other' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Otra Incidencia</h3>
                                <p className="text-xs text-gray-500">Describe el problema y selecciona la conclusión.</p>
                            </div>

                            <textarea 
                                value={reportNotes}
                                onChange={e => setReportNotes(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm h-32 resize-none outline-none focus:ring-2 focus:ring-purple-500/20"
                                placeholder="Detalles del problema..."
                            ></textarea>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Conclusión / Acción Final</label>
                                <select 
                                    value={otherAction} 
                                    onChange={e => setOtherAction(e.target.value as OtherAction)}
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                                >
                                    <option value="wait">Continuar Esperando (Sin cambios)</option>
                                    <option value="investigate">Investigación Interna (Alerta)</option>
                                    <option value="cancel">Cancelar Orden (Baja)</option>
                                </select>
                            </div>

                            <button onClick={executeProtocolAction} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-purple-700 transition-colors">
                                Guardar Reporte
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
