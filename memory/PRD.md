# CleverCampus CMS - Product Requirements Document

## Original Problem Statement
Build a multi-tenant drag and drop CMS for school websites, similar to WordPress/Elementor for schools. Focus on CMS editor with drag and drop functionality, inline editing, and section-based editing. Elementary school template with demo/dummy auth.

## Architecture
- **Frontend**: React with Tailwind CSS, ShadCN UI components, @dnd-kit for drag and drop
- **Backend**: FastAPI with MongoDB
- **Design**: Inspired by Cleverbox.co.uk - professional, warm, education-focused

## User Personas
1. **School Administrator**: Manages school website content, adds pages, edits components
2. **Marketing Staff**: Creates engaging content for prospective parents
3. **IT Coordinator**: Sets up and manages multiple school websites

## Core Requirements (Static)
- Multi-tenant architecture (multiple schools)
- Drag and drop page builder (Elementor-like)
- Inline text editing
- Device preview (Desktop/Tablet/Mobile)
- Component library with school-specific widgets
- Live preview of published site
- Demo authentication for testing

## What's Been Implemented (Jan 2026)
### Backend (server.py)
- [x] School CRUD endpoints (/api/schools)
- [x] Page CRUD endpoints (/api/pages)
- [x] Component templates endpoint (/api/templates/components)
- [x] Demo seed data endpoint (/api/seed)
- [x] Dummy authentication (/api/auth/login)

### Frontend
- [x] Login page with demo credentials
- [x] Dashboard with school management
- [x] Drag and drop editor with:
  - Left sidebar: Widget library with categories
  - Center: Live canvas preview
  - Right sidebar: Properties panel
  - Device view switcher
  - Save and Publish buttons
- [x] Preview page for published school website

### Components Available
1. Hero Section - Full-width with background image
2. Text Block - Rich text content
3. Heading - Section titles (H1-H4)
4. Image - Single image with styling
5. Button - CTA buttons with variants
6. Features Grid - 3-column feature cards
7. Image Gallery - 4-column image grid
8. Announcements - News cards
9. Events Calendar - Event listings
10. Staff Directory - Team member cards
11. Contact Section - Contact info with icons
12. Footer - Full footer with social links
13. Spacer - Vertical spacing

## Prioritized Backlog
### P0 (Critical)
- ✅ Drag and drop functionality
- ✅ Component rendering
- ✅ Save/Publish workflow
- ✅ Preview mode

### P1 (High Priority)
- [ ] Sortable components (reorder via drag)
- [ ] Undo/Redo functionality
- [ ] Image upload integration
- [ ] Real authentication (JWT)

### P2 (Medium Priority)
- [ ] Multiple pages per school
- [ ] Page navigation editor
- [ ] Template library (pre-built layouts)
- [ ] Custom CSS per school

### P3 (Nice to Have)
- [ ] Form builder component
- [ ] Blog/News management
- [ ] SEO settings
- [ ] Analytics dashboard

## Next Tasks
1. Add sortable drag within canvas (reorder components)
2. Implement image upload functionality
3. Add multiple page management
4. Integrate real JWT authentication
5. Add undo/redo stack

## Tech Stack
- React 19
- FastAPI 0.110.1
- MongoDB (motor 3.3.1)
- Tailwind CSS 3.4
- @dnd-kit/core 6.3.1
- ShadCN UI Components
