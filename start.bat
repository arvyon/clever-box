@echo off
REM Simple script to start both frontend and backend on Windows

echo 🚀 Starting Clever Box...
echo.

REM Check if concurrently is installed
if not exist "node_modules\concurrently" (
  echo 📦 Installing root dependencies...
  call npm install
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
  echo 📦 Installing frontend dependencies...
  cd frontend
  call npm install
  cd ..
)

REM Check if backend has .env file
if not exist "backend\.env" (
  echo ⚠️  Warning: backend\.env not found!
  echo    Create backend\.env with:
  echo    MONGO_URL=mongodb://localhost:27017
  echo    DB_NAME=cleverbox
  echo    CORS_ORIGINS=*
  echo.
)

echo 🎯 Starting backend and frontend...
echo    Backend: http://localhost:8000
echo    Frontend: http://localhost:3000
echo.

call npm run dev
