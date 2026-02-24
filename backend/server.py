from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import logging
import base64
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import json

ROOT_DIR = Path(__file__).parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

load_dotenv(ROOT_DIR / '.env')

# Supabase connection
supabase_url = os.environ['SUPABASE_URL']
supabase_key = os.environ['SUPABASE_KEY']
supabase: Client = create_client(supabase_url, supabase_key)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ============ MODELS ============

class ComponentData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    props: Dict[str, Any] = {}
    order: int = 0

class PageData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    school_id: str
    name: str
    slug: str
    components: List[ComponentData] = []
    is_published: bool = False
    theme: str = "default"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class School(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    logo_url: Optional[str] = None
    primary_color: str = "#1D4ED8"
    secondary_color: str = "#FBBF24"
    theme: str = "default"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SchoolCreate(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    primary_color: str = "#1D4ED8"
    secondary_color: str = "#FBBF24"

class PageCreate(BaseModel):
    school_id: str
    name: str
    slug: str
    components: List[Dict[str, Any]] = []

class PageUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    components: Optional[List[Dict[str, Any]]] = None
    is_published: Optional[bool] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: Dict[str, Any]

# ============ AUTH ROUTES (DUMMY) ============

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # Dummy auth for demo
    if request.email and request.password:
        return LoginResponse(
            token="demo-token-" + str(uuid.uuid4()),
            user={
                "id": "demo-user-1",
                "email": request.email,
                "name": "Demo Admin",
                "role": "admin"
            }
        )
    raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.get("/auth/me")
async def get_current_user():
    return {
        "id": "demo-user-1",
        "email": "admin@demo.com",
        "name": "Demo Admin",
        "role": "admin"
    }

# ============ SCHOOL ROUTES ============

@api_router.post("/schools", response_model=School)
async def create_school(school: SchoolCreate):
    school_obj = School(**school.model_dump())
    doc = school_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    result = supabase.table('schools').insert(doc).execute()
    if result.data:
        return School(**result.data[0])
    raise HTTPException(status_code=500, detail="Failed to create school")

@api_router.get("/schools", response_model=List[School])
async def get_schools():
    result = supabase.table('schools').select('*').limit(100).execute()
    schools = []
    for school in result.data:
        if isinstance(school.get('created_at'), str):
            school['created_at'] = datetime.fromisoformat(school['created_at'].replace('Z', '+00:00'))
        schools.append(School(**school))
    return schools

@api_router.get("/schools/{school_id}", response_model=School)
async def get_school(school_id: str):
    result = supabase.table('schools').select('*').eq('id', school_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="School not found")
    school = result.data[0]
    if isinstance(school.get('created_at'), str):
        school['created_at'] = datetime.fromisoformat(school['created_at'].replace('Z', '+00:00'))
    return School(**school)

@api_router.delete("/schools/{school_id}")
async def delete_school(school_id: str):
    # Check if school exists
    check = supabase.table('schools').select('id').eq('id', school_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="School not found")
    # Delete school (pages will be cascade deleted)
    supabase.table('schools').delete().eq('id', school_id).execute()
    return {"message": "School deleted"}

# ============ PAGE ROUTES ============

@api_router.post("/pages", response_model=PageData)
async def create_page(page: PageCreate):
    components = [ComponentData(**c) for c in page.components]
    page_obj = PageData(
        school_id=page.school_id,
        name=page.name,
        slug=page.slug,
        components=components
    )
    doc = page_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    # Convert components to JSON for PostgreSQL
    doc['components'] = json.dumps([c.model_dump() for c in components])
    result = supabase.table('pages').insert(doc).execute()
    if result.data:
        # Parse components back from JSON
        result.data[0]['components'] = json.loads(result.data[0]['components'])
        return PageData(**result.data[0])
    raise HTTPException(status_code=500, detail="Failed to create page")

@api_router.get("/pages", response_model=List[PageData])
async def get_pages(school_id: Optional[str] = None):
    query = supabase.table('pages').select('*')
    if school_id:
        query = query.eq('school_id', school_id)
    result = query.limit(100).execute()
    pages = []
    for page in result.data:
        if isinstance(page.get('created_at'), str):
            page['created_at'] = datetime.fromisoformat(page['created_at'].replace('Z', '+00:00'))
        if isinstance(page.get('updated_at'), str):
            page['updated_at'] = datetime.fromisoformat(page['updated_at'].replace('Z', '+00:00'))
        # Parse components from JSON
        if isinstance(page.get('components'), str):
            page['components'] = json.loads(page['components'])
        pages.append(PageData(**page))
    return pages

@api_router.get("/pages/{page_id}", response_model=PageData)
async def get_page(page_id: str):
    result = supabase.table('pages').select('*').eq('id', page_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Page not found")
    page = result.data[0]
    if isinstance(page.get('created_at'), str):
        page['created_at'] = datetime.fromisoformat(page['created_at'].replace('Z', '+00:00'))
    if isinstance(page.get('updated_at'), str):
        page['updated_at'] = datetime.fromisoformat(page['updated_at'].replace('Z', '+00:00'))
    # Parse components from JSON
    if isinstance(page.get('components'), str):
        page['components'] = json.loads(page['components'])
    return PageData(**page)

@api_router.put("/pages/{page_id}", response_model=PageData)
async def update_page(page_id: str, page_update: PageUpdate):
    # Check if page exists
    check = supabase.table('pages').select('id').eq('id', page_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Page not found")
    
    update_data = {}
    if page_update.name is not None:
        update_data['name'] = page_update.name
    if page_update.slug is not None:
        update_data['slug'] = page_update.slug
    if page_update.components is not None:
        # Convert components to JSON for PostgreSQL
        update_data['components'] = json.dumps(page_update.components)
    if page_update.is_published is not None:
        update_data['is_published'] = page_update.is_published
    
    # updated_at will be auto-updated by trigger
    
    result = supabase.table('pages').update(update_data).eq('id', page_id).execute()
    
    if result.data:
        updated = result.data[0]
        if isinstance(updated.get('created_at'), str):
            updated['created_at'] = datetime.fromisoformat(updated['created_at'].replace('Z', '+00:00'))
        if isinstance(updated.get('updated_at'), str):
            updated['updated_at'] = datetime.fromisoformat(updated['updated_at'].replace('Z', '+00:00'))
        # Parse components from JSON
        if isinstance(updated.get('components'), str):
            updated['components'] = json.loads(updated['components'])
        return PageData(**updated)
    raise HTTPException(status_code=500, detail="Failed to update page")

@api_router.delete("/pages/{page_id}")
async def delete_page(page_id: str):
    # Check if page exists
    check = supabase.table('pages').select('id').eq('id', page_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Page not found")
    supabase.table('pages').delete().eq('id', page_id).execute()
    return {"message": "Page deleted"}

# ============ TEMPLATE COMPONENTS ============

@api_router.get("/templates/components")
async def get_component_templates():
    return {
        "widgets": [
            {
                "type": "hero",
                "name": "Hero Section",
                "icon": "Image",
                "category": "sections",
                "defaultProps": {
                    "title": "Welcome to Our School",
                    "subtitle": "Inspiring young minds since 1990",
                    "backgroundImage": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop",
                    "buttonText": "Learn More",
                    "buttonLink": "#about"
                }
            },
            {
                "type": "text",
                "name": "Text Block",
                "icon": "Type",
                "category": "basic",
                "defaultProps": {
                    "content": "Enter your text here...",
                    "align": "left",
                    "fontSize": "base"
                }
            },
            {
                "type": "heading",
                "name": "Heading",
                "icon": "Heading",
                "category": "basic",
                "defaultProps": {
                    "content": "Section Title",
                    "level": "h2",
                    "align": "center"
                }
            },
            {
                "type": "image",
                "name": "Image",
                "icon": "ImageIcon",
                "category": "basic",
                "defaultProps": {
                    "src": "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop",
                    "alt": "School image",
                    "width": "100%"
                }
            },
            {
                "type": "button",
                "name": "Button",
                "icon": "MousePointerClick",
                "category": "basic",
                "defaultProps": {
                    "text": "Click Me",
                    "link": "#",
                    "variant": "primary"
                }
            },
            {
                "type": "features",
                "name": "Features Grid",
                "icon": "Grid3X3",
                "category": "sections",
                "defaultProps": {
                    "title": "Why Choose Us",
                    "features": [
                        {"icon": "GraduationCap", "title": "Excellence in Education", "description": "Award-winning curriculum designed for success"},
                        {"icon": "Users", "title": "Dedicated Teachers", "description": "Experienced educators who care about every student"},
                        {"icon": "Building", "title": "Modern Facilities", "description": "State-of-the-art classrooms and sports facilities"}
                    ]
                }
            },
            {
                "type": "gallery",
                "name": "Image Gallery",
                "icon": "Images",
                "category": "sections",
                "defaultProps": {
                    "title": "School Gallery",
                    "images": [
                        "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop",
                        "https://images.unsplash.com/photo-1427504494785-3a9ca28497b1?q=80&w=2070&auto=format&fit=crop",
                        "https://images.unsplash.com/photo-1592280771884-f25f2b8423f5?q=80&w=1974&auto=format&fit=crop",
                        "https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=1974&auto=format&fit=crop"
                    ]
                }
            },
            {
                "type": "announcements",
                "name": "Announcements",
                "icon": "Bell",
                "category": "school",
                "defaultProps": {
                    "title": "Latest News",
                    "items": [
                        {"title": "Parent-Teacher Conference", "date": "Jan 15, 2026", "excerpt": "Join us for our upcoming parent-teacher conference..."},
                        {"title": "Spring Break Schedule", "date": "Jan 10, 2026", "excerpt": "Important dates for the upcoming spring break..."},
                        {"title": "Science Fair Winners", "date": "Jan 5, 2026", "excerpt": "Congratulations to all our science fair participants..."}
                    ]
                }
            },
            {
                "type": "events",
                "name": "Events Calendar",
                "icon": "Calendar",
                "category": "school",
                "defaultProps": {
                    "title": "Upcoming Events",
                    "events": [
                        {"title": "Open House", "date": "2026-01-20", "time": "10:00 AM"},
                        {"title": "Sports Day", "date": "2026-01-25", "time": "9:00 AM"},
                        {"title": "Art Exhibition", "date": "2026-02-01", "time": "2:00 PM"}
                    ]
                }
            },
            {
                "type": "staff",
                "name": "Staff Directory",
                "icon": "Users",
                "category": "school",
                "defaultProps": {
                    "title": "Meet Our Team",
                    "staff": [
                        {"name": "Dr. Sarah Johnson", "role": "Principal", "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"},
                        {"name": "Mr. James Wilson", "role": "Vice Principal", "image": "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1974&auto=format&fit=crop"},
                        {"name": "Ms. Emily Davis", "role": "Head of Elementary", "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"}
                    ]
                }
            },
            {
                "type": "contact",
                "name": "Contact Section",
                "icon": "Mail",
                "category": "sections",
                "defaultProps": {
                    "title": "Contact Us",
                    "address": "123 Education Lane, Learning City, LC 12345",
                    "phone": "(555) 123-4567",
                    "email": "info@school.edu",
                    "showMap": True
                }
            },
            {
                "type": "footer",
                "name": "Footer",
                "icon": "PanelBottom",
                "category": "sections",
                "defaultProps": {
                    "schoolName": "Elementary School",
                    "address": "123 Education Lane",
                    "phone": "(555) 123-4567",
                    "email": "info@school.edu",
                    "socialLinks": {
                        "facebook": "#",
                        "twitter": "#",
                        "instagram": "#"
                    }
                }
            },
            {
                "type": "spacer",
                "name": "Spacer",
                "icon": "SeparatorHorizontal",
                "category": "basic",
                "defaultProps": {
                    "height": "60"
                }
            }
        ],
        "categories": [
            {"id": "basic", "name": "Basic Elements"},
            {"id": "sections", "name": "Page Sections"},
            {"id": "school", "name": "School Specific"}
        ]
    }

# ============ IMAGE UPLOAD ============

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image and return the URL"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, GIF, WebP allowed.")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    # Save file
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return the URL (using the backend URL)
    return {
        "url": f"/uploads/{filename}",
        "filename": filename
    }

# ============ THEMES ============

@api_router.get("/themes")
async def get_themes():
    """Get available themes for school websites"""
    return {
        "themes": [
            {
                "id": "default",
                "name": "Classic Blue",
                "description": "Professional blue theme with warm amber accents",
                "preview": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400",
                "colors": {
                    "primary": "#1D4ED8",
                    "secondary": "#FBBF24",
                    "background": "#FFFFFF",
                    "text": "#1E293B",
                    "accent": "#3B82F6"
                },
                "heroStyle": "gradient",
                "fontFamily": "Outfit"
            },
            {
                "id": "forest",
                "name": "Forest Green",
                "description": "Natural green theme perfect for eco-conscious schools",
                "preview": "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400",
                "colors": {
                    "primary": "#166534",
                    "secondary": "#FCD34D",
                    "background": "#F0FDF4",
                    "text": "#14532D",
                    "accent": "#22C55E"
                },
                "heroStyle": "nature",
                "fontFamily": "DM Sans"
            },
            {
                "id": "sunset",
                "name": "Sunset Orange",
                "description": "Warm and energetic theme with vibrant colors",
                "preview": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400",
                "colors": {
                    "primary": "#EA580C",
                    "secondary": "#0EA5E9",
                    "background": "#FFFBEB",
                    "text": "#431407",
                    "accent": "#F97316"
                },
                "heroStyle": "warm",
                "fontFamily": "Nunito"
            }
        ]
    }

@api_router.put("/schools/{school_id}/theme")
async def update_school_theme(school_id: str, theme_data: Dict[str, Any]):
    """Update school theme"""
    # Check if school exists
    check = supabase.table('schools').select('id').eq('id', school_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="School not found")
    
    update_data = {
        "theme": theme_data.get("theme", "default"),
        "primary_color": theme_data.get("primary_color", "#1D4ED8"),
        "secondary_color": theme_data.get("secondary_color", "#FBBF24")
    }
    
    result = supabase.table('schools').update(update_data).eq('id', school_id).execute()
    
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=500, detail="Failed to update school theme")

# ============ SEED DATA ============

@api_router.post("/seed")
async def seed_data():
    # Check if data already exists
    existing = supabase.table('schools').select('id').limit(1).execute()
    if existing.data:
        return {"message": "Data already seeded"}
    
    # Create demo school
    school = School(
        id="demo-school-1",
        name="Sunshine Elementary",
        slug="sunshine-elementary",
        logo_url=None,
        primary_color="#1D4ED8",
        secondary_color="#FBBF24"
    )
    doc = school.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    supabase.table('schools').insert(doc).execute()
    
    # Create demo page with components
    page = PageData(
        id="demo-page-1",
        school_id="demo-school-1",
        name="Home",
        slug="home",
        is_published=True,
        components=[
            ComponentData(
                id="comp-1",
                type="hero",
                order=0,
                props={
                    "title": "Welcome to Sunshine Elementary",
                    "subtitle": "Where Every Child Shines Bright",
                    "backgroundImage": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop",
                    "buttonText": "Enroll Now",
                    "buttonLink": "#contact"
                }
            ),
            ComponentData(
                id="comp-2",
                type="features",
                order=1,
                props={
                    "title": "Why Choose Sunshine Elementary?",
                    "features": [
                        {"icon": "GraduationCap", "title": "Excellence in Education", "description": "Award-winning curriculum designed for success"},
                        {"icon": "Users", "title": "Dedicated Teachers", "description": "Experienced educators who care about every student"},
                        {"icon": "Building", "title": "Modern Facilities", "description": "State-of-the-art classrooms and sports facilities"}
                    ]
                }
            ),
            ComponentData(
                id="comp-3",
                type="announcements",
                order=2,
                props={
                    "title": "Latest News & Updates",
                    "items": [
                        {"title": "Parent-Teacher Conference", "date": "Jan 15, 2026", "excerpt": "Join us for our upcoming parent-teacher conference to discuss your child's progress."},
                        {"title": "Spring Break Schedule", "date": "Jan 10, 2026", "excerpt": "Important dates for the upcoming spring break period."},
                        {"title": "Science Fair Winners", "date": "Jan 5, 2026", "excerpt": "Congratulations to all our talented science fair participants!"}
                    ]
                }
            ),
            ComponentData(
                id="comp-4",
                type="gallery",
                order=3,
                props={
                    "title": "Life at Sunshine Elementary",
                    "images": [
                        "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop",
                        "https://images.unsplash.com/photo-1427504494785-3a9ca28497b1?q=80&w=2070&auto=format&fit=crop",
                        "https://images.unsplash.com/photo-1592280771884-f25f2b8423f5?q=80&w=1974&auto=format&fit=crop",
                        "https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=1974&auto=format&fit=crop"
                    ]
                }
            ),
            ComponentData(
                id="comp-5",
                type="contact",
                order=4,
                props={
                    "title": "Get in Touch",
                    "address": "123 Sunshine Lane, Happy Valley, HV 12345",
                    "phone": "(555) 123-4567",
                    "email": "info@sunshine-elementary.edu",
                    "showMap": True
                }
            )
        ]
    )
    page_doc = page.model_dump()
    page_doc['created_at'] = page_doc['created_at'].isoformat()
    page_doc['updated_at'] = page_doc['updated_at'].isoformat()
    # Convert components to JSON for PostgreSQL
    page_doc['components'] = json.dumps([c.model_dump() for c in page.components])
    supabase.table('pages').insert(page_doc).execute()
    
    return {"message": "Demo data seeded successfully", "school_id": school.id, "page_id": page.id}

# ============ ROOT ============

@api_router.get("/")
async def root():
    return {"message": "CleverCampus CMS API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Supabase client doesn't need explicit shutdown
# Connection is managed by the client library
