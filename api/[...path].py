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

# Vercel automatically routes /api/* to files in api/ directory
# When a request comes to /api/auth/login:
# - Vercel routes it to api/[...path].py
# - Mangum receives the full request path: /api/auth/login
# - FastAPI routes have /api prefix, so /api/auth/login matches correctly
# No path manipulation needed - Mangum handles it automatically

# Wrap FastAPI app with Mangum for serverless compatibility
handler = Mangum(app, lifespan="off")
