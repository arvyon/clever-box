import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useEditor } from '../../context/EditorContext';
import { ComponentRenderer } from './ComponentRenderer';
import { cn } from '../../lib/utils';
import { Plus, MousePointer, ArrowDown } from 'lucide-react';

// Drop zone between components
const DropZone = ({ index, isOver }) => {
  return (
    <div 
      className={cn(
        "transition-all duration-200 mx-4",
        isOver ? "h-20 bg-blue-50 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center my-2" : "h-1"
      )}
    >
      {isOver && (
        <div className="flex items-center gap-2 text-blue-600 text-sm font-medium animate-pulse">
          <ArrowDown className="w-4 h-4" />
          <span>Drop here to add</span>
        </div>
      )}
    </div>
  );
};

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
  const [hoveredDropZone, setHoveredDropZone] = useState(null);

  const sortedComponents = [...components].sort((a, b) => a.order - b.order);

  const deviceClasses = {
    desktop: 'canvas-desktop',
    tablet: 'canvas-tablet',
    mobile: 'canvas-mobile',
  };

  return (
    <div className="editor-canvas custom-scrollbar" data-testid="editor-canvas">
      <div 
        ref={setNodeRef}
        className={cn(
          "canvas-container device-frame",
          deviceClasses[deviceView],
          isOver && "ring-2 ring-blue-400 ring-offset-4"
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedComponent(null);
          }
        }}
      >
        {sortedComponents.length === 0 ? (
          <div 
            className={cn(
              "empty-canvas transition-all duration-300",
              isOver && "bg-blue-50 border-blue-400"
            )} 
            data-testid="empty-canvas"
          >
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300",
              isOver ? "bg-blue-100 scale-110" : "bg-blue-50"
            )}>
              {isOver ? (
                <ArrowDown className="w-10 h-10 text-blue-600 animate-bounce" />
              ) : (
                <MousePointer className="w-10 h-10 text-blue-600" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              {isOver ? "Drop to Add Component" : "Start Building Your Page"}
            </h3>
            <p className="text-slate-500 mb-6 max-w-md text-center">
              {isOver 
                ? "Release to add this component to your page" 
                : "Drag widgets from the left sidebar and drop them here to build your school website"
              }
            </p>
            <div className={cn(
              "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-all duration-300",
              isOver ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
            )}>
              <Plus className="w-4 h-4" />
              <span>{isOver ? "Drop Now!" : "Drag & Drop Widgets"}</span>
            </div>
          </div>
        ) : (
          <div className="min-h-[600px] pb-8">
            {/* Drop zone at top */}
            <DropZone index={0} isOver={isOver && hoveredDropZone === 0} />
            
            {sortedComponents.map((component, index) => (
              <React.Fragment key={component.id}>
                <ComponentRenderer
                  component={component}
                  isSelected={selectedComponent === component.id}
                  onClick={() => setSelectedComponent(component.id)}
                  index={index}
                  onUpdate={updateComponent}
                  onRemove={removeComponent}
                  onDuplicate={duplicateComponent}
                />
                {/* Drop zone after each component */}
                <DropZone index={index + 1} isOver={isOver && hoveredDropZone === index + 1} />
              </React.Fragment>
            ))}
            
            {/* Main drop indicator when dragging */}
            {isOver && (
              <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce z-50">
                <ArrowDown className="w-5 h-5" />
                <span className="font-medium">Drop to add component</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
