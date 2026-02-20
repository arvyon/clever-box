import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  GraduationCap, 
  Plus, 
  Edit3, 
  ExternalLink, 
  Trash2,
  Search,
  LogOut,
  Building2,
  FileText,
  MoreVertical
} from 'lucide-react';
import { getSchools, getPages, createSchool, deleteSchool, createPage, seedData } from '../lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewSchool, setShowNewSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const user = JSON.parse(localStorage.getItem('cms_user') || '{}');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ensure demo data exists
      try {
        await seedData();
      } catch (e) {
        // Ignore if already seeded
      }
      
      const schoolsData = await getSchools();
      setSchools(schoolsData);
      
      // Load pages for each school
      const pagesMap = {};
      for (const school of schoolsData) {
        const schoolPages = await getPages(school.id);
        pagesMap[school.id] = schoolPages;
      }
      setPages(pagesMap);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
    navigate('/login');
  };

  const handleCreateSchool = async () => {
    if (!newSchoolName.trim()) return;
    
    try {
      const slug = newSchoolName.toLowerCase().replace(/\s+/g, '-');
      const school = await createSchool({ name: newSchoolName, slug });
      
      // Create default home page
      await createPage({
        school_id: school.id,
        name: 'Home',
        slug: 'home',
        components: []
      });
      
      setShowNewSchool(false);
      setNewSchoolName('');
      loadData();
    } catch (err) {
      console.error('Failed to create school:', err);
    }
  };

  const handleDeleteSchool = async (id) => {
    if (window.confirm('Are you sure you want to delete this school? All pages will be deleted.')) {
      try {
        await deleteSchool(id);
        loadData();
      } catch (err) {
        console.error('Failed to delete school:', err);
      }
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="dashboard-header sticky top-0 z-50 glass">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">CleverCampus</h1>
            <p className="text-xs text-slate-500">School CMS Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">Welcome, {user.name || 'Admin'}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-900"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Your Schools</h2>
            <p className="text-slate-500">Manage and edit your school websites</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search schools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="search-schools-input"
              />
            </div>
            
            <Dialog open={showNewSchool} onOpenChange={setShowNewSchool}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="add-school-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add School
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New School</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      placeholder="e.g., Sunshine Elementary"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      data-testid="new-school-name-input"
                    />
                  </div>
                  <Button 
                    onClick={handleCreateSchool} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    data-testid="create-school-btn"
                  >
                    Create School
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Schools Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No schools yet</h3>
            <p className="text-slate-500 mb-6">Create your first school to get started</p>
            <Button 
              onClick={() => setShowNewSchool(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First School
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((school, idx) => (
              <div 
                key={school.id} 
                className="school-card animate-slide-in-bottom"
                style={{ animationDelay: `${idx * 50}ms` }}
                data-testid={`school-card-${school.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: school.primary_color + '20' }}
                  >
                    <GraduationCap 
                      className="w-6 h-6" 
                      style={{ color: school.primary_color }}
                    />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleDeleteSchool(school.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{school.name}</h3>
                <p className="text-sm text-slate-500 mb-4">/{school.slug}</p>
                
                <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                  <FileText className="w-4 h-4" />
                  <span>{pages[school.id]?.length || 0} pages</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      const homePage = pages[school.id]?.find(p => p.slug === 'home');
                      if (homePage) {
                        navigate(`/editor/${school.id}/${homePage.id}`);
                      }
                    }}
                    data-testid={`edit-school-${school.id}`}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const homePage = pages[school.id]?.find(p => p.slug === 'home');
                      if (homePage) {
                        navigate(`/preview/${school.id}/${homePage.id}`);
                      }
                    }}
                    data-testid={`preview-school-${school.id}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
