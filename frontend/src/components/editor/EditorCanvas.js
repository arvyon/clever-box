import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditor } from '../../context/EditorContext';
import { ComponentRenderer } from './ComponentRenderer';
import { cn } from '../../lib/utils';
import { Plus, MousePointer, ArrowDown, GripVertical } from 'lucide-react';

// Sortable Component Wrapper
const SortableComponent = ({ component, isSelected, onClick, onUpdate, onRemove, onDuplicate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "ring-2 ring-blue-400 rounded-lg")}>
      {/* Drag Handle */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing z-20 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 hover:opacity-100"
        )}
        {...attributes}
        {...listeners}
      >
        <div className="bg-white/90 backdrop-blur rounded-lg shadow-md p-1.5">
          <GripVertical className="w-5 h-5 text-slate-400" />
        </div>
      </div>
      
      <ComponentRenderer
        component={component}
        isSelected={isSelected}
        onClick={onClick}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onDuplicate={onDuplicate}
      />
    </div>
  );
};

export const EditorCanvas = ({ templates, school }) => {
  const { 
    components, 
    deviceView, 
    selectedComponent, 
    setSelectedComponent,
    updateComponent,
    removeComponent,
    duplicateComponent
  } = useEditor();
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' });

  const sortedComponents = [...components].sort((a, b) => a.order - b.order);

  const deviceClasses = {
    desktop: 'w-full max-w-[1200px]',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  };

  // Get theme colors
  const themeColors = {
    primary: school?.primary_color || '#1D4ED8',
    secondary: school?.secondary_color || '#FBBF24',
  };

  return (
    <div 
      className="editor-canvas custom-scrollbar"
      data-testid="editor-canvas"
      style={{ overflowY: 'auto', height: '100%' }}
    >
      <div 
        ref={setNodeRef}
        className={cn(
          "bg-white rounded-xl shadow-lg min-h-[800px] mx-auto relative",
          deviceClasses[deviceView],
          isOver && "ring-4 ring-blue-400 ring-offset-4 bg-blue-50/30"
        )}
        style={{ 
          marginBottom: '100px',
          '--theme-primary': themeColors.primary,
          '--theme-secondary': themeColors.secondary,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedComponent(null);
          }
        }}
      >
        {sortedComponents.length === 0 ? (
          <div 
            className={cn(
              "flex flex-col items-center justify-center min-h-[600px] p-12 text-center transition-all duration-300 border-2 border-dashed rounded-xl m-4",
              isOver ? "border-blue-400 bg-blue-50" : "border-slate-200"
            )} 
            data-testid="empty-canvas"
          >
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mb-8 transition-all duration-300",
              isOver ? "bg-blue-500 scale-110" : "bg-blue-100"
            )}>
              {isOver ? (
                <ArrowDown className="w-12 h-12 text-white animate-bounce" />
              ) : (
                <MousePointer className="w-12 h-12 text-blue-600" />
              )}
            </div>
            <h3 className={cn(
              "text-2xl font-bold mb-4",
              isOver ? "text-blue-600" : "text-slate-700"
            )}>
              {isOver ? "Release to Add!" : "Start Building Your Page"}
            </h3>
            <p className="text-slate-500 mb-8 max-w-md text-lg">
              {isOver 
                ? "Let go to add this component to your page" 
                : "Drag widgets from the left panel and drop them here"
              }
            </p>
            <div className={cn(
              "flex items-center gap-3 text-lg font-semibold px-6 py-3 rounded-full transition-all duration-300",
              isOver ? "bg-blue-600 text-white scale-105" : "bg-blue-100 text-blue-600"
            )}>
              <Plus className="w-5 h-5" />
              <span>{isOver ? "Drop Here!" : "Drag & Drop to Start"}</span>
            </div>
          </div>
        ) : (
          <div className="pb-20">
            {/* Reorder Instructions */}
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center gap-2 text-sm text-blue-600">
              <GripVertical className="w-4 h-4" />
              <span>Drag the handle on the left to reorder components</span>
            </div>
            
            {sortedComponents.map((component, index) => (
              <SortableComponent
                key={component.id}
                component={component}
                isSelected={selectedComponent === component.id}
                onClick={() => setSelectedComponent(component.id)}
                onUpdate={updateComponent}
                onRemove={removeComponent}
                onDuplicate={duplicateComponent}
              />
            ))}
            
            {/* Drop zone at bottom when dragging */}
            {isOver && (
              <div className="mx-4 mt-4 h-32 border-3 border-dashed border-blue-400 bg-blue-50 rounded-xl flex flex-col items-center justify-center animate-pulse">
                <ArrowDown className="w-8 h-8 text-blue-500 mb-2 animate-bounce" />
                <span className="text-blue-600 font-semibold text-lg">Drop here to add</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Floating indicator when dragging */}
      {isOver && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-blue-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
            <ArrowDown className="w-6 h-6" />
            <span className="font-bold text-lg">Drop to Add Component</span>
          </div>
        </div>
      )}
    </div>
  );
};
