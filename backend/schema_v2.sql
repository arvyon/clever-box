-- Supabase/PostgreSQL Schema v2 Migration for Clever Box CMS
-- This migration updates IDs to UUID type with auto-generation
-- and adds metadata JSONB fields to both tables
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Drop existing constraints and indexes that depend on the old column types
DROP INDEX IF EXISTS idx_pages_school_id;
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;

-- Step 2: Drop foreign key constraint (will be recreated with UUID)
ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_school_id_fkey;

-- Step 3: Alter schools table - change id to UUID with default generation
ALTER TABLE schools
  ALTER COLUMN id TYPE UUID USING id::uuid,
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 4: Add metadata field to schools table
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Step 5: Alter pages table - change id and school_id to UUID
ALTER TABLE pages
  ALTER COLUMN id TYPE UUID USING id::uuid,
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN school_id TYPE UUID USING school_id::uuid;

-- Step 6: Add metadata field to pages table
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Step 7: Recreate foreign key constraint with UUID
ALTER TABLE pages
  ADD CONSTRAINT pages_school_id_fkey
  FOREIGN KEY (school_id)
  REFERENCES schools(id)
  ON DELETE CASCADE;

-- Step 8: Recreate indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pages_school_id ON pages(school_id);
CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);

-- Step 9: Create GIN indexes for JSONB metadata fields (for efficient JSON queries)
CREATE INDEX IF NOT EXISTS idx_schools_metadata ON schools USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_pages_metadata ON pages USING GIN (metadata);

-- Step 10: Recreate updated_at trigger
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Update any existing RLS policies if they exist
-- Note: If you have RLS enabled, you may need to update policies manually
-- This section handles common policy patterns

-- Drop and recreate policies for schools table (if they exist)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Schools are viewable by everyone" ON schools;
    DROP POLICY IF EXISTS "Schools are insertable by authenticated users" ON schools;
    DROP POLICY IF EXISTS "Schools are updatable by authenticated users" ON schools;
    DROP POLICY IF EXISTS "Schools are deletable by authenticated users" ON schools;

    -- Recreate policies (adjust these based on your actual RLS requirements)
    -- Uncomment and modify these if you have RLS enabled:
    /*
    CREATE POLICY "Schools are viewable by everyone" ON schools
        FOR SELECT USING (true);

    CREATE POLICY "Schools are insertable by authenticated users" ON schools
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Schools are updatable by authenticated users" ON schools
        FOR UPDATE USING (auth.role() = 'authenticated');

    CREATE POLICY "Schools are deletable by authenticated users" ON schools
        FOR DELETE USING (auth.role() = 'authenticated');
    */
END $$;

-- Drop and recreate policies for pages table (if they exist)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Pages are viewable by everyone" ON pages;
    DROP POLICY IF EXISTS "Pages are insertable by authenticated users" ON pages;
    DROP POLICY IF EXISTS "Pages are updatable by authenticated users" ON pages;
    DROP POLICY IF EXISTS "Pages are deletable by authenticated users" ON pages;

    -- Recreate policies (adjust these based on your actual RLS requirements)
    -- Uncomment and modify these if you have RLS enabled:
    /*
    CREATE POLICY "Pages are viewable by everyone" ON pages
        FOR SELECT USING (true);

    CREATE POLICY "Pages are insertable by authenticated users" ON pages
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Pages are updatable by authenticated users" ON pages
        FOR UPDATE USING (auth.role() = 'authenticated');

    CREATE POLICY "Pages are deletable by authenticated users" ON pages
        FOR DELETE USING (auth.role() = 'authenticated');
    */
END $$;

-- Migration complete!
-- Note: If you have existing data, the USING clause will attempt to convert
-- existing TEXT IDs to UUIDs. Make sure your existing IDs are valid UUIDs
-- or update them before running this migration.
