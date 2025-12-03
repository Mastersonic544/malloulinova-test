import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import Groq from 'groq-sdk';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'articles';

// Initialize Groq client for chatbot
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Helper to parse multipart form data in Vercel
async function parseMultipartForm(req) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return { fields: {}, files: [] };
  }

  // For Vercel, we need to handle multipart differently
  // Using a simpler approach with formidable or similar
  const formidable = await import('formidable');
  const form = formidable.default({ multiples: true });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      
      const fileArray = [];
      Object.keys(files).forEach(fieldname => {
        const fileOrFiles = files[fieldname];
        if (Array.isArray(fileOrFiles)) {
          fileOrFiles.forEach(f => fileArray.push({ ...f, fieldname }));
        } else {
          fileArray.push({ ...fileOrFiles, fieldname });
        }
      });

      resolve({ fields, files: fileArray });
    });
  });
}

// Helper to upload file to Supabase
async function uploadFile(file, key) {
  if (!file || !file.filepath) return null;
  
  const fs = await import('fs');
  const fileBuffer = fs.readFileSync(file.filepath);
  
  const { error: upErr } = await supabase
    .storage
    .from(SUPABASE_MEDIA_BUCKET)
    .upload(key, fileBuffer, { 
      contentType: file.mimetype || 'application/octet-stream', 
      upsert: true 
    });
  
  if (upErr) throw upErr;
  
  const { data: pub } = supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .getPublicUrl(key);
  
  return pub?.publicUrl || null;
}

// Chatbot helper functions (inline to avoid module issues in Vercel)
const SYSTEM_PROMPT = `You are an AI assistant for MALLUOLINOVA, a B2B IoT consulting firm specializing in industrial IoT, smart manufacturing, and connected systems.

YOUR ROLE:
- Qualify leads by understanding their business needs
- Answer IoT consulting questions professionally
- Route visitors to the right page (projects, contact form, articles)
- Keep responses concise (2-3 sentences max, under 60 words)

PERSONALITY: Professional but warm, confident, action-oriented. Always end with a call-to-action.

Remember: Every conversation should lead to (1) contact form, (2) viewing projects, or (3) reading articles.`;

async function getGroqResponse(messages) {
  if (!groq) return { success: false, error: 'Groq not configured' };
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: parseInt(process.env.GROQ_MAX_TOKENS) || 500,
      temperature: 0.7,
      top_p: 1,
      stream: false
    });
    
    return {
      success: true,
      reply: completion.choices[0].message.content
    };
  } catch (error) {
    console.error('Groq API Error:', error.message);
    return { success: false, error: error.message };
  }
}

