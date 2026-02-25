# Railway Migration Guide: Vercel to Railway

This guide provides step-by-step instructions for migrating the CleverBox project from Vercel to Railway with Supabase integration.

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- Supabase project with database schema already set up
- GitHub repository with the project code
- Supabase project URL and API keys

## Architecture Overview

After migration, your project will have:

- **Frontend Service**: React CRA app served via Railway
- **Backend Service**: Minimal FastAPI service for custom endpoints
- **Supabase Data API**: Direct CRUD operations from frontend
- **Supabase Storage**: Image uploads handled by Supabase

## Step-by-Step Migration

### Step 1: Setup Supabase Storage

Before deploying to Railway, set up Supabase Storage for image uploads:

1. Go to your Supabase project dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `uploads`
   - **Public bucket**: ✅ Enable this (check the box)
   - **File size limit**: `5242880` (5MB) or your preference
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`
5. Click **"Create bucket"**

6. **Set Storage Policies** (for public uploads):
   - Go to **Storage** → **Policies**
   - Click **"New Policy"** for the `uploads` bucket
   - Choose **"For full customization"**
   - Policy name: `Allow public uploads`
   - Allowed operation: `INSERT` and `SELECT`
   - Policy definition:
     ```sql
     (bucket_id = 'uploads'::text)
     ```
   - For anonymous access, use:
     ```sql
     (bucket_id = 'uploads'::text)
     ```
   - Click **"Review"** and **"Save policy"**

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign in or create an account
3. Click **"New Project"** button (top right)
4. Select **"Deploy from GitHub repo"**
5. If not connected, authorize Railway to access your GitHub
6. Select your repository: `clever-box` (or your repo name)
7. Click **"Deploy Now"**

Railway will create a project and attempt to auto-detect services. We'll configure services manually.

### Step 3: Create Frontend Service

1. In your Railway project dashboard, you should see an empty project or auto-detected service
2. Click **"+ New"** button
3. Select **"GitHub Repo"**
4. Select your repository again
5. Railway will show a service configuration screen

6. **Configure Frontend Service:**
   - **Service Name**: `clever-box-frontend` (or your preferred name)
   - **Root Directory**: Click **"Settings"** → **"Root Directory"** → Set to `frontend`
   - **Build Command**: Railway auto-detects, but verify it's:
     ```
     npm install --legacy-peer-deps && DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false npm run build
     ```
   - **Start Command**: 
     ```
     npx serve -s build -l $PORT
     ```
   - **Healthcheck Path**: `/` (optional, in Settings → Healthcheck)

7. **Set Environment Variables:**
   - Click on the service → **"Variables"** tab
   - Click **"+ New Variable"** for each:
     - `REACT_APP_SUPABASE_URL` = `https://your-project-id.supabase.co`
     - `REACT_APP_SUPABASE_ANON_KEY` = Your Supabase anon/public key
     - `REACT_APP_BACKEND_URL` = (Leave empty for now, we'll set after backend deploys)
   - **Note**: Get these from Supabase Dashboard → Settings → API

8. **Configure Domain:**
   - Go to **"Settings"** → **"Networking"**
   - Click **"Generate Domain"** (or add custom domain)
   - Note the generated URL (e.g., `clever-box-frontend-production.up.railway.app`)
   - Copy this URL - you'll need it for backend CORS configuration

### Step 4: Create Backend Service

1. In the same Railway project, click **"+ New"** again
2. Select **"GitHub Repo"** → Same repository
3. **Configure Backend Service:**
   - **Service Name**: `clever-box-backend`
   - **Root Directory**: Click **"Settings"** → **"Root Directory"** → Set to `backend`
   - **Build Command**: Railway auto-detects Python, verify:
     ```
     pip install -r requirements.txt
     ```
   - **Start Command**: 
     ```
     uvicorn server:app --host 0.0.0.0 --port $PORT
     ```
   - **Healthcheck Path**: `/api/` (optional)

4. **Set Environment Variables:**
   - Click on the service → **"Variables"** tab
   - Click **"+ New Variable"** for each:
     - `SUPABASE_URL` = `https://your-project-id.supabase.co`
     - `SUPABASE_KEY` = Your Supabase **service role key** (not anon key - needed for Storage)
     - `FRONTEND_URL` = Frontend service URL from Step 3 (e.g., `https://clever-box-frontend-production.up.railway.app`)
     - `PORT` = (Railway auto-provides, but you can set explicitly if needed)
   - **Important**: Use **service role key** for `SUPABASE_KEY` (found in Supabase Dashboard → Settings → API → service_role key)

5. **Configure Domain:**
   - Go to **"Settings"** → **"Networking"**
   - Click **"Generate Domain"**
   - Note the generated URL (e.g., `clever-box-backend-production.up.railway.app`)
   - Copy this URL

### Step 5: Update Frontend Environment Variable

1. Go back to **Frontend Service**
2. Click **"Variables"** tab
3. Update `REACT_APP_BACKEND_URL` with the backend service URL from Step 4
4. Railway will automatically redeploy the frontend when variables change

### Step 6: Verify Deployments

1. **Check Backend Service:**
   - Wait for deployment to complete (check **"Deployments"** tab)
   - Visit `https://your-backend-url.railway.app/api/`
   - Should return: `{"message": "CleverBox CMS API", "version": "1.0.0"}`

2. **Check Frontend Service:**
   - Wait for deployment to complete
   - Visit `https://your-frontend-url.railway.app`
   - Should load the React app login page

3. **Test API Connection:**
   - Open browser console (F12) on frontend
   - Check for CORS errors
   - Try logging in (use demo credentials)
   - Check Network tab for API calls

### Step 7: Monitor and Debug

#### View Logs

1. **Backend Logs:**
   - Click on backend service → **"Deployments"** tab
   - Click on latest deployment
   - Click **"View Logs"** to see real-time logs

2. **Frontend Logs:**
   - Click on frontend service → **"Deployments"** tab
   - Click on latest deployment
   - Click **"View Logs"** to see build and runtime logs

#### Service Health

- Railway dashboard shows service status with colored indicators:
  - 🟢 **Green**: Service is running
  - 🟡 **Yellow**: Service is building/deploying
  - 🔴 **Red**: Service has errors

#### Common Issues and Solutions

**CORS Errors:**
- **Symptom**: Browser console shows CORS errors
- **Solution**: 
  - Verify `FRONTEND_URL` in backend matches frontend domain exactly (including `https://`)
  - Check backend logs for CORS configuration
  - Ensure no trailing slashes in URLs

**Build Failures:**
- **Symptom**: Service shows red status, build fails
- **Solution**:
  - Check build logs for specific errors
  - Verify all dependencies are in `package.json` or `requirements.txt`
  - For frontend: Ensure `--legacy-peer-deps` flag is used
  - For backend: Check Python version compatibility

**Port Binding Errors:**
- **Symptom**: Service fails to start, port errors in logs
- **Solution**: 
  - Ensure using `$PORT` environment variable (Railway provides this)
  - Backend: `uvicorn server:app --host 0.0.0.0 --port $PORT`
  - Frontend: `npx serve -s build -l $PORT`

**Environment Variable Issues:**
- **Symptom**: App works locally but fails on Railway
- **Solution**:
  - Verify all required env vars are set in Railway dashboard
  - Check variable names match exactly (case-sensitive)
  - For React: Variables must start with `REACT_APP_` to be accessible
  - Redeploy after adding/updating variables

**Supabase Connection Errors:**
- **Symptom**: API calls fail, Supabase errors in logs
- **Solution**:
  - Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
  - Check you're using the right key (anon key for frontend, service role for backend)
  - Ensure Supabase project is active and not paused
  - Check Supabase dashboard for API status

**Image Upload Failures:**
- **Symptom**: Image uploads fail with storage errors
- **Solution**:
  - Verify Supabase Storage bucket `uploads` exists and is public
  - Check storage policies allow INSERT operations
  - Verify backend uses service role key (not anon key)
  - Check file size limits in bucket settings

## Environment Variables Reference

### Frontend Service Variables

| Variable                      | Description              | Example                          |
| ----------------------------- | ------------------------ | -------------------------------- |
| `REACT_APP_SUPABASE_URL`      | Supabase project URL     | `https://abc123.supabase.co`     |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGc...`                     |
| `REACT_APP_BACKEND_URL`       | Backend service URL      | `https://backend.up.railway.app` |

### Backend Service Variables

| Variable       | Description                     | Example                           |
| -------------- | ------------------------------- | --------------------------------- |
| `SUPABASE_URL` | Supabase project URL            | `https://abc123.supabase.co`      |
| `SUPABASE_KEY` | Supabase service role key       | `eyJhbGc...` (service_role)       |
| `FRONTEND_URL` | Frontend service URL (for CORS) | `https://frontend.up.railway.app` |
| `PORT`         | Port number (auto-provided)     | `3000`                            |

## Railway Features

### Automatic Deployments

- Railway automatically deploys on every push to your main branch
- Preview deployments for pull requests (if configured)
- Rollback to previous deployments via dashboard

### Monitoring

- Real-time logs for each service
- Metrics dashboard (CPU, memory, network)
- Usage tracking (important for free tier limits)

### Scaling

- Railway auto-scales based on traffic
- Manual scaling available in paid plans
- Resource limits based on your plan

## Post-Migration Checklist

- [ ] Both services deployed successfully
- [ ] Frontend loads without errors
- [ ] Backend API responds at `/api/`
- [ ] CORS configured correctly
- [ ] Supabase Storage bucket created and configured
- [ ] Image uploads working
- [ ] CRUD operations working (schools, pages)
- [ ] Custom endpoints working (templates, themes, seed)
- [ ] Environment variables set correctly
- [ ] Domains configured (if using custom domains)
- [ ] Monitoring and logging verified

## Rollback Plan

If you need to rollback:

1. **Via Railway Dashboard:**
   - Go to service → **"Deployments"** tab
   - Find previous successful deployment
   - Click **"Redeploy"** or **"Rollback"**

2. **Via Git:**
   - Revert commits in your repository
   - Railway will automatically redeploy

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Data API Documentation](https://supabase.com/docs/guides/api)

## Support

If you encounter issues:

1. Check Railway logs for error messages
2. Verify all environment variables are set
3. Check Supabase dashboard for API status
4. Review this guide's troubleshooting section
5. Check Railway status page for service outages

---

**Migration completed successfully!** Your CleverBox project is now running on Railway with Supabase integration.
