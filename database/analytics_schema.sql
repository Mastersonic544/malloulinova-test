-- Analytics Database Schema for Malloulinova
-- Run this in Supabase SQL Editor

-- 1. Page Views Table
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  country TEXT,
  city TEXT,
  session_id TEXT,
  visitor_id TEXT, -- Anonymous visitor tracking
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON public.page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);

-- 2. Click Events Table (for heatmap)
CREATE TABLE IF NOT EXISTS public.click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  x_position INTEGER NOT NULL, -- X coordinate as percentage (0-100)
  y_position INTEGER NOT NULL, -- Y coordinate as percentage (0-100)
  element_type TEXT, -- 'button', 'link', 'image', etc.
  element_text TEXT,
  element_id TEXT,
  element_class TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  scroll_depth INTEGER, -- Percentage scrolled
  section_id TEXT,
  session_id TEXT,
  visitor_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for heatmap queries
CREATE INDEX IF NOT EXISTS idx_click_events_page_path ON public.click_events(page_path);
CREATE INDEX IF NOT EXISTS idx_click_events_created_at ON public.click_events(created_at DESC);

-- 3. Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  visitor_id TEXT NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_count INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  referrer TEXT,
  entry_page TEXT,
  exit_page TEXT,
  is_bounce BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for session queries
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON public.sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON public.sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at DESC);

-- 4. Visitors Table (Anonymous tracking)
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT UNIQUE NOT NULL,
  first_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  visit_count INTEGER DEFAULT 1,
  total_page_views INTEGER DEFAULT 0,
  device_type TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for visitor queries
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON public.visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON public.visitors(last_seen DESC);

-- 5. Daily Stats Table (Aggregated for performance)
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  new_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  avg_session_duration INTEGER, -- seconds
  bounce_rate DECIMAL(5,2), -- percentage
  desktop_percentage DECIMAL(5,2),
  mobile_percentage DECIMAL(5,2),
  tablet_percentage DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for date queries
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_stats(date DESC);

-- 6. Top Pages Table (Aggregated)
CREATE TABLE IF NOT EXISTS public.top_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  page_title TEXT,
  view_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page INTEGER, -- seconds
  bounce_rate DECIMAL(5,2),
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(page_path)
);

-- Index for top pages
CREATE INDEX IF NOT EXISTS idx_top_pages_view_count ON public.top_pages(view_count DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow insert for anyone (anonymous tracking), read only for authenticated users
CREATE POLICY "Allow anonymous insert on page_views" ON public.page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read on page_views" ON public.page_views
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow anonymous insert on click_events" ON public.click_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read on click_events" ON public.click_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow anonymous insert on sessions" ON public.sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update on sessions" ON public.sessions
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated read on sessions" ON public.sessions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow anonymous insert on visitors" ON public.visitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update on visitors" ON public.visitors
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated read on visitors" ON public.visitors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read on daily_stats" ON public.daily_stats
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read on top_pages" ON public.top_pages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Function to update daily stats (run via cron or trigger)
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_stats (
    date,
    total_views,
    unique_visitors,
    new_visitors,
    returning_visitors,
    total_sessions,
    avg_session_duration,
    bounce_rate,
    desktop_percentage,
    mobile_percentage,
    tablet_percentage
  )
  SELECT
    CURRENT_DATE,
    COUNT(*) as total_views,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(DISTINCT CASE WHEN v.visit_count = 1 THEN pv.visitor_id END) as new_visitors,
    COUNT(DISTINCT CASE WHEN v.visit_count > 1 THEN pv.visitor_id END) as returning_visitors,
    COUNT(DISTINCT session_id) as total_sessions,
    AVG(s.duration_seconds)::INTEGER as avg_session_duration,
    (COUNT(CASE WHEN s.is_bounce THEN 1 END)::DECIMAL / NULLIF(COUNT(DISTINCT s.session_id), 0) * 100) as bounce_rate,
    (COUNT(CASE WHEN pv.device_type = 'desktop' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as desktop_percentage,
    (COUNT(CASE WHEN pv.device_type = 'mobile' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as mobile_percentage,
    (COUNT(CASE WHEN pv.device_type = 'tablet' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as tablet_percentage
  FROM public.page_views pv
  LEFT JOIN public.visitors v ON pv.visitor_id = v.visitor_id
  LEFT JOIN public.sessions s ON pv.session_id = s.session_id
  WHERE DATE(pv.created_at) = CURRENT_DATE
  ON CONFLICT (date) DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_visitors = EXCLUDED.unique_visitors,
    new_visitors = EXCLUDED.new_visitors,
    returning_visitors = EXCLUDED.returning_visitors,
    total_sessions = EXCLUDED.total_sessions,
    avg_session_duration = EXCLUDED.avg_session_duration,
    bounce_rate = EXCLUDED.bounce_rate,
    desktop_percentage = EXCLUDED.desktop_percentage,
    mobile_percentage = EXCLUDED.mobile_percentage,
    tablet_percentage = EXCLUDED.tablet_percentage,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update top pages stats
CREATE OR REPLACE FUNCTION update_top_pages()
RETURNS void AS $$
BEGIN
  INSERT INTO public.top_pages (
    page_path,
    page_title,
    view_count,
    unique_visitors,
    avg_time_on_page,
    bounce_rate
  )
  SELECT
    pv.page_path,
    MAX(pv.page_title) as page_title,
    COUNT(*) as view_count,
    COUNT(DISTINCT pv.visitor_id) as unique_visitors,
    0 as avg_time_on_page, -- Calculate separately if needed
    0 as bounce_rate -- Calculate separately if needed
  FROM public.page_views pv
  GROUP BY pv.page_path
  ON CONFLICT (page_path) DO UPDATE SET
    page_title = EXCLUDED.page_title,
    view_count = EXCLUDED.view_count,
    unique_visitors = EXCLUDED.unique_visitors,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.page_views TO anon, authenticated;
GRANT SELECT, INSERT ON public.click_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.visitors TO anon, authenticated;
GRANT SELECT ON public.daily_stats TO authenticated;
GRANT SELECT ON public.top_pages TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Analytics schema created successfully!';
  RAISE NOTICE 'Tables created: page_views, click_events, sessions, visitors, daily_stats, top_pages';
  RAISE NOTICE 'Run update_daily_stats() and update_top_pages() functions periodically to aggregate data';
END $$;
