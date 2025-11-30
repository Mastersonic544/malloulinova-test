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

    // POST /api/analytics/pageview - record pageviews (best-effort)
    if (route === 'analytics/pageview' && req.method === 'POST') {
      const { page, referrer, sessionId, userAgent } = req.body || {};
      const payload = {
        id: randomUUID(),
        page: page || '',
        referrer: referrer || '',
        session_id: sessionId || null,
        user_agent: userAgent || (req.headers['user-agent'] || ''),
        created_at: new Date().toISOString()
      };
      try {
        await supabase.from('analytics_pageviews').insert(payload);
      } catch (e) {
        console.warn('analytics_pageview insert failed (continuing):', e.message);
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

    

    // Health check
    if (route === 'health' && req.method === 'GET') {
      return res.status(200).json({ status: 'ok' });
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

    // GET /api/partners - list partners
    if (route === 'partners' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // GET /api/team - list team members
    if (route === 'team' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('team')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // GET /api/services - list services (map to frontend fields)
    if (route === 'services' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('title', { ascending: true });
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
