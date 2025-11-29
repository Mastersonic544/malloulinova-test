-- Migration: Add tags system to articles table
-- Date: 2025-01-09
-- Description: Adds tags column and creates tags table for managing article categories

-- 1. Create tags table for managing available tags
CREATE TABLE IF NOT EXISTS public.tags (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  color text DEFAULT '#447D9B',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Add tags column to articles table (JSONB array for multiple tags)
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb NOT NULL;

-- 3. Create index on tags for faster filtering
CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING gin(tags);

-- 4. Insert default tags
INSERT INTO public.tags (id, name, slug, description, color) VALUES
  ('tag_embedded', 'Embedded Systems', 'embedded-systems', 'Firmware development, microcontroller projects, embedded connectivity', '#447D9B'),
  ('tag_iot', 'IoT Solutions', 'iot-solutions', 'End-to-end IoT implementations, sensor networks, device management', '#273F4F'),
  ('tag_wireless', 'Wireless Protocols', 'wireless-protocols', 'LoRaWAN, WMBUS, MIOTY implementations and guides', '#FE7743'),
  ('tag_cloud', 'Cloud Integration', 'cloud-integration', 'AWS, Azure, Google Cloud integrations and backend development', '#64748B'),
  ('tag_case_study', 'Case Studies', 'case-studies', 'Client success stories and project walkthroughs', '#10B981')
ON CONFLICT (id) DO NOTHING;

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger for tags table
DROP TRIGGER IF EXISTS update_tags_updated_at ON public.tags;
CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON public.tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Create trigger for articles table (if not exists)
DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verification queries (run these to check the migration)
-- SELECT * FROM public.tags;
-- SELECT id, title, tags FROM public.articles;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'tags';
