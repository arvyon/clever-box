from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from supabase import create_client, Client
import os
import logging
import traceback
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def log_info(msg):
    logger.info(msg)
    print(f"[BACKEND] {msg}")

def log_error(msg, exc=None):
    logger.error(msg, exc_info=exc)
    print(f"[BACKEND ERROR] {msg}")
    if exc:
        print(f"[BACKEND ERROR] Traceback: {traceback.format_exc()}")

log_info("=" * 60)
log_info("Initializing FastAPI backend server...")
log_info("=" * 60)

ROOT_DIR = Path(__file__).parent
log_info(f"Root directory: {ROOT_DIR}")

log_info("Loading environment variables...")
load_dotenv(ROOT_DIR / '.env')
log_info(f"Environment file exists: {(ROOT_DIR / '.env').exists()}")

# Supabase connection with error handling
log_info("Checking Supabase environment variables...")
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_KEY')

log_info(f"SUPABASE_URL present: {bool(supabase_url)}")
log_info(f"SUPABASE_KEY present: {bool(supabase_key)}")

if supabase_url:
    log_info(f"SUPABASE_URL: {supabase_url[:30]}..." if len(supabase_url) > 30 else f"SUPABASE_URL: {supabase_url}")
else:
    log_error("SUPABASE_URL is missing!")

if supabase_key:
    log_info(f"SUPABASE_KEY: {supabase_key[:20]}..." if len(supabase_key) > 20 else f"SUPABASE_KEY: {supabase_key[:10]}...")
else:
    log_error("SUPABASE_KEY is missing!")

if not supabase_url or not supabase_key:
    error_msg = (
        "Missing required environment variables: SUPABASE_URL and SUPABASE_KEY must be set. "
        "Please set them in Railway Dashboard → Settings → Environment Variables"
    )
    log_error(error_msg)
    raise ValueError(error_msg)

log_info("Creating Supabase client...")
try:
    supabase: Client = create_client(supabase_url, supabase_key)
    log_info("✓ Supabase client created successfully")
except Exception as e:
    log_error(f"Failed to create Supabase client: {e}", e)
    raise

log_info("Creating FastAPI app...")
app = FastAPI(title="CleverBox API", version="1.0.0")
api_router = APIRouter(prefix="/api")
log_info("✓ FastAPI app and router created")

# ============ MODELS (for seed endpoint) ============

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

# ============ IMAGE UPLOAD (Supabase Storage) ============

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image to Supabase Storage and return the URL"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, GIF, WebP allowed.")

    # Read file content
    file_content = await file.read()
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = f"uploads/{filename}"

    try:
        # Upload to Supabase Storage
        # The Python client uses a different API than JavaScript
        result = supabase.storage.from_("uploads").upload(
            file_path,
            file_content,
            file_options={
                "content-type": file.content_type,
                "cache-control": "3600",
                "upsert": False
            }
        )
        
        # Check for errors (Python client returns data/error tuple)
        if hasattr(result, 'error') and result.error:
            log_error(f"Supabase Storage upload error: {result.error}")
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {result.error}")
        
        # Get public URL
        public_url_result = supabase.storage.from_("uploads").get_public_url(file_path)
        
        # Python client returns a response object with data attribute
        if hasattr(public_url_result, 'data'):
            public_url = public_url_result.data.get("publicUrl")
        elif isinstance(public_url_result, dict):
            public_url = public_url_result.get("publicUrl")
        else:
            # Fallback: construct URL manually
            public_url = f"{supabase_url}/storage/v1/object/public/uploads/{file_path}"
        
        if not public_url:
            raise HTTPException(status_code=500, detail="Failed to get public URL")
        
        log_info(f"Image uploaded successfully: {public_url}")
        return {
            "url": public_url,
            "filename": filename,
            "path": file_path
        }
    except HTTPException:
        raise
    except Exception as e:
        log_error(f"Error uploading image: {e}", e)
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

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

# ============ SEED DATA ============

@api_router.post("/seed")
async def seed_data():
    """Seed demo data into Supabase"""
    try:
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
    except Exception as e:
        log_error(f"Error seeding data: {e}", e)
        raise HTTPException(status_code=500, detail=f"Failed to seed data: {str(e)}")

# ============ ROOT ============

@api_router.get("/")
async def root():
    log_info("Root endpoint called")
    return {"message": "CleverBox CMS API", "version": "1.0.0"}

# Include router
log_info("Including API router...")
app.include_router(api_router)
log_info(f"✓ API router included with {len(app.routes)} total routes")
log_info(f"Registered routes: {[r.path for r in app.routes if hasattr(r, 'path')]}")

# Add request logging middleware
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        log_info(f"→ {request.method} {request.url.path}")
        try:
            response = await call_next(request)
            log_info(f"← {request.method} {request.url.path} → {response.status_code}")
            return response
        except Exception as e:
            log_error(f"Request handler error for {request.method} {request.url.path}: {e}", e)
            raise

app.add_middleware(LoggingMiddleware)

log_info("Adding CORS middleware...")
# Get frontend URL from environment, fallback to wildcard
frontend_url = os.environ.get('FRONTEND_URL', '*')
cors_origins = [frontend_url] if frontend_url != '*' else ['*']
log_info(f"CORS origins: {cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
log_info("✓ CORS middleware added")

log_info("=" * 60)
log_info("FastAPI backend server initialized successfully!")
log_info("=" * 60)
