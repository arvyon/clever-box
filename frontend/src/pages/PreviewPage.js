import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPage, getSchool } from '../lib/api';
import { ComponentRenderer } from '../components/editor/ComponentRenderer';
import { Button } from '../components/ui/button';
import { ArrowLeft, Edit3 } from 'lucide-react';

export default function PreviewPage() {
  const { schoolId, pageId } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [schoolId, pageId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schoolData, pageData] = await Promise.all([
        getSchool(schoolId),
        getPage(pageId)
      ]);
      setSchool(schoolData);
      setPage(pageData);
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!page || !school) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500">Page not found</p>
      </div>
    );
  }

  const sortedComponents = [...(page.components || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen" data-testid="preview-page">
      {/* Preview Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white py-3 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10"
            data-testid="preview-back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <div className="h-4 w-px bg-white/20" />
          <span className="text-sm">
            Previewing: <strong>{school.name}</strong> - {page.name}
          </span>
        </div>
        
        <Button
          size="sm"
          onClick={() => navigate(`/editor/${schoolId}/${pageId}`)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="preview-edit-btn"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Edit Page
        </Button>
      </div>
      
      {/* Page Content */}
      <div className="pt-14 preview-mode">
        {sortedComponents.length === 0 ? (
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center">
              <p className="text-slate-500 mb-4">This page has no content yet</p>
              <Button
                onClick={() => navigate(`/editor/${schoolId}/${pageId}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Start Editing
              </Button>
            </div>
          </div>
        ) : (
          sortedComponents.map((component) => (
            <ComponentRenderer
              key={component.id}
              component={component}
              isPreview={true}
            />
          ))
        )}
      </div>
    </div>
  );
}
