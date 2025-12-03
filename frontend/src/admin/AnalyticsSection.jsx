import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { getDashboardData, getHeatmapData } from '../services/analyticsService.js';
import { fetchTopArticles } from '../services/connectorService.js';

const defaultKpis = {
  todayViews: 0,
  viewsGrowth: 0,
  todayVisitors: 0,
  visitorsGrowth: 0,
  totalViews30Days: 0,
  avgViewsPerDay: 0,
  bounceRate: 0,
  avgSessionDuration: '0:00'
};

const AnalyticsSection = ({ colors }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [kpis, setKpis] = useState(defaultKpis);
  const [topPages, setTopPages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [heatmapData, setHeatmapData] = useState({ clicks: [], sectionSummary: [], totalClicks: 0 });
  const [topArticles, setTopArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dash, heat, top] = await Promise.all([
          getDashboardData(30),
          getHeatmapData('/', selectedMonth),
          fetchTopArticles(7, selectedMonth)
        ]);
        if (cancelled) return;
        setKpis(dash?.kpis || defaultKpis);
        setTopPages(dash?.topPages || []);
        setLocations(dash?.locations || []);
        setHeatmapData(heat || { clicks: [], sectionSummary: [], totalClicks: 0 });
        setTopArticles(Array.isArray(top) ? top : []);
      } catch (e) {
        console.error('Failed to load analytics dashboard', e);
        if (!cancelled) setError('Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  const buildTopArticlesBarData = useMemo(
    () => () => {
      if (!Array.isArray(topArticles)) return [];
      return topArticles
        .map((a) => ({
          name: a.title || a.id,
          value: typeof a.viewCount === 'number' ? a.viewCount : typeof a.views === 'number' ? a.views : 0
        }))
        .filter((x) => x.value > 0);
    },
    [topArticles]
  );

  const buildTopPagesPieData = (items) => {
    if (!Array.isArray(items)) return [];
    const totals = new Map();
    for (const p of items) {
      const rawName = p?.page_title || p?.title || p?.page_path || 'Unknown';
      const path = (p?.page_path || rawName || '').toString().toLowerCase();
      const value = typeof p?.view_count === 'number' ? p.view_count : p?.views || 0;
      if (!value) continue;
      let key = '';
      if (path === '/' || path === '') key = 'Home';
      else if (path === '/projects' || path.startsWith('/projects/')) key = 'Projects';
      else if (path === '/articles' || path.startsWith('/articles/')) key = 'Projects';
      else continue;
      totals.set(key, (totals.get(key) || 0) + value);
    }
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  const sectionSummary = useMemo(() => {
    let sectionSummaryLocal = Array.isArray(heatmapData?.sectionSummary) ? heatmapData.sectionSummary : [];
    if (!sectionSummaryLocal.length && Array.isArray(heatmapData?.clicks) && heatmapData.clicks.length) {
      const tmp = {};
      heatmapData.clicks.forEach((c) => {
        const key = c.sectionId || 'unknown';
        tmp[key] = (tmp[key] || 0) + 1;
      });
      sectionSummaryLocal = Object.entries(tmp).map(([sectionId, count]) => ({ sectionId, count }));
    }
    return sectionSummaryLocal;
  }, [heatmapData]);

  const maxSectionCount = sectionSummary.reduce((m, r) => Math.max(m, r.count || 0), 0);
  const counts = sectionSummary.reduce((acc, s) => {
    acc[s.sectionId || 'unknown'] = s.count;
    return acc;
  }, {});

  const getColor = (count) => {
    if (maxSectionCount <= 0 || !count) return '#e5e7eb';
    const ratio = count / maxSectionCount;
    if (ratio >= 0.66) return '#ef4444';
    if (ratio >= 0.33) return '#f59e0b';
    return '#10b981';
  };

  const defaultSections = [
    { id: 'hero', label: 'Hero' },
    { id: 'features', label: 'Features' },
    { id: 'services', label: 'Our Services' },
    { id: 'technologies', label: 'Technologies' },
    { id: 'projects', label: 'Projects' },
    { id: 'partners', label: 'Partners' },
    { id: 'team', label: 'Team' },
    { id: 'faqs', label: 'FAQs' },
    { id: 'contact', label: 'Contact' },
    { id: 'unknown', label: 'Other' }
  ];

  const sections = useMemo(() => {
    const seen = new Set(defaultSections.map((s) => s.id));
    const dynamicExtra = (sectionSummary || [])
      .map((s) => s.sectionId)
      .filter((id) => id && !seen.has(id))
      .map((id) => ({
        id,
        label: id
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
      }));
    return [...defaultSections, ...dynamicExtra];
  }, [sectionSummary]);

  const monthOptions = useMemo(() => {
    const items = [];
    const base = new Date();
    base.setUTCDate(1);
    for (let i = 0; i < 12; i++) {
      const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const val = `${y}-${m}`;
      const label = d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
      items.push({ value: val, label });
    }
    return items;
  }, []);

  return (
    <div style={{ borderRadius: 16, background: colors.card, padding: 18, boxShadow: colors.shadow, border: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: colors.dark }}>Analytics Overview</h2>
          {loading && <div style={{ fontSize: 12, color: colors.muted }}>Loading analytics…</div>}
          {error && <div style={{ fontSize: 12, color: '#b91c1c' }}>{error}</div>}
        </div>
        <div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13 }}
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(102,126,234,0.3)'
          }}
        >
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Today&apos;s Views</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>{kpis.todayViews}</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            <span style={{ color: kpis.viewsGrowth >= 0 ? '#a7f3d0' : '#fecaca' }}>
              {kpis.viewsGrowth >= 0 ? '↑' : '↓'} {Math.abs(kpis.viewsGrowth)}%
            </span>{' '}
            vs last week
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(240,147,251,0.3)'
          }}
        >
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Today&apos;s Visitors</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>{kpis.todayVisitors}</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            <span style={{ color: kpis.visitorsGrowth >= 0 ? '#a7f3d0' : '#fecaca' }}>
              {kpis.visitorsGrowth >= 0 ? '↑' : '↓'} {Math.abs(kpis.visitorsGrowth)}%
            </span>{' '}
            vs last week
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(79,172,254,0.3)'
          }}
        >
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>30-Day Views</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>{kpis.totalViews30Days.toLocaleString()}</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Avg: {kpis.avgViewsPerDay}/day</div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(250,112,154,0.3)'
          }}
        >
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Bounce Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '4px' }}>{kpis.bounceRate}%</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Avg Session: {kpis.avgSessionDuration}</div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .heatmap-row { grid-template-columns: 1fr; } }
      `}</style>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: colors.card, borderRadius: '16px', padding: '20px', boxShadow: colors.shadow, border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: colors.dark, fontSize: '1.1rem' }}>Top Articles by Views</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={buildTopArticlesBarData()} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="name" hide />
              <YAxis tick={{ fontSize: 12, fill: colors.muted }} allowDecimals={false} />
              <Tooltip
                formatter={(value) => [value, 'Views']}
                contentStyle={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px' }}
              />
              <Bar dataKey="value" name="Views" fill={colors.primary} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: colors.card, borderRadius: '16px', padding: '20px', boxShadow: colors.shadow, border: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: '0 0 16px 0', color: colors.dark, fontSize: '1.1rem' }}>Top Pages</h3>
          {Array.isArray(topPages) && topPages.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={buildTopPagesPieData(topPages)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={50}
                    paddingAngle={2}
                    label={false}
                  >
                    {buildTopPagesPieData(topPages).map((_, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={[colors.primary, colors.accent, '#34d399', '#f59e0b', '#6366f1', '#ef4444'][idx % 6]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: colors.muted }}>No page view data yet.</div>
          )}
        </div>
      </div>

      {/* Heatmap + locations */}
      <div className="heatmap-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <div style={{ background: colors.card, borderRadius: '16px', padding: '20px', boxShadow: colors.shadow, border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: colors.dark, fontSize: '1.1rem' }}>Click Heatmap (Home page)</h3>
            <div style={{ fontSize: '12px', color: colors.muted }}>
              {new Date(selectedMonth + '-01').toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </div>
          </div>

          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
              {sections.map((s) => {
                const count = counts[s.id] || 0;
                const color = getColor(count);
                const hex = color.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                const bg = `rgba(${r}, ${g}, ${b}, 0.1)`;
                return (
                  <div key={s.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: 12, background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong style={{ color: colors.dark, fontSize: 13 }}>{s.label}</strong>
                      <span style={{ fontSize: 12, color: colors.muted }}>{count} clicks</span>
                    </div>
                    <div
                      style={{
                        height: 64,
                        borderRadius: 12,
                        background: bg,
                        border: `2px solid ${color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: color,
                        fontWeight: 700
                      }}
                    >
                      {count > 0 ? 'Hotness' : 'No data'}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 14, background: '#f59e0b', borderRadius: 4, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: colors.muted }}>Warm (medium)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 14, background: '#ef4444', borderRadius: 4, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: colors.muted }}>Hot (high)</span>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: colors.muted }}>Total clicks: {heatmapData.totalClicks}</div>
            </div>
          </>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: colors.card, borderRadius: '16px', padding: '16px 20px', boxShadow: colors.shadow, border: `1px solid ${colors.border}` }}>
            <h3 style={{ margin: '0 0 12px 0', color: colors.dark, fontSize: '1.1rem' }}>Top Countries</h3>
            {Array.isArray(locations) && locations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {locations.slice(0, 7).map((loc, idx) => (
                  <div
                    key={`${loc.country || 'unknown'}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: `1px solid ${colors.border}`,
                      borderRadius: 10,
                      padding: '8px 10px',
                      background: '#fff'
                    }}
                  >
                    <span style={{ color: colors.text, fontSize: 13 }}>{loc.country || 'Unknown'}</span>
                    <span style={{ color: colors.muted, fontSize: 12 }}>{loc.visits || 0} visits</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: colors.muted }}>No location data yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
