// Analytics Service - Track and retrieve site analytics
// Use relative path by default to avoid port/env mismatches
const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';

// Generate unique visitor ID (stored in localStorage)
const getVisitorId = () => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

// Track a like event for an article and return updated total likes
export const trackLike = async (articleId) => {
  try {
    if (!articleId) throw new Error('articleId is required');
    const sessionId = getSessionId();
    const visitorId = getVisitorId();
    const response = await fetch(`${BASE_URL}/api/analytics/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, sessionId, visitorId })
    });
    if (!response.ok) throw new Error('Failed to like');
    return await response.json(); // { liked: true, totalLikes }
  } catch (e) {
    console.error('Failed to send like:', e);
    throw e;
  }
};

// Get total likes for an article
export const getLikes = async (articleId) => {
  try {
    if (!articleId) throw new Error('articleId is required');
    const response = await fetch(`${BASE_URL}/api/analytics/likes?articleId=${encodeURIComponent(articleId)}`);
    if (!response.ok) throw new Error('Failed to fetch likes');
    const data = await response.json();
    return typeof data.totalLikes === 'number' ? data.totalLikes : 0;
  } catch (e) {
    console.error('Failed to get likes:', e);
    return 0;
  }
};

// Track hover/engagement (used for bounce-rate and engagement, not heatmap)
// Throttled to avoid spamming backend. Default: send at most once every 3s per session.
export const trackHover = (() => {
  let lastSent = 0;
  return async (event) => {
    try {
      const sessionId = getSessionId();
      const path = window.location.pathname;
      const sentKey = `hover_sent:${sessionId}:${path}`;
      if (sessionStorage.getItem(sentKey) === '1') return; // already sent for this page in this session

      const now = Date.now();
      if (now - lastSent < 3000) return; // throttle 3s
      lastSent = now;

      const visitorId = getVisitorId();

      // Calculate position as percentage (similar to click) for potential analysis
      const xPosition = Math.round((event.clientX / window.innerWidth) * 100);
      const yPosition = Math.round(((event.clientY + window.scrollY) / document.documentElement.scrollHeight) * 100);

      // Element + section inference
      const target = event.target || document.body;
      const elementType = target.tagName ? target.tagName.toLowerCase() : 'unknown';
      const elementText = (target.textContent || '').substring(0, 100);
      const elementId = target.id || '';
      const elementClass = target.className || '';
      let sectionId = '';
      const sectionEl = target.closest && (target.closest('section[id]') || target.closest('[data-section-id]') || target.closest('.section'));
      if (sectionEl) {
        sectionId = sectionEl.getAttribute('id') || sectionEl.getAttribute('data-section-id') || '';
      }

      const payload = {
        pagePath: path,
        eventType: 'hover',
        xPosition,
        yPosition,
        elementType,
        elementText,
        elementId,
        elementClass,
        sectionId,
        sessionId,
        visitorId,
      };

      const response = await fetch(`${BASE_URL}/api/analytics/hover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        console.error('Failed to track hover:', response.statusText);
      }
      // Mark as sent for this session+path regardless of outcome to avoid spamming
      sessionStorage.setItem(sentKey, '1');
    } catch (e) {
      console.error('Failed to track hover:', e);
    }
  };
})();

// Generate session ID (stored in sessionStorage)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = 's_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Store analytics in localStorage for demo (in production, use backend)
const ANALYTICS_KEY = 'malloulinova_analytics';

