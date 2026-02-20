import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { useEditor } from '../../context/EditorContext';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Save, 
  Eye, 
  Undo, 
  Redo,
  Upload,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';

export const EditorToolbar = ({ school, page, onSave, onPublish, saving, hasChanges }) => {
  const navigate = useNavigate();
  const { schoolId, pageId } = useParams();
  const { deviceView, setDeviceView } = useEditor();

  const devices = [
    { id: 'desktop', icon: Monitor, label: 'Desktop' },
    { id: 'tablet', icon: Tablet, label: 'Tablet' },
    { id: 'mobile', icon: Smartphone, label: 'Mobile' },
  ];

  return (
    <div className="editor-toolbar" data-testid="editor-toolbar">
      {/* Left: Page Info */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="font-semibold text-slate-900">{school?.name}</h2>
          <p className="text-xs text-slate-500">Editing: {page?.name}</p>
        </div>
        
        {hasChanges && (
          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
            Unsaved changes
          </span>
        )}
      </div>

      {/* Center: Device Preview */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
        {devices.map(device => (
          <Button
            key={device.id}
            variant="ghost"
            size="sm"
            onClick={() => setDeviceView(device.id)}
            className={cn(
              "h-8 px-3 gap-2",
              deviceView === device.id && "bg-white shadow-sm"
            )}
            data-testid={`device-${device.id}`}
          >
            <device.icon className="w-4 h-4" />
            <span className="hidden md:inline text-xs">{device.label}</span>
          </Button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/preview/${schoolId}/${pageId}`)}
          data-testid="preview-btn"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={saving || !hasChanges}
          data-testid="save-btn"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
        
        <Button
          size="sm"
          onClick={onPublish}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="publish-btn"
        >
          <Upload className="w-4 h-4 mr-2" />
          Publish
        </Button>
      </div>
    </div>
  );
};
