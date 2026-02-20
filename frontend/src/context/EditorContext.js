import React, { createContext, useContext, useState, useCallback } from 'react';
import { generateId } from '../lib/utils';

const EditorContext = createContext(null);

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
};

export const EditorProvider = ({ children }) => {
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [deviceView, setDeviceView] = useState('desktop');
  const [isDragging, setIsDragging] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const addComponent = useCallback((type, props = {}, index = null) => {
    const newComponent = {
      id: generateId(),
      type,
      props,
      order: index !== null ? index : components.length,
    };
    
    setComponents(prev => {
      const updated = [...prev];
      if (index !== null) {
        updated.splice(index, 0, newComponent);
        // Update order for all components
        return updated.map((comp, idx) => ({ ...comp, order: idx }));
      }
      return [...updated, newComponent];
    });
    setSelectedComponent(newComponent.id);
    setHasChanges(true);
    return newComponent.id;
  }, [components.length]);

  const updateComponent = useCallback((id, props) => {
    setComponents(prev =>
      prev.map(comp =>
        comp.id === id ? { ...comp, props: { ...comp.props, ...props } } : comp
      )
    );
    setHasChanges(true);
  }, []);

  const removeComponent = useCallback((id) => {
    setComponents(prev => {
      const filtered = prev.filter(comp => comp.id !== id);
      return filtered.map((comp, idx) => ({ ...comp, order: idx }));
    });
    if (selectedComponent === id) {
      setSelectedComponent(null);
    }
    setHasChanges(true);
  }, [selectedComponent]);

  const moveComponent = useCallback((fromIndex, toIndex) => {
    setComponents(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return updated.map((comp, idx) => ({ ...comp, order: idx }));
    });
    setHasChanges(true);
  }, []);

  const duplicateComponent = useCallback((id) => {
    const component = components.find(c => c.id === id);
    if (component) {
      const index = components.findIndex(c => c.id === id);
      const newId = addComponent(component.type, { ...component.props }, index + 1);
      return newId;
    }
    return null;
  }, [components, addComponent]);

  const loadComponents = useCallback((comps) => {
    setComponents(comps.sort((a, b) => a.order - b.order));
    setHasChanges(false);
  }, []);

  const clearComponents = useCallback(() => {
    setComponents([]);
    setSelectedComponent(null);
    setHasChanges(true);
  }, []);

  const value = {
    components,
    selectedComponent,
    deviceView,
    isDragging,
    hasChanges,
    setSelectedComponent,
    setDeviceView,
    setIsDragging,
    setHasChanges,
    addComponent,
    updateComponent,
    removeComponent,
    moveComponent,
    duplicateComponent,
    loadComponents,
    clearComponents,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};
