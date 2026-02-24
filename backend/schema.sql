-- Supabase/PostgreSQL Schema for Clever Box CMS
-- Run this in your Supabase SQL Editor to create the tables

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#1D4ED8',
    secondary_color TEXT DEFAULT '#FBBF24',
    theme TEXT DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    components JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT FALSE,
    theme TEXT DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, slug)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pages_school_id ON pages(school_id);
CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
