
import React, { useState } from 'react';

export const TransitPreparation: React.FC = () => {
    const [tasks, setTasks] = useState([
        { id: 1, label: 'Verificar espacio en estantería', done: false },
        { id: 2, label: 'Imprimir orden de compra', done: true },
        { id: 3, label: 'Notificar a equipo de descarga', done: false },
        { id: 4, label: 'Preparar zona de cuarentena', done: false },
        { id: 5, label: 'Revisar etiquetas de lote', done: false },
    ]);

    const toggleTask = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const progress = Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex flex-col shadow-sm h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <span className="material-icons text-sm">checklist</span>
                    </div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Protocolo Pre-Arribo
                    </h3>
                </div>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">{progress}%</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                {tasks.map(task => (
                    <div 
                        key={task.id} 
                        onClick={() => toggleTask(task.id)}
                        className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                            task.done 
                            ? 'bg-gray-50/50 border-transparent dark:bg-white/5 opacity-60' 
                            : 'bg-white border-gray-100 dark:bg-transparent dark:border-gray-700 hover:border-indigo-200 hover:shadow-sm'
                        }`}
                    >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                            task.done ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-gray-300 group-hover:border-indigo-400'
                        }`}>
                            {task.done && <span className="material-icons text-[12px] font-bold">check</span>}
                        </div>
                        <span className={`text-[11px] font-medium leading-tight select-none ${task.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                            {task.label}
                        </span>
                    </div>
                ))}
            </div>
            
            {/* Footer gradient hint */}
            <div className="h-4 bg-gradient-to-t from-white dark:from-surface-dark to-transparent shrink-0 -mt-4 pointer-events-none"></div>
        </div>
    );
};
