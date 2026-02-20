import React, { useState, createContext, useContext } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

// Safe hook to use editor context - returns null if not in provider
const EditorContext = createContext(null);
const useEditorSafe = () => {
  try {
    const { useEditor } = require('../../context/EditorContext');
    return useEditor();
  } catch {
    return null;
  }
};
import { 
  GripVertical, 
  Trash2, 
  Copy, 
  GraduationCap, 
  Users, 
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Bell,
  Facebook,
  Twitter,
  Instagram
} from 'lucide-react';

// Hero Component
const HeroComponent = ({ props, isPreview, onInlineEdit }) => {
  const { title, subtitle, backgroundImage, buttonText, buttonLink } = props;
  
  return (
    <div 
      className="preview-hero relative flex items-center justify-center min-h-[400px] md:min-h-[500px]"
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/70" />
      <div className="relative z-10 text-center text-white px-6 py-12 max-w-4xl mx-auto">
        <h1 
          className={cn(
            "text-3xl md:text-5xl lg:text-6xl font-bold mb-4",
            !isPreview && "inline-editable"
          )}
          contentEditable={!isPreview}
          suppressContentEditableWarning
          onBlur={(e) => !isPreview && onInlineEdit?.('title', e.target.innerText)}
          data-testid="hero-title"
        >
          {title}
        </h1>
        <p 
          className={cn(
            "text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto",
            !isPreview && "inline-editable"
          )}
          contentEditable={!isPreview}
          suppressContentEditableWarning
          onBlur={(e) => !isPreview && onInlineEdit?.('subtitle', e.target.innerText)}
        >
          {subtitle}
        </p>
        {buttonText && (
          <a 
            href={buttonLink || '#'} 
            className="inline-block bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-8 py-3 rounded-full transition-colors"
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
};

// Text Component
const TextComponent = ({ props, isPreview, onInlineEdit }) => {
  const { content, align, fontSize } = props;
  
  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div className="px-6 py-4 max-w-4xl mx-auto">
      <p 
        className={cn(
          "text-slate-700 leading-relaxed",
          sizeClasses[fontSize] || 'text-base',
          align === 'center' && 'text-center',
          align === 'right' && 'text-right',
          !isPreview && "inline-editable"
        )}
        contentEditable={!isPreview}
        suppressContentEditableWarning
        onBlur={(e) => !isPreview && onInlineEdit?.('content', e.target.innerText)}
        data-testid="text-content"
      >
        {content}
      </p>
    </div>
  );
};

// Heading Component
const HeadingComponent = ({ props, isPreview, onInlineEdit }) => {
  const { content, level, align } = props;
  
  const Tag = level || 'h2';
  const sizeClasses = {
    h1: 'text-4xl md:text-5xl',
    h2: 'text-3xl md:text-4xl',
    h3: 'text-2xl md:text-3xl',
    h4: 'text-xl md:text-2xl',
  };

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      <Tag 
        className={cn(
          "font-bold text-slate-900",
          sizeClasses[level] || sizeClasses.h2,
          align === 'center' && 'text-center',
          align === 'right' && 'text-right',
          !isPreview && "inline-editable"
        )}
        contentEditable={!isPreview}
        suppressContentEditableWarning
        onBlur={(e) => !isPreview && onInlineEdit?.('content', e.target.innerText)}
        data-testid="heading-content"
      >
        {content}
      </Tag>
    </div>
  );
};

// Image Component
const ImageComponent = ({ props }) => {
  const { src, alt, width } = props;
  
  return (
    <div className="px-6 py-4">
      <img 
        src={src} 
        alt={alt || 'Image'} 
        className="rounded-xl shadow-lg mx-auto"
        style={{ width: width || '100%', maxWidth: '100%' }}
        data-testid="image-element"
      />
    </div>
  );
};

// Button Component
const ButtonComponent = ({ props }) => {
  const { text, link, variant } = props;
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-900',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  return (
    <div className="px-6 py-4 text-center">
      <a 
        href={link || '#'} 
        className={cn(
          "inline-block px-8 py-3 rounded-full font-semibold transition-colors",
          variantClasses[variant] || variantClasses.primary
        )}
        data-testid="button-element"
      >
        {text}
      </a>
    </div>
  );
};

