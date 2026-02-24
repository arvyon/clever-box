# Debugging with Logs

## Where to Find Logs

1. **Vercel Dashboard → Your Project → Functions Tab**
   - Click on the function that failed (usually `api/[...path]`)
   - View real-time logs and errors

2. **Vercel Dashboard → Your Project → Deployments Tab**
   - Click on a deployment
   - View build logs and function logs

## What the Logs Will Show

### Initialization Logs

When the serverless function starts, you'll see:

```
[INFO] ============================================================
[INFO] Initializing Vercel serverless function...
[INFO] ============================================================
[INFO] Backend path: /path/to/backend
[INFO] Backend path exists: True
[INFO] Backend directory contents: [...]
[INFO] Added /path/to/backend to Python path
[INFO] Checking environment variables...
[INFO] SUPABASE_URL present: True
[INFO] SUPABASE_KEY present: True
[INFO] SUPABASE_URL starts with: https://...
[INFO] SUPABASE_KEY starts with: eyJ...
[INFO] Attempting to import server module...
[BACKEND] ============================================================
[BACKEND] Initializing FastAPI backend server...
[BACKEND] ============================================================
[BACKEND] Root directory: /path/to/backend
[BACKEND] Upload directory: /path/to/backend/uploads
[BACKEND] Loading environment variables...
[BACKEND] Environment file exists: False
[BACKEND] Checking Supabase environment variables...
[BACKEND] SUPABASE_URL present: True
[BACKEND] SUPABASE_KEY present: True
[BACKEND] SUPABASE_URL: https://...
[BACKEND] SUPABASE_KEY: eyJ...
[BACKEND] Creating Supabase client...
[BACKEND] ✓ Supabase client created successfully
[BACKEND] Testing Supabase connection...
[BACKEND] ✓ Supabase client initialized
[BACKEND] Creating FastAPI app...
[BACKEND] ✓ FastAPI app and router created
[BACKEND] Mounting static files directory...
[BACKEND] ✓ Static files mounted at /uploads
[BACKEND] Including API router...
[BACKEND] ✓ API router included with X total routes
[BACKEND] Registered routes: ['/api/', '/api/auth/login', ...]
[BACKEND] Adding CORS middleware...
[BACKEND] CORS origins: ['*']
[BACKEND] ✓ CORS middleware added
[BACKEND] ============================================================
[BACKEND] FastAPI backend server initialized successfully!
[BACKEND] ============================================================
[INFO] ✓ Successfully imported server module
[INFO] FastAPI app: <FastAPI app>
[INFO] FastAPI app routes: [...]
[INFO] Wrapping FastAPI app with Mangum...
[INFO] ✓ Successfully created Mangum handler
[INFO] ============================================================
[INFO] Serverless function initialized successfully!
[INFO] ============================================================
```

### Request Logs

When a request comes in:

```
[INFO] ============================================================
[INFO] Received request: GET /api/
[INFO] Event keys: [...]
[BACKEND] → GET /api/
[BACKEND] ← GET /api/ → 200
[INFO] Request completed successfully
```

### Error Logs

If something fails, you'll see:

```
[ERROR] Failed to import server module: <error message>
[ERROR] Traceback: ...
```

Or:

```
[BACKEND ERROR] Failed to create Supabase client: <error>
[BACKEND ERROR] Traceback: ...
```

## Common Issues and What to Look For

### 1. Missing Environment Variables

**Look for:**
```
[INFO] SUPABASE_URL present: False
[INFO] SUPABASE_KEY present: False
[BACKEND ERROR] SUPABASE_URL is missing!
[BACKEND ERROR] SUPABASE_KEY is missing!
```

**Solution:** Set `SUPABASE_URL` and `SUPABASE_KEY` in Vercel Dashboard → Settings → Environment Variables

### 2. Import Errors

**Look for:**
```
[ERROR] Failed to import server module: No module named 'server'
[ERROR] Traceback: ...
```

**Possible causes:**
- Backend directory not found
- Missing Python dependencies
- Path issues

**Check:**
- `[INFO] Backend path exists: True/False`
- `[INFO] Backend directory contents: [...]`

### 3. Supabase Connection Errors

**Look for:**
```
[BACKEND ERROR] Failed to create Supabase client: <error>
```

**Possible causes:**
- Invalid Supabase URL
- Invalid Supabase key
- Network issues

**Check:**
- `[BACKEND] SUPABASE_URL: ...` - verify it's correct
- `[BACKEND] SUPABASE_KEY: ...` - verify it's the anon/public key

### 4. Route Not Found

**Look for:**
```
[BACKEND] → GET /api/nonexistent
[BACKEND] ← GET /api/nonexistent → 404
```

**Check:**
- `[BACKEND] Registered routes: [...]` - verify your route is listed

### 5. Handler Execution Errors

**Look for:**
```
[ERROR] Handler error: <error message>
[BACKEND ERROR] Request handler error for GET /api/...: <error>
```

**Check the traceback** to see what went wrong in your route handler.

## Tips

1. **Always check the full logs** - errors often have helpful tracebacks
2. **Look for initialization errors first** - if initialization fails, all requests will fail
3. **Check environment variables** - most 500 errors are due to missing env vars
4. **Verify routes are registered** - check the "Registered routes" log line
5. **Check Supabase connection** - verify the client is created successfully

## Testing Locally

To see these logs locally, run:

```bash
./start.sh  # Mac/Linux
# or
start.bat   # Windows
```

The logs will appear in your terminal where the backend is running.
