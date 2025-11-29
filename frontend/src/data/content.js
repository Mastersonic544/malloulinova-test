import { useEffect, useState } from 'react';
import { fetchArticles as fetchFromConnector } from '../services/connectorService.js';

const initialData = [
  {
    id: 'p1',
    title: 'Smart Manufacturing Platform',
    category: 'IoT Solutions',
    fullBody: 'We architected an industrial IoT backbone that unified disparate PLCs and sensors, enabling real-time KPIs, downtime tracking, and maintenance planning across multiple sites.',
    thumbnailUrl: 'https://placehold.co/400x225/38bdf8/ffffff?text=16:9+THUMB',
    mediaUrls: { gallery: ['https://placehold.co/800x450'], videos: ['https://example.com/video1.mp4'] },
    documents: [],
    isFeatured: true
  },
  {
    id: 'p2',
    title: 'Logistics Automation Suite',
    category: 'Embedded Systems',
    fullBody: 'Designed low-power embedded nodes with NB-IoT connectivity, enabling granular shipment telemetry and SLA-compliant alerting.',
    thumbnailUrl: 'https://placehold.co/400x225/0ea5e9/ffffff?text=16:9+THUMB',
    mediaUrls: { gallery: ['https://placehold.co/800x450?2'], videos: [] },
    documents: [],
    isFeatured: true
  },
  {
    id: 'p3',
    title: 'Predictive Maintenance Toolkit',
    category: 'AI/ML',
    fullBody: 'Implemented lightweight on-device inference with a cloud pipeline for fleet-wide model updates and monitoring.',
    thumbnailUrl: 'https://placehold.co/400x225/22c55e/ffffff?text=16:9+THUMB',
    mediaUrls: { gallery: [], videos: [] },
    documents: [],
    isFeatured: true
  },
  {
    id: 'p4',
    title: 'Energy Submetering Network',
    category: 'IoT Solutions',
    fullBody: 'Deployed resilient, multi-tenant LoRaWAN infrastructure with dashboards tailored for facility managers.',
    thumbnailUrl: 'https://placehold.co/400x225/6366f1/ffffff?text=16:9+THUMB',
    mediaUrls: { gallery: [], videos: [] },
    documents: [],
    isFeatured: false
  },
  {
    id: 'p5',
    title: 'Utilities AMR Retrofit',
    category: 'Embedded Systems',
    fullBody: 'Engineered ultra-low power endpoints with robust RF stacks and secure commissioning flows for field ops.',
    thumbnailUrl: 'https://placehold.co/400x225/f97316/ffffff?text=16:9+THUMB',
    mediaUrls: { gallery: [], videos: [] },
    documents: [],
    isFeatured: false
  },
  {
    id: 'p6',
    title: 'Industrial Safety Beacons',
    category: 'IoT Solutions',
    fullBody: 'Delivered reliable, auditable presence detection and safety workflows, integrated with SOC systems.',
    thumbnailUrl: 'https://placehold.co/400x225/14b8a6/ffffff?text=16:9+THUMB',
    mediaUrls: { gallery: [], videos: [] },
    documents: [],
    isFeatured: false
  },
  {
    id: 'p7',
    title: 'Smart Agriculture Nodes',
    category: 'Embedded Systems',
    fullBody: 'Optimized energy profiles and backhaul to deliver season-long operation without service visits.',
    thumbnailUrl: 'https://placehold.co/400x225/ef4444/ffffff?text=16:9+THUMB',
    mediaUrls: { gallery: [], videos: [] },
    documents: [],
    isFeatured: false
  },
  {
    id: 'p8',
    title: 'Smart City Air Quality',
    category: 'AI/ML',
    fullBody: 'Built calibration pipelines and dashboards for actionable environmental insights across districts.',
    thumbnailUrl: 'https://placehold.co/400x225/475569/ffffff?text=16:9+THUMB',
    mediaUrls: { gallery: [], videos: [] },
    documents: [],
    isFeatured: false
  }
];

// Simple in-memory store with subscription
const listeners = new Set();
let store = [...initialData];

export const getData = () => store;
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const notify = () => listeners.forEach((fn) => fn(store));

export const addArticle = (article) => {
  const id = article.id || `p${Date.now()}`;
  store = [{
    ...article,
    id,
    fullBody: article.fullBody || article.body || '',
    thumbnailUrl: article.thumbnailUrl || '',
    mediaUrls: article.mediaUrls || { gallery: [], videos: [] },
    documents: article.documents || [],
    isFeatured: !!article.isFeatured
  }, ...store];
  notify();
};

export const updateArticle = (id, patch) => {
  store = store.map((a) => (a.id === id ? { ...a, ...patch } : a));
  notify();
};

export const deleteArticle = (id) => {
  store = store.filter((a) => a.id !== id);
  notify();
};

export const setFeaturedIds = (ids) => {
  const limited = ids.slice(0, 3);
  store = store.map((a) => ({ ...a, isFeatured: limited.includes(a.id) }));
  notify();
};

export const useContentData = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load from backend first
    const loadData = async () => {
      try {
        await loadFromConnector();
        setData(getData());
        setIsLoading(false);
      } catch (e) {
        console.error('Failed to load from backend, using placeholder data:', e);
        setData(getData()); // Use placeholder data as fallback
        setIsLoading(false);
        setError('Failed to load content from backend');
      }
    };

    loadData();

    const unsub = subscribe((next) => setData(next));
    return () => { unsub(); };
  }, []);

  return { data, isLoading, error };
};

// Load articles from the Python connector and hydrate store
export const loadFromConnector = async () => {
  try {
    const list = await fetchFromConnector();
    // Map connector Article -> store shape
    const mapped = list.map(a => ({
      id: a.id,
      title: a.title,
      category: a.category || 'Uncategorized',
      fullBody: a.body || '',
      thumbnailUrl: a.thumbnailUrl || '',
      mediaUrls: { gallery: a.galleryImageUrls || [], videos: a.videoUrl ? [a.videoUrl] : [] },
      documents: a.documentUrls || [],
      isFeatured: !!a.isFeatured,
      tags: a.tags || [],
      viewCount: typeof a.viewCount === 'number' ? a.viewCount : 0,
      createdAt: a.createdAt || null
    }));
    // Replace store entirely with remote data ONLY if backend returned items.
    if (mapped.length > 0) {
      store = mapped.slice().sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
      notify();
    }
  } catch (e) {
    console.warn('Connector fetch failed, using local seed:', e?.message || e);
  }
};
