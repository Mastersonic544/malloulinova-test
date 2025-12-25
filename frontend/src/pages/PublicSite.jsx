import React, { useState, useEffect, useRef, useMemo } from 'react';
import machineAnimation from '../../../assets/lottie/machine_animation.json';
import contactAnimation from '../../../assets/lottie/contact_animation.json';
import FutureHeader from '../components/FutureHeader.jsx';
import AnimatedLogo from '../components/AnimatedLogo.jsx';

import { useContentData } from '../data/content.js';
import { submitContact } from '../services/connectorService.js';
import { trackPageView, trackClick, trackHover } from '../services/analyticsService.js';
import { fetchFaqs } from '../services/faqService.js';
import { fetchPartners } from '../services/partnerService.js';
import { fetchTeam } from '../services/teamService.js';
import PartnersSection from '../components/public/PartnersSection.jsx';
import TeamCarousel from '../components/public/TeamCarousel.jsx';
import FAQSection from '../components/public/FAQSection.jsx';
import ExpertiseSection from '../components/public/ExpertiseSection.jsx';
import HeroSection from '../components/public/HeroSection.jsx';
import TechnologiesSection from '../components/public/TechnologiesSection.jsx';
import KeyFeaturesSection from '../components/public/KeyFeaturesSection.jsx';
import cursorNormal from '../../../assets/images/cursor/cursorNormal.png';
import cursorSelect from '../../../assets/images/cursor/cursorSelect.png';
import { makeShortDescription } from '../utils/preview.js';

// Social icons for footer
const SocialIcon = ({ platform }) => {
  const icons = {
    LinkedIn: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    GitHub: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    Twitter: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    )
  };
  return icons[platform] || null;
};

// Simple placeholders (no animations or 3D libs)
const IoTMotionBox = ({ label }) => (
  <div style={{
    height: '150px',
    backgroundColor: '#E3F2FD',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    color: '#447D9B',
    fontWeight: 500
  }}>
    {label}
  </div>
);

// Ensure lottie-web script is available
const ensureLottieWeb = () => {
  if (!window.lottie) {
    const scriptId = 'lottie-web-script';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
      s.async = true;
      s.onerror = () => {
        // Fallback CDN
        const fallback = document.createElement('script');
        fallback.id = scriptId + '-fallback';
        fallback.src = 'https://unpkg.com/lottie-web@5.12.2/build/player/lottie.min.js';
        fallback.async = true;
        document.head.appendChild(fallback);
      };
      document.head.appendChild(s);
    }
  }
};

