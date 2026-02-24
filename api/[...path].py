"""
Vercel serverless function wrapper for FastAPI backend
This handles all /api/* routes using catch-all pattern
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Import the FastAPI app from backend
from server import app
from mangum import Mangum

# Vercel's [...path] receives the path without /api prefix
# But FastAPI routes have /api prefix, so we need to prepend it
# Mangum will handle the path correctly when we wrap the app

# Wrap FastAPI app with Mangum for serverless compatibility
# The app already has /api prefix in routes, and Vercel routes /api/* here
# So paths will match correctly
handler = Mangum(app, lifespan="off")
