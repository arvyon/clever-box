# API and Backend Routing Setup

## Overview

This monorepo uses a unified deployment on Vercel where:
- **Frontend**: React app built from `frontend/` directory
- **Backend**: FastAPI server running as serverless functions in `api/` directory
- **Both**: Deployed on the same domain, eliminating CORS issues

## Architecture

```
┌─────────────────────────────────────┐
│     Vercel Deployment               │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Frontend   │  │    API      │ │
│  │  (Static)    │  │ (Serverless)│ │
│  │              │  │             │ │
│  │ /, /login,   │  │ /api/*      │ │
│  │ /dashboard   │  │             │ │
│  └──────────────┘  └─────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## Request Flow

1. **Frontend Request**: User visits `https://your-app.vercel.app/dashboard`
   - Vercel serves the React app from `frontend/build/`

2. **API Request**: Frontend calls `/api/schools`
   - Vercel routes `/api/*` to `api/[...path].py` serverless function
   - The function imports `backend/server.py` (FastAPI app)
   - Mangum wraps FastAPI to handle Vercel's event format
   - FastAPI routes with `/api` prefix match the request
   - Response returned to frontend

## File Structure

```
clever-box/
├── api/
│   ├── [...path].py          # Catch-all serverless function
│   ├── requirements.txt      # Python dependencies
│   └── runtime.txt           # Python version (3.9)
├── backend/
│   └── server.py             # FastAPI application
├── frontend/
│   └── src/
│       └── lib/
│           └── api.js        # API client (uses /api/*)
├── vercel.json               # Vercel configuration
└── package.json              # Root monorepo config
```

## Configuration Files

### vercel.json
```json
{
  "buildCommand": "cd frontend && npm install --legacy-peer-deps && DISABLE_ESLINT_PLUGIN=true npm run build",
  "outputDirectory": "frontend/build",
  "installCommand": "cd frontend && npm install --legacy-peer-deps",
  "functions": {
    "api/**/*.py": {
      "runtime": "python3.9"
    }
  },
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key Points:**
- `functions`: Explicitly configures Python runtime for API functions
- `rewrites`: Routes all non-API requests to React app
- `/api/*` requests are automatically handled by Vercel (no rewrite needed)

### api/[...path].py
- Catch-all pattern `[...path]` matches all `/api/*` routes
- Imports FastAPI app from `backend/server.py`
- Wraps with Mangum for Vercel compatibility
- Exports `handler` variable (required by Vercel)

### backend/server.py
- FastAPI app with routes prefixed with `/api`
- Routes: `/api/schools`, `/api/pages`, `/api/auth/login`, etc.
- Uses Supabase for database operations

## Path Routing Details

When a request comes to `/api/schools`:

1. **Vercel Routing**: 
   - Vercel detects `/api/*` pattern
   - Routes to `api/[...path].py` serverless function
   - The `[...path]` captures: `schools`

2. **Mangum Processing**:
   - Mangum receives Vercel event with full path: `/api/schools`
   - Converts to ASGI request for FastAPI

3. **FastAPI Matching**:
   - FastAPI router has prefix `/api`
   - Route defined as: `@api_router.get("/schools")`
   - Full path matches: `/api/schools` ✅
   - Handler executes

## Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/public key
- `CORS_ORIGINS`: Optional (defaults to `*`)

**Important**: After adding/updating env vars, **redeploy** your project.

## Local Development

### Running Locally

```bash
# Install dependencies
npm run install:all

# Run both frontend and backend
npm run dev

# Or run separately:
npm run dev:backend  # Backend on http://localhost:8000
npm run dev:frontend # Frontend on http://localhost:3000
```

### Local API Configuration

In `frontend/src/lib/api.js`:
- Development: Uses `http://localhost:8000/api/...`
- Production: Uses relative URLs `/api/...` (same domain)

## Testing the Setup

### 1. Test API Endpoint
```bash
curl https://your-app.vercel.app/api/
# Should return: {"message": "CleverBox CMS API", "version": "1.0.0"}
```

### 2. Test Schools Endpoint
```bash
curl https://your-app.vercel.app/api/schools
# Should return: [] or list of schools
```

### 3. Check Vercel Function Logs
- Go to Vercel Dashboard → Your Project → Functions
- Click on `api/[...path]` function
- Check logs for initialization messages

## Troubleshooting

### 404 Errors on `/api/*` Routes

**Symptoms**: All API requests return 404 "The page could not be found"

**Possible Causes**:
1. Function not deploying
   - Check Vercel Dashboard → Functions tab
   - Verify `api/[...path].py` exists and is committed to git
   - Check build logs for Python function detection

2. Handler not exported
   - Ensure `handler = Mangum(app, lifespan="off")` is at module level
   - Variable must be named `handler` (not `app_handler` or similar)

3. Import errors
   - Check Vercel function logs for import errors
   - Verify `backend/server.py` exists and is importable
   - Ensure all dependencies in `api/requirements.txt` are installed

4. Path routing issues
   - Verify FastAPI routes have `/api` prefix
   - Check that Mangum is receiving the correct path
   - Review function logs for path information

### 500 Internal Server Error

**Most Common Cause**: Missing environment variables

1. Check Vercel Environment Variables:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure `SUPABASE_URL` and `SUPABASE_KEY` are set
   - Set for **Production**, **Preview**, and **Development** environments
   - **Redeploy** after adding/updating

2. Check Function Logs:
   - Go to Vercel Dashboard → Functions → `api/[...path]`
   - Look for error messages in logs
   - Common errors:
     - `"Missing required environment variables"`
     - `"Failed to create Supabase client"`

## Monorepo Structure

This project uses a monorepo structure managed at the root level:

- **Root `package.json`**: Manages workspace and shared scripts
- **Frontend**: Independent React app in `frontend/` directory
- **Backend**: Python FastAPI app in `backend/` directory
- **API**: Vercel serverless functions in `api/` directory

### Benefits
- Single repository for all code
- Shared configuration and tooling
- Unified deployment on Vercel
- Easy local development with `npm run dev`

## Future Improvements

### Potential Vite Migration

If migrating from Create React App to Vite:

1. **Benefits**:
   - Faster development server
   - Better HMR (Hot Module Replacement)
   - Simpler configuration
   - Better monorepo support

2. **Migration Steps**:
   - Install Vite and plugins
   - Create `vite.config.js`
   - Update `package.json` scripts
   - Move `public/` and `src/` structure
   - Update `vercel.json` build command

3. **Considerations**:
   - Current CRA setup works fine
   - Migration requires testing all features
   - Vite has different build output structure

## Summary

✅ **API and backend are properly routed and connected**
- Vercel automatically routes `/api/*` to serverless functions
- FastAPI app handles all API requests
- Frontend and backend run on same domain
- Monorepo structure supports unified deployment

The setup is production-ready and follows Vercel best practices for full-stack applications.
