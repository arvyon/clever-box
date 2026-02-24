# API Setup for Vercel

## How It Works

1. **Vercel automatically routes `/api/*` to files in the `api/` directory**
   - No rewrite needed for API routes
   - Files in `api/` become serverless functions

2. **The `api/[...path].py` file handles all `/api/*` requests**
   - Uses catch-all pattern `[...path]`
   - Receives all API requests and passes them to FastAPI

3. **FastAPI app structure:**
   - Routes are defined with `/api` prefix: `api_router = APIRouter(prefix="/api")`
   - When Vercel routes `/api/auth/login` to the function, Mangum receives the full path
   - FastAPI matches `/api/auth/login` against routes with `/api` prefix ✅

4. **Frontend API calls:**
   - Production: Uses relative URLs (`/api/...`) - same domain
   - Development: Uses `http://localhost:8000/api/...` - separate backend server

## Environment Variables Needed in Vercel

Set these in Vercel Dashboard → Settings → Environment Variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon/public key
- `CORS_ORIGINS` - Optional, defaults to `*` (all origins)

## Troubleshooting

### API requests return 404
- Check that `api/[...path].py` exists
- Verify `api/requirements.txt` has all dependencies
- Check Vercel function logs for errors

### API requests return CORS errors
- Set `CORS_ORIGINS` environment variable
- Or ensure backend allows your frontend domain

### API requests go to React app instead
- Check `vercel.json` rewrite rules exclude `/api/*`
- Current config: `"source": "/((?!api/).*)"` excludes `/api/` paths
