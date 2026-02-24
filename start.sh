#!/bin/bash

# Simple script to start both frontend and backend
# Make sure you have:
# 1. Python 3.9+ installed
# 2. Node.js and npm/yarn installed
# 3. MongoDB running (or update MONGO_URL in backend/.env)

echo "🚀 Starting Clever Box..."
echo ""

# Check if concurrently is installed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/concurrently" ]; then
  echo "📦 Installing root dependencies..."
  npm install
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Check if backend has .env file
if [ ! -f "backend/.env" ]; then
  echo "⚠️  Warning: backend/.env not found!"
  echo "   Create backend/.env with:"
  echo "   MONGO_URL=mongodb://localhost:27017"
  echo "   DB_NAME=cleverbox"
  echo "   CORS_ORIGINS=*"
  echo ""
fi

echo "🎯 Starting backend and frontend..."
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo ""

npm run dev
