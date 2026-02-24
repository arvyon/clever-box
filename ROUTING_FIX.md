# Fixing 404 Errors on Vercel

## The Problem

Getting 404 "The page could not be found" errors for all `/api/*` requests. This suggests Vercel isn't finding or invoking the serverless function.

## Root Cause

The 404 error is coming from Vercel itself, not from FastAPI. This means:
- The serverless function might not be deploying
- Vercel might not be recognizing the Python function
- The handler might not be properly exported

## Solution Steps

### 1. Verify File Structure

Ensure the file exists at:
```
api/[...path].py
```

### 2. Check Vercel Function Logs

Go to Vercel Dashboard → Your Project → Functions tab
- If you see the function listed, check its logs
- If you DON'T see the function, it's not being deployed

### 3. Verify Handler Export

The handler must be exported as `handler` at the module level:
```python
handler = Mangum(app, lifespan="off")
```

### 4. Check Build Logs

In Vercel Dashboard → Deployments → Latest deployment:
- Look for Python function detection
- Check for any errors during build
- Verify `api/requirements.txt` is being processed

### 5. Test Locally

Run `vercel dev` locally to test:
```bash
vercel dev
```

Then test: `http://localhost:3000/api/`

### 6. Common Issues

**Issue: Function not detected**
- Ensure file is named `[...path].py` (not `[...path].py.txt`)
- Check that `api/` directory is in the root of your project
- Verify the file is committed to git

**Issue: Import errors**
- Check Vercel function logs for import errors
- Ensure `backend/server.py` exists and is importable
- Verify all dependencies in `api/requirements.txt`

**Issue: Handler not callable**
- The handler must be the result of `Mangum(app)`
- Don't wrap it in additional functions that change the signature

## Next Steps

1. Check Vercel function logs to see if initialization logs appear
2. If no logs appear, the function isn't being invoked
3. If logs appear but show errors, fix those errors
4. If function exists but returns 404, check route registration
