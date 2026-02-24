# Local Development Setup

## Quick Start

### Option 1: Using the startup script (Recommended)

**Mac/Linux:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

### Option 2: Using npm directly

```bash
# Install dependencies (first time only)
npm install
cd frontend && npm install && cd ..

# Start both frontend and backend
npm run dev
```

## Prerequisites

1. **Node.js** (v16+) and npm/yarn
2. **Python** (3.9+) with pip
3. **MongoDB** running locally (or use MongoDB Atlas)

## Setup Steps

### 1. Install Dependencies

```bash
# Install root dependencies (includes concurrently)
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && pip install -r requirements.txt && cd ..
```

### 2. Configure Backend

Create `backend/.env` file:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=cleverbox
CORS_ORIGINS=*
```

Or use MongoDB Atlas:
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=cleverbox
CORS_ORIGINS=*
```

### 3. Configure Frontend (Optional)

The frontend will automatically use `http://localhost:8000` if `REACT_APP_BACKEND_URL` is not set.

To override, create `frontend/.env.local`:
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Running the App

Once everything is set up, simply run:

```bash
npm run dev
```

This will start:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000

The frontend will automatically open in your browser.

## Available Scripts

- `npm run dev` - Start both frontend and backend concurrently
- `npm run dev:backend` - Start only the backend
- `npm run dev:frontend` - Start only the frontend
- `npm run install:all` - Install all dependencies (root, frontend, and backend)

## Troubleshooting

### Backend won't start
- Make sure MongoDB is running
- Check that `backend/.env` exists and has correct values
- Verify Python dependencies: `pip install -r backend/requirements.txt`

### Frontend won't connect to backend
- Ensure backend is running on port 8000
- Check browser console for CORS errors (shouldn't happen with CORS_ORIGINS=*)
- Verify `REACT_APP_BACKEND_URL` is set correctly or defaults to localhost:8000

### Port already in use
- Backend uses port 8000 - change in `package.json` if needed
- Frontend uses port 3000 - React will prompt to use another port
