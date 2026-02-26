
import React from 'react';
import { useWiki } from '../../hooks/operations/useWiki';

const WikiTab: React.FC = () => {
  const { articles, searchTerm, setSearchTerm, selectedCategory, setSelectedCategory } = useWiki();

  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'Procesos': return 'settings';
          case 'Servicio': return 'spa';
          case 'Producto': return 'science';
          case 'ADN Marca': return 'fingerprint';
          default: return 'article';
      }
  };

  const getCategoryColor = (cat: string) => {
      switch(cat) {
          case 'Procesos': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300';
          case 'Servicio': return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300';
          case 'Producto': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300';
          case 'ADN Marca': return 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-300';
          default: return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
      }
  };

  return (
    <div className="flex flex-col h-full gap-4 max-w-5xl mx-auto w-full overflow-y-auto pr-2 custom-scrollbar pb-4">
      
      {/* Search Hero - Compacted */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
         <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">Base de Conocimiento</h2>
         
         <div className="flex gap-4">
             <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 group-focus-within:text-primary">search</span>
                </div>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar protocolo, ingrediente o guía..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
             </div>
             
             {/* Category Pills - Inline */}
             <div className="hidden md:flex gap-2">
                {['Procesos', 'Servicio', 'Producto', 'ADN Marca'].map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                            ${selectedCategory === cat 
                                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black' 
                                : 'bg-white dark:bg-surface-dark text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'}
                        `}
                    >
                        {cat}
                    </button>
                ))}
             </div>
         </div>
      </div>

      {/* Results List - Dense */}
      <div className="flex-1">
         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            {searchTerm || selectedCategory ? 'Resultados' : 'Documentos Recientes'}
         </h3>
         
         <div className="space-y-2">
            {articles.map(article => (
               <div key={article.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-all cursor-pointer group flex items-start gap-4">
                  
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getCategoryColor(article.category)}`}>
                      <span className="material-icons text-lg">{getCategoryIcon(article.category)}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-primary transition-colors">{article.title}</h4>
                          <span className="text-[10px] text-gray-400">{article.lastUpdate}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{article.content}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 rounded text-gray-500 border border-gray-100 dark:border-gray-700 uppercase">{article.category}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1"><span className="material-icons text-[10px]">visibility</span> {article.views}</span>
                      </div>
                  </div>

                  {/* Actions (Hover) */}
                  <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity px-2">
                      <button className="text-gray-400 hover:text-primary"><span className="material-icons text-lg">chevron_right</span></button>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default WikiTab;
