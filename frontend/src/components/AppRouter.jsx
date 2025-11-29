import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import PublicSite from '../pages/PublicSite.jsx';
import AdminLogin from '../pages/AdminLogin.jsx';
import MainDashboard from '../admin/MainDashboard.jsx';
import Contact from '../pages/Contact.jsx';
import { auth, onAuthStateChanged } from '@/lib/firebase.js';
import { useContentData } from '../data/content.js';
import ArticleView from '../pages/ArticleView.jsx';
import { makeShortDescription } from '../utils/preview.js';
import ChatWidget from './ChatWidget.jsx';
import AnimatedLogo from './AnimatedLogo.jsx';
import logoSvg from '../../../assets/images/logo.svg';

// Create User Context for global state management
const UserContext = createContext();

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// User Provider Component
const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Set up authentication state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setUserId(user.uid);
        setUser(user);
        console.log('User authenticated:', user.uid);
      } else {
        // User is signed out
        setUserId(null);
        setUser(null);
        console.log('No user authenticated');
      }
      setIsAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    userId,
    user,
    auth,
    isAuthLoading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: '#273F4F'
  }}>
    <style>{`
      @keyframes ld-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: 12, background: 'rgba(241,245,249,0.6)', border: '1px solid #e5e7eb', animation: 'ld-fade-in 400ms ease both' }}>
      <AnimatedLogo size={24} spinDuration={4} spinDirection="normal" spinDelay="0s" initialRotate={15} style={{ opacity: 0.35, position: 'relative' }} />
      <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.3px' }}>MALLOULINOVA… website loading</span>
    </div>
  </div>
);

// useContentData imported from shared store

// Card component
const ProjectCard = ({ item }) => (
  <div style={{
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  }}>
    <img src={item.thumbnailUrl} alt={item.title} style={{ width: '100%', height: 'auto', display: 'block' }} />
    <div style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>{item.category}</div>
      <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{item.title}</h4>
      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, marginTop: '8px' }}>{makeShortDescription(item.fullBody || item.body || '')}</p>
    </div>
  </div>
);

// Views
const HomeView = ({ onNavigate }) => {
  const { data, isLoading, error } = useContentData();
  const featured = useMemo(() => data.filter(d => d.isFeatured).slice(0,3), [data]);
  const cardStyles = [
    { background: '#EEF5FA', border: '1px solid rgba(68,125,155,0.18)', boxShadow: '0 14px 36px rgba(39,63,79,0.16)' },
    { background: '#FDF2F0', border: '1px solid rgba(254,119,67,0.18)', boxShadow: '0 14px 36px rgba(254,119,67,0.12)' },
    { background: '#F1F5F9', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 14px 36px rgba(15,23,42,0.10)' }
  ];

  return (
    <div>
      {/* Simple hero header for the listing app layer */}
      <div style={{ padding: '2rem 1.25rem 1rem', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '2rem', color: '#0f172a' }}>B2B Projects That Ship</h2>
        <p style={{ marginTop: '0.5rem', color: '#475569' }}>Selected case studies that reduced time-to-market and improved ROI.</p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.25rem 1.5rem' }}>
        {isLoading && <div style={{ textAlign: 'center', padding: '1rem' }}>Loading featured projects…</div>}
        {error && <div style={{ textAlign: 'center', color: '#ef4444' }}>{error}</div>}
        {!isLoading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {featured.map((item, i) => (
              <div key={item.id} style={{ borderRadius: '18px', padding: '12px', ...cardStyles[i % cardStyles.length] }}>
                <ProjectCard item={item} />
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => onNavigate('projects')} style={{
            padding: '0.8rem 1.5rem',
            background: '#FE7743',
            color: '#fff',
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
            boxShadow: '0 10px 24px rgba(254,119,67,0.25)'
          }}>See More Projects</button>
        </div>
      </div>
    </div>
  );
};

const ProjectsView = ({ onNavigate }) => {
  const { data, isLoading, error } = useContentData();
  const [selectedTag, setSelectedTag] = useState('all');
  const [availableTags, setAvailableTags] = useState([]);

  // Load tags on mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await fetch('/api/tags');
        if (res.ok) {
          const tags = await res.json();
          setAvailableTags(tags);
        }
      } catch (e) {
        console.error('Failed to load tags:', e);
      }
    };
    loadTags();
  }, []);

  // Filter items by selected tag
  const items = useMemo(() => {
    if (selectedTag === 'all') return data;
    return data.filter(item => item.tags && item.tags.includes(selectedTag));
  }, [data, selectedTag]);

  // Deterministic hash to vary card sizes consistently per item
  const hashToFactor = (s) => {
    let h = 2166136261;
    for (let i = 0; i < String(s).length; i++) {
      h ^= String(s).charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return Math.abs(h % 1000) / 1000; // 0..1
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', margin: 0, padding: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');
        body { margin: 0; padding: 0; }
        * { box-sizing: border-box; }
      `}</style>
      
      {/* Navigation Bar */}
      <nav style={{ 
        background: 'linear-gradient(135deg, #447D9B 0%, #273F4F 100%)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        margin: 0,
        padding: 0
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem'
        }}>
          {/* Logo */}
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onNavigate && typeof onNavigate === 'function') {
                onNavigate('home');
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
              }
            }}
            style={{ 
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <img src={logoSvg} alt="Malloulinova" style={{ height: '40px', filter: 'brightness(0) invert(1)' }} />
          </div>
          
          {/* Page Title */}
          <h1 style={{
            margin: 0,
            color: 'white',
            fontWeight: 700,
            fontSize: '1.75rem',
            letterSpacing: '0.5px',
            fontFamily: 'Montserrat, Arial, sans-serif',
            textAlign: 'center',
            flex: 1
          }}>Projects & Case Studies</h1>
          
          {/* Back Button */}
          <button 
            type="button"
            className="back-home-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onNavigate && typeof onNavigate === 'function') {
                onNavigate('home');
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
              }
            }} 
            style={{ 
              padding: '0.6rem 1.2rem', 
              borderRadius: 999, 
              border: '1px solid rgba(255,255,255,0.3)', 
              background: 'rgba(255,255,255,0.1)', 
              color: 'white', 
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'Montserrat, Arial, sans-serif',
              fontWeight: 500,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="home-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="back-home-text">← Back to Home</span>
          </button>
        </div>
      </nav>
      
      {/* Content Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        {/* Tag Filter Buttons */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={() => setSelectedTag('all')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '999px',
              border: '2px solid',
              borderColor: selectedTag === 'all' ? '#447D9B' : '#e5e7eb',
              background: selectedTag === 'all' ? '#447D9B' : 'white',
              color: selectedTag === 'all' ? 'white' : '#273F4F',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}
          >
            All ({data.length})
          </button>
          {availableTags.map(tag => {
            const count = data.filter(item => item.tags && item.tags.includes(tag.id)).length;
            return (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '999px',
                  border: '2px solid',
                  borderColor: selectedTag === tag.id ? tag.color : '#e5e7eb',
                  background: selectedTag === tag.id ? tag.color : 'white',
                  color: selectedTag === tag.id ? 'white' : '#273F4F',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  fontFamily: 'Montserrat, Arial, sans-serif'
                }}
              >
                {tag.name} ({count})
              </button>
            );
          })}
        </div>
        <style>{`
          .back-home-text {
            display: inline;
          }
          .home-icon {
            display: none;
          }
          @media (max-width: 768px) {
            nav h1 {
              font-size: 1.25rem !important;
            }
          }
          @media (max-width: 640px) {
            .back-home-text {
              display: none;
            }
            .home-icon {
              display: block;
            }
            .back-home-btn {
              padding: 0.5rem !important;
              width: 40px !important;
              height: 40px !important;
              border-radius: 50% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              min-width: 40px !important;
              gap: 0 !important;
            }
            nav h1 {
              font-size: 1.1rem !important;
            }
          }
        }
        `}</style>
        {isLoading && <div style={{ textAlign: 'center', padding: '1rem' }}>Loading…</div>}
        {error && <div style={{ textAlign: 'center', color: '#ef4444' }}>{error}</div>}
        {!isLoading && !error && (
          <>
            <div className="projects-grid" style={{
              display: 'grid',
              gap: '1rem',
              width: '100%'
            }}>
              {items.map((item) => {
              const f = hashToFactor(item.id);
              const text = (item.fullBody || item.shortDescription || '').trim();
              const base = 100; // base characters
              const extra = Math.floor(f * 120); // smaller cards reveal less text
              const len = base + extra;
              const snippet = text.slice(0, len);
              // Varied heights for messy look: 240px to 360px range
                const minH = 240 + Math.floor(f * 120);
                return (
                  <div key={item.id} style={{
                    background: '#ffffff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 14, 
                    overflow: 'hidden',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.05)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    minHeight: minH,
                    width: '100%'
                  }}>
                    <div style={{ width: '100%', aspectRatio: '16 / 9', background: '#F1F5F9', flexShrink: 0 }}>
                      {item.thumbnailUrl && (
                        <img src={item.thumbnailUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      )}
                    </div>
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {item.tags.map(tagId => {
                            const tag = availableTags.find(t => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <span
                                key={tagId}
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  background: tag.color || '#447D9B',
                                  color: 'white',
                                  fontSize: '10px',
                                  fontWeight: '600'
                                }}
                              >
                                {tag.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <strong style={{ color: '#273F4F', display: 'block', marginBottom: 6, fontSize: '0.98rem' }}>{item.title}</strong>
                      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.55, marginTop: 'auto' }}>
                        {snippet}{text.length > len ? '… ' : ' '}
                        {text.length > 0 && (
                          <button onClick={() => onNavigate({ view: 'article', id: item.id })}
                            style={{ background: 'none', border: 'none', color: '#447D9B', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>read more…</button>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <style>{`
              .projects-grid { 
                grid-template-columns: 1fr !important;
                width: 100%;
              }
              @media (min-width: 640px) { 
                .projects-grid { 
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                } 
              }
              @media (min-width: 1024px) { 
                .projects-grid { 
                  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                } 
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  );
};

const DashboardView = () => {
  const { data } = useContentData();
  const [form, setForm] = useState({
    title: '', shortDescription: '', fullBody: '', thumbnailUrl: '', gallery: '', videos: ''
  });
  const [message, setMessage] = useState('');
  const [featuredIds, setFeaturedIds] = useState(data.filter(d=>d.isFeatured).slice(0,3).map(d=>d.id));

  const onPublish = () => {
    // simulate success
    setMessage('Article published (simulated). Form has been reset.');
    setForm({ title: '', shortDescription: '', fullBody: '', thumbnailUrl: '', gallery: '', videos: '' });
    setTimeout(()=>setMessage(''), 2000);
  };

  const onCancel = () => setForm({ title: '', shortDescription: '', fullBody: '', thumbnailUrl: '', gallery: '', videos: '' });

  const toggleFeatured = (id) => {
    setFeaturedIds(prev => {
      const has = prev.includes(id);
      if (has) return prev.filter(x=>x!==id);
      if (prev.length >= 3) return prev; // limit to 3
      return [...prev, id];
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.25rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Admin Dashboard</h2>
      {message && <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <input placeholder="Title" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        <textarea placeholder="Short Description" rows={3} value={form.shortDescription} onChange={e=>setForm({...form, shortDescription: e.target.value})} style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        <textarea placeholder="Main Article Body" rows={6} value={form.fullBody} onChange={e=>setForm({...form, fullBody: e.target.value})} style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        <input placeholder="Thumbnail URL (16:9)" value={form.thumbnailUrl} onChange={e=>setForm({...form, thumbnailUrl: e.target.value})} style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        <input placeholder="Gallery Photo URLs (comma-separated)" value={form.gallery} onChange={e=>setForm({...form, gallery: e.target.value})} style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        <input placeholder="Video URLs (comma-separated)" value={form.videos} onChange={e=>setForm({...form, videos: e.target.value})} style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onPublish} style={{ padding: '0.7rem 1.2rem', background: '#447D9B', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Publish Article</button>
          <button onClick={onCancel} style={{ padding: '0.7rem 1.2rem', background: '#e2e8f0', border: 'none', color: '#0f172a', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h3>Manage Featured Articles</h3>
        <p style={{ color: '#475569', marginTop: 0 }}>Select up to three articles to feature on Home.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {MOCK_PROJECT_DATA.map(item => (
            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem 0.6rem' }}>
              <input type="checkbox" checked={featuredIds.includes(item.id)} onChange={()=>toggleFeatured(item.id)} />
              <span style={{ fontSize: '0.95rem' }}>{item.id} — {item.title}</span>
            </label>
          ))}
        </div>
        {featuredIds.length > 3 && <div style={{ color: '#ef4444', marginTop: '0.5rem' }}>You can only select up to 3.</div>}
        {featuredIds.length <= 3 && <div style={{ color: '#16a34a', marginTop: '0.5rem' }}>Selection saved (simulated).</div>}
      </div>
    </div>
  );
};

// Wrapper components for routing
const HomeRoute = () => {
  const navigate = useNavigate();
  const handleNavigate = (destination) => {
    if (typeof destination === 'object' && destination.view === 'article') {
      navigate(`/projects/${destination.id}`);
    } else if (destination === 'projects') {
      navigate('/projects');
    } else {
      navigate('/');
    }
  };
  return <PublicSite onNavigate={handleNavigate} />;
};

const ProjectsRoute = () => {
  const navigate = useNavigate();
  const handleNavigate = (destination) => {
    if (typeof destination === 'object' && destination.view === 'article') {
      navigate(`/projects/${destination.id}`);
    } else if (destination === 'home') {
      navigate('/');
    } else {
      navigate('/projects');
    }
  };
  return <ProjectsView onNavigate={handleNavigate} />;
};

const ArticleRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleNavigate = (destination) => {
    if (typeof destination === 'object' && destination.view === 'article') {
      navigate(`/projects/${destination.id}`);
    } else if (destination === 'projects') {
      navigate('/projects');
    } else {
      navigate('/');
    }
  };
  return <ArticleView articleId={id} onNavigate={handleNavigate} />;
};

const AdminRoute = () => {
  const { user } = useUser();
  return user ? <MainDashboard /> : <AdminLogin onLoginSuccess={() => window.location.reload()} />;
};

const ContactRoute = () => {
  const navigate = useNavigate();
  return <Contact onNavigate={(path) => navigate(path)} />;
};

// Main App Component with proper URL routing
const AppRouter = () => {
  const { isAuthLoading } = useUser();
  const location = useLocation();

  return (
    <div className="app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/projects" element={<ProjectsRoute />} />
          <Route path="/projects/:id" element={<ArticleRoute />} />
          <Route path="/contact" element={<ContactRoute />} />
          <Route path="/admin" element={isAuthLoading ? <LoadingSpinner /> : <AdminRoute />} />
        </Routes>
      </main>

      {/* Footer removed per request */}
      
      {/* Chatbot Widget - Available on all pages except admin */}
      {location.pathname !== '/admin' && <ChatWidget />}
    </div>
  );
};

// Main App Component with User Provider and Router
const App = () => {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppRouter />
      </UserProvider>
    </BrowserRouter>
  );
};

export default App;