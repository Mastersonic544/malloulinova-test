const { createClient } = require('@supabase/supabase-js');
const multipart = require('lambda-multipart-parser');
const { nanoid } = require('nanoid');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'articles';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    if (!supabase) throw new Error('Supabase env not set');

    const path = event.path || '';

    if (path.endsWith('/api/health')) {
      return json({ status: 'ok' });
    }

    if (path.endsWith('/api/articles') && event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return json(data || []);
    }

    if (path.endsWith('/api/articles') && event.httpMethod === 'POST') {
      const parsed = await multipart.parse(event);
      const fields = parsed.fields || {};
      const files = parsed.files || [];

      const title = fields.title || 'Untitled';
      const shortDescription = fields.shortDescription || '';
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
        return json({ message: 'thumbnail is required' }, 400);
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

      return json(row, 201);
    }

    return json({ message: 'Not Found' }, 404);
  } catch (err) {
    console.error(err);
    return json({ message: err.message || 'Server Error' }, 500);
  }
};

function json(data, statusCode = 200, headers = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...headers },
    body: JSON.stringify(data)
  };
}
