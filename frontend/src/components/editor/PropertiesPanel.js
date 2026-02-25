import React, { useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { uploadImage } from '../../lib/api';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  X, 
  Trash2, 
  Copy, 
  Settings, 
  Type,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  Upload,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

// Image Upload Component
const ImageUpload = ({ value, onChange, label }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = React.useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file);
      // result.url is already the full public URL from Supabase Storage
      onChange(result.url);
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL or upload..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      {value && (
        <div className="mt-2 rounded-lg overflow-hidden border border-slate-200">
          <img src={value} alt="Preview" className="w-full h-24 object-cover" />
        </div>
      )}
    </div>
  );
};

export const PropertiesPanel = ({ templates }) => {
  const { 
    components, 
    selectedComponent, 
    setSelectedComponent, 
    updateComponent, 
    removeComponent,
    duplicateComponent 
  } = useEditor();

  const component = components.find(c => c.id === selectedComponent);
  
  if (!component) return null;

  const widget = templates.widgets.find(w => w.type === component.type);
  const props = component.props || {};

  const handlePropChange = (key, value) => {
    updateComponent(component.id, { [key]: value });
  };

  const handleNestedChange = (parentKey, index, key, value) => {
    const arr = [...(props[parentKey] || [])];
    arr[index] = { ...arr[index], [key]: value };
    updateComponent(component.id, { [parentKey]: arr });
  };

  const addArrayItem = (key, defaultItem) => {
    const arr = [...(props[key] || []), defaultItem];
    updateComponent(component.id, { [key]: arr });
  };

  const removeArrayItem = (key, index) => {
    const arr = [...(props[key] || [])];
    arr.splice(index, 1);
    updateComponent(component.id, { [key]: arr });
  };

  return (
    <div className="editor-properties flex flex-col" data-testid="properties-panel">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-900">Properties</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedComponent(null)}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Component Type Badge */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="component-type-badge">
          <Type className="w-3 h-3" />
          {widget?.name || component.type}
        </div>
      </div>

      {/* Properties */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-4 space-y-4">
          {/* Common text properties */}
          {(component.type === 'text' || component.type === 'heading') && (
            <>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={props.content || ''}
                  onChange={(e) => handlePropChange('content', e.target.value)}
                  placeholder="Enter text..."
                  rows={3}
                  data-testid="prop-content"
                />
              </div>
              <div className="space-y-2">
                <Label>Alignment</Label>
                <div className="flex gap-1">
                  {['left', 'center', 'right'].map(align => (
                    <Button
                      key={align}
                      variant={props.align === align ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePropChange('align', align)}
                      className={cn(
                        "flex-1",
                        props.align === align && "bg-blue-600"
                      )}
                    >
                      {align === 'left' && <AlignLeft className="w-4 h-4" />}
                      {align === 'center' && <AlignCenter className="w-4 h-4" />}
                      {align === 'right' && <AlignRight className="w-4 h-4" />}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Hero properties */}
          {component.type === 'hero' && (
            <>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={props.title || ''}
                  onChange={(e) => handlePropChange('title', e.target.value)}
                  placeholder="Hero title..."
                  data-testid="prop-hero-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  value={props.subtitle || ''}
                  onChange={(e) => handlePropChange('subtitle', e.target.value)}
                  placeholder="Hero subtitle..."
                  rows={2}
                  data-testid="prop-hero-subtitle"
                />
              </div>
              <ImageUpload
                label="Background Image"
                value={props.backgroundImage || ''}
                onChange={(url) => handlePropChange('backgroundImage', url)}
              />
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={props.buttonText || ''}
                  onChange={(e) => handlePropChange('buttonText', e.target.value)}
                  placeholder="Button text..."
                />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input
                  value={props.buttonLink || ''}
                  onChange={(e) => handlePropChange('buttonLink', e.target.value)}
                  placeholder="#section or https://..."
                />
              </div>
            </>
          )}

          {/* Image properties */}
          {component.type === 'image' && (
            <>
              <ImageUpload
                label="Image"
                value={props.src || ''}
                onChange={(url) => handlePropChange('src', url)}
              />
              <div className="space-y-2">
                <Label>Alt Text</Label>
                <Input
                  value={props.alt || ''}
                  onChange={(e) => handlePropChange('alt', e.target.value)}
                  placeholder="Image description..."
                />
              </div>
            </>
          )}

          {/* Button properties */}
          {component.type === 'button' && (
            <>
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={props.text || ''}
                  onChange={(e) => handlePropChange('text', e.target.value)}
                  placeholder="Button text..."
                  data-testid="prop-button-text"
                />
              </div>
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input
                  value={props.link || ''}
                  onChange={(e) => handlePropChange('link', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={props.variant || 'primary'} onValueChange={(v) => handlePropChange('variant', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Features properties */}
          {component.type === 'features' && (
            <>
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={props.title || ''}
                  onChange={(e) => handlePropChange('title', e.target.value)}
                  placeholder="Section title..."
                  data-testid="prop-features-title"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Features</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('features', { icon: 'Star', title: 'New Feature', description: 'Description' })}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {(props.features || []).map((feature, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Feature {idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem('features', idx)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input
                      value={feature.title || ''}
                      onChange={(e) => handleNestedChange('features', idx, 'title', e.target.value)}
                      placeholder="Title"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={feature.description || ''}
                      onChange={(e) => handleNestedChange('features', idx, 'description', e.target.value)}
                      placeholder="Description"
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Gallery properties */}
          {component.type === 'gallery' && (
            <>
              <div className="space-y-2">
                <Label>Gallery Title</Label>
                <Input
                  value={props.title || ''}
                  onChange={(e) => handlePropChange('title', e.target.value)}
                  placeholder="Gallery title..."
                  data-testid="prop-gallery-title"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Images</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const images = [...(props.images || []), 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400'];
                      handlePropChange('images', images);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {(props.images || []).map((img, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={img}
                      onChange={(e) => {
                        const images = [...(props.images || [])];
                        images[idx] = e.target.value;
                        handlePropChange('images', images);
                      }}
                      placeholder="Image URL"
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const images = [...(props.images || [])];
                        images.splice(idx, 1);
                        handlePropChange('images', images);
                      }}
                      className="h-10 w-10 p-0 text-red-500"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Announcements properties */}
          {component.type === 'announcements' && (
            <>
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={props.title || ''}
                  onChange={(e) => handlePropChange('title', e.target.value)}
                  placeholder="Announcements title..."
                  data-testid="prop-announcements-title"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('items', { title: 'New Announcement', date: 'Jan 1, 2026', excerpt: 'Description...' })}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {(props.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Item {idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem('items', idx)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input
                      value={item.title || ''}
                      onChange={(e) => handleNestedChange('items', idx, 'title', e.target.value)}
                      placeholder="Title"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={item.date || ''}
                      onChange={(e) => handleNestedChange('items', idx, 'date', e.target.value)}
                      placeholder="Date"
                      className="h-8 text-sm"
                    />
                    <Textarea
                      value={item.excerpt || ''}
                      onChange={(e) => handleNestedChange('items', idx, 'excerpt', e.target.value)}
                      placeholder="Description"
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Contact properties */}
          {component.type === 'contact' && (
            <>
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={props.title || ''}
                  onChange={(e) => handlePropChange('title', e.target.value)}
                  placeholder="Contact Us"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={props.address || ''}
                  onChange={(e) => handlePropChange('address', e.target.value)}
                  placeholder="School address..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={props.phone || ''}
                  onChange={(e) => handlePropChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={props.email || ''}
                  onChange={(e) => handlePropChange('email', e.target.value)}
                  placeholder="info@school.edu"
                />
              </div>
            </>
          )}

          {/* Spacer properties */}
          {component.type === 'spacer' && (
            <div className="space-y-2">
              <Label>Height (px)</Label>
              <Input
                type="number"
                value={props.height || '60'}
                onChange={(e) => handlePropChange('height', e.target.value)}
                placeholder="60"
                data-testid="prop-spacer-height"
              />
            </div>
          )}

          {/* Staff properties */}
          {component.type === 'staff' && (
            <>
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={props.title || ''}
                  onChange={(e) => handlePropChange('title', e.target.value)}
                  placeholder="Meet Our Team"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Staff Members</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('staff', { name: 'New Staff', role: 'Teacher', image: '' })}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {(props.staff || []).map((person, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Staff {idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem('staff', idx)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input
                      value={person.name || ''}
                      onChange={(e) => handleNestedChange('staff', idx, 'name', e.target.value)}
                      placeholder="Name"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={person.role || ''}
                      onChange={(e) => handleNestedChange('staff', idx, 'role', e.target.value)}
                      placeholder="Role"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={person.image || ''}
                      onChange={(e) => handleNestedChange('staff', idx, 'image', e.target.value)}
                      placeholder="Image URL"
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Events properties */}
          {component.type === 'events' && (
            <>
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={props.title || ''}
                  onChange={(e) => handlePropChange('title', e.target.value)}
                  placeholder="Upcoming Events"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Events</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('events', { title: 'New Event', date: '2026-01-15', time: '10:00 AM' })}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {(props.events || []).map((event, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Event {idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem('events', idx)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input
                      value={event.title || ''}
                      onChange={(e) => handleNestedChange('events', idx, 'title', e.target.value)}
                      placeholder="Event Title"
                      className="h-8 text-sm"
                    />
                    <Input
                      type="date"
                      value={event.date || ''}
                      onChange={(e) => handleNestedChange('events', idx, 'date', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      value={event.time || ''}
                      onChange={(e) => handleNestedChange('events', idx, 'time', e.target.value)}
                      placeholder="Time"
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer properties */}
          {component.type === 'footer' && (
            <>
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input
                  value={props.schoolName || ''}
                  onChange={(e) => handlePropChange('schoolName', e.target.value)}
                  placeholder="School name"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={props.address || ''}
                  onChange={(e) => handlePropChange('address', e.target.value)}
                  placeholder="Address"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={props.phone || ''}
                  onChange={(e) => handlePropChange('phone', e.target.value)}
                  placeholder="Phone"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={props.email || ''}
                  onChange={(e) => handlePropChange('email', e.target.value)}
                  placeholder="Email"
                />
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t border-slate-200 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => duplicateComponent(component.id)}
          className="flex-1"
          data-testid="duplicate-component-btn"
        >
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => removeComponent(component.id)}
          className="flex-1"
          data-testid="delete-component-btn"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
};
