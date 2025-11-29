/* Minimal Express backend using Supabase for storage + DB
   Endpoints:
   - GET  /api/health
   - GET  /api/articles
   - POST /api/articles  (multipart; thumbnail required; gallery/video optional)
   - POST /api/chat (chatbot endpoint)
*/

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { nanoid } = require('nanoid');
const { createClient } = require('@supabase/supabase-js');
const createFaqsRouter = require('./routes/faqs');
const createPartnersRouter = require('./routes/partners');
const createTeamRouter = require('./routes/team');
const createServicesRouter = require('./routes/services');
const createTechnologiesRouter = require('./routes/technologies');

// Chatbot modules
const { getGroqResponse } = require('./chatbot/groqClient');
const { findBestMatch } = require('./chatbot/faqMatcher');
const { detectIntent, shouldQualifyLead, generateSuggestions } = require('./chatbot/intentDetector');
const { SYSTEM_PROMPT } = require('./chatbot/systemPrompt');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'articles';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies
// Simple request logger
app.use((req, _res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`); next(); });

// Record like for an article and mark session engaged (reduces bounce)
app.post('/api/analytics/like', async (req, res) => {
  try {
    const { articleId, sessionId, visitorId } = req.body || {};
    if (!articleId || !sessionId || !visitorId) {
      return res.status(400).json({ message: 'articleId, sessionId and visitorId are required' });
    }

    const nowIso = new Date().toISOString();

    // Increment likes_count on the article
    const { data: artRow } = await supabase
      .from('articles')
      .select('likes_count')
      .eq('id', articleId)
      .single();
    const nextLikes = (artRow?.likes_count || 0) + 1;
    await supabase
      .from('articles')
      .update({ likes_count: nextLikes, updated_at: nowIso })
      .eq('id', articleId);

    // Mark session as engaged (not a bounce)
    try {
      await supabase
        .from('sessions')
        .upsert([{ session_id: sessionId, is_bounce: false, updated_at: nowIso }], { onConflict: 'session_id' });
    } catch (e) {
      console.warn('session upsert warning:', e?.message || e);
    }

    // Return total likes from article
    const { data: finalRow } = await supabase
      .from('articles')
      .select('likes_count')
      .eq('id', articleId)
      .single();
    const totalLikes = finalRow?.likes_count || 0;

    return res.json({ liked: true, totalLikes });
  } catch (e) {
    console.error('POST /api/analytics/like error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Get likes count for an article
app.get('/api/analytics/likes', async (req, res) => {
  try {
    const articleId = req.query.articleId;
    if (!articleId) return res.status(400).json({ message: 'articleId is required' });
    const { data } = await supabase
      .from('articles')
      .select('likes_count')
      .eq('id', articleId)
      .single();
    const totalLikes = data?.likes_count || 0;
    res.json({ articleId, totalLikes });
  } catch (e) {
    console.error('GET /api/analytics/likes error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Top articles by view_count (for charts)
app.get('/api/articles/top', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '7', 10) || 7, 50);
    const { month } = req.query;
    // If month provided, compute counts from page_views within that month by extracting :id from /articles/:id or /projects/:id
    if (month && /^\d{4}-\d{2}$/.test(String(month))) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0)).toISOString();
      const end = new Date(Date.UTC(y, m, 1, 0, 0, 0)).toISOString();
      const { data: views, error: vErr } = await supabase
        .from('page_views')
        .select('page_path')
        .gte('created_at', start)
        .lt('created_at', end);
      if (vErr) throw vErr;
      const counts = {};
      (views || []).forEach(v => {
        const path = String(v.page_path || '');
        const match = path.match(/^\/(articles|projects)\/([^\/\?]+)/i);
        if (match && match[2]) {
          const id = match[2];
          counts[id] = (counts[id] || 0) + 1;
        }
      });
      // Fetch titles for the IDs (best-effort)
      const ids = Object.keys(counts).slice(0, 200);
      let titleMap = {};
      if (ids.length) {
        const { data: arts } = await supabase
          .from('articles')
          .select('id, title')
          .in('id', ids);
        (arts || []).forEach(a => { titleMap[a.id] = a.title; });
      }
      const out = Object.entries(counts)
        .map(([id, viewCount]) => ({ id, title: titleMap[id] || id, viewCount }))
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, limit);
      return res.json(out);
    }
    // Default: overall top by persisted view_count
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, view_count')
      .order('view_count', { ascending: false })
      .limit(limit);
    if (error) throw error;
    const out = (data || []).map(r => ({ id: r.id, title: r.title, viewCount: r.view_count || 0 }));
    res.json(out);
  } catch (e) {
    console.error('GET /api/articles/top error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Simple in-memory rate limiter for contact endpoint
const contactRate = new Map(); // ip -> { count, ts }
const CONTACT_LIMIT = 5; // 5 requests
const CONTACT_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes

// POST /api/chat: chatbot endpoint
app.post('/api/chat', express.json(), async (req, res) => {
  try {
    const { sessionId, message, context } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Missing sessionId or message' });
    }
    
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
          id: nanoid(),
          session_id: sessionId,
          messages: []
        })
        .select()
        .single();
      conversation = newConv;
    }
    
    // Add user message to history
    const messages = conversation.messages || [];
    messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    
    // Detect intent
    const intent = detectIntent(message, messages);
    
    // Try Groq API first
    let botReply, suggestions, source;
    const groqMessages = messages.map(m => ({ role: m.role, content: m.content }));
    
    const groqResult = await getGroqResponse(groqMessages, SYSTEM_PROMPT);
    
    if (groqResult.success) {
      botReply = groqResult.reply;
      source = 'groq';
      
      // Generate context-aware suggestions based on intent
      suggestions = generateSuggestions(intent, context || {});
      
    } else {
      // Fallback to hardcoded FAQ
      const faqMatch = findBestMatch(message);
      botReply = faqMatch.response;
      suggestions = faqMatch.suggestions;
      source = 'fallback';
      intent.route = faqMatch.routeTo;
    }
    
    // Add bot response to history
    messages.push({ role: 'assistant', content: botReply, timestamp: new Date().toISOString() });
    
    // Update visitor data if provided
    const visitorData = {
      visitor_name: context?.visitorData?.name || conversation.visitor_name,
      visitor_email: context?.visitorData?.email || conversation.visitor_email,
      visitor_company: context?.visitorData?.company || conversation.visitor_company
    };
    
    const leadQualified = shouldQualifyLead(visitorData);
    
    // Save conversation
    await supabase
      .from('chat_conversations')
      .update({
        messages,
        ...visitorData,
        lead_qualified: leadQualified,
        route_suggested: intent.route,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
    
    // Return response
    res.json({
      reply: botReply,
      suggestions: suggestions || ["Tell Me More", "Contact Us"],
      routeTo: intent.route,
      leadQualified,
      source
    });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      reply: "I'm having trouble right now. Please email us at info@malloulinova.com",
      suggestions: ["Contact Us", "View Projects"],
      source: 'error'
    });
  }
});

// Track hover/engagement events (used to mark sessions as engaged and reduce bounce rate)
app.post('/api/analytics/hover', async (req, res) => {
  try {
    const { pagePath, sessionId, visitorId } = req.body || {};
    if (!sessionId || !visitorId) {
      return res.status(400).json({ message: 'sessionId and visitorId are required' });
    }

    const nowIso = new Date().toISOString();

    // Upsert session by session_id unique constraint
    const row = {
      session_id: sessionId,
      visitor_id: visitorId,
      updated_at: nowIso,
      is_bounce: false,
      exit_page: pagePath || null,
    };

    // If this is a new session, set start_time and entry_page
    // Supabase upsert: onConflict session_id to update existing row
    const { data, error } = await supabase
      .from('sessions')
      .upsert(
        [
          {
            ...row,
            start_time: nowIso,
            entry_page: pagePath || null,
          }
        ],
        { onConflict: 'session_id' }
      )
      .select('*')
      ;

    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) {
    console.error('POST /api/analytics/hover error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// POST /api/contact: validate, persist, email
app.post('/api/contact', express.json(), async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    const { name, email, message, company = '', website = '' } = req.body || {};

    // Honeypot
    if (website && String(website).trim() !== '') {
      return res.status(200).json({ ok: true });
    }

    // Rate limit
    const now = Date.now();
    const rec = contactRate.get(ip) || { count: 0, ts: now };
    if (now - rec.ts > CONTACT_WINDOW_MS) { rec.count = 0; rec.ts = now; }
    rec.count += 1; contactRate.set(ip, rec);
    if (rec.count > CONTACT_LIMIT) {
      return res.status(429).json({ message: 'Too many requests, please try again later.' });
    }

    // Basic validation
    const isEmail = (v) => /.+@.+\..+/.test(String(v||''));
    if (!String(name||'').trim() || !isEmail(email) || !String(message||'').trim()) {
      return res.status(400).json({ message: 'Invalid input. Name, valid email, and message are required.' });
    }
    if (String(message).length > 2000) {
      return res.status(400).json({ message: 'Message is too long (max 2000 chars).' });
    }

    // Persist to Supabase (best-effort)
    try {
      const row = {
        id: nanoid(),
        name,
        email,
        company,
        message,
        created_at: new Date().toISOString(),
        ip,
        user_agent: ua,
      };
      const { error: insErr } = await supabase.from('contacts').insert(row);
      if (insErr) console.warn('Contact insert warning:', insErr.message || insErr);
    } catch (e) {
      console.warn('Contact insert failed:', e?.message || e);
    }

    // Email via SMTP (optional, no external service)
    try {
      const SMTP_HOST = process.env.SMTP_HOST;
      const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
      const SMTP_USER = process.env.SMTP_USER;
      const SMTP_PASS = process.env.SMTP_PASS;
      const CONTACT_TO = process.env.CONTACT_TO; // your personal email
      if (SMTP_HOST && SMTP_USER && SMTP_PASS && CONTACT_TO) {
        let nodemailer = null;
        try { nodemailer = require('nodemailer'); } catch { nodemailer = null; }
        if (nodemailer) {
          const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
          });
          // SMTP diagnostics (non-sensitive)
          try {
            const verifyRes = await transporter.verify();
            console.log('SMTP verify ok:', {
              host: SMTP_HOST,
              port: SMTP_PORT,
              secure: SMTP_PORT === 465,
              user: SMTP_USER,
              verify: verifyRes,
            });
          } catch (verr) {
            console.warn('SMTP verify failed:', {
              host: SMTP_HOST,
              port: SMTP_PORT,
              secure: SMTP_PORT === 465,
              user: SMTP_USER,
              error: verr?.message || verr,
            });
          }
          const subject = `New Contact from ${name}`;
          const text = `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nIP: ${ip}\nUA: ${ua}\n\nMessage:\n${message}`;
          try {
            const info = await transporter.sendMail({ from: SMTP_USER, to: CONTACT_TO, subject, text });
            console.log('SMTP sendMail ok:', {
              messageId: info?.messageId,
              accepted: info?.accepted,
              rejected: info?.rejected,
              response: info?.response,
            });
          } catch (sendErr) {
            console.warn('SMTP sendMail failed:', sendErr?.message || sendErr);
          }
        } else {
          console.warn('Nodemailer not installed; skipping email send.');
        }
      }
    } catch (e) {
      console.warn('Contact email failed:', e?.message || e);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('Contact endpoint failed:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Persist featured selection (must be BEFORE '/api/articles/:id')
app.put('/api/articles/featured', express.json(), async (req, res) => {
  try {
    const { featuredIds } = req.body || {};
    console.log('PUT /api/articles/featured payload:', featuredIds);
    if (!Array.isArray(featuredIds)) {
      return res.status(400).json({ message: 'featuredIds must be an array' });
    }

    const ids = featuredIds.filter((x) => typeof x === 'string');

    // Step 1: set currently featured rows to false (must include a WHERE clause)
    const { error: clearErr } = await supabase
      .from('articles')
      .update({ is_featured: false, updated_at: new Date().toISOString() })
      .eq('is_featured', true);
    if (clearErr) { console.error('Featured clear error:', clearErr); throw clearErr; }

    // Step 2: if we have ids, set them to true
    if (ids.length > 0) {
      const { error: onErr } = await supabase
        .from('articles')
        .update({ is_featured: true, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (onErr) { console.error('Featured set error:', onErr); throw onErr; }
    }

    res.json({ featuredIds: ids });
  } catch (e) {
    console.error('Featured persist failed:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Health
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Root probe
app.get('/', (_req, res) => res.status(200).send('Express backend is running')); 

// Helpers to map DB (snake_case) ↔ API (camelCase)
const mapDbToApi = (r) => ({
  id: r.id,
  title: r.title,
  shortDescription: r.short_description || '',
  body: r.body || '',
  category: r.category || 'Uncategorized',
  thumbnailUrl: r.thumbnail_url || null,
  videoUrl: r.video_url || null,
  galleryImageUrls: Array.isArray(r.gallery_image_urls) ? r.gallery_image_urls : [],
  documentUrls: Array.isArray(r.document_urls) ? r.document_urls : [],
  isFeatured: Boolean(r.is_featured),
  tags: Array.isArray(r.tags) ? r.tags : [],
  viewCount: typeof r.view_count === 'number' ? r.view_count : 0,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// List articles
app.get('/api/articles', async (_req, res) => {
  try {
    let { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      // Fallback if column doesn't exist yet
      console.warn('Order by created_at failed, retrying without order:', error);
      const retry = await supabase.from('articles').select('*');
      data = retry.data;
      if (retry.error) throw retry.error;
    }
    const out = (data || []).map(mapDbToApi);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Update article metadata (no media changes here)
app.put('/api/articles/:id', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, category, isFeatured, tags } = req.body || {};
    const patch = { updated_at: new Date().toISOString() };
    if (typeof title === 'string') patch.title = title;
    if (typeof body === 'string') patch.body = body;
    if (typeof category === 'string') patch.category = category;
    if (typeof isFeatured !== 'undefined') patch.is_featured = !!isFeatured;
    if (Array.isArray(tags)) patch.tags = tags;

    if (Object.keys(patch).length === 1) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    const { data, error } = await supabase
      .from('articles')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    res.json(mapDbToApi(data));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Multipart config
const upload = multer({ storage: multer.memoryStorage() });

// Update article media (thumbnail/gallery/video/documents). All optional; only provided files are updated.
app.put('/api/articles/:id/media', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'gallery', maxCount: 12 },
  { name: 'documents', maxCount: 12 },
]), async (req, res) => {
  try {
    const { id } = req.params;
    const thumbFile = (req.files?.thumbnail || [])[0];
    const videoFile = (req.files?.video || [])[0];
    const galleryFiles = req.files?.gallery || [];
    const documentFiles = req.files?.documents || [];
    const { clearGallery, clearVideo, clearDocuments } = req.body || {};

    // Validate types/sizes like create
    const imageMax = 5 * 1024 * 1024; // 5MB
    const videoMax = 50 * 1024 * 1024; // 50MB
    const docMax = 20 * 1024 * 1024; // 20MB per document
    const isImage = (f) => f && f.mimetype && f.mimetype.startsWith('image/');
    const isVideo = (f) => f && f.mimetype && f.mimetype.startsWith('video/');
    // Align documents to PDFs only (frontend restricts uploads to application/pdf)
    const isDocument = (f) => f && f.mimetype === 'application/pdf';

    if (thumbFile) {
      if (!isImage(thumbFile)) return res.status(400).json({ message: 'thumbnail must be an image' });
      if (thumbFile.size > imageMax) return res.status(400).json({ message: 'thumbnail exceeds 5MB' });
    }
    for (const g of galleryFiles) {
      if (!isImage(g)) return res.status(400).json({ message: 'gallery files must be images' });
      if (g.size > imageMax) return res.status(400).json({ message: 'a gallery image exceeds 5MB' });
    }
    if (videoFile) {
      if (!isVideo(videoFile)) return res.status(400).json({ message: 'video must be a video file' });
      if (videoFile.size > videoMax) return res.status(400).json({ message: 'video exceeds 50MB' });
    }
    for (const d of documentFiles) {
      if (!isDocument(d)) return res.status(400).json({ message: 'documents must be PDF files' });
      if (d.size > docMax) return res.status(400).json({ message: 'a document exceeds 20MB' });
    }
    for (const d of documentFiles) {
      if (!isDocument(d)) return res.status(400).json({ message: 'documents must be PDF files' });
      if (d.size > docMax) return res.status(400).json({ message: 'a document exceeds 20MB' });
    }

    const patch = { updated_at: new Date().toISOString() };

    const uploadToBucket = async (file, key) => {
      const { error: upErr } = await supabase
        .storage
        .from(SUPABASE_MEDIA_BUCKET)
        .upload(key, file.buffer, { contentType: file.mimetype, upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(SUPABASE_MEDIA_BUCKET).getPublicUrl(key);
      return pub?.publicUrl || null;
    };

    if (thumbFile) {
      patch.thumbnail_url = await uploadToBucket(thumbFile, `${id}/thumbnail/${thumbFile.originalname || 'thumb'}`);
    }
    if (videoFile) {
      patch.video_url = await uploadToBucket(videoFile, `${id}/video/${videoFile.originalname || 'video'}`);
    }
    if (galleryFiles && galleryFiles.length) {
      const galleryImageUrls = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const g = galleryFiles[i];
        const url = await uploadToBucket(g, `${id}/gallery/${i}-${g.originalname || 'image'}`);
        if (url) galleryImageUrls.push(url);
      }
      patch.gallery_image_urls = galleryImageUrls;
    }
    if (String(clearGallery) === 'true') {
      patch.gallery_image_urls = [];
    }

    if (String(clearVideo) === 'true') {
      patch.video_url = null;
    }

    if (documentFiles && documentFiles.length) {
      const documentUrls = [];
      for (let i = 0; i < documentFiles.length; i++) {
        const d = documentFiles[i];
        const url = await uploadToBucket(d, `${id}/documents/${i}-${d.originalname || 'document'}`);
        if (url) documentUrls.push(url);
      }
      patch.document_urls = documentUrls;
    }
    if (String(clearDocuments) === 'true') {
      patch.document_urls = [];
    }

    if (Object.keys(patch).length === 1) {
      return res.status(400).json({ message: 'No media provided' });
    }

    const { data, error } = await supabase
      .from('articles')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    res.json(mapDbToApi(data));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Create article
app.post('/api/articles', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'gallery', maxCount: 12 },
  { name: 'documents', maxCount: 12 },
]), async (req, res) => {
  try {
    const { title = 'Untitled', body = '', category = 'Uncategorized', tags = '[]' } = req.body || {};
    const parsedTags = (() => { try { return JSON.parse(tags); } catch { return []; } })();

    const thumbFile = (req.files?.thumbnail || [])[0];
    const videoFile = (req.files?.video || [])[0];
    const galleryFiles = req.files?.gallery || [];
    const documentFiles = req.files?.documents || [];

    if (!thumbFile) {
      return res.status(400).json({ message: 'thumbnail is required' });
    }

    // Basic validation
    const imageMax = 5 * 1024 * 1024; // 5MB
    const videoMax = 50 * 1024 * 1024; // 50MB
    const docMax = 20 * 1024 * 1024; // 20MB per document
    const isImage = (f) => f && f.mimetype && f.mimetype.startsWith('image/');
    const isVideo = (f) => f && f.mimetype && f.mimetype.startsWith('video/');
    // Documents are PDF-only per instructions
    const isDocument = (f) => f && f.mimetype === 'application/pdf';

    if (!isImage(thumbFile)) return res.status(400).json({ message: 'thumbnail must be an image' });
    if (thumbFile.size > imageMax) return res.status(400).json({ message: 'thumbnail exceeds 5MB' });
    for (const g of galleryFiles) {
      if (!isImage(g)) return res.status(400).json({ message: 'gallery files must be images' });
      if (g.size > imageMax) return res.status(400).json({ message: 'a gallery image exceeds 5MB' });
    }
    if (videoFile) {
      if (!isVideo(videoFile)) return res.status(400).json({ message: 'video must be a video file' });
      if (videoFile.size > videoMax) return res.status(400).json({ message: 'video exceeds 50MB' });
    }

    const id = nanoid();
    const now = new Date().toISOString();

    // Upload helper
    const uploadToBucket = async (file, key) => {
      const { error: upErr } = await supabase
        .storage
        .from(SUPABASE_MEDIA_BUCKET)
        .upload(key, file.buffer, { contentType: file.mimetype, upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(SUPABASE_MEDIA_BUCKET).getPublicUrl(key);
      return pub?.publicUrl || null;
    };

    const thumbnailUrl = await uploadToBucket(thumbFile, `${id}/thumbnail/${thumbFile.originalname || 'thumb'}`);

    let videoUrl = null;
    if (videoFile) {
      videoUrl = await uploadToBucket(videoFile, `${id}/video/${videoFile.originalname || 'video'}`);
    }

    const galleryImageUrls = [];
    for (let i = 0; i < galleryFiles.length; i++) {
      const g = galleryFiles[i];
      const url = await uploadToBucket(g, `${id}/gallery/${i}-${g.originalname || 'image'}`);
      if (url) galleryImageUrls.push(url);
    }

    const documentUrls = [];
    for (let i = 0; i < documentFiles.length; i++) {
      const d = documentFiles[i];
      const url = await uploadToBucket(d, `${id}/documents/${i}-${d.originalname || 'document'}`);
      if (url) documentUrls.push(url);
    }

    const row_db = {
      id,
      title,
      body,
      category,
      thumbnail_url: thumbnailUrl,
      video_url: videoUrl,
      gallery_image_urls: galleryImageUrls,
      document_urls: documentUrls,
      is_featured: false,
      tags: parsedTags,
      view_count: 0,
      created_at: now,
      updated_at: now,
    };

    console.log('Upserting keys:', Object.keys(row_db));
    const { error: insErr } = await supabase.from('articles').upsert(row_db);
    if (insErr) throw insErr;

    res.status(201).json(mapDbToApi(row_db));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Tags Management Endpoints

// GET /api/tags - List all available tags
app.get('/api/tags', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    console.error('GET /api/tags error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// POST /api/tags - Create a new tag
app.post('/api/tags', express.json(), async (req, res) => {
  try {
    const { name, description = '', color = '#447D9B' } = req.body || {};
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Tag name is required' });
    }
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const id = `tag_${nanoid(8)}`;
    
    const { data, error } = await supabase
      .from('tags')
      .insert({
        id,
        name: name.trim(),
        slug,
        description: description.trim(),
        color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    console.error('POST /api/tags error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// DELETE /api/tags/:id - Delete a tag
app.delete('/api/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ success: true, id });
  } catch (e) {
    console.error('DELETE /api/tags/:id error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// PUT /api/tags/:id - Update a tag
app.put('/api/tags/:id', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body || {};
    
    const patch = { updated_at: new Date().toISOString() };
    if (typeof name === 'string' && name.trim().length > 0) {
      patch.name = name.trim();
      patch.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (typeof description === 'string') patch.description = description.trim();
    if (typeof color === 'string') patch.color = color;
    
    if (Object.keys(patch).length === 1) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }
    
    const { data, error } = await supabase
      .from('tags')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('PUT /api/tags/:id error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// ========================================
// ANALYTICS ENDPOINTS
// ========================================

// Track page view
app.post('/api/analytics/pageview', async (req, res) => {
  try {
    const { pagePath, pageTitle, referrer, userAgent, deviceType, country, city, sessionId, visitorId } = req.body;
    // Enrich geo from headers if not provided
    const h = req.headers || {};
    const ip = (h['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '';
    const hdrCountry = country || h['cf-ipcountry'] || h['x-vercel-ip-country'] || h['x-country'] || null;
    const hdrCity = city || h['x-vercel-ip-city'] || h['x-appengine-city'] || h['x-city'] || null;
    
    const { data, error } = await supabase
      .from('page_views')
      .insert({
        page_path: pagePath,
        page_title: pageTitle,
        referrer,
        user_agent: userAgent,
        device_type: deviceType,
        country: hdrCountry,
        city: hdrCity,
        session_id: sessionId,
        visitor_id: visitorId
      })
      .select()
      .single();
    
    if (error) throw error;
    // Increment article view_count if pagePath refers to an article/project ID
    try {
      const match = String(pagePath || '').match(/^\/(articles|projects)\/([^\/\?]+)/i);
      if (match && match[2]) {
        const articleId = match[2];
        const { data: art } = await supabase
          .from('articles')
          .select('view_count')
          .eq('id', articleId)
          .single();
        const next = (art?.view_count || 0) + 1;
        await supabase
          .from('articles')
          .update({ view_count: next, updated_at: new Date().toISOString() })
          .eq('id', articleId);
      }
    } catch (incErr) {
      console.warn('view_count increment warning:', incErr?.message || incErr);
    }
    res.json({ success: true, data });
  } catch (e) {
    console.error('POST /api/analytics/pageview error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Track click event (for heatmap)
app.post('/api/analytics/click', async (req, res) => {
  try {
    const { 
      pagePath, xPosition, yPosition, elementType, elementText, elementId, 
      elementClass, viewportWidth, viewportHeight, scrollDepth, sessionId, visitorId, sectionId 
    } = req.body;
    
    const { data, error } = await supabase
      .from('click_events')
      .insert({
        page_path: pagePath,
        x_position: xPosition,
        y_position: yPosition,
        element_type: elementType,
        element_text: elementText,
        element_id: elementId,
        element_class: elementClass,
        viewport_width: viewportWidth,
        viewport_height: viewportHeight,
        scroll_depth: scrollDepth,
        session_id: sessionId,
        visitor_id: visitorId,
        section_id: (sectionId && String(sectionId).trim()) ? String(sectionId).trim() : 'unknown'
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) {
    console.error('POST /api/analytics/click error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Get analytics dashboard data
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const { period = '30', month } = req.query;
    let startDate, endDate;
    if (month && /^\d{4}-\d{2}$/.test(String(month))) {
      // Month mode: [YYYY-MM-01, first day of next month)
      const [y, m] = month.split('-').map(Number);
      startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(y, m, 1, 0, 0, 0));
      // Try snapshot cache first
      try {
        const { data: snap } = await supabase
          .from('analytics_monthly')
          .select('kpis, daily_stats, top_pages, top_articles, devices, locations')
          .eq('month_key', month)
          .single();
        if (snap) {
          return res.json({
            kpis: snap.kpis || {},
            dailyStats: snap.daily_stats || [],
            topPages: snap.top_pages || [],
            topArticles: snap.top_articles || [],
            devices: snap.devices || { desktop: 0, mobile: 0, tablet: 0 },
            locations: snap.locations || []
          });
        }
      } catch (_) { /* ignore and compute fresh */ }
    } else {
      // Fallback to days window
      const daysAgo = parseInt(period);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      endDate = new Date();
    }
    
    // Get daily stats
    let { data: dailyStats, error: dailyError } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lt('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    if (dailyError) throw dailyError;
    // Fallback: build daily stats from page_views if table is empty
    if (!dailyStats || dailyStats.length === 0) {
      const { data: raw, error: pvErr } = await supabase
        .from('page_views')
        .select('visitor_id, created_at')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      if (pvErr) throw pvErr;
      const byDate = new Map();
      (raw || []).forEach((r) => {
        const d = new Date(r.created_at);
        const key = d.toISOString().split('T')[0];
        let rec = byDate.get(key);
        if (!rec) { rec = { date: key, total_views: 0, unique_visitors_set: new Set() }; byDate.set(key, rec); }
        rec.total_views += 1;
        if (r.visitor_id) rec.unique_visitors_set.add(r.visitor_id);
      });
      dailyStats = Array.from(byDate.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((r) => ({
          date: r.date,
          total_views: r.total_views,
          unique_visitors: r.unique_visitors_set.size,
          new_visitors: 0,
          returning_visitors: 0,
          total_sessions: 0,
          avg_session_duration: 0,
          bounce_rate: 0,
          desktop_percentage: 0,
          mobile_percentage: 0,
          tablet_percentage: 0,
        }));
    }
    
    // Get top pages (aggregate from page_views within window)
    let topPages = [];
    {
      const { data: rawViews, error: viewsErr } = await supabase
        .from('page_views')
        .select('page_path')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      if (viewsErr) throw viewsErr;
      const counts = (rawViews || []).reduce((acc, r) => {
        const key = r.page_path || '/';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      topPages = Object.entries(counts)
        .map(([page_path, view_count]) => ({ page_path, page_title: null, view_count, unique_visitors: null }))
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 10);
    }

    // Get top articles (aggregate from page_views within window by /articles/:id and /projects/:id)
    let topArticles = [];
    {
      const { data: rawViews2, error: viewsErr2 } = await supabase
        .from('page_views')
        .select('page_path')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      if (viewsErr2) throw viewsErr2;
      const artCounts = {};
      (rawViews2 || []).forEach(v => {
        const path = String(v.page_path || '');
        const match = path.match(/^\/(articles|projects)\/([^\/\?]+)/i);
        if (match && match[2]) {
          const id = match[2];
          artCounts[id] = (artCounts[id] || 0) + 1;
        }
      });
      const ids = Object.keys(artCounts).slice(0, 200);
      const titleMap = {};
      if (ids.length) {
        const { data: arts } = await supabase
          .from('articles')
          .select('id, title')
          .in('id', ids);
        (arts || []).forEach(a => { titleMap[a.id] = a.title; });
      }
      topArticles = Object.entries(artCounts)
        .map(([id, viewCount]) => ({ id, title: titleMap[id] || id, viewCount }))
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 7);
    }
    
    // Get device breakdown (last 30 days)
    const { data: deviceData, error: deviceError } = await supabase
      .from('page_views')
      .select('device_type')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());
    
    if (deviceError) throw deviceError;
    
    const deviceCounts = deviceData.reduce((acc, row) => {
      acc[row.device_type || 'unknown'] = (acc[row.device_type || 'unknown'] || 0) + 1;
      return acc;
    }, {});
    
    const total = deviceData.length;
    const devices = {
      desktop: Math.round((deviceCounts.desktop || 0) / total * 100) || 0,
      mobile: Math.round((deviceCounts.mobile || 0) / total * 100) || 0,
      tablet: Math.round((deviceCounts.tablet || 0) / total * 100) || 0
    };
    
    // Get location breakdown
    const { data: locationData, error: locationError } = await supabase
      .from('page_views')
      .select('country')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());
    
    if (locationError) throw locationError;
    
    const locationCounts = locationData.reduce((acc, row) => {
      if (row.country) {
        acc[row.country] = (acc[row.country] || 0) + 1;
      }
      return acc;
    }, {});
    
    const locations = Object.entries(locationCounts)
      .map(([country, visits]) => ({ country, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);
    
    // Calculate KPIs
    const today = dailyStats.find(d => d.date === new Date().toISOString().split('T')[0]) || {};
    const last7Days = dailyStats.slice(-7);
    const previous7Days = dailyStats.slice(-14, -7);
    
    const totalViews7Days = last7Days.reduce((sum, d) => sum + (d.total_views || 0), 0);
    const totalViewsPrevious7Days = previous7Days.reduce((sum, d) => sum + (d.total_views || 0), 0);
    const viewsGrowth = totalViewsPrevious7Days > 0 
      ? ((totalViews7Days - totalViewsPrevious7Days) / totalViewsPrevious7Days * 100).toFixed(1)
      : 0;
    
    const totalVisitors7Days = last7Days.reduce((sum, d) => sum + (d.unique_visitors || 0), 0);
    const totalVisitorsPrevious7Days = previous7Days.reduce((sum, d) => sum + (d.unique_visitors || 0), 0);
    const visitorsGrowth = totalVisitorsPrevious7Days > 0
      ? ((totalVisitors7Days - totalVisitorsPrevious7Days) / totalVisitorsPrevious7Days * 100).toFixed(1)
      : 0;
    
    const totalViews30Days = dailyStats.reduce((sum, d) => sum + (d.total_views || 0), 0);
    const daysInWindow = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000)));
    const avgViewsPerDay = Math.round(totalViews30Days / daysInWindow);
    
    // Compute bounce rate using total likes stored on articles
    // Note: likes_count is cumulative (not per-window)
    let likesInWindow = 0;
    try {
      const { data: likeRows } = await supabase
        .from('articles')
        .select('likes_count');
      likesInWindow = (likeRows || []).reduce((sum, r) => sum + (r.likes_count || 0), 0);
    } catch (e) {
      likesInWindow = 0;
    }
    const totalViewsWindow = dailyStats.reduce((sum, d) => sum + (d.total_views || 0), 0);
    const bounceRatePct = totalViewsWindow > 0 ? Math.max(0, Math.round((1 - (likesInWindow / totalViewsWindow)) * 100)) : 0;
    
    const avgSessionDuration = dailyStats.length > 0
      ? Math.round(dailyStats.reduce((sum, d) => sum + (d.avg_session_duration || 0), 0) / dailyStats.length)
      : 0;
    
    const kpis = {
      todayViews: today.total_views || 0,
      todayVisitors: today.unique_visitors || 0,
      totalViews30Days,
      totalVisitors30Days: dailyStats.reduce((sum, d) => sum + (d.unique_visitors || 0), 0),
      avgViewsPerDay,
      avgVisitorsPerDay: Math.round(dailyStats.reduce((sum, d) => sum + (d.unique_visitors || 0), 0) / daysInWindow),
      viewsGrowth: parseFloat(viewsGrowth),
      visitorsGrowth: parseFloat(visitorsGrowth),
      bounceRate: bounceRatePct,
      avgSessionDuration: `${Math.floor(avgSessionDuration / 60)}:${(avgSessionDuration % 60).toString().padStart(2, '0')}`
    };
    
    const payload = {
      kpis,
      dailyStats,
      topPages,
      topArticles,
      devices,
      locations
    };

    // If month mode, upsert snapshot for future fast loads
    if (month && /^\d{4}-\d{2}$/.test(String(month))) {
      try {
        await supabase
          .from('analytics_monthly')
          .upsert({
            month_key: month,
            kpis,
            daily_stats: dailyStats,
            top_pages: topPages,
            top_articles: topArticles,
            devices,
            locations,
            updated_at: new Date().toISOString()
          }, { onConflict: 'month_key' });
      } catch (e) {
        console.warn('analytics_monthly upsert warning:', e?.message || e);
      }
    }
    res.json(payload);
  } catch (e) {
    console.error('GET /api/analytics/dashboard error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Get heatmap data for a specific page
app.get('/api/analytics/heatmap', async (req, res) => {
  try {
    const { month } = req.query;
    let startDate, endDate;
    if (month && /^\d{4}-\d{2}$/.test(String(month))) {
      const [y, m] = month.split('-').map(Number);
      startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(y, m, 1, 0, 0, 0));
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
    }

    // Ignore page_path: we only have a homepage heatmap.
    const { data, error } = await supabase
      .from('click_events')
      .select('x_position, y_position, element_type, element_text, section_id, created_at')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Group clicks by proximity (5% radius) and calculate intensity
    const clusters = [];
    const radius = 5; // 5% radius for clustering
    
    data.forEach(click => {
      const existing = clusters.find(c => 
        Math.abs(c.x - click.x_position) <= radius && 
        Math.abs(c.y - click.y_position) <= radius
      );
      
      if (existing) {
        existing.count++;
        existing.intensity = Math.min(100, existing.count * 10);
      } else {
        clusters.push({
          x: click.x_position,
          y: click.y_position,
          count: 1,
          intensity: 10,
          elementType: click.element_type,
          elementText: click.element_text,
          sectionId: click.section_id || null
        });
      }
    });
    
    // Sort by intensity
    clusters.sort((a, b) => b.intensity - a.intensity);

    // Aggregate per-section summary from fetched rows
    const sectionCounts = {};
    (data || []).forEach((row) => {
      const key = row.section_id || 'unknown';
      sectionCounts[key] = (sectionCounts[key] || 0) + 1;
    });
    const sectionSummary = Object.entries(sectionCounts)
      .map(([sectionId, count]) => ({ sectionId, count }))
      .sort((a, b) => b.count - a.count);
    const maxSectionCount = sectionSummary.length ? sectionSummary[0].count : 0;
    
    res.json({
      clicks: clusters,
      totalClicks: data.length,
      sectionSummary,
      maxSectionCount
    });
  } catch (e) {
    console.error('GET /api/analytics/heatmap error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Mount modular routers
app.use('/api/faqs', createFaqsRouter({ supabase, nanoid, express }));
app.use('/api/partners', createPartnersRouter({ supabase, nanoid }));
app.use('/api/team', createTeamRouter({ supabase, nanoid }));
app.use('/api/services', createServicesRouter({ supabase, nanoid }));
app.use('/api/technologies', createTechnologiesRouter({ supabase, nanoid }));

// Update daily stats (call this via cron or manually)
app.post('/api/analytics/update-stats', async (req, res) => {
  try {
    // Call the database function
    const { error: dailyError } = await supabase.rpc('update_daily_stats');
    if (dailyError) throw dailyError;
    
    const { error: pagesError } = await supabase.rpc('update_top_pages');
    if (pagesError) throw pagesError;
    
    res.json({ success: true, message: 'Stats updated successfully' });
  } catch (e) {
    console.error('POST /api/analytics/update-stats error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => console.log(`Backend running on http://${HOST}:${PORT}`));
server.on('error', (err) => {
  console.error('Server listen error:', err);
});
