-- CABISaas Kitchen Quote Tool Database Schema
-- Supabase Project: https://fejzgyzzqszsvjzvkois.supabase.co

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_number TEXT UNIQUE NOT NULL,
  revision INT DEFAULT 0,
  customer_name TEXT NOT NULL,
  mobile TEXT,
  location TEXT,
  wall_height INT DEFAULT 2700,
  notes TEXT,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Walls Table
CREATE TABLE IF NOT EXISTS walls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  wall_id TEXT NOT NULL, -- 'A', 'B', 'C', 'I'
  length INT NOT NULL,
  height INT NOT NULL DEFAULT 2700,
  openings JSONB DEFAULT '[]'::jsonb
);

-- 3. Placed Cabinets Table (Single Source of Truth)
CREATE TABLE IF NOT EXISTS cabinets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  wall_id TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL, -- 'base', 'top', 'tall'
  start_mm INT NOT NULL,
  width_mm INT NOT NULL,
  depth_mm INT NOT NULL,
  height_mm INT NOT NULL,
  charge_width_mm INT NOT NULL,
  locked BOOLEAN DEFAULT FALSE,
  label TEXT,
  notes TEXT
);

-- 4. Confidential Pricing & Quotation Revisions
CREATE TABLE IF NOT EXISTS quote_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  revision_number INT NOT NULL,
  base_lf NUMERIC,
  top_lf NUMERIC,
  tall_lf NUMERIC,
  granite_sqft NUMERIC,
  unique_run_lf NUMERIC,
  fabricator_cost NUMERIC, -- Owner only
  selling_price NUMERIC NOT NULL, -- Customer facing
  pdf_storage_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
