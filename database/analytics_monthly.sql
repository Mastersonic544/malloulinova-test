-- Monthly snapshots for dashboard
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.analytics_monthly (
  month_key TEXT PRIMARY KEY, -- format YYYY-MM
  kpis JSONB NOT NULL DEFAULT '{}'::jsonb,
  daily_stats JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  devices JSONB NOT NULL DEFAULT '{}'::jsonb,
  locations JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful index (PK already covers equality lookups)
CREATE INDEX IF NOT EXISTS idx_analytics_monthly_updated_at ON public.analytics_monthly(updated_at DESC);

-- RLS (match other analytics tables)
ALTER TABLE public.analytics_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on analytics_monthly" ON public.analytics_monthly
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service role upsert on analytics_monthly" ON public.analytics_monthly
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow service role update on analytics_monthly" ON public.analytics_monthly
  FOR UPDATE USING (auth.role() = 'service_role');

-- Optional helper to rebuild a given month (YYYY-MM)
CREATE OR REPLACE FUNCTION public.rebuild_analytics_month(month_text TEXT)
RETURNS void AS $$
DECLARE
  y INT;
  m INT;
  start_ts TIMESTAMPTZ;
  end_ts TIMESTAMPTZ;
  -- payload parts
  _kpis JSONB := '{}'::jsonb;
  _daily JSONB := '[]'::jsonb;
  _pages JSONB := '[]'::jsonb;
  _devices JSONB := '{}'::jsonb;
  _locations JSONB := '[]'::jsonb;
BEGIN
  IF month_text !~ '^[0-9]{4}-[0-9]{2}$' THEN
    RAISE EXCEPTION 'month_text must be YYYY-MM';
  END IF;
  y := split_part(month_text, '-', 1)::INT;
  m := split_part(month_text, '-', 2)::INT;
  start_ts := make_timestamptz(y, m, 1, 0, 0, 0);
  end_ts   := (start_ts + INTERVAL '1 month');

  -- Build daily stats from page_views
  WITH by_day AS (
    SELECT
      date_trunc('day', created_at)::date AS d,
      COUNT(*) AS total_views,
      COUNT(DISTINCT visitor_id) AS unique_visitors
    FROM public.page_views
    WHERE created_at >= start_ts AND created_at < end_ts
    GROUP BY 1
    ORDER BY 1
  )
  SELECT coalesce(json_agg(json_build_object(
           'date', d,
           'total_views', total_views,
           'unique_visitors', unique_visitors
         ) ORDER BY d), '[]'::json) INTO _daily
  FROM by_day;

  -- Devices
  WITH dev AS (
    SELECT device_type, COUNT(*) AS c
    FROM public.page_views
    WHERE created_at >= start_ts AND created_at < end_ts
    GROUP BY device_type
  )
  SELECT json_build_object(
           'desktop', COALESCE(SUM(CASE WHEN device_type='desktop' THEN c END),0),
           'mobile',  COALESCE(SUM(CASE WHEN device_type='mobile'  THEN c END),0),
           'tablet',  COALESCE(SUM(CASE WHEN device_type='tablet'  THEN c END),0)
         ) INTO _devices
  FROM dev;

  -- Locations (top 7)
  WITH loc AS (
    SELECT country, COUNT(*) AS visits
    FROM public.page_views
    WHERE created_at >= start_ts AND created_at < end_ts
    GROUP BY country
    ORDER BY visits DESC
    LIMIT 7
  )
  SELECT coalesce(json_agg(json_build_object('country', country, 'visits', visits)), '[]'::json) INTO _locations
  FROM loc;

  -- Top pages (top 10)
  WITH tp AS (
    SELECT page_path, COUNT(*) AS view_count
    FROM public.page_views
    WHERE created_at >= start_ts AND created_at < end_ts
    GROUP BY page_path
    ORDER BY view_count DESC
    LIMIT 10
  )
  SELECT coalesce(json_agg(json_build_object('page_path', page_path, 'view_count', view_count)), '[]'::json) INTO _pages
  FROM tp;

  -- KPIs from daily
  SELECT json_build_object(
           'todayViews', COALESCE(((_daily->>json_array_length(_daily)-1)::jsonb->>'total_views')::int, 0),
           'todayVisitors', 0,
           'totalViews30Days', COALESCE((SELECT SUM((elem->>'total_views')::int) FROM json_array_elements(_daily) elem), 0),
           'avgViewsPerDay', COALESCE((SELECT ROUND(AVG((elem->>'total_views')::numeric)) FROM json_array_elements(_daily) elem), 0),
           'viewsGrowth', 0,
           'visitorsGrowth', 0,
           'bounceRate', 0,
           'avgSessionDuration', '0:00'
         ) INTO _kpis;

  INSERT INTO public.analytics_monthly(month_key, kpis, daily_stats, top_pages, devices, locations, updated_at)
  VALUES (month_text, _kpis, _daily, _pages, _devices, _locations, NOW())
  ON CONFLICT (month_key) DO UPDATE SET
    kpis = EXCLUDED.kpis,
    daily_stats = EXCLUDED.daily_stats,
    top_pages = EXCLUDED.top_pages,
    devices = EXCLUDED.devices,
    locations = EXCLUDED.locations,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
