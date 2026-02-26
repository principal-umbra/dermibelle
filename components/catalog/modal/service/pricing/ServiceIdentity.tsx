
import React from 'react';

interface ServiceIdentityProps {
    title: string;
    sku: string;
    category: string;
    updateField: (field: string, value: any) => void;
}

const ServiceIdentity: React.FC<ServiceIdentityProps> = ({ title, sku, category, updateField }) => {
    return (
        <div className="relative z-10 grid grid-cols-12 gap-3">
            <div className="col-span-12">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1 block">Nombre del Servicio</label>
                <input 
                    value={title || ''}
                    onChange={e => updateField('title', e.target.value)}
                    className="w-full text-lg font-display font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-100 dark:border-gray-800 focus:border-primary px-1 py-0.5 outline-none transition-all placeholder:text-gray-300"
                    placeholder="Ej: Facial Hidratante"
                    autoFocus
                />
            </div>

            <div className="col-span-7">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1 block">Categoría</label>
                <div className="relative">
                    <input 
                        value={category || ''}
                        onChange={e => updateField('category', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 px-3 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="Seleccionar..."
                        list="categories-list"
                    />
                </div>
            </div>
            
            <div className="col-span-5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1 block">Código</label>
                <input 
                    value={sku || ''}
                    onChange={e => updateField('sku', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 px-3 text-xs font-mono font-bold uppercase text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="AUTO"
                />
            </div>
        </div>
    );
};

export default ServiceIdentity;
