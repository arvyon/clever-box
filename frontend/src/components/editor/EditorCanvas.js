import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useEditor } from '../../context/EditorContext';
import { ComponentRenderer } from './ComponentRenderer';
import { cn } from '../../lib/utils';
import { Plus, MousePointer } from 'lucide-react';

export const EditorCanvas = ({ templates }) => {
  const { components, deviceView, selectedComponent, setSelectedComponent } = useEditor();
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' });

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
          isOver && "drop-target"
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedComponent(null);
          }
        }}
      >
        {sortedComponents.length === 0 ? (
          <div className="empty-canvas" data-testid="empty-canvas">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <MousePointer className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Start Building</h3>
            <p className="text-slate-500 mb-4 max-w-sm">
              Drag and drop widgets from the left sidebar to start creating your school website
            </p>
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
              <Plus className="w-4 h-4" />
              <span>Drop a widget here</span>
            </div>
          </div>
        ) : (
          <div className="min-h-[600px]">
            {sortedComponents.map((component, index) => (
              <ComponentRenderer
                key={component.id}
                component={component}
                isSelected={selectedComponent === component.id}
                onClick={() => setSelectedComponent(component.id)}
                index={index}
              />
            ))}
            
            {/* Drop indicator at bottom */}
            {isOver && (
              <div className="h-24 border-2 border-dashed border-blue-400 bg-blue-50/50 rounded-lg m-4 flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">Drop here</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
