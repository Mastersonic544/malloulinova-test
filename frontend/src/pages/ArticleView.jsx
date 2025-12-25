import React, { useMemo, useState, useEffect } from 'react';
import { useContentData } from '../data/content.js';
import logoSvg from '../../../assets/images/logo.svg';
import { trackPageView, trackClick, trackHover, trackLike, getLikes } from '../services/analyticsService.js';

const ArticleView = ({ articleId, onNavigate }) => {
  const { data } = useContentData();
  const article = useMemo(() => data.find(a => a.id === articleId) || null, [data, articleId]);
  const suggestions = useMemo(() => data.filter(a => a.id !== articleId).slice(0, 3), [data, articleId]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);

  // Always start at top when navigating to a new article.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const raf = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [articleId]);

  // Lightbox state for gallery
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchMove, setTouchMove] = useState(null);
  const gallery = article?.mediaUrls?.gallery || [];
  const openLightbox = (idx) => { setLightboxIndex(idx); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const prev = () => setLightboxIndex(i => (i - 1 + gallery.length) % gallery.length);
  const next = () => setLightboxIndex(i => (i + 1) % gallery.length);

  // Analytics tracking: page view + click + hover (throttled in service)
  useEffect(() => {
    trackPageView(window.location.pathname, document.title);

    const handleClick = (event) => {
      const target = event.target;
      const isInteractive =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.onclick ||
        target.style.cursor === 'pointer' ||
        (target.classList && target.classList.contains('clickable'));
      if (isInteractive) {
        trackClick(event);
      }
    };
    const handleHover = (e) => trackHover(e);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('mousemove', handleHover, { passive: true });

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('mousemove', handleHover);
    };
  }, []);

  // Load like count and liked state (per session/browser)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const total = await getLikes(articleId);
        if (mounted) setLikeCount(total);
      } catch {}
      try {
        const key = `liked:${articleId}`;
        const likedSession = sessionStorage.getItem(key) === '1';
        const likedLocal = localStorage.getItem(key) === '1';
        setLiked(Boolean(likedSession || likedLocal));
      } catch {}
    })();
    return () => { mounted = false; };
  }, [articleId]);

  const onLike = async () => {
    if (!article) return;
    if (liked) return; // prevent multiple likes per session/browser
    try {
      setLiked(true);
      setLikeCount((c) => c + 1); // optimistic
      const res = await trackLike(article.id);
      if (typeof res?.totalLikes === 'number') setLikeCount(res.totalLikes);
      // Persist like in session and local storage (session-level and sticky per browser)
      const key = `liked:${article.id}`;
      sessionStorage.setItem(key, '1');
      localStorage.setItem(key, '1');
    } catch (e) {
      // revert optimistic on failure
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    }
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, gallery.length]);

  const onTouchStart = (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    const t = e.touches[0];
    setTouchStart({ x: t.clientX, y: t.clientY });
    setTouchMove(null);
  };
  const onTouchMove = (e) => {
    if (!touchStart || !e.touches || e.touches.length !== 1) return;
    const t = e.touches[0];
    setTouchMove({ x: t.clientX, y: t.clientY });
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchMove) { setTouchStart(null); setTouchMove(null); return; }
    const dx = touchMove.x - touchStart.x;
    const dy = touchMove.y - touchStart.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    // Horizontal swipe threshold; ignore mostly vertical swipes
    if (absX > 40 && absY < 60) {
      if (dx < 0) next(); else prev();
    }
    setTouchStart(null);
    setTouchMove(null);
  };

  if (!article) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.25rem' }}>
        <h2 style={{ marginTop: '7rem' }}>Article not found</h2>
        <button onClick={() => onNavigate('projects')} style={{ padding: '0.7rem 1.1rem', borderRadius: 12, border: '1px solid #e2e8f0' }}>Back to Projects</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Montserrat, Arial, sans-serif', color: '#273F4F', margin: 0, padding: 0 }}>
      <style>{`
        body { margin: 0; padding: 0; }
        * { box-sizing: border-box; }
      `}</style>
      <div className="article-header" style={{ width: '100%', background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '1.5rem 2rem', margin: 0 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div onClick={() => onNavigate('/')} style={{ cursor: 'pointer' }}>
            <img src={logoSvg} alt="Malloulinova" style={{ height: '40px' }} />
          </div>
          <button className="back-btn" onClick={() => onNavigate('projects')} style={{ padding: '0.6rem 1rem', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#273F4F', cursor: 'pointer', whiteSpace: 'nowrap' }}>← Back to Projects</button>
        </div>
      </div>
      <div className="article-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem 2rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <article className="article-content" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '1.25rem 1.5rem', boxShadow: '0 10px 24px rgba(0,0,0,0.06)', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
          <h1 className="article-title" style={{ marginTop: 0, color: '#273F4F', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '1rem', wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>{article.title}</h1>
          {article.thumbnailUrl && (
            <img className="article-thumbnail" src={article.thumbnailUrl} alt={article.title} style={{ width: '100%', maxWidth: '100%', height: 'auto', borderRadius: 12, margin: '0.5rem 0 1rem', objectFit: 'cover', maxHeight: '500px', display: 'block' }} />
          )}
          {/* Like row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0.25rem 0 0.75rem' }}>
            <button
              onClick={onLike}
              aria-label={liked ? 'Liked' : 'Like this article'}
              disabled={liked}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '2px solid #447D9B',
                background: liked ? '#447D9B' : '#fff',
                color: liked ? '#fff' : '#447D9B',
                cursor: liked ? 'default' : 'pointer',
                boxShadow: '0 8px 18px rgba(39,63,79,0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform .15s ease, background .2s ease, color .2s ease',
                animation: liked ? 'pulse-like 600ms ease' : 'none'
              }}
              onMouseEnter={(e) => { if (!liked) { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.background = '#FE7743'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={(e) => { if (!liked) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#447D9B'; } }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>❤</span>
            </button>
            <div style={{ fontWeight: 700, color: '#273F4F' }}>{likeCount}</div>
            {!liked && (
              <div style={{ fontSize: 12, color: '#64748B' }}>Enjoyed this? Tap like</div>
            )}
          </div>

          {(article.fullBody && article.fullBody.trim().length > 0) && (
            <div className="article-body" style={{ color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginTop: '0.25rem', fontSize: '1rem', wordWrap: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>{article.fullBody}</div>
          )}

          {article.mediaUrls?.gallery?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px', marginTop: '1rem' }}>
              {article.mediaUrls.gallery.map((src, i) => (
                <img key={i} src={src} alt={`Gallery ${i+1}`} onClick={() => openLightbox(i)} style={{ width: '100%', borderRadius: 10, cursor: 'pointer' }} />
              ))}
            </div>
          )}

          {article.mediaUrls?.videos?.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              {article.mediaUrls.videos.map((v, i) => (
                <video key={i} controls style={{ width: '100%', borderRadius: 10, marginTop: i ? '0.5rem' : 0 }} src={v} />
              ))}
            </div>
          )}

          {Array.isArray(article.documents) && article.documents.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ margin: '0 0 8px', color: '#273F4F', fontSize: '1.1rem' }}>Downloads</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {article.documents.map((url, i) => {
                  const name = (() => {
                    try {
                      const u = new URL(url);
                      const parts = u.pathname.split('/');
                      return decodeURIComponent(parts[parts.length - 1] || `document-${i+1}`);
                    } catch {
                      const parts = String(url).split('/');
                      return decodeURIComponent(parts[parts.length - 1] || `document-${i+1}`);
                    }
                  })();
                  const ext = name.split('.').pop()?.toLowerCase() || '';
                  const badge = ext ? ext.toUpperCase() : 'FILE';
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10,
                        background: '#F8FAFC', color: '#0f172a', textDecoration: 'none'
                      }}
                    >
                      <span style={{
                        minWidth: 48, height: 28, borderRadius: 999,
                        background: '#eef2ff', border: '1px solid #c7d2fe',
                        color: '#3730a3', fontWeight: 700, fontSize: 12,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                      }}>{badge}</span>
                      <span style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </article>

        <aside className="suggestions-sidebar" style={{ background: '#F0F6FB', border: '1px solid #dbe7f0', borderRadius: 16, padding: '12px 12px 14px', boxShadow: '0 10px 22px rgba(68,125,155,0.10)', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ margin: '0 0 0.75rem', color: '#273F4F', fontWeight: 700 }}>Suggested Articles</h3>
          <div className="suggestions-grid" style={{ display: 'grid', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
            {suggestions.map(s => (
              <div key={s.id} className="suggestion-card" style={{ border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', background: '#EEF5FA', cursor: 'pointer' }} onClick={() => onNavigate({ view: 'article', id: s.id })}>
                {s.thumbnailUrl && <img src={s.thumbnailUrl} alt={s.title} style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} />}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>{s.category}</div>
                  <strong style={{ color: '#273F4F', fontSize: '0.9rem', display: 'block', marginBottom: 6 }}>{s.title}</strong>
                  <p className="suggestion-description" style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                    {(s.fullBody || '').slice(0, 110)}{(s.fullBody || '').length > 110 ? '…' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {lightboxOpen && gallery.length > 0 && (
        <div
          onClick={closeLightbox}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          {/* Counter top-right */}
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 18, right: 56, color: '#fff', background: 'rgba(0,0,0,0.35)', padding: '6px 10px', borderRadius: 12, fontSize: 13 }}>
            {lightboxIndex + 1} / {gallery.length}
          </div>
          {/* Close */}
          <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} aria-label="Close" style={{ position: 'absolute', top: 16, right: 18, background: 'transparent', border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          {/* Prev/Next */}
          {gallery.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous" style={{ position: 'absolute', left: 10, background: 'transparent', border: 'none', color: '#fff', fontSize: 36, cursor: 'pointer', padding: '10px' }}>‹</button>
          )}
          <img
            src={gallery[lightboxIndex]}
            alt={`Gallery ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '82vh', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', objectFit: 'contain' }}
          />
          {gallery.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next" style={{ position: 'absolute', right: 10, background: 'transparent', border: 'none', color: '#fff', fontSize: 36, cursor: 'pointer', padding: '10px' }}>›</button>
          )}
          {/* Dots bottom-center */}
          {gallery.length > 1 && (
            <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
              {gallery.map((_, idx) => (
                <span key={idx} style={{ width: idx === lightboxIndex ? 10 : 8, height: idx === lightboxIndex ? 10 : 8, borderRadius: '50%', background: idx === lightboxIndex ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }} />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Responsive Styles */}
      <style>{`
        /* Prevent horizontal overflow globally */
        .article-content,
        .article-title,
        .article-thumbnail,
        .article-body {
          max-width: 100%;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        
        .article-content {
          overflow: hidden;
          box-sizing: border-box;
        }
        
        .article-thumbnail {
          height: auto;
          display: block;
        }
        
        /* Desktop - sidebar layout */
        @media (min-width: 769px) {
          .article-container {
            grid-template-columns: 1fr 320px !important;
          }
          .suggestions-sidebar {
            display: block !important;
          }
        }
        
        /* Tablet and Mobile - carousel at bottom */
        @media (max-width: 768px) {
          .article-header {
            padding: 1rem 1.5rem !important;
          }
          
          .article-header > div {
            justify-content: center !important;
          }
          
          .article-container {
            grid-template-columns: 1fr !important;
            padding: 0 1rem 1rem !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
          
          .article-content {
            padding: 1rem !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          
          .article-title {
            font-size: 2rem !important;
            line-height: 1.3 !important;
            margin-bottom: 0.75rem !important;
            max-width: 100% !important;
            word-break: break-word !important;
          }
          
          .article-thumbnail {
            max-height: 350px !important;
            border-radius: 10px !important;
            width: 100% !important;
            max-width: 100% !important;
            object-fit: cover !important;
          }
          
          .article-body {
            font-size: 0.95rem !important;
            line-height: 1.6 !important;
            max-width: 100% !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
          }
          
          .suggestions-sidebar {
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            box-shadow: none !important;
            margin-top: 2rem;
          }
          
          .suggestions-sidebar h3 {
            text-align: center;
            margin-bottom: 1rem !important;
          }
          
          .suggestions-grid {
            display: flex !important;
            gap: 1rem !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 1rem;
            width: 100%;
            max-width: 100%;
            scrollbar-width: thin;
            scrollbar-color: #447D9B #f1f1f1;
          }
          
          .suggestions-grid::-webkit-scrollbar {
            height: 8px;
          }
          
          .suggestions-grid::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          
          .suggestions-grid::-webkit-scrollbar-thumb {
            background: #447D9B;
            border-radius: 10px;
          }
          
          .suggestion-card {
            min-width: 280px !important;
            max-width: 280px !important;
            flex-shrink: 0;
            scroll-snap-align: start;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            touch-action: pan-x;
          }
          
          .suggestion-description {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
        
        /* Small mobile */
        @media (max-width: 480px) {
          .article-header {
            padding: 0.75rem 0.5rem !important;
          }
          
          .article-header img {
            height: 32px !important;
          }
          
          .back-btn {
            font-size: 0.85rem !important;
            padding: 0.5rem 0.75rem !important;
          }
          
          .article-container {
            padding: 0 0.5rem 0.5rem !important;
            width: 100% !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }
          
          .article-content {
            padding: 0.75rem !important;
            border-radius: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          
          .article-title {
            font-size: 1.5rem !important;
            line-height: 1.25 !important;
            margin-bottom: 0.5rem !important;
            max-width: 100% !important;
            word-break: break-word !important;
            hyphens: auto !important;
          }
          
          .article-thumbnail {
            max-height: 250px !important;
            border-radius: 8px !important;
            margin: 0.25rem 0 0.75rem !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
          }
          
          .article-body {
            font-size: 0.9rem !important;
            line-height: 1.6 !important;
            max-width: 100% !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
          }
          
          .suggestion-card {
            min-width: 240px !important;
            max-width: 240px !important;
          }
          
          .suggestion-card strong {
            font-size: 0.85rem !important;
          }
          
          .suggestion-card p {
            font-size: 12px !important;
          }
        }
        
        /* Extra small mobile (320px) */
        @media (max-width: 360px) {
          .article-header {
            padding: 0.5rem !important;
          }
          
          .article-header > div {
            gap: 0.5rem !important;
          }
          
          .article-header img {
            height: 28px !important;
          }
          
          .back-btn {
            font-size: 0.75rem !important;
            padding: 0.4rem 0.6rem !important;
          }
          
          .article-container {
            padding: 0 0.5rem 0.5rem !important;
          }
          
          .article-content {
            padding: 0.5rem !important;
          }
          
          .article-title {
            font-size: 1.25rem !important;
            line-height: 1.2 !important;
          }
          
          .article-body {
            font-size: 0.85rem !important;
          }
          
          .suggestion-card {
            min-width: 200px !important;
            max-width: 200px !important;
          }
          
          .suggestion-card strong {
            font-size: 0.8rem !important;
          }
          
          .suggestion-card p {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ArticleView;
