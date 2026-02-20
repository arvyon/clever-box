import React from 'react';
import { Button } from '../ui/button';
import { X, Check, Palette } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ThemeSelector = ({ themes, currentTheme, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Choose a Theme</h2>
              <p className="text-sm text-slate-500">Select a theme for your school website</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Themes Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {themes.map(theme => (
              <div
                key={theme.id}
                onClick={() => onSelect(theme.id)}
                className={cn(
                  "relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg group",
                  currentTheme === theme.id 
                    ? "border-blue-500 ring-2 ring-blue-200" 
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                {/* Theme Preview */}
                <div 
                  className="h-32 relative"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="font-bold text-lg" style={{ fontFamily: theme.fontFamily }}>
                        School Name
                      </h3>
                      <p className="text-sm opacity-80">Welcome Message</p>
                    </div>
                  </div>
                  
                  {/* Color Dots */}
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                  </div>
                  
                  {/* Selected Check */}
                  {currentTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>
                
                {/* Theme Info */}
                <div className="p-4" style={{ backgroundColor: theme.colors.background }}>
                  <h4 className="font-semibold text-slate-900 mb-1">{theme.name}</h4>
                  <p className="text-sm text-slate-500">{theme.description}</p>
                  
                  {/* Button Preview */}
                  <div className="mt-3 flex gap-2">
                    <span 
                      className="px-3 py-1 text-xs rounded-full text-white"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      Primary
                    </span>
                    <span 
                      className="px-3 py-1 text-xs rounded-full"
                      style={{ 
                        backgroundColor: theme.colors.secondary,
                        color: theme.colors.text 
                      }}
                    >
                      Secondary
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">
            Theme changes are applied immediately
          </p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