const PublicSite = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  // Contact form state
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cCompany, setCCompany] = useState('');
  const [cMessage, setCMessage] = useState('');
  const [cHoneypot, setCHoneypot] = useState('');
  const [cSending, setCSending] = useState(false);
  const [cSuccess, setCSuccess] = useState('');
  const [cError, setCError] = useState('');
  const lottieContainerRef = useRef(null); // hero
  const lottieInstanceRef = useRef(null);
  const contactLottieRef = useRef(null);
  const contactLottieInstRef = useRef(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [tnHover, setTnHover] = useState(false);
  const [tzHover, setTzHover] = useState(false);
  const [iotHover, setIotHover] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const glowRef = useRef(null);
  const glowAnimRef = useRef(0);
  const glowPosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const glowTargetRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const { data: articles } = useContentData();
  const countersRef = useRef([]);
  const countersStarted = useRef(false);
  const featured = useMemo(() => {
    const list = articles || [];
    const f = list.filter(a => a.isFeatured);
    return (f.length ? f : list).slice(0, 3);
  }, [articles]);
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(-1);
  const [partners, setPartners] = useState([]);
  const [team, setTeam] = useState([]);

  // Analytics tracking
  useEffect(() => {
    const handleScrollButton = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    handleScrollButton();
    window.addEventListener('scroll', handleScrollButton);
    return () => window.removeEventListener('scroll', handleScrollButton);
  }, []);

  useEffect(() => {
    // Track page view
    trackPageView(window.location.pathname, document.title);
    
    // Track clicks for heatmap
    const handleClick = (event) => {
      const target = event.target;
      // Only track interactive elements
      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') ||
        target.onclick ||
        target.style.cursor === 'pointer' ||
        target.classList.contains('clickable');
      
      if (isInteractive) {
        trackClick(event);
      }
    };
    
    // Add click listener
    document.addEventListener('click', handleClick, true);
    // Add hover/engagement listener (throttled inside trackHover)
    const handleHover = (e) => trackHover(e);
    window.addEventListener('mousemove', handleHover, { passive: true });
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('mousemove', handleHover);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchFaqs();
        if (mounted) setFaqs(Array.isArray(data) ? data : []);
      } catch (e) { console.error('Failed to load FAQs:', e); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchPartners();
        if (mounted) setPartners(Array.isArray(data) ? data.filter(p=>p.visible!==false) : []);
      } catch (e) { console.error('Failed to load partners:', e); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchTeam();
        if (mounted) setTeam(Array.isArray(data) ? data.filter(m=>m.visible!==false) : []);
      } catch (e) { console.error('Failed to load team:', e); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setIsVisible(true);
    ensureLottieWeb();
    // SEO: dynamic title & description for Home
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]') || (()=>{ const m=document.createElement('meta'); m.name='description'; document.head.appendChild(m); return m; })();
    document.title = 'Malloulinova – Embedded & IoT Consulting (WMBUS, LoRaWAN, MIOTY)';
    metaDesc.setAttribute('content', 'Embedded systems & IoT experts. WMBUS, LoRaWAN, MIOTY, embedded connectivity, IoT backends, cloud integrations. Reduce development costs by 40–60%.');
    // Inject Services ItemList JSON-LD
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'ld-services-itemlist';
    try {
      ld.textContent = JSON.stringify({
        '@context':'https://schema.org', '@type':'ItemList', itemListElement: [
          { '@type':'Service', name:'IoT Device Software' },
          { '@type':'Service', name:'Embedded Connectivity' },
          { '@type':'Service', name:'IoT Backend Development' },
          { '@type':'Service', name:'Prototyping & PoCs' }
        ]
      });
      // remove previous if exists
      const old = document.getElementById('ld-services-itemlist'); if (old) old.remove();
      document.head.appendChild(ld);
    } catch {}
    
    const handleScroll = () => {
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop < window.innerHeight - 100) {
          section.classList.add('visible');
        }
      });
      // Trigger counters when credibility bar enters viewport
      if (!countersStarted.current) {
        const cred = document.querySelector('.credibility-bar');
        if (cred) {
          const rect = cred.getBoundingClientRect();
          if (rect.top < window.innerHeight - 120) {
            countersStarted.current = true;
            const items = [
              { value: 50, suffix: '+' },
              { value: 8, suffix: '' },
              { value: 100, suffix: '%' },
            ];
            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
            const animate = (el, to, suffix = '', duration = 1200) => {
              let start = null;
              const from = 0;
              const step = (ts) => {
                if (!start) start = ts;
                const p = Math.min(1, (ts - start) / duration);
                const eased = easeOutCubic(p);
                const val = Math.round(from + (to - from) * eased);
                if (el) el.textContent = String(val) + suffix;
                if (p < 1) requestAnimationFrame(step);
              };
              requestAnimationFrame(step);
            };
            items.forEach((it, i) => {
              const el = countersRef.current[i];
              if (el) animate(el, it.value, it.suffix);
            });
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    const onMove = (e) => {
      const x = e.clientX || 0;
      const y = e.clientY || 0;
      glowTargetRef.current = { x, y };
      if (glowRef.current && glowRef.current.style.opacity !== '1') {
        glowRef.current.style.opacity = '1';
      }
      if (!glowAnimRef.current) {
        const step = () => {
          const el = glowRef.current;
          if (!el) { glowAnimRef.current = 0; return; }
          const p = glowPosRef.current;
          const t = glowTargetRef.current;
          // Lerp
          const nx = p.x + (t.x - p.x) * 0.25;
          const ny = p.y + (t.y - p.y) * 0.25;
          glowPosRef.current = { x: nx, y: ny };
          el.style.transform = `translate3d(${nx - 16}px, ${ny - 16}px, 0)`; // centered (32px)
          glowAnimRef.current = requestAnimationFrame(step);
        };
        glowAnimRef.current = requestAnimationFrame(step);
      }
    };
    const onEnter = () => { if (glowRef.current) glowRef.current.style.opacity = '1'; };
    const onLeave = () => { if (glowRef.current) glowRef.current.style.opacity = '0'; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseenter', onEnter);
    window.addEventListener('mouseleave', onLeave);
    
    // Initialize lottie-web when script is loaded
    const initLottie = () => {
      if (window.lottie && lottieContainerRef.current && !lottieInstanceRef.current) {
        lottieInstanceRef.current = window.lottie.loadAnimation({
          container: lottieContainerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: machineAnimation,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true }
        });
      }
      if (window.lottie && contactLottieRef.current && !contactLottieInstRef.current) {
        contactLottieInstRef.current = window.lottie.loadAnimation({
          container: contactLottieRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: contactAnimation,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true }
        });
      }
    };
    const interval = setInterval(() => {
      if (window.lottie) {
        clearInterval(interval);
        initLottie();
      }
    }, 50);
    setTimeout(() => clearInterval(interval), 5000);
    initLottie();
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('mouseleave', onLeave);
      document.title = prevTitle;
      const curLd = document.getElementById('ld-services-itemlist'); if (curLd) curLd.remove();
      if (lottieInstanceRef.current) {
        try { lottieInstanceRef.current.destroy(); } catch (_) {}
        lottieInstanceRef.current = null;
      }
      if (contactLottieInstRef.current) {
        try { contactLottieInstRef.current.destroy(); } catch (_) {}
        contactLottieInstRef.current = null;
      }
      if (glowAnimRef.current) cancelAnimationFrame(glowAnimRef.current);
    };
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goToProjects = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('projects');
    }
  };

  const goToArticle = (id) => {
    if (!id) return;
    if (typeof onNavigate === 'function') {
      onNavigate({ view: 'article', id });
    }
  };

  return (
    <div className="public-site" style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-in', fontFamily: 'Montserrat, Arial, sans-serif', color: '#273F4F' }}>
      <FutureHeader onNavigate={scrollToSection} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');
        body { margin: 0; }
        /* Cursor glow */
        .cursor-glow { position: fixed; top: 0; left: 0; width: 32px; height: 32px; pointer-events: none; z-index: 3000; opacity: 0; transition: opacity .2s ease; }
        .cursor-glow::before { content: ''; position: absolute; inset: -10px; border-radius: 999px; background: radial-gradient(closest-side, rgba(68,125,155,0.5), rgba(68,125,155,0) 70%); filter: blur(2px); box-shadow: 0 0 20px rgba(68,125,155,0.45); animation: cursorPulse 1.6s ease-in-out infinite; }
        @keyframes cursorPulse { 0% { transform: scale(0.95); opacity: .85; } 50% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(0.95); opacity: .85; } }
        @media (pointer: coarse) { .cursor-glow { display: none; } }
        @media (min-width: 1600px) {
          .section.projects-section > div {
            max-width: 1500px !important;
          }
          .section.projects-section h2 {
            font-size: 3rem !important;
          }
          .section.contact-section > div {
            max-width: 1500px !important;
          }
        }
      `}</style>

      <main style={{ paddingTop: '80px', margin: 0, overflowX: 'hidden', background: 'transparent' }}>
        {/* Subtle cursor glow follower */}
        <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '2rem',
              background: '#FE7743',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'background 0.3s, transform 0.3s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#E56A3A'}
            onMouseOut={(e) => e.currentTarget.style.background = '#FE7743'}
          >
            ↑
          </button>
        )}
        {/* Hero Section */}
        <HeroSection
          sectionId="hero"
          lottieContainerRef={lottieContainerRef}
          tnHover={tnHover}
          setTnHover={setTnHover}
          tzHover={tzHover}
          setTzHover={setTzHover}
          iotHover={iotHover}
          setIotHover={setIotHover}
          countersRef={countersRef}
          goToProjects={goToProjects}
        />

        {/* Contact success modal */}
        {contactModalOpen && (
          <div role="dialog" aria-modal="true" onClick={()=> setContactModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div onClick={(e)=> e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', width: 'min(92vw, 520px)', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <button onClick={()=> setContactModalOpen(false)} aria-label="Close" style={{ position: 'absolute', right: 18, top: 16, background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748B' }}>✕</button>
              <h3 style={{ marginTop: 0, color: '#273F4F' }}>Message sent!</h3>
              <p style={{ color: '#475569', marginBottom: 16 }}>Thanks for reaching out. We’ll get back to you within 2 business days.</p>
              <button onClick={()=> setContactModalOpen(false)} style={{ padding: '10px 16px', background: '#FE7743', color: '#fff', border: 'none', borderRadius: 999, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        )}

        {/* Features Section */}
        <KeyFeaturesSection sectionId="features" />

        {/* Services / Expertise Section */}
        <ExpertiseSection sectionId="services" />

        {/* Technologies & Protocols */}
        <TechnologiesSection sectionId="technologies" />

        {/* Projects Section */}
        <section id="projects" data-section-id="projects" className="section projects-section" style={{ padding: '5rem 0', background: '#fdfdfd' }}>
          <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Projects & Case Studies</h2>
              <p style={{ maxWidth: '720px', margin: '1.25rem auto 0', color: '#475569', fontSize: '1.05rem' }}>
                A snapshot of the IoT platforms, telemetry systems and embedded creations we have shipped for regulated industries across EMEA.
              </p>
            </div>

            <div className="projects-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {featured.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', borderRadius: 24, border: '1px dashed #cbd5f5', background: '#f8fafc', color: '#475569' }}>
                  No featured projects yet. Check back soon.
                </div>
              )}
              {featured.map((item) => (
                <article key={item.id} className="project-card" role="button" tabIndex={0} onClick={() => goToArticle(item.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goToArticle(item.id); }} style={{
                  background: '#fff',
                  borderRadius: 24,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer'
                }}>
                  <div style={{ width: '100%', aspectRatio: '16/9', background: '#e2e8f0' }}>
                    {item.thumbnailUrl && (
                      <img src={item.thumbnailUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
                    )}
                  </div>
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', letterSpacing: '1px' }}>{item.category || 'Case Study'}</span>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>{item.title}</h3>
                    <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{makeShortDescription(item.fullBody || item.body || '')}</p>
                    <button onClick={(e) => { e.stopPropagation(); goToArticle(item.id); }} style={{
                      marginTop: 'auto',
                      alignSelf: 'flex-start',
                      padding: '0.65rem 1.25rem',
                      borderRadius: 999,
                      border: '1px solid #cbd5f5',
                      background: 'transparent',
                      color: '#273F4F',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all .2s ease'
                    }}
                      onMouseEnter={(e)=>{ e.currentTarget.style.background = '#273F4F'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e)=>{ e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#273F4F'; }}
                    >View Details →</button>
                  </div>
                </article>
              ))}
            </div>

            <style>{`
              @media (max-width: 600px) {
                .projects-grid {
                  display: flex !important;
                  grid-template-columns: none !important;
                  gap: 1.25rem !important;
                  overflow-x: auto;
                  overflow-y: hidden;
                  scroll-snap-type: x mandatory;
                  -webkit-overflow-scrolling: touch;
                  padding: 0.25rem 0.25rem 0.75rem;
                  margin: 0 -0.25rem;
                }
                .projects-grid::-webkit-scrollbar { height: 8px; }
                .projects-grid::-webkit-scrollbar-thumb { background: rgba(39, 63, 79, 0.25); border-radius: 999px; }
                .project-card {
                  flex: 0 0 82%;
                  max-width: 82%;
                  scroll-snap-align: center;
                }
              }
            `}</style>

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button onClick={goToProjects} style={{
                padding: '0.85rem 2.5rem',
                borderRadius: 999,
                border: 'none',
                background: '#FE7743',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: '0 15px 30px rgba(254,119,67,0.3)',
                cursor: 'pointer'
              }}>See the full project library</button>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        {partners.length > 0 && (
          <PartnersSection sectionId="partners" partners={partners} />
        )}

        {/* Team Section */}
        {team.length > 0 && (
          <section id="team" data-section-id="team" className="section team-section" style={{ padding: '3.5rem 1.5rem', background: '#f8fafc' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2.6rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Our Team</h2>
              </div>
              <TeamCarousel sectionId="team" members={team} />
            </div>
          </section>
        )}

        {/* FAQs Section */}
        <FAQSection
          sectionId="faqs"
          faqs={faqs}
          openFaq={openFaq}
          setOpenFaq={setOpenFaq}
          scrollToSection={scrollToSection}
        />

        {/* Contact Section */}
        <section id="contact" data-section-id="contact" className="section contact-section" style={{
          padding: '6rem 2rem 6rem',
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          background: 'linear-gradient(135deg, #273F4F, #1a2a36)',
          color: '#fff'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem', alignItems: 'center' }}>
            <div className="contact-form" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: '2.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color: '#FE7743', fontWeight: 700, letterSpacing: '2px', marginBottom: '0.5rem' }}>CONTACT</p>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 700, margin: 0, marginBottom: '1rem' }}>Tell us about your roadmap</h2>
              <p style={{ opacity: 0.9, margin: 0, marginBottom: '1.25rem', color: '#cbd5f5' }}>We’ll get back to you in 2 business days.</p>
              {(cSuccess || cError) && (
                <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '10px', background: cSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${cSuccess ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`, color: '#fff' }}>
                  {cSuccess || cError}
                </div>
              )}
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (cSending) return;
                if (!cName.trim() || !cEmail.trim() || !cMessage.trim()) {
                  setCError('Please fill in your name, email, and message.');
                  setTimeout(() => setCError(''), 2500);
                  return;
                }
                setCSending(true);
                try {
                  await submitContact({ name: cName, email: cEmail, company: cCompany, message: cMessage, website: cHoneypot });
                  setContactModalOpen(true);
                  setCName(''); setCEmail(''); setCCompany(''); setCMessage('');
                  setCSuccess('Message sent! We will reply soon.');
                  setTimeout(() => setCSuccess(''), 2500);
                } catch (err) {
                  console.error('Contact submit failed:', err);
                  setCError('Failed to send your message. Please try again.');
                  setTimeout(() => setCError(''), 3000);
                } finally {
                  setCSending(false);
                }
              }} style={{ display: 'grid', gap: '12px', maxWidth: 640 }}>
                <div className="contact-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Your Name" style={{ padding: '12px 14px', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 12, background: '#fff', color: '#273F4F' }} />
                  <input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="Your Email" style={{ padding: '12px 14px', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 12, background: '#fff', color: '#273F4F' }} />
                </div>
                <input value={cCompany} onChange={(e) => setCCompany(e.target.value)} placeholder="Company (optional)" style={{ padding: '12px 14px', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 12, background: '#fff', color: '#273F4F' }} />
                {/* Honeypot */}
                <input value={cHoneypot} onChange={(e) => setCHoneypot(e.target.value)} placeholder="Website" style={{ display: 'none' }} />
                <textarea value={cMessage} onChange={(e) => setCMessage(e.target.value)} rows={6} placeholder="Tell us briefly about your project…" style={{ padding: '12px 14px', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 12, background: '#fff', color: '#273F4F', resize: 'vertical' }} />
                <div>
                  <button type="submit" disabled={cSending || !cName.trim() || !cEmail.trim() || !cMessage.trim()} style={{ padding: '12px 20px', background: '#FE7743', color: '#fff', border: 'none', borderRadius: 999, cursor: (cSending || !cName.trim() || !cEmail.trim() || !cMessage.trim()) ? 'not-allowed' : 'pointer', opacity: (cSending || !cName.trim() || !cEmail.trim() || !cMessage.trim()) ? 0.75 : 1 }}>
                    {cSending ? 'Sending…' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Contact Lottie */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div ref={contactLottieRef} className="contact-lottie" style={{ height: '360px', width: '100%', maxWidth: '520px' }} />
            </div>
          </div>

          <div style={{ maxWidth: '1400px', margin: '2.5rem auto 0', padding: '0 1rem' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, marginBottom: '1.2rem', color: '#FFFFFF' }}>Other ways to reach us</h3>
            <div className="contact-alt-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem'
            }}>
              {[
                { key: 'email', title: 'Email', value: 'info@malloulinova.com', href: 'mailto:info@malloulinova.com', icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#447D9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16v16H4z" fill="#FFFFFF" />
                    <path d="M22 6l-10 7L2 6" stroke="#447D9B" fill="none" />
                  </svg>
                ) },
                { key: 'phoneTN', title: 'Phone (Tunisia)', value: '+216 25 571 398', href: 'tel:+21625571398', icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#447D9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.31 1.77.57 2.61a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 7 7l.56-1.23a2 2 0 0 1 2.11-.45c.84.26 1.71.45 2.61.57A2 2 0 0 1 22 16.92z" fill="#FFFFFF" />
                  </svg>
                ) },
                { key: 'phoneDE', title: 'Phone (Germany)', value: '+49 177 833 4621', href: 'tel:+491778334621', icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#447D9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.31 1.77.57 2.61a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 7 7l.56-1.23a2 2 0 0 1 2.11-.45c.84.26 1.71.45 2.61.57A2 2 0 0 1 22 16.92z" fill="#FFFFFF" />
                  </svg>
                ) },
                { key: 'address', title: 'Address', value: 'Route Lafrane Km 4\nSfax, Tunisia', href: 'https://www.google.com/maps/search/?api=1&query=Route%20Lafrane%20Km%204%2C%20Sfax%2C%20Tunisia', icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#447D9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z" fill="#FFFFFF" />
                    <circle cx="12" cy="10" r="3" stroke="#447D9B" />
                  </svg>
                ) },
              ].map((item) => (
                <a key={item.key} href={item.href} target={item.key === 'address' ? '_blank' : undefined} rel={item.key === 'address' ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '1rem',
                    background: '#FFFFFF',
                    color: '#273F4F',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.3)',
                    textDecoration: 'none',
                    boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                    transition: 'transform .25s ease, box-shadow .25s ease, background .25s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.14)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: '#EEF5FA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#447D9B' }}>
                      {item.icon}
                    </div>
                    <div style={{ fontWeight: 700 }}>{item.title}</div>
                  </div>
                  <div style={{ whiteSpace: 'pre-line', color: '#475569' }}>{item.value}</div>
                </a>
              ))}
            </div>
          </div>

          <style>{`
            @media (max-width: 900px) {
              #contact > div {
                grid-template-columns: 1fr !important;
                text-align: center;
                justify-items: center;
                align-items: center;
              }
              #contact .contact-form {
                margin: 0 auto;
                width: 100%;
                max-width: 480px;
                padding: 0 12px;
              }
              #contact .contact-form form { width: 100%; }
              #contact .contact-form h2,
              #contact .contact-form p { text-align: center; }
              #contact .contact-row { grid-template-columns: 1fr !important; }
              #contact .contact-lottie { height: 280px !important; max-width: 420px !important; margin: 0 auto; display: block; }
              #contact button[type="submit"] { width: 100%; }
              #contact .contact-alt-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>

      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#273F4F',
        color: 'white',
        padding: '4rem 2rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="footer-logo" style={{ marginBottom: '2rem' }}>
            <svg width="220" height="50" viewBox="0 0 220 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Malloulinova">
              <g id="logomark">
                <path d="M12 11L22 6L32 11L32 23L22 28L12 23Z" stroke="#447D9B" strokeWidth="3.5" fill="none"/>
                <circle cx="22" cy="17" r="3" fill="#FE7743"/>
              </g>
              <g id="wordmark">
                <text x="45" y="22" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="700" fill="#FFFFFF">
                  MALLOULINOVA
                </text>
                <text x="45" y="35" fontFamily="Arial, Helvetica, sans-serif" fontSize="8" fontWeight="400" fill="#FFFFFF" opacity="0.8">
                  EMBEDDED SYSTEMS &amp; IoT SOLUTIONS
                </text>
              </g>
            </svg>
          </div>
          
          <div className="footer-content" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '3rem',
            marginBottom: '2rem'
          }}>
            <div>
              <h4 style={{ marginBottom: '1.5rem', color: '#FE7743', fontSize: '1.2rem' }}>Contact</h4>
              <p style={{ opacity: 0.8, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📧 info@malloulinova.com
              </p>
              <p style={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 📞 +216 (25) 571 398
              </p>
            </div>
            
            <div>
              <h4 style={{ marginBottom: '1.5rem', color: '#FE7743', fontSize: '1.2rem' }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {['Home', 'Expertise', 'Projects', 'Contact'].map((link) => (
                  <button
                    key={link}
                    onClick={() => scrollToSection(link.toLowerCase())}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      opacity: 0.8,
                      transition: 'all 0.3s ease',
                      textAlign: 'left',
                      padding: '0.3rem 0',
                      fontSize: '1rem'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = '1';
                      e.target.style.transform = 'translateX(5px)';
                      e.target.style.color = '#FE7743';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '0.8';
                      e.target.style.transform = 'translateX(0)';
                      e.target.style.color = 'white';
                    }}
                  >
                    → {link}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 style={{ marginBottom: '1.5rem', color: '#FE7743', fontSize: '1.2rem' }}>Follow Us</h4>
              <div className="footer-follow" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { platform: 'LinkedIn', url: 'https://linkedin.com/company/malloulinova' },
                  { platform: 'GitHub', url: 'https://github.com/malloulinova' },
                  { platform: 'Twitter', url: 'https://twitter.com/malloulinova' }
                ].map((item, index) => (
                  <a
                    key={index}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.6rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      width: '40px',
                      height: '40px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#FE7743';
                      e.target.style.color = '#FFFFFF';
                      e.target.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.color = '#FFFFFF';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <SocialIcon platform={item.platform} />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 style={{ marginBottom: '1.5rem', color: '#FE7743', fontSize: '1.2rem' }}>Legal</h4>
              <p style={{ opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.6' }}>
                <span style={{ opacity: 0.6 }}>
                  Privacy Policy | Terms of Service
                </span>
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
         @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');
         
         html, body { margin: 0; padding: 0; overflow-x: hidden; }
         body { background: #ffffff; }
         .public-site { margin: 0; }
         .hero-section { padding-left: 0 !important; padding-right: 0 !important; opacity: 1 !important; transform: none !important; }
         .features { padding-left: 0 !important; padding-right: 0 !important; opacity: 1 !important; transform: none !important; }

         * {
           font-family: 'Montserrat', sans-serif;
         }
         
         .section { transition: all 0.6s ease; }
         
         .section.visible {
           opacity: 1;
           transform: translateY(0);
         }
         
         /* Creative shapes and decorative elements */
         .hero-section::before {
           content: '';
           position: absolute;
           top: 20%;
           right: 10%;
           width: 200px;
           height: 200px;
           background: linear-gradient(45deg, rgba(254, 119, 67, 0.1), rgba(68, 125, 155, 0.1));
           border-radius: 50%;
           z-index: 0;
         }
         
         .hero-section::after {
           content: '';
           position: absolute;
           bottom: 10%;
           left: 5%;
           width: 100px;
           height: 100px;
           background: linear-gradient(135deg, rgba(254, 119, 67, 0.08), rgba(39, 63, 79, 0.08));
           border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
           z-index: 0;
         }
         
         .expertise-section::before {
          content: '';
          position: absolute;
          top: 50px;
          left: 5%;
          width: 80px;
          height: 80px;
          background: linear-gradient(45deg, rgba(254, 119, 67, 0.08), rgba(68, 125, 155, 0.08));
          border-radius: 20px;
          transform: rotate(45deg);
          z-index: 0;
        }
        
        @media (max-width: 768px) {
           .header {
            padding: 1rem;
          }
          
          .navigation {
            display: none !important;
          }
          
          .hero-section {
            display: grid !important;
            grid-template-columns: 1fr !important;
            grid-template-areas:
              'visual'
              'text' !important;
          }
          .hero-visual { margin-bottom: 1rem; }
          
          .hero-content h1 {
            font-size: 2.5rem !important;
          }
           
           .founder-section > div {
             grid-template-columns: 1fr !important;
             gap: 2rem !important;
           }
           .hero-section::before,
           .hero-section::after,
           .expertise-section::before,
           .founder-section::after {
             display: none;
           }
         }
         
        /* Ultra-wide helpers */
        @media (min-width: 1600px) {
          .projects-section > div { max-width: 1400px !important; }
          #team > h2, #team > div { max-width: 1400px !important; margin-left: auto; margin-right: auto; }
        }
        @media (min-width: 1920px) {
          .projects-section > div { max-width: 1560px !important; }
          #team > h2, #team > div { max-width: 1560px !important; }
        }
       `}</style>
    </div>
  );
};

export default PublicSite;