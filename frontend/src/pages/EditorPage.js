import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorProvider, useEditor } from '../context/EditorContext';
import { getPage, getSchool, updatePage, getComponentTemplates } from '../lib/api';
import { WidgetsSidebar } from '../components/editor/WidgetsSidebar';
import { EditorCanvas } from '../components/editor/EditorCanvas';
import { PropertiesPanel } from '../components/editor/PropertiesPanel';
import { EditorToolbar } from '../components/editor/EditorToolbar';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { toast } from 'sonner';

function EditorContent() {
  const { schoolId, pageId } = useParams();
  const navigate = useNavigate();
  const { 
    components, 
    loadComponents, 
    addComponent, 
    selectedComponent,
    setHasChanges,
    hasChanges 
  } = useEditor();
  
  const [school, setSchool] = useState(null);
  const [page, setPage] = useState(null);
  const [templates, setTemplates] = useState({ widgets: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeWidget, setActiveWidget] = useState(null);

  useEffect(() => {
    loadData();
  }, [schoolId, pageId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schoolData, pageData, templatesData] = await Promise.all([
        getSchool(schoolId),
        getPage(pageId),
        getComponentTemplates()
      ]);
      
      setSchool(schoolData);
      setPage(pageData);
      setTemplates(templatesData);
      loadComponents(pageData.components || []);
    } catch (err) {
      console.error('Failed to load editor data:', err);
      toast.error('Failed to load page data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!pageId || saving) return;
    
    setSaving(true);
    try {
      await updatePage(pageId, { components });
      setHasChanges(false);
      toast.success('Page saved successfully!');
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Failed to save page');
    } finally {
      setSaving(false);
    }
  }, [pageId, components, saving, setHasChanges]);

  const handlePublish = useCallback(async () => {
    if (!pageId) return;
    
    setSaving(true);
    try {
      await updatePage(pageId, { components, is_published: true });
      setHasChanges(false);
      toast.success('Page published successfully!');
    } catch (err) {
      console.error('Failed to publish:', err);
      toast.error('Failed to publish page');
    } finally {
      setSaving(false);
    }
  }, [pageId, components, setHasChanges]);

  const handleDragStart = (event) => {
    const { active } = event;
    const widget = templates.widgets.find(w => w.type === active.id);
    if (widget) {
      setActiveWidget(widget);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveWidget(null);
    
    if (over && over.id === 'canvas-drop-zone') {
      const widget = templates.widgets.find(w => w.type === active.id);
      if (widget) {
        addComponent(widget.type, { ...widget.defaultProps });
        toast.success(`${widget.name} added!`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="editor-layout">
        {/* Left Sidebar - Widgets */}
        <WidgetsSidebar 
          templates={templates} 
          onBack={() => navigate('/dashboard')}
        />
        
        {/* Center - Canvas */}
        <div className="editor-canvas-wrapper">
          <EditorToolbar 
            school={school}
            page={page}
            onSave={handleSave}
            onPublish={handlePublish}
            saving={saving}
            hasChanges={hasChanges}
          />
          <EditorCanvas templates={templates} />
        </div>
        
        {/* Right Sidebar - Properties */}
        {selectedComponent && (
          <PropertiesPanel templates={templates} />
        )}
      </div>
      
      {/* Drag Overlay */}
      <DragOverlay>
        {activeWidget && (
          <div className="drag-overlay">
            <span className="text-blue-600 font-medium">{activeWidget.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default function EditorPage() {
  return (
    <EditorProvider>
      <EditorContent />
    </EditorProvider>
  );
}
