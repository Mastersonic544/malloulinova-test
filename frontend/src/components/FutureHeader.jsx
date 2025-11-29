import React, { useState } from 'react';
import logoUrl from '../../../assets/images/logo.svg';

const FutureHeader = ({ onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { id: 'hero', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'founder', label: 'About Us' },
    { id: 'contact', label: 'Contact Us' }
  ];

  const go = (id) => {
    if (typeof onNavigate === 'function') onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <header className="mn-header" style={{ position: 'fixed', insetInline: 0, top: 0, zIndex: 1050, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e5e7eb' }}>
      <div className="mn-header-shell" style={{ position: 'relative', margin: '0 auto', maxWidth: '1200px', padding: '0 16px' }}>
        {/* Row: left logo, center pill, right CTA */}
        <div className="mn-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
          {/* Left: Logo */}
          <div className="mn-header-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px' }}>
            <img src={logoUrl} alt="Malloulinova" style={{ height: '60px', width: 'auto', userSelect: 'none' }} />
          </div>

          {/* Center: pill menu (desktop) */}
          <div className="__hdr-center" style={{ display: 'none', flex: 1, justifyContent: 'center' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 8px 30px rgba(39,63,79,0.12)', border: '1px solid rgba(68,125,155,0.2)', padding: '8px 10px' }}>
              {nav.map((item) => (
                <button
                  key={item.label}
                  className="__hdr-link"
                  onClick={() => go(item.id)}
                  style={{ padding: '10px 18px', borderRadius: '999px', fontSize: '16px', fontWeight: 700, color: '#273F4F', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e)=>{ e.currentTarget.style.background = '#EEF5FA'; e.currentTarget.style.color = '#447D9B'; }}
                  onMouseLeave={(e)=>{ e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#273F4F'; }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right: CTA + Hamburger (mobile) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => window.open('https://dontshift.zohobookings.com/', '_blank', 'noopener,noreferrer')}
              style={{ display: 'none', alignItems: 'center', borderRadius: '12px', border: '2px solid #447D9B', color: '#447D9B', padding: '10px 16px', fontSize: '16px', fontWeight: 700, background: 'transparent', cursor: 'pointer' }}
              className="__hdr-cta"
              onMouseEnter={(e)=>{ e.currentTarget.style.background = '#447D9B'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e)=>{ e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#447D9B'; }}
            >
              Let's Talk!
            </button>
            <button onClick={() => setMenuOpen((v)=>!v)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '44px', width: '44px', borderRadius: '10px', border: '1px solid #cbd5e1', color: '#273F4F', background: 'white', cursor: 'pointer' }} className="__hdr-burger" aria-expanded={menuOpen} aria-controls="mobile-nav">
              <span style={{ position: 'absolute', left: '-9999px' }}>{menuOpen ? 'Close menu' : 'Open menu'}</span>
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ height: '20px', width: '20px' }}>
                  <path d="M6.225 4.811a1 1 0 011.414 0L12 9.172l4.361-4.361a1 1 0 111.414 1.414L13.414 10.586l4.361 4.361a1 1 0 01-1.414 1.414L12 12l-4.361 4.361a1 1 0 01-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 010-1.414z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ height: '20px', width: '20px' }}>
                  <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 0 1 4.5 6h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile side drawer */}
        {/* Overlay (animated) */}
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? 'auto' : 'none', transition: 'opacity .25s ease' }} onClick={() => setMenuOpen(false)} />

        {/* Drawer with slide animation */}
        <aside role="dialog" aria-modal="true" id="mobile-nav" style={{
          position: 'fixed', top: 0, right: 0, height: '100vh', width: '80vw', maxWidth: '320px',
          background: '#0f172a', color: '#E2E8F0', boxShadow: '-16px 0 40px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column', padding: '20px 16px', gap: '8px',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .28s ease'
        }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={logoUrl} alt="Malloulinova" style={{ height: '28px' }} />
                  <strong style={{ letterSpacing: '0.5px' }}>Menu</strong>
                </div>
                <button onClick={() => setMenuOpen(false)} style={{ background: 'transparent', border: '1px solid #334155', color: '#E2E8F0', height: '36px', width: '36px', borderRadius: '10px', cursor: 'pointer' }}>×</button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {nav.map((item) => (
                  <button key={item.label} onClick={() => go(item.id)} style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: '10px', background: 'transparent', border: '1px solid #1f2937',
                    color: '#E2E8F0', fontSize: '15px', fontWeight: 600, cursor: 'pointer'
                  }}
                  onMouseEnter={(e)=>{ e.currentTarget.style.background = '#111827'; }}
                  onMouseLeave={(e)=>{ e.currentTarget.style.background = 'transparent'; }}
                  >{item.label}</button>
                ))}
              </nav>

              <div style={{ marginTop: 'auto' }}>
                <button onClick={() => window.open('https://dontshift.zohobookings.com/', '_blank', 'noopener,noreferrer')} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #447D9B', color: '#E2E8F0', background: 'transparent', fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={(e)=>{ e.currentTarget.style.background = '#1e293b'; }}
                onMouseLeave={(e)=>{ e.currentTarget.style.background = 'transparent'; }}>
                  Let's Talk!
                </button>
              </div>
        </aside>
      </div>

      {/* Scoped CSS for responsive behavior */}
      <style>{`
        @media (min-width: 768px) {
          .__hdr-center { display: flex !important; }
          .__hdr-cta { display: inline-flex !important; }
          .__hdr-burger { display: none !important; }
          .__hdr-mobile { display: none !important; }
        }
        @media (min-width: 1600px) {
          .mn-header-shell {
            max-width: 1800px !important;
            padding-inline: 32px !important;
          }
          .mn-header-logo img {
            height: 72px !important;
          }
          .mn-header-row {
            padding-block: 18px !important;
          }
          .mn-header .__hdr-center nav {
            padding: 10px 14px !important;
            box-shadow: 0 10px 40px rgba(39,63,79,0.18) !important;
          }
          .mn-header .__hdr-center .__hdr-link {
            font-size: 18px !important;
            padding: 12px 22px !important;
          }
          .mn-header .__hdr-cta {
            font-size: 17px !important;
            padding: 12px 22px !important;
            border-radius: 999px !important;
          }
        }
      `}</style>
    </header>
  );
};

export default FutureHeader;
