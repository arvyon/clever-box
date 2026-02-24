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

# When running on Vercel, the /api prefix is already in the URL path
# So we need to adjust the app's root path
# The FastAPI app has routes under /api, and Vercel routes /api/* to this function
# So the path matching should work correctly

# Wrap FastAPI app with Mangum for serverless compatibility
handler = Mangum(app, lifespan="off")
