const { createClient } = require('@supabase/supabase-js');
const multipart = require('lambda-multipart-parser');
const { nanoid } = require('nanoid');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'articles';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const getCorsHeaders = (event) => {
  const requestOrigin = event?.headers?.origin || event?.headers?.Origin || '';
  const allowListRaw = process.env.CORS_ALLOW_ORIGINS || '';
  const allowList = allowListRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Safe defaults:
  // - If an allowlist is provided, only allow matching origins.
  // - If not provided, fall back to request origin when present (useful for previews/dev)
  //   otherwise allow '*'.
  let allowOrigin = '*';
  if (allowList.length > 0) {
    allowOrigin = allowList.includes(requestOrigin) ? requestOrigin : allowList[0];
  } else if (requestOrigin) {
    allowOrigin = requestOrigin;
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...(allowOrigin !== '*' ? { 'Vary': 'Origin' } : {})
  };
};

exports.handler = async (event) => {
  const corsHeaders = getCorsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    if (!supabase) throw new Error('Supabase env not set');

    const path = event.path || '';

    if (path.endsWith('/api/health')) {
      return json({ status: 'ok' }, 200, {}, corsHeaders);
    }

    if (path.endsWith('/api/articles') && event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json(data || [], 200, {}, corsHeaders);
    }

    if (path.endsWith('/api/articles') && event.httpMethod === 'POST') {
      let parsed;
      try {
        parsed = await multipart.parse(event);
      } catch (parseErr) {
        console.error('Multipart parsing failed:', parseErr);
        return json({ message: 'Invalid multipart/form-data payload' }, 400, {}, corsHeaders);
      }
      const fields = parsed.fields || {};
      const files = parsed.files || [];

      const title = fields.title || 'Untitled';
      const body = fields.body || '';
      const category = fields.category || 'Uncategorized';
      const isFeatured = String(fields.isFeatured || 'false') === 'true';

      const id = nanoid();
      const now = new Date().toISOString();

      const findFile = (name) => files.find(f => f.fieldname === name);
      const findAll = (name) => files.filter(f => f.fieldname === name);

      const upload = async (file, key) => {
        if (!file) return null;
        const { error: upErr } = await supabase
          .storage
          .from(SUPABASE_MEDIA_BUCKET)
          .upload(key, file.content, { contentType: file.contentType, upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(SUPABASE_MEDIA_BUCKET).getPublicUrl(key);
        return pub?.publicUrl || null;
      };

      const thumbFile = findFile('thumbnail');
      const videoFile = findFile('video');
      const galleryFiles = findAll('gallery');

      if (!thumbFile) {
        return json({ message: 'thumbnail is required' }, 400, {}, corsHeaders);
      }

      const thumbnailUrl = await upload(thumbFile, `${id}/thumbnail/${thumbFile?.filename || 'thumb'}`);
      const videoUrl = await upload(videoFile, `${id}/video/${videoFile?.filename || 'video'}`);

      const galleryImageUrls = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const g = galleryFiles[i];
        const url = await upload(g, `${id}/gallery/${i}-${g.filename || 'image'}`);
        if (url) galleryImageUrls.push(url);
      }

      const row = {
        id,
        title,
        body,
        category,
        thumbnail_url: thumbnailUrl,
        video_url: videoUrl,
        gallery_image_urls: galleryImageUrls,
        is_featured: isFeatured,
        created_at: now,
        updated_at: now
      };

      const { error: insErr } = await supabase.from('articles').upsert(row);
      if (insErr) throw insErr;

      return json(row, 201, {}, corsHeaders);
    }

    return json({ message: 'Not Found' }, 404, {}, corsHeaders);
  } catch (err) {
    console.error(err);
    return json({ message: err.message || 'Server Error' }, 500, {}, corsHeaders);
  }
};

function json(data, statusCode = 200, headers = {}, corsHeaders = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...headers },
    body: JSON.stringify(data)
  };
}
