import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  ArrowLeft, 
  Search,
  Image,
  Type,
  Heading,
  MousePointerClick,
  Grid3X3,
  Images,
  Bell,
  Calendar,
  Users,
  Mail,
  PanelBottom,
  SeparatorHorizontal,
  GraduationCap,
  GripVertical
} from 'lucide-react';
import { cn } from '../../lib/utils';

const iconMap = {
  Image: Image,
  Type: Type,
  Heading: Heading,
  ImageIcon: Image,
  MousePointerClick: MousePointerClick,
  Grid3X3: Grid3X3,
  Images: Images,
  Bell: Bell,
  Calendar: Calendar,
  Users: Users,
  Mail: Mail,
  PanelBottom: PanelBottom,
  SeparatorHorizontal: SeparatorHorizontal,
};

const DraggableWidget = ({ widget }) => {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: widget.type,
    data: widget,
  });

  const IconComponent = iconMap[widget.icon] || Grid3X3;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={cn(
        "widget-card flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-grab active:cursor-grabbing bg-white relative group",
        isDragging 
          ? "border-blue-500 shadow-2xl scale-105 opacity-90 rotate-2" 
          : "border-slate-200 hover:border-blue-400 hover:shadow-lg"
      )}
      data-testid={`widget-${widget.type}`}
    >
      {/* Drag handle indicator */}
      <div className={cn(
        "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity",
        isDragging && "opacity-100"
      )}>
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>
      
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-200",
        isDragging ? "bg-blue-600 scale-110" : "bg-blue-50 group-hover:bg-blue-100"
      )}>
        <IconComponent className={cn(
          "w-6 h-6 transition-colors",
          isDragging ? "text-white" : "text-blue-600"
        )} />
      </div>
      <span className={cn(
        "text-sm font-medium text-center transition-colors",
        isDragging ? "text-blue-600" : "text-slate-700"
      )}>
        {widget.name}
      </span>
      
      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
          Dragging...
        </div>
      )}
    </div>
  );
};

export const WidgetsSidebar = ({ templates, onBack }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const filteredWidgets = templates.widgets.filter(widget => {
    const matchesSearch = widget.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'All' },
    ...templates.categories
  ];

  return (
    <div className="editor-sidebar flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-8 w-8 p-0"
            data-testid="editor-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Widgets</span>
          </div>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="widget-search-input"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 border-b border-slate-200 flex gap-2 overflow-x-auto">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "whitespace-nowrap text-xs",
              selectedCategory === cat.id && "bg-blue-600 text-white"
            )}
            data-testid={`category-${cat.id}`}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Widgets Grid */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-4">
          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider flex items-center gap-2">
            <GripVertical className="w-3 h-3" />
            Drag to canvas
          </p>
          <div className="grid grid-cols-2 gap-3">
            {filteredWidgets.map(widget => (
              <DraggableWidget key={widget.type} widget={widget} />
            ))}
          </div>
          
          {filteredWidgets.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p>No widgets found</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with instructions */}
      <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MousePointerClick className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Drag & Drop</p>
            <p className="text-xs text-slate-500">Grab a widget and drop it on the canvas</p>
          </div>
        </div>
      </div>
    </div>
  );
};