// Features Component
const FeaturesComponent = ({ props, isPreview, onInlineEdit }) => {
  const { title, features } = props;
  
  const iconMap = {
    GraduationCap: GraduationCap,
    Users: Users,
    Building: Building,
  };

  return (
    <div className="px-6 py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <h2 
          className={cn(
            "text-3xl md:text-4xl font-bold text-center text-slate-900 mb-12",
            !isPreview && "inline-editable"
          )}
          contentEditable={!isPreview}
          suppressContentEditableWarning
          onBlur={(e) => !isPreview && onInlineEdit?.('title', e.target.innerText)}
          data-testid="features-title"
        >
          {title}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {(features || []).map((feature, idx) => {
            const Icon = iconMap[feature.icon] || GraduationCap;
            return (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Gallery Component
const GalleryComponent = ({ props, isPreview, onInlineEdit }) => {
  const { title, images } = props;

  return (
    <div className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 
          className={cn(
            "text-3xl md:text-4xl font-bold text-center text-slate-900 mb-12",
            !isPreview && "inline-editable"
          )}
          contentEditable={!isPreview}
          suppressContentEditableWarning
          onBlur={(e) => !isPreview && onInlineEdit?.('title', e.target.innerText)}
          data-testid="gallery-title"
        >
          {title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(images || []).map((img, idx) => (
            <div key={idx} className="aspect-square overflow-hidden rounded-xl group">
              <img 
                src={img} 
                alt={`Gallery ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Announcements Component
const AnnouncementsComponent = ({ props, isPreview, onInlineEdit }) => {
  const { title, items } = props;

  return (
    <div className="px-6 py-16 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <h2 
            className={cn(
              "text-3xl font-bold text-slate-900",
              !isPreview && "inline-editable"
            )}
            contentEditable={!isPreview}
            suppressContentEditableWarning
            onBlur={(e) => !isPreview && onInlineEdit?.('title', e.target.innerText)}
            data-testid="announcements-title"
          >
            {title}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {(items || []).map((item, idx) => (
            <div key={idx} className="bg-slate-50 rounded-xl p-6 hover:shadow-md transition-shadow">
              <span className="text-sm text-blue-600 font-medium">{item.date}</span>
              <h3 className="text-lg font-semibold text-slate-900 mt-2 mb-3">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.excerpt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Events Component
const EventsComponent = ({ props, isPreview, onInlineEdit }) => {
  const { title, events } = props;

  return (
    <div className="px-6 py-16 bg-blue-600">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 
            className={cn(
              "text-3xl font-bold text-white",
              !isPreview && "inline-editable"
            )}
            contentEditable={!isPreview}
            suppressContentEditableWarning
            onBlur={(e) => !isPreview && onInlineEdit?.('title', e.target.innerText)}
            data-testid="events-title"
          >
            {title}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {(events || []).map((event, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="text-center bg-blue-50 rounded-lg p-3 min-w-[60px]">
                  <span className="block text-2xl font-bold text-blue-600">
                    {new Date(event.date).getDate()}
                  </span>
                  <span className="text-xs text-blue-600 uppercase">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{event.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{event.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Staff Component
const StaffComponent = ({ props, isPreview, onInlineEdit }) => {
  const { title, staff } = props;

  return (
    <div className="px-6 py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <h2 
          className={cn(
            "text-3xl md:text-4xl font-bold text-center text-slate-900 mb-12",
            !isPreview && "inline-editable"
          )}
          contentEditable={!isPreview}
          suppressContentEditableWarning
          onBlur={(e) => !isPreview && onInlineEdit?.('title', e.target.innerText)}
          data-testid="staff-title"
        >
          {title}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {(staff || []).map((person, idx) => (
            <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="aspect-square overflow-hidden">
                <img 
                  src={person.image || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400'} 
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold text-slate-900">{person.name}</h3>
                <p className="text-blue-600 text-sm mt-1">{person.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Contact Component
const ContactComponent = ({ props, isPreview, onInlineEdit }) => {
  const { title, address, phone, email, showMap } = props;

  return (
    <div className="px-6 py-16 bg-white" id="contact">
      <div className="max-w-6xl mx-auto">
        <h2 
          className={cn(
            "text-3xl md:text-4xl font-bold text-center text-slate-900 mb-12",
            !isPreview && "inline-editable"
          )}
          contentEditable={!isPreview}
          suppressContentEditableWarning
          onBlur={(e) => !isPreview && onInlineEdit?.('title', e.target.innerText)}
          data-testid="contact-title"
        >
          {title}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Address</h3>
              <p className="text-slate-600">{address}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Phone</h3>
              <p className="text-slate-600">{phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Email</h3>
              <p className="text-slate-600">{email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Footer Component
const FooterComponent = ({ props }) => {
  const { schoolName, address, phone, email, socialLinks } = props;

  return (
    <footer className="bg-slate-900 text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-slate-900" />
              </div>
              <span className="text-xl font-bold">{schoolName}</span>
            </div>
            <p className="text-slate-400 max-w-sm">
              Inspiring young minds and building bright futures through excellence in education.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-slate-400 text-sm">
              <p>{address}</p>
              <p>{phone}</p>
              <p>{email}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3">
              <a href={socialLinks?.facebook || '#'} className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={socialLinks?.twitter || '#'} className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href={socialLinks?.instagram || '#'} className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-pink-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} {schoolName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// Spacer Component
const SpacerComponent = ({ props }) => {
  const { height } = props;
  return <div style={{ height: `${height || 60}px` }} data-testid="spacer-element" />;
};

// Component Map
const componentMap = {
  hero: HeroComponent,
  text: TextComponent,
  heading: HeadingComponent,
  image: ImageComponent,
  button: ButtonComponent,
  features: FeaturesComponent,
  gallery: GalleryComponent,
  announcements: AnnouncementsComponent,
  events: EventsComponent,
  staff: StaffComponent,
  contact: ContactComponent,
  footer: FooterComponent,
  spacer: SpacerComponent,
};

// Main Component Renderer
export const ComponentRenderer = ({ component, isSelected, onClick, isPreview, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Only use editor context when not in preview mode
  let updateComponent, removeComponent, duplicateComponent;
  if (!isPreview) {
    try {
      const editorContext = require('../../context/EditorContext');
      const editor = editorContext.useEditor();
      updateComponent = editor.updateComponent;
      removeComponent = editor.removeComponent;
      duplicateComponent = editor.duplicateComponent;
    } catch (e) {
      // In preview mode, these won't be available
    }
  }

  const Component = componentMap[component.type];
  
  if (!Component) {
    return (
      <div className="p-4 bg-red-50 text-red-600 text-center">
        Unknown component type: {component.type}
      </div>
    );
  }

  const handleInlineEdit = (key, value) => {
    if (updateComponent) {
      updateComponent(component.id, { [key]: value });
    }
  };

  if (isPreview) {
    return <Component props={component.props} isPreview={true} />;
  }

  return (
    <div
      className={cn(
        "component-wrapper relative",
        isSelected && "component-selected",
        isHovered && !isSelected && "component-hover"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`component-${component.id}`}
    >
      {/* Component Actions */}
      {(isHovered || isSelected) && duplicateComponent && removeComponent && (
        <div className="component-actions">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-white shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              duplicateComponent(component.id);
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 w-8 p-0 shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              removeComponent(component.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Sort Handle */}
      {(isHovered || isSelected) && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 sort-handle z-10">
          <div className="p-2 bg-white rounded-lg shadow-md">
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      )}

      <Component 
        props={component.props} 
        isPreview={false}
        onInlineEdit={handleInlineEdit}
      />
    </div>
  );
};