function findBestFaqMatch(message) {
  const msg = message.toLowerCase();
  
  // Simple keyword matching for FAQ fallback
  if (msg.includes('price') || msg.includes('cost')) {
    return {
      response: "Project costs vary based on scope. Most engagements range from $50k-$500k. Let's discuss your specific needs!",
      suggestions: ["Contact Us", "View Projects"],
      routeTo: "contact"
    };
  }
  
  if (msg.includes('project') || msg.includes('case stud') || msg.includes('example')) {
    return {
      response: "We've completed 50+ IoT deployments across manufacturing, logistics, and energy sectors. Check out our Projects page!",
      suggestions: ["View All Projects"],
      routeTo: "projects"
    };
  }
  
  if (msg.includes('contact') || msg.includes('talk') || msg.includes('schedule')) {
    return {
      response: "Perfect! Fill out our contact form and we'll schedule a consultation within 24 hours.",
      suggestions: ["Go to Contact Form"],
      routeTo: "contact"
    };
  }
  
  // Default response
  return {
    response: "I'd love to help! Can you tell me more about your IoT project or challenge?",
    suggestions: ["View Projects", "Contact Us", "Tell Me More"],
    routeTo: null
  };
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
    return;
  }

  // Set CORS headers for all responses
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });
  // Disable caching of API responses to avoid stale 304 results
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    if (!supabase) {
      return res.status(500).json({ message: 'Supabase not configured' });
    }

    // Derive route from URL path to be robust across runtimes
    let route = '';
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      route = url.pathname.replace(/^\/?api\/?/, '').replace(/^\/+|\/+$/g, '');
    } catch (_) {
      const { path } = req.query || {};
      route = Array.isArray(path) ? path.join('/') : (path || '');
    }

    // POST /api/analytics/pageview - record pageviews (best-effort) -> primary table: page_views
    if (route === 'analytics/pageview' && req.method === 'POST') {
      const {
        pagePath,
        pageTitle,
        referrer,
        sessionId,
        userAgent,
        deviceType,
        country,
        city,
        visitorId
      } = req.body || {};
      // try to infer country if not provided (Vercel header)
      const hdrCountry = req.headers['x-vercel-ip-country'] || req.headers['x-country'] || '';
      const payload = {
        id: randomUUID(),
        page_path: pagePath || '',
        page_title: pageTitle || null,
        referrer: referrer || '',
        user_agent: userAgent || (req.headers['user-agent'] || ''),
        device_type: deviceType || null,
        country: country || hdrCountry || null,
        city: city || null,
        session_id: sessionId || null,
        visitor_id: visitorId || null,
        created_at: new Date().toISOString()
      };
      try {
        // primary table
        await supabase.from('page_views').insert(payload);
      } catch (e) {
        // fallback to legacy table if present
        try { await supabase.from('analytics_pageviews').insert(payload); }
        catch (e2) { console.warn('pageview insert failed (continuing):', e.message, e2?.message); }
      }
      return res.status(200).json({ ok: true });
    }

    // POST /api/analytics/hover - record hover events (best-effort)
    if (route === 'analytics/hover' && req.method === 'POST') {
      const { element, section, page, sessionId } = req.body || {};
      const payload = {
        id: randomUUID(),
        element: element || null,
        section: section || null,
        page: page || '',
        session_id: sessionId || null,
        created_at: new Date().toISOString()
      };
      try {
        await supabase.from('analytics_hovers').insert(payload);
      } catch (e) {
        console.warn('analytics_hover insert failed (continuing):', e.message);
      }
      return res.status(200).json({ ok: true });
    }

    // POST /api/analytics/click - record click events (for heatmap) -> primary table: click_events
    if (route === 'analytics/click' && req.method === 'POST') {
      const {
        pagePath,
        xPosition,
        yPosition,
        elementType,
        elementText,
        elementId,
        elementClass,
        viewportWidth,
        viewportHeight,
        scrollDepth,
        sectionId,
        sessionId,
        visitorId
      } = req.body || {};

      const payload = {
        id: randomUUID(),
        page_path: pagePath || '',
        x_pct: typeof xPosition === 'number' ? xPosition : null,
        y_pct: typeof yPosition === 'number' ? yPosition : null,
        element_type: elementType || null,
        element_text: elementText || null,
        element_id: elementId || null,
        element_class: elementClass || null,
        viewport_width: typeof viewportWidth === 'number' ? viewportWidth : null,
        viewport_height: typeof viewportHeight === 'number' ? viewportHeight : null,
        scroll_depth_pct: typeof scrollDepth === 'number' ? scrollDepth : null,
        section_id: sectionId || null,
        session_id: sessionId || null,
        visitor_id: visitorId || null,
        created_at: new Date().toISOString()
      };
      try {
        // primary table
        await supabase.from('click_events').insert(payload);
      } catch (e) {
        // fallback to legacy table if present
        try { await supabase.from('analytics_clicks').insert(payload); }
        catch (e2) { console.warn('click insert failed (continuing):', e.message, e2?.message); }
      }
      return res.status(200).json({ ok: true });
    }

    // GET /api/analytics/heatmap?pagePath=/&month=YYYY-MM (optional)
    if (route.startsWith('analytics/heatmap') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pagePath = url.searchParams.get('pagePath') || '/';
      const month = url.searchParams.get('month'); // YYYY-MM

      let clicks = [];
      try {
        // primary: click_events; fallback to analytics_clicks
        let query = supabase
          .from('click_events')
          .select('*')
          .eq('page_path', pagePath)
          .order('created_at', { ascending: true });

        if (month && /^\d{4}-\d{2}$/.test(month)) {
          // Filter by month via string prefix match on created_at if stored as ISO string
          query = query.like('created_at', `${month}%`);
        }
        let { data, error } = await query;
        if (error) {
          // fallback try
          let q2 = supabase
            .from('analytics_clicks')
            .select('*')
            .eq('page_path', pagePath)
            .order('created_at', { ascending: true });
          if (month && /^\d{4}-\d{2}$/.test(month)) q2 = q2.like('created_at', `${month}%`);
          const r2 = await q2; data = r2.data; error = r2.error;
          if (error) throw error;
        }
        clicks = (data || []).map((r) => ({
          id: r.id,
          pagePath: r.page_path,
          xPosition: r.x_pct,
          yPosition: r.y_pct,
          elementType: r.element_type,
          elementText: r.element_text,
          elementId: r.element_id,
          elementClass: r.element_class,
          viewportWidth: r.viewport_width,
          viewportHeight: r.viewport_height,
          scrollDepth: r.scroll_depth_pct,
          sectionId: r.section_id,
          createdAt: r.created_at
        }));
      } catch (e) {
        // Table may not exist in the current schema; return empty dataset instead of 500
        clicks = [];
      }

      // Build simple section summary counts
      const sectionSummaryMap = new Map();
      for (const c of clicks) {
        const key = c.sectionId || 'unknown';
        sectionSummaryMap.set(key, (sectionSummaryMap.get(key) || 0) + 1);
      }
      const sectionSummary = Array.from(sectionSummaryMap.entries()).map(([sectionId, count]) => ({ sectionId, count }));
      const maxSectionCount = sectionSummary.reduce((m, s) => Math.max(m, s.count), 0);

      return res.status(200).json({
        pagePath,
        clicks,
        totalClicks: clicks.length,
        sectionSummary,
        maxSectionCount
      });
    }

    // POST /api/analytics/like - register a like for an article
    if (route === 'analytics/like' && req.method === 'POST') {
      const { articleId, sessionId, visitorId } = req.body || {};
      if (!articleId) return res.status(400).json({ message: 'articleId required' });
      try {
        await supabase.from('article_likes').insert({
          id: randomUUID(),
          article_id: articleId,
          session_id: sessionId || null,
          visitor_id: visitorId || null,
          created_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('like insert failed (continuing):', e.message);
      }
      // Return updated total
      const { data: agg } = await supabase
        .from('article_likes')
        .select('article_id', { count: 'exact', head: true })
        .eq('article_id', articleId);
      return res.status(200).json({ liked: true, totalLikes: agg?.length ?? (typeof agg?.count === 'number' ? agg.count : null) });
    }

    // GET /api/analytics/likes?articleId=...
    if (route === 'analytics/likes' && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const articleId = url.searchParams.get('articleId');
      if (!articleId) return res.status(400).json({ message: 'articleId required' });
      const { count, error } = await supabase
        .from('article_likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId);
      if (error) throw error;
      return res.status(200).json({ totalLikes: count || 0 });
    }

    // GET /api/analytics/dashboard?period=30 - compute from daily_stats/top_pages; devices/locations from page_views
    if (route.startsWith('analytics/dashboard') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const period = parseInt(url.searchParams.get('period') || '30', 10);
      const days = isNaN(period) || period <= 0 ? 30 : Math.min(period, 90);

      // Defaults
      let kpis = {
        todayViews: 0,
        todayVisitors: 0,
        totalViews30Days: 0,
        totalVisitors30Days: 0,
        avgViewsPerDay: 0,
        avgVisitorsPerDay: 0,
        viewsGrowth: 0,
        visitorsGrowth: 0,
        bounceRate: 0,
        avgSessionDuration: '0:00'
      };
      let dailyStats = [];
      let topPages = [];
      let devices = { desktop: 0, mobile: 0, tablet: 0 };
      let locations = [];

      try {
        // 1) Pull last N days from daily_stats
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - (days - 1));
        const sinceStr = since.toISOString().slice(0, 10);
        const { data: dsData } = await supabase
          .from('daily_stats')
          .select('*')
          .gte('date', sinceStr)
          .order('date', { ascending: true });
        const rows = Array.isArray(dsData) ? dsData : [];
        dailyStats = rows.map(r => ({
          date: r.date,
          total_views: Number(r.total_views) || 0,
          unique_visitors: Number(r.unique_visitors) || 0,
          bounce_rate: Number(r.bounce_rate) || 0,
          avg_session_duration: Number(r.avg_session_duration) || 0
        }));

        // KPIs from daily_stats
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayRow = dailyStats.find(d => d.date === todayStr);
        const lastNDays = dailyStats.slice(-days);
        const prevNDays = dailyStats.slice(-(2*days), -days);

        const sum = (arr, f) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);
        const avg = (arr, f) => arr.length ? Math.round(sum(arr, f) / arr.length) : 0;

        const totalViews = sum(lastNDays, x => x.total_views);
        const totalVisitors = sum(lastNDays, x => x.unique_visitors);
        const prevViews = sum(prevNDays, x => x.total_views) || 0;
        const prevVisitors = sum(prevNDays, x => x.unique_visitors) || 0;
        const pct = (a, b) => b > 0 ? Math.round(((a - b) / b) * 100) : 0;

        kpis = {
          todayViews: todayRow ? todayRow.total_views : 0,
          todayVisitors: todayRow ? todayRow.unique_visitors : 0,
          totalViews30Days: totalViews,
          totalVisitors30Days: totalVisitors,
          avgViewsPerDay: Math.round(totalViews / days),
          avgVisitorsPerDay: Math.round(totalVisitors / days),
          viewsGrowth: pct(totalViews, prevViews),
          visitorsGrowth: pct(totalVisitors, prevVisitors),
          bounceRate: Math.round(avg(lastNDays, x => x.bounce_rate)),
          avgSessionDuration: (() => {
            const secs = avg(lastNDays, x => x.avg_session_duration);
            const m = Math.floor(secs / 60);
            const s = String(secs % 60).padStart(2, '0');
            return `${m}:${s}`;
          })()
        };

        // 2) Top pages from top_pages already sorted desc by view_count
        const { data: tpData } = await supabase
          .from('top_pages')
          .select('*')
          .order('view_count', { ascending: false })
          .limit(10);
        topPages = Array.isArray(tpData) ? tpData.map(r => ({
          path: r.path,
          title: r.title,
          view_count: Number(r.view_count) || 0
        })) : [];

        // 3) Devices and locations breakdown from page_views within period
        const { data: pvData } = await supabase
          .from('page_views')
          .select('device_type, country, created_at')
          .gte('created_at', since.toISOString());
        const pvRows = Array.isArray(pvData) ? pvData : [];
        const totalPV = pvRows.length || 1;
        const devCounts = { desktop: 0, mobile: 0, tablet: 0 };
        const locCounts = new Map();
        for (const r of pvRows) {
          const d = (r.device_type || '').toLowerCase();
          if (d.includes('desktop')) devCounts.desktop++;
          else if (d.includes('tablet')) devCounts.tablet++;
          else devCounts.mobile++;
          const c = r.country || 'Unknown';
          locCounts.set(c, (locCounts.get(c) || 0) + 1);
        }
        devices = {
          desktop: Math.round((devCounts.desktop / totalPV) * 100),
          mobile: Math.round((devCounts.mobile / totalPV) * 100),
          tablet: Math.round((devCounts.tablet / totalPV) * 100)
        };
        locations = Array.from(locCounts.entries())
          .map(([country, visits]) => ({ country, visits }))
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 20);
      } catch (e) {
        console.warn('dashboard build failed, returning safe defaults:', e.message);
      }

      return res.status(200).json({ kpis, dailyStats, topPages, devices, locations });
    }

    // POST /api/analytics/update-stats - trigger Supabase RPCs to rebuild aggregates
    if (route === 'analytics/update-stats' && req.method === 'POST') {
      try {
        await supabase.rpc('update_daily_stats');
      } catch (e) {
        console.warn('update_daily_stats RPC failed:', e.message);
      }
      try {
        await supabase.rpc('update_top_pages');
      } catch (e) {
        console.warn('update_top_pages RPC failed:', e.message);
      }
      return res.status(200).json({ ok: true });
    }

    // GET /api/articles/top - top articles by view_count desc (fallback to is_featured)
    if (route === 'articles/top' && req.method === 'GET') {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('view_count', { ascending: false, nullsFirst: false })
          .limit(5);
        if (error) throw error;
        const mapped = (data || []).map((r) => ({
          id: r.id,
          title: r.title,
          shortDescription: r.short_description || '',
          thumbnailUrl: r.thumbnail_url || null,
          viewCount: typeof r.view_count === 'number' ? r.view_count : 0,
          createdAt: r.created_at
        }));
        return res.status(200).json(mapped);
      } catch (_) {
        // Fallback to featured articles if view_count or table ordering unavailable
        const { data } = await supabase
          .from('articles')
          .select('*')
          .eq('is_featured', true)
          .limit(5);
        const mapped = (data || []).map((r) => ({
          id: r.id,
          title: r.title,
          shortDescription: r.short_description || '',
          thumbnailUrl: r.thumbnail_url || null,
          viewCount: typeof r.view_count === 'number' ? r.view_count : 0,
          createdAt: r.created_at
        }));
        return res.status(200).json(mapped);
      }
    }

    

    // Health check
    if (route === 'health' && req.method === 'GET') {
      return res.status(200).json({ status: 'ok' });
    }

    // GET /api/config/firebase - expose client-safe Firebase config
    if (route === 'config/firebase' && req.method === 'GET') {
      const pick = (...keys) => keys.find((k) => process.env[k] && String(process.env[k]).length > 0) || '';
      const cfg = {
        apiKey: pick(
          'VITE_FIREBASE_API_KEY',
          'NEXT_PUBLIC_FIREBASE_API_KEY',
          'REACT_APP_FIREBASE_API_KEY',
          'FIREBASE_API_KEY',
          'FIREBASE_APIKEY'
        ),
        authDomain: pick(
          'VITE_FIREBASE_AUTH_DOMAIN',
          'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
          'REACT_APP_FIREBASE_AUTH_DOMAIN',
          'FIREBASE_AUTH_DOMAIN',
          'FIREBASE_AUTHDOMAIN'
        ),
        projectId: pick(
          'VITE_FIREBASE_PROJECT_ID',
          'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
          'REACT_APP_FIREBASE_PROJECT_ID',
          'FIREBASE_PROJECT_ID',
          'FIREBASE_PROJECTID'
        ),
        storageBucket: pick(
          'VITE_FIREBASE_STORAGE_BUCKET',
          'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
          'REACT_APP_FIREBASE_STORAGE_BUCKET',
          'FIREBASE_STORAGE_BUCKET'
        ),
        messagingSenderId: pick(
          'VITE_FIREBASE_MESSAGING_SENDER_ID',
          'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
          'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
          'FIREBASE_MESSAGING_SENDER_ID'
        ),
        appId: pick(
          'VITE_FIREBASE_APP_ID',
          'NEXT_PUBLIC_FIREBASE_APP_ID',
          'REACT_APP_FIREBASE_APP_ID',
          'FIREBASE_APP_ID'
        )
      };
      return res.status(200).json(cfg);
    }

    // GET /api/articles - Fetch all articles (map DB snake_case -> API camelCase)
    if (route === 'articles' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((r) => ({
        id: r.id,
        title: r.title,
        shortDescription: r.short_description || '',
        body: r.body || '',
        category: r.category || 'Uncategorized',
        thumbnailUrl: r.thumbnail_url || null,
        videoUrl: r.video_url || null,
        galleryImageUrls: Array.isArray(r.gallery_image_urls) ? r.gallery_image_urls : [],
        documentUrls: Array.isArray(r.document_urls) ? r.document_urls : [],
        isFeatured: !!r.is_featured,
        tags: Array.isArray(r.tags) ? r.tags : [],
        viewCount: typeof r.view_count === 'number' ? r.view_count : 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      return res.status(200).json(mapped);
    }

    // GET /api/tags - list tags
    if (route === 'tags' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // GET /api/partners - list partners (order by position ASC)
    if (route === 'partners' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // GET /api/team - list team members (order by position ASC)
    if (route === 'team' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('team')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // GET /api/services - list services (map to frontend fields, order by position ASC)
    if (route === 'services' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      const mapped = (data || []).map((r) => ({
        id: r.id,
        title: r.title || 'Service',
        description: r.description || r.short_description || '',
        image_url: r.image_url || r.thumbnail_url || null,
        visible: r.visible !== false,
      }));
      return res.status(200).json(mapped);
    }

    // GET /api/technologies - list technologies
    if (route === 'technologies' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('technologies')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // GET /api/faqs - list FAQs
    if (route === 'faqs' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // POST /api/articles - Create new article
    if (route === 'articles' && req.method === 'POST') {
      const { fields, files } = await parseMultipartForm(req);

      const title = fields.title || 'Untitled';
      const shortDescription = fields.shortDescription || '';
      const body = fields.body || '';
      const category = fields.category || 'Uncategorized';
      const isFeatured = String(fields.isFeatured || 'false') === 'true';

      const id = randomUUID();
      const now = new Date().toISOString();

      const findFile = (name) => files.find(f => f.fieldname === name);
      const findAll = (name) => files.filter(f => f.fieldname === name);

      const thumbFile = findFile('thumbnail');
      const videoFile = findFile('video');
      const galleryFiles = findAll('gallery');

      if (!thumbFile) {
        return res.status(400).json({ message: 'thumbnail is required' });
      }

      const thumbnailUrl = await uploadFile(thumbFile, `${id}/thumbnail/${thumbFile.originalFilename || 'thumb'}`);
      const videoUrl = videoFile ? await uploadFile(videoFile, `${id}/video/${videoFile.originalFilename || 'video'}`) : null;

      const galleryImageUrls = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const g = galleryFiles[i];
        const url = await uploadFile(g, `${id}/gallery/${i}-${g.originalFilename || 'image'}`);
        if (url) galleryImageUrls.push(url);
      }

      const row = {
        id,
        title,
        shortDescription,
        body,
        category,
        thumbnailUrl,
        videoUrl,
        galleryImageUrls,
        isFeatured,
        createdAt: now,
        updatedAt: now
      };

      const { error: insErr } = await supabase.from('articles').upsert(row);
      if (insErr) throw insErr;

      return res.status(201).json(row);
    }

    // PUT /api/articles/:id - Update article
    if (route.startsWith('articles/') && req.method === 'PUT') {
      const id = route.split('/')[1];
      const { title, shortDescription, body, category, isFeatured } = req.body;

      const updates = {
        title,
        shortDescription,
        body,
        category,
        isFeatured,
        updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    // PUT /api/articles/featured - Update featured articles
    if (route === 'articles/featured' && req.method === 'PUT') {
      const { featuredIds } = req.body;
      
      // First, unfeature all articles
      await supabase
        .from('articles')
        .update({ isFeatured: false, updatedAt: new Date().toISOString() })
        .neq('id', '');

      // Then feature the selected ones
      if (featuredIds && featuredIds.length > 0) {
        await supabase
          .from('articles')
          .update({ isFeatured: true, updatedAt: new Date().toISOString() })
          .in('id', featuredIds);
      }

      return res.status(200).json({ featuredIds });
    }

    // POST /api/chat - Chatbot endpoint
    if (route === 'chat' && req.method === 'POST') {
      const { sessionId, message, context } = req.body;
      
      if (!sessionId || !message) {
        return res.status(400).json({ error: 'Missing sessionId or message' });
      }
      
      try {
        // Fetch or create conversation
        let { data: conversation } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('session_id', sessionId)
          .single();
        
        if (!conversation) {
          const { data: newConv } = await supabase
            .from('chat_conversations')
            .insert({
              id: randomUUID(),
              session_id: sessionId,
              messages: []
            })
            .select()
            .single();
          conversation = newConv;
        }
        
        // Add user message
        const messages = conversation?.messages || [];
        messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
        
        // Try Groq API first
        let botReply, suggestions, source, routeTo = null;
        const groqMessages = messages.map(m => ({ role: m.role, content: m.content }));
        const groqResult = await getGroqResponse(groqMessages);
        
        if (groqResult.success) {
          botReply = groqResult.reply;
          source = 'groq';
          suggestions = ["View Projects", "Contact Us", "Tell Me More"];
        } else {
          // Fallback to FAQ
          const faqMatch = findBestFaqMatch(message);
          botReply = faqMatch.response;
          suggestions = faqMatch.suggestions;
          routeTo = faqMatch.routeTo;
          source = 'fallback';
        }
        
        // Add bot response
        messages.push({ role: 'assistant', content: botReply, timestamp: new Date().toISOString() });
        
        // Update conversation
        await supabase
          .from('chat_conversations')
          .update({
            messages,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId);
        
        return res.status(200).json({
          reply: botReply,
          suggestions: suggestions || ["Tell Me More", "Contact Us"],
          routeTo,
          leadQualified: false,
          source
        });
        
      } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({
          reply: "I'm having trouble right now. Please email us at contact@malloulinova.com",
          suggestions: ["Contact Us", "View Projects"],
          source: 'error'
        });
      }
    }

    // POST /api/contact - Handle contact form
    if (route === 'contact' && req.method === 'POST') {
      const { name, email, company, message, website } = req.body;
      
      // Here you can add email sending logic or save to database
      console.log('Contact form submission:', { name, email, company, message, website });
      
      return res.status(200).json({ ok: true, message: 'Contact form received' });
    }

    // 404 for unknown routes
    return res.status(404).json({ message: 'Not Found' });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ message: err.message || 'Server Error' });
  }
}
