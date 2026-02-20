import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorProvider, useEditor } from '../context/EditorContext';
import { getPage, getSchool, updatePage, getComponentTemplates, getThemes, updateSchoolTheme, uploadImage } from '../lib/api';
import { WidgetsSidebar } from '../components/editor/WidgetsSidebar';
import { EditorCanvas } from '../components/editor/EditorCanvas';
import { PropertiesPanel } from '../components/editor/PropertiesPanel';
import { EditorToolbar } from '../components/editor/EditorToolbar';
import { ThemeSelector } from '../components/editor/ThemeSelector';
import { DndContext, DragOverlay, pointerWithin, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { 
  Image, Type, Heading, MousePointerClick, Grid3X3, Images, 
  Bell, Calendar, Users, Mail, PanelBottom, SeparatorHorizontal 
} from 'lucide-react';

const iconMap = {
  Image: Image, Type: Type, Heading: Heading, ImageIcon: Image,
  MousePointerClick: MousePointerClick, Grid3X3: Grid3X3, Images: Images,
  Bell: Bell, Calendar: Calendar, Users: Users, Mail: Mail,
  PanelBottom: PanelBottom, SeparatorHorizontal: SeparatorHorizontal,
};

function EditorContent() {
  const { schoolId, pageId } = useParams();
  const navigate = useNavigate();
  const { 
    components, 
    loadComponents, 
    addComponent, 
    moveComponent,
    selectedComponent,
    setHasChanges,
    hasChanges 
  } = useEditor();
  
  const [school, setSchool] = useState(null);
  const [page, setPage] = useState(null);
  const [templates, setTemplates] = useState({ widgets: [], categories: [] });
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeWidget, setActiveWidget] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  useEffect(() => {
    loadData();
  }, [schoolId, pageId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schoolData, pageData, templatesData, themesData] = await Promise.all([
        getSchool(schoolId),
        getPage(pageId),
        getComponentTemplates(),
        getThemes()
      ]);
      
      setSchool(schoolData);
      setPage(pageData);
      setTemplates(templatesData);
      setThemes(themesData.themes || []);
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

  const handleThemeChange = async (themeId) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme || !schoolId) return;
    
    try {
      await updateSchoolTheme(schoolId, {
        theme: themeId,
        primary_color: theme.colors.primary,
        secondary_color: theme.colors.secondary
      });
      setSchool(prev => ({
        ...prev,
        theme: themeId,
        primary_color: theme.colors.primary,
        secondary_color: theme.colors.secondary
      }));
      toast.success(`Theme changed to ${theme.name}`);
      setShowThemeSelector(false);
    } catch (err) {
      toast.error('Failed to update theme');
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    
    // Check if it's a widget from sidebar
    const widget = templates.widgets.find(w => w.type === active.id);
    if (widget) {
      setActiveWidget(widget);
      setActiveId(null);
    } else {
      // It's a component being reordered
      setActiveWidget(null);
      setActiveId(active.id);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveWidget(null);
    setActiveId(null);
    
    if (!over) return;

    // Adding new widget from sidebar
    const widget = templates.widgets.find(w => w.type === active.id);
    if (widget && over.id === 'canvas-drop-zone') {
      addComponent(widget.type, { ...widget.defaultProps });
      toast.success(`${widget.name} added!`);
      return;
    }
    
    // Reordering existing components
    if (active.id !== over.id && !widget) {
      const oldIndex = components.findIndex(c => c.id === active.id);
      const newIndex = components.findIndex(c => c.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        moveComponent(oldIndex, newIndex);
        toast.success('Component reordered');
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

  const sortedComponents = [...components].sort((a, b) => a.order - b.order);

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
            onThemeClick={() => setShowThemeSelector(true)}
          />
          <SortableContext 
            items={sortedComponents.map(c => c.id)} 
            strategy={verticalListSortingStrategy}
          >
            <EditorCanvas templates={templates} school={school} />
          </SortableContext>
        </div>
        
        {/* Right Sidebar - Properties */}
        {selectedComponent && (
          <PropertiesPanel templates={templates} />
        )}
        
        {/* Theme Selector Modal */}
        {showThemeSelector && (
          <ThemeSelector
            themes={themes}
            currentTheme={school?.theme || 'default'}
            onSelect={handleThemeChange}
            onClose={() => setShowThemeSelector(false)}
          />
        )}
      </div>
      
      {/* Drag Overlay */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeWidget && (
          <div className="bg-white border-2 border-blue-500 rounded-xl p-4 shadow-2xl flex items-center gap-3 min-w-[200px]">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              {iconMap[activeWidget.icon] && React.createElement(iconMap[activeWidget.icon], {
                className: "w-6 h-6 text-white"
              })}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{activeWidget.name}</p>
              <p className="text-xs text-blue-600">Drop on canvas to add</p>
            </div>
          </div>
        )}
        {activeId && (
          <div className="bg-blue-100 border-2 border-blue-500 rounded-xl p-4 shadow-2xl">
            <p className="font-semibold text-blue-600">Moving component...</p>
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