// Initialize analytics storage
const initAnalytics = () => {
  const stored = localStorage.getItem(ANALYTICS_KEY);
  if (!stored) {
    const initialData = {
      pageViews: generateMockPageViews(),
      visitors: generateMockVisitors(),
      topPages: [
        { path: '/', views: 1250, title: 'Home' },
        { path: '/projects', views: 890, title: 'Projects' },
        { path: '/contact', views: 340, title: 'Contact' },
        { path: '/article/*', views: 670, title: 'Articles' }
      ],
      devices: {
        desktop: 65,
        mobile: 28,
        tablet: 7
      },
      locations: [
        { country: 'Tunisia', visits: 450 },
        { country: 'France', visits: 380 },
        { country: 'Germany', visits: 290 },
        { country: 'USA', visits: 250 },
        { country: 'UK', visits: 180 }
      ],
      referrers: [
        { source: 'Direct', visits: 890 },
        { source: 'Google', visits: 670 },
        { source: 'LinkedIn', visits: 340 },
        { source: 'GitHub', visits: 150 }
      ]
    };
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(stored);
};

// Generate mock page views for last 30 days
function generateMockPageViews() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const baseViews = 80 + Math.floor(Math.random() * 40);
    const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.6 : 1;
    data.push({
      date: dateStr,
      views: Math.floor(baseViews * weekendMultiplier),
      uniqueVisitors: Math.floor((baseViews * weekendMultiplier) * 0.7)
    });
  }
  return data;
}

// Generate mock visitor data
function generateMockVisitors() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const baseVisitors = 60 + Math.floor(Math.random() * 30);
    const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.6 : 1;
    data.push({
      date: dateStr,
      visitors: Math.floor(baseVisitors * weekendMultiplier),
      newVisitors: Math.floor((baseVisitors * weekendMultiplier) * 0.4),
      returningVisitors: Math.floor((baseVisitors * weekendMultiplier) * 0.6)
    });
  }
  return data;
}

// Track page view (called from components)
export const trackPageView = async (path, title) => {
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const deviceType = getDeviceType();
    
    const response = await fetch(`${BASE_URL}/api/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePath: path,
        pageTitle: title,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        deviceType,
        country: null, // Can be detected via IP geolocation service
        city: null,
        sessionId,
        visitorId
      })
    });
    
    if (!response.ok) {
      console.error('Failed to track page view:', response.statusText);
    }
  } catch (e) {
    console.error('Failed to track page view:', e);
  }
};

// Track click event (for heatmap)
export const trackClick = async (event) => {
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    
    // Calculate position as percentage
    const rect = document.documentElement.getBoundingClientRect();
    const xPosition = Math.round((event.clientX / window.innerWidth) * 100);
    const yPosition = Math.round(((event.clientY + window.scrollY) / document.documentElement.scrollHeight) * 100);
    
    // Get element info
    const target = event.target;
    const elementType = target.tagName.toLowerCase();
    const elementText = target.textContent?.substring(0, 100) || '';
    const elementId = target.id || '';
    const elementClass = target.className || '';
    // Infer sectionId from closest section or wrapper
    let sectionId = '';
    const sectionEl = target.closest('section[id]') || target.closest('[data-section-id]') || target.closest('.section');
    if (sectionEl) {
      sectionId = sectionEl.getAttribute('id') || sectionEl.getAttribute('data-section-id') || '';
    }
    
    // Calculate scroll depth
    const scrollDepth = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    
    const response = await fetch(`${BASE_URL}/api/analytics/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePath: window.location.pathname,
        xPosition,
        yPosition,
        elementType,
        elementText,
        elementId,
        elementClass,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        scrollDepth,
        sectionId,
        sessionId,
        visitorId
      })
    });
    
    if (!response.ok) {
      console.error('Failed to track click:', response.statusText);
    }
  } catch (e) {
    console.error('Failed to track click:', e);
  }
};

