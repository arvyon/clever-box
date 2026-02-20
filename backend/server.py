from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

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
    await db.schools.insert_one(doc)
    return school_obj

@api_router.get("/schools", response_model=List[School])
async def get_schools():
    schools = await db.schools.find({}, {"_id": 0}).to_list(100)
    for school in schools:
        if isinstance(school.get('created_at'), str):
            school['created_at'] = datetime.fromisoformat(school['created_at'])
    return schools

@api_router.get("/schools/{school_id}", response_model=School)
async def get_school(school_id: str):
    school = await db.schools.find_one({"id": school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    if isinstance(school.get('created_at'), str):
        school['created_at'] = datetime.fromisoformat(school['created_at'])
    return school

@api_router.delete("/schools/{school_id}")
async def delete_school(school_id: str):
    result = await db.schools.delete_one({"id": school_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="School not found")
    await db.pages.delete_many({"school_id": school_id})
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
    await db.pages.insert_one(doc)
    return page_obj

@api_router.get("/pages", response_model=List[PageData])
async def get_pages(school_id: Optional[str] = None):
    query = {"school_id": school_id} if school_id else {}
    pages = await db.pages.find(query, {"_id": 0}).to_list(100)
    for page in pages:
        if isinstance(page.get('created_at'), str):
            page['created_at'] = datetime.fromisoformat(page['created_at'])
        if isinstance(page.get('updated_at'), str):
            page['updated_at'] = datetime.fromisoformat(page['updated_at'])
    return pages

@api_router.get("/pages/{page_id}", response_model=PageData)
async def get_page(page_id: str):
    page = await db.pages.find_one({"id": page_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    if isinstance(page.get('created_at'), str):
        page['created_at'] = datetime.fromisoformat(page['created_at'])
    if isinstance(page.get('updated_at'), str):
        page['updated_at'] = datetime.fromisoformat(page['updated_at'])
    return page

@api_router.put("/pages/{page_id}", response_model=PageData)
async def update_page(page_id: str, page_update: PageUpdate):
    existing = await db.pages.find_one({"id": page_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Page not found")
    
    update_data = {}
    if page_update.name is not None:
        update_data['name'] = page_update.name
    if page_update.slug is not None:
        update_data['slug'] = page_update.slug
    if page_update.components is not None:
        update_data['components'] = page_update.components
    if page_update.is_published is not None:
        update_data['is_published'] = page_update.is_published
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.pages.update_one({"id": page_id}, {"$set": update_data})
    
    updated = await db.pages.find_one({"id": page_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return updated

@api_router.delete("/pages/{page_id}")
async def delete_page(page_id: str):
    result = await db.pages.delete_one({"id": page_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
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

# ============ SEED DATA ============

@api_router.post("/seed")
async def seed_data():
    # Check if data already exists
    existing = await db.schools.find_one({})
    if existing:
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
    await db.schools.insert_one(doc)
    
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
    await db.pages.insert_one(page_doc)
    
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
