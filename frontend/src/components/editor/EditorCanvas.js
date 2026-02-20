import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useEditor } from '../../context/EditorContext';
import { ComponentRenderer } from './ComponentRenderer';
import { cn } from '../../lib/utils';
import { Plus, MousePointer, ArrowDown } from 'lucide-react';

export const EditorCanvas = ({ templates }) => {
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

  return (
    <div 
      className="editor-canvas custom-scrollbar"
      data-testid="editor-canvas"
      style={{ overflowY: 'auto', height: '100%' }}
    >
      <div 
        ref={setNodeRef}
        className={cn(
          "bg-white rounded-xl shadow-lg min-h-[800px] mx-auto",
          deviceClasses[deviceView],
          isOver && "ring-4 ring-blue-400 ring-offset-4 bg-blue-50/30"
        )}
        style={{ marginBottom: '100px' }}
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
            {sortedComponents.map((component, index) => (
              <ComponentRenderer
                key={component.id}
                component={component}
                isSelected={selectedComponent === component.id}
                onClick={() => setSelectedComponent(component.id)}
                index={index}
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
