
import React, { useState, useEffect } from 'react';
import { PublicProductSection } from '../../../../types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// StrictModeDroppable adapter for React 18+ strict mode compatibility
const StrictModeDroppable = ({ children, ...props }: any) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

interface ProductSectionSidebarProps {
    sections: PublicProductSection[];
    selectedSectionId: string;
    onSelectSection: (id: string) => void;
    onAddSection: () => void;
    onDeleteSection: (id: string) => void;
    onReorder: (startIndex: number, endIndex: number) => void;
}

const ProductSectionSidebar: React.FC<ProductSectionSidebarProps> = ({ 
    sections, selectedSectionId, onSelectSection, onAddSection, onDeleteSection, onReorder 
}) => {
    
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        if (result.destination.index === result.source.index) return;
        onReorder(result.source.index, result.destination.index);
    };

    return (
        <div className="w-64 bg-white dark:bg-black/10 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 h-full">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Colecciones</span>
                <button onClick={onAddSection} className="w-6 h-6 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center hover:text-orange-500 hover:border-orange-500 transition-colors">
                    <span className="material-icons text-xs">add</span>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <DragDropContext onDragEnd={onDragEnd}>
                    <StrictModeDroppable droppableId="product-sections-list">
                        {(provided: any) => (
                            <div 
                                {...provided.droppableProps} 
                                ref={provided.innerRef}
                                className="space-y-2"
                            >
                                {sections.map((section, index) => (
                                    <Draggable key={section.id} draggableId={section.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                onClick={() => onSelectSection(section.id)}
                                                className={`group p-3 rounded-xl border cursor-pointer transition-all relative
                                                    ${snapshot.isDragging ? 'z-50 shadow-xl ring-2 ring-orange-500 bg-white dark:bg-surface-dark' : ''}
                                                    ${selectedSectionId === section.id 
                                                        ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 shadow-sm' 
                                                        : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-700 hover:border-gray-300'}
                                                `}
                                                style={provided.draggableProps.style}
                                            >
                                                <div className="flex items-start gap-2">
                                                    {/* Drag Handle */}
                                                    <div {...provided.dragHandleProps} className="mt-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                                                        <span className="material-icons text-sm">drag_indicator</span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <p className={`text-sm font-bold leading-tight truncate ${selectedSectionId === section.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                                {section.title || 'Sin Título'}
                                                            </p>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); onDeleteSection(section.id); }}
                                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity ml-1"
                                                            >
                                                                <span className="material-icons text-xs">delete</span>
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-1.5">
                                                            <span className="text-[9px] bg-gray-100 dark:bg-white/10 px-1.5 rounded text-gray-500">{section.productIds.length} productos</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </StrictModeDroppable>
                </DragDropContext>
            </div>
        </div>
    );
};

export default ProductSectionSidebar;