// Get analytics dashboard data from backend
export const getDashboardData = async (arg = 'current') => {
  try {
    let url = `${BASE_URL}/api/analytics/dashboard`;
    if (typeof arg === 'string' && /^\d{4}-\d{2}$/.test(arg)) {
      url += `?month=${encodeURIComponent(arg)}`;
    } else if (typeof arg === 'number') {
      url += `?period=${arg}`;
    } else {
      url += `?period=30`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    return await response.json();
  } catch (e) {
    console.error('Failed to get dashboard data:', e);
    // Return fallback mock data
    return {
      kpis: {
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
      },
      dailyStats: [],
      topPages: [],
      devices: { desktop: 0, mobile: 0, tablet: 0 },
      locations: []
    };
  }
};

// Get analytics data (legacy - for backward compatibility)
export const getAnalytics = () => {
  return initAnalytics();
};

// Get KPIs (legacy - for backward compatibility)
export const getKPIs = () => {
  const analytics = initAnalytics();
  const last30Days = analytics.pageViews.slice(-30);
  const last7Days = analytics.pageViews.slice(-7);
  const today = analytics.pageViews[analytics.pageViews.length - 1] || { views: 0, uniqueVisitors: 0 };
  
  // Calculate totals
  const totalViews30Days = last30Days.reduce((sum, d) => sum + d.views, 0);
  const totalViews7Days = last7Days.reduce((sum, d) => sum + d.views, 0);
  const totalVisitors30Days = last30Days.reduce((sum, d) => sum + d.uniqueVisitors, 0);
  const totalVisitors7Days = last7Days.reduce((sum, d) => sum + d.uniqueVisitors, 0);
  
  // Calculate averages
  const avgViewsPerDay = Math.round(totalViews30Days / 30);
  const avgVisitorsPerDay = Math.round(totalVisitors30Days / 30);
  
  // Calculate growth (compare last 7 days to previous 7 days)
  const previous7Days = analytics.pageViews.slice(-14, -7);
  const previousViews = previous7Days.reduce((sum, d) => sum + d.views, 0);
  const viewsGrowth = previousViews > 0 ? ((totalViews7Days - previousViews) / previousViews * 100).toFixed(1) : 0;
  
  const previousVisitors = previous7Days.reduce((sum, d) => sum + d.uniqueVisitors, 0);
  const visitorsGrowth = previousVisitors > 0 ? ((totalVisitors7Days - previousVisitors) / previousVisitors * 100).toFixed(1) : 0;
  
  return {
    todayViews: today.views,
    todayVisitors: today.uniqueVisitors,
    totalViews30Days,
    totalVisitors30Days,
    avgViewsPerDay,
    avgVisitorsPerDay,
    viewsGrowth: parseFloat(viewsGrowth),
    visitorsGrowth: parseFloat(visitorsGrowth),
    bounceRate: 42.5, // Mock data
    avgSessionDuration: '2:34' // Mock data
  };
};

// Get heatmap data (page interactions)
export const getHeatmapData = async (pagePath = '/', month = null) => {
  try {
    let url = `${BASE_URL}/api/analytics/heatmap?pagePath=${encodeURIComponent(pagePath)}`;
    if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
      url += `&month=${encodeURIComponent(month)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch heatmap data');
    }
    const data = await response.json();
    return {
      clicks: data.clicks || [],
      totalClicks: data.totalClicks || 0,
      pagePath: data.pagePath,
      sectionSummary: data.sectionSummary || [],
      maxSectionCount: data.maxSectionCount || 0
    };
  } catch (e) {
    console.error('Failed to get heatmap data:', e);
    // Return empty data if no clicks yet
    return {
      clicks: [],
      totalClicks: 0,
      pagePath
    };
  }
};

// Get chart data for visitors over time
export const getVisitorChartData = (period = '30days') => {
  const analytics = initAnalytics();
  let data = analytics.visitors;
  
  if (period === '7days') {
    data = data.slice(-7);
  } else if (period === '30days') {
    data = data.slice(-30);
  }
  
  return data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visitors: d.visitors,
    new: d.newVisitors,
    returning: d.returningVisitors
  }));
};

// Get chart data for page views over time
export const getPageViewsChartData = (period = '30days') => {
  const analytics = initAnalytics();
  let data = analytics.pageViews;
  
  if (period === '7days') {
    data = data.slice(-7);
  } else if (period === '30days') {
    data = data.slice(-30);
  }
  
  return data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: d.views
  }));
};

export default {
  trackPageView,
  trackClick,
  trackHover,
  getDashboardData,
  getAnalytics,
  getKPIs,
  getHeatmapData,
  trackLike,
  getLikes,
  getVisitorChartData,
  getPageViewsChartData
};
