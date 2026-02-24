# Vercel Environment Variables Setup

## Required Environment Variables

To fix the 500 errors, you **must** set these environment variables in Vercel:

### 1. Go to Vercel Dashboard
- Navigate to your project: `clever-box`
- Click **Settings** → **Environment Variables**

### 2. Add These Variables

#### `SUPABASE_URL`
- **Value**: Your Supabase project URL
- **Format**: `https://your-project-id.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL

#### `SUPABASE_KEY`
- **Value**: Your Supabase anon/public key
- **Format**: A long string starting with `eyJ...`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public` key
- **⚠️ Important**: Use the **anon/public** key, NOT the `service_role` key

### 3. Set for All Environments
Make sure to set these for:
- ✅ **Production**
- ✅ **Preview** 
- ✅ **Development**

### 4. Redeploy
After adding/updating environment variables:
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Quick Test

After setting environment variables and redeploying:

1. Test the API root: `https://clever-box-ashen.vercel.app/api/`
   - Should return: `{"message": "CleverBox API", "version": "1.0.0"}`

2. Test a specific endpoint: `https://clever-box-ashen.vercel.app/api/auth/login`
   - Should return a response (not 500 error)

## Still Getting 500 Errors?

1. **Check Function Logs:**
   - Vercel Dashboard → Your Project → **Functions** tab
   - Click on the function that failed
   - Look for error messages in the logs

2. **Verify Environment Variables:**
   - Go back to Settings → Environment Variables
   - Confirm both `SUPABASE_URL` and `SUPABASE_KEY` are present
   - Make sure there are no extra spaces or quotes

3. **Test Supabase Connection:**
   - Verify your Supabase project is active
   - Check that the URL and key are correct
   - Try accessing Supabase Dashboard to confirm credentials

## Local Development

For local development, create a `.env` file in the project root:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key-here
```

Then run:
```bash
./start.sh  # Mac/Linux
# or
start.bat   # Windows
```
