"""
Vercel serverless function wrapper for FastAPI backend
This handles all /api/* routes using catch-all pattern
"""
import sys
import os
import json
import traceback
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from mangum import Mangum

# Configure logging - Vercel will capture print() and logging output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Also use print for Vercel logs visibility
def log_info(msg):
    logger.info(msg)
    print(f"[INFO] {msg}")

def log_error(msg, exc=None):
    logger.error(msg, exc_info=exc)
    print(f"[ERROR] {msg}")
    if exc:
        print(f"[ERROR] Traceback: {traceback.format_exc()}")

log_info("=" * 60)
log_info("Initializing Vercel serverless function...")
log_info("=" * 60)

# Add backend directory to path
backend_path = Path(__file__).parent.parent / "backend"
log_info(f"Backend path: {backend_path}")
log_info(f"Backend path exists: {backend_path.exists()}")

if backend_path.exists():
    log_info(f"Backend directory contents: {list(backend_path.iterdir())}")
else:
    log_error(f"Backend directory not found at: {backend_path}")

sys.path.insert(0, str(backend_path))
log_info(f"Added {backend_path} to Python path")

# Check environment variables
log_info("Checking environment variables...")
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_KEY')
log_info(f"SUPABASE_URL present: {bool(supabase_url)}")
log_info(f"SUPABASE_KEY present: {bool(supabase_key)}")
if supabase_url:
    log_info(f"SUPABASE_URL starts with: {supabase_url[:20]}...")
if supabase_key:
    log_info(f"SUPABASE_KEY starts with: {supabase_key[:10]}...")

try:
    log_info("Attempting to import server module...")
    from server import app
    log_info("✓ Successfully imported server module")
    log_info(f"FastAPI app: {app}")
    log_info(f"FastAPI app routes: {[r.path for r in app.routes]}")
    
    log_info("Wrapping FastAPI app with Mangum...")
    handler = Mangum(app, lifespan="off")
    log_info("✓ Successfully created Mangum handler")
    log_info("=" * 60)
    log_info("Serverless function initialized successfully!")
    log_info("=" * 60)
    
except ImportError as e:
    log_error(f"Failed to import server module: {e}", e)
    log_error(f"Python path: {sys.path}")
    log_error(f"Current working directory: {os.getcwd()}")
    error_app = FastAPI()
    error_msg = str(e)
    error_trace = traceback.format_exc()
    
    @error_app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        log_error(f"Request failed: {exc}", exc)
        return JSONResponse(
            status_code=500,
            content={
                'error': 'Import failed',
                'message': error_msg,
                'type': type(e).__name__,
                'hint': 'Check Vercel function logs for full traceback',
                'trace': error_trace.split('\n')[-10:] if error_trace else []
            }
        )
    
    @error_app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
    async def error_handler(full_path: str, request: Request):
        log_error(f"Request to {full_path} failed - server not initialized")
        raise HTTPException(
            status_code=500,
            detail={
                'error': 'Server initialization failed',
                'message': error_msg,
                'type': type(e).__name__,
                'path': full_path,
                'hint': 'Check Vercel function logs for full traceback'
            }
        )
    
    handler = Mangum(error_app, lifespan="off")
    
except Exception as e:
    log_error(f"Failed to initialize server: {e}", e)
    error_app = FastAPI()
    error_msg = str(e)
    error_trace = traceback.format_exc()
    
    @error_app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        log_error(f"Request failed: {exc}", exc)
        return JSONResponse(
            status_code=500,
            content={
                'error': 'Server initialization failed',
                'message': error_msg,
                'type': type(e).__name__,
                'hint': 'Check Vercel function logs for full traceback',
                'trace': error_trace.split('\n')[-10:] if error_trace else []
            }
        )
    
    @error_app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
    async def error_handler(full_path: str, request: Request):
        log_error(f"Request to {full_path} failed - server not initialized")
        raise HTTPException(
            status_code=500,
            detail={
                'error': 'Server initialization failed',
                'message': error_msg,
                'type': type(e).__name__,
                'path': full_path,
                'hint': 'Check Vercel function logs for full traceback'
            }
        )
    
    handler = Mangum(error_app, lifespan="off")

# Add request logging middleware
async def log_request(request: Request, call_next):
    log_info(f"→ {request.method} {request.url.path}")
    log_info(f"  Query params: {dict(request.query_params)}")
    try:
        response = await call_next(request)
        log_info(f"← {request.method} {request.url.path} → {response.status_code}")
        return response
    except Exception as e:
        log_error(f"Request handler error: {e}", e)
        raise

# Wrap handler to add logging
original_handler = handler

async def logged_handler(event, context):
    log_info("=" * 60)
    log_info(f"Received request: {event.get('httpMethod', 'UNKNOWN')} {event.get('path', 'UNKNOWN')}")
    log_info(f"Event keys: {list(event.keys())}")
    try:
        result = await original_handler(event, context)
        log_info(f"Request completed successfully")
        return result
    except Exception as e:
        log_error(f"Handler error: {e}", e)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Handler execution failed',
                'message': str(e),
                'type': type(e).__name__,
                'hint': 'Check Vercel function logs for full traceback'
            })
        }

handler = logged_handler
