# Supabase Migration Guide

This document explains how to migrate from MongoDB to Supabase.

## Setup Steps

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon/public key from Settings → API

### 2. Create Database Tables

Run the SQL in `schema.sql` in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `backend/schema.sql`
4. Run the SQL to create the tables

### 3. Update Environment Variables

Replace MongoDB environment variables with Supabase:

**Old (MongoDB):**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=cleverbox
```

**New (Supabase):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
```

### 4. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

The new dependencies include:
- `supabase>=2.3.0` - Supabase Python client
- `postgrest>=0.16.0` - PostgreSQL REST client (dependency)

### 5. Update Vercel Environment Variables

If deploying to Vercel, update your environment variables:
- Remove: `MONGO_URL`, `DB_NAME`
- Add: `SUPABASE_URL`, `SUPABASE_KEY`

## Key Changes

### Database Structure

- **MongoDB Collections** → **PostgreSQL Tables**
  - `schools` collection → `schools` table
  - `pages` collection → `pages` table

### Data Types

- **Components**: Stored as JSONB in PostgreSQL (was array in MongoDB)
- **Timestamps**: PostgreSQL uses TIMESTAMPTZ (automatically handled)
- **IDs**: Still using UUID strings (compatible)

### API Changes

No API changes - all endpoints work the same way. The backend handles the conversion between JSON and JSONB automatically.

## Benefits of Supabase

1. **PostgreSQL**: More powerful querying and relationships
2. **Built-in Auth**: Can integrate Supabase Auth later
3. **Real-time**: Can add real-time subscriptions if needed
4. **Storage**: Can use Supabase Storage for file uploads
5. **Free Tier**: Generous free tier for development

## Testing

After migration:

1. Start your backend: `npm run dev:backend`
2. Test the seed endpoint: `POST http://localhost:8000/api/seed`
3. Verify data in Supabase dashboard → Table Editor

## Troubleshooting

### Connection Issues
- Verify `SUPABASE_URL` includes `https://`
- Check that `SUPABASE_KEY` is the anon/public key (not service role key)

### JSON Parsing Errors
- Components are stored as JSONB - the code handles conversion automatically
- If you see JSON errors, check that the schema was created correctly

### Missing Tables
- Run `schema.sql` in Supabase SQL Editor
- Check that tables exist in Supabase dashboard → Table Editor
