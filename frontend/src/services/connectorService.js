// Connector Service: talks to the backend API
// Vite proxy forwards /api to http://localhost:3001 in development
// In production, /api routes to Vercel serverless functions
let BASE_URL = '/api';
if (typeof window !== 'undefined' && window.__CONNECTOR_BASE__) {
  BASE_URL = window.__CONNECTOR_BASE__;
}

export async function persistFeatured(featuredIds) {
  const res = await fetch(`${BASE_URL}/articles/featured`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ featuredIds })
  });
  const body = await res.text();
  if (!res.ok) {
    let msg = `Failed to persist featured: ${res.status}`;
    try { const j = JSON.parse(body); if (j && j.message) msg += ` - ${j.message}`; } catch (_) {}
    throw new Error(msg);
  }
  try { return JSON.parse(body); } catch { return { featuredIds: [] }; }
}

export async function updateArticleMedia(id, { thumbnailFile, galleryFiles, videoFile, documentFiles, clearGallery, clearVideo, clearDocuments }) {
  const form = new FormData();
  if (thumbnailFile) form.append('thumbnail', thumbnailFile);
  if (videoFile) form.append('video', videoFile);
  if (galleryFiles && galleryFiles.length) {
    Array.from(galleryFiles).forEach(f => form.append('gallery', f));
  }
  if (documentFiles && documentFiles.length) {
    Array.from(documentFiles).forEach(f => form.append('documents', f));
  }
  if (clearGallery === 'true' || clearGallery === true) form.append('clearGallery', 'true');
  if (clearVideo === 'true' || clearVideo === true) form.append('clearVideo', 'true');
  if (clearDocuments === 'true' || clearDocuments === true) form.append('clearDocuments', 'true');
  const res = await fetch(`${BASE_URL}/articles/${id}/media`, { method: 'PUT', body: form });
  if (!res.ok) throw new Error(`Failed to update media: ${res.status}`);
  return await res.json();
}

export async function fetchArticles() {
  const res = await fetch(`${BASE_URL}/articles`);
  if (!res.ok) throw new Error(`Failed to fetch articles: ${res.status}`);
  return await res.json();
}

export async function fetchTopArticles(limit = 7, month = null) {
  let url = `${BASE_URL}/articles/top?limit=${encodeURIComponent(limit)}`;
  if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
    url += `&month=${encodeURIComponent(month)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch top articles: ${res.status}`);
  return await res.json();
}

export async function saveArticle({ title, body, tags }, { thumbnailFile, galleryFiles, videoFile, documentFiles }) {
  const form = new FormData();
  form.append('title', title || 'Untitled');
  form.append('body', body || '');
  form.append('tags', JSON.stringify(tags || []));

  if (thumbnailFile) form.append('thumbnail', thumbnailFile);
  if (videoFile) form.append('video', videoFile);
  if (galleryFiles && galleryFiles.length) {
    Array.from(galleryFiles).forEach(f => form.append('gallery', f));
  }
  if (documentFiles && documentFiles.length) {
    Array.from(documentFiles).forEach(f => form.append('documents', f));
  }

  const res = await fetch(`${BASE_URL}/articles`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Failed to save article: ${res.status}`);
  return await res.json();
}

export async function updateArticleRemote(id, { title, body, tags }) {
  const res = await fetch(`${BASE_URL}/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, tags })
  });
  if (!res.ok) throw new Error(`Failed to update article: ${res.status}`);
  return await res.json();
}

export async function submitContact({ name, email, company, message, website }) {
  const res = await fetch(`${BASE_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, company, message, website })
  });
  const body = await res.text();
  if (!res.ok) {
    let msg = `Failed to submit contact: ${res.status}`;
    try { const j = JSON.parse(body); if (j && j.message) msg += ` - ${j.message}`; } catch (_) {}
    throw new Error(msg);
  }
  try { return JSON.parse(body); } catch { return { ok: true }; }
}
