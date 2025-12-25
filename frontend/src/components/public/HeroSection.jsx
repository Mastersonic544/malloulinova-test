import React, { useEffect, useMemo, useState } from 'react';
import AnimatedLogo from '../AnimatedLogo.jsx';
// No background logos here (non-white background)

const HeroSection = ({ sectionId, lottieContainerRef, countersRef, goToProjects }) => {
  const [activeInfo, setActiveInfo] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!activeInfo) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setActiveInfo(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeInfo]);

  const infoItems = useMemo(() => ([
    {
      key: 'tn',
      label: 'Tunisia-based',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
          <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 1 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      ),
      title: 'Tunisia-based team, global delivery',
      subtitle: 'A cost-effective engineering hub with strong expertise and smooth collaboration with Europe.',
      bullets: [
        'Cost-effective development without compromising quality',
        'Strong technical education and engineering expertise',
        'Perfect time zone alignment with European clients',
        'Cultural affinity and multilingual capabilities'
      ]
    },
    {
      key: 'tz',
      label: 'European Time Zone',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      title: 'Workdays aligned with Europe',
      subtitle: 'Fewer delays, fewer late meetings, and faster iteration cycles for European teams.',
      bullets: [
        'We operate within standard European working hours (CET/CEST), eliminating late-night meetings.',
        'Decisions made in the morning are implemented by the afternoon, accelerating your project timeline.',
        'Our team functions as a natural, effortless extension of your in-house European team.',
        'Critical bugs are addressed during your active workday, minimizing delays and downtime.'
      ]
    },
    {
      key: 'iot',
      label: 'IoT Specialists',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
          <path d="M18 6L6 18"></path>
          <path d="M6 6l12 12"></path>
        </svg>
      ),
      title: 'End-to-end embedded + IoT expertise',
      subtitle: 'From firmware to connectivity, cloud, and scalable PoCs—delivered as complete solutions.',
      bullets: [
        'Expertise spans embedded firmware, connectivity layers, cloud backend, and data analytics.',
        'We deliver complete, end-to-end solutions, not just isolated code modules.',
        'Deep experience in key verticals like Smart Cities, Industry 4.0, and Smart Farming.',
        'We excel at rapid prototyping and developing scalable Proofs of Concept (PoCs) efficiently.'
      ]
    }
  ]), []);

  const active = activeInfo ? infoItems.find((x) => x.key === activeInfo) : null;

  return (
    <section id="hero" data-section-id={sectionId || 'hero'} className="section hero-section" style={{
      minHeight: '90vh',
      display: 'grid',
      gridTemplateColumns: '1.1fr 0.9fr',
      gridTemplateAreas: '"text visual"',
      gap: '2rem',
      alignItems: 'center',
      background: 'linear-gradient(180deg, #273F4F 0%, #447D9B 35%, #7FB0CE 60%, #ffffff 100%)',
      color: 'white',
      padding: 0,
      paddingBottom: '1.5rem',
      margin: 0,
      width: '100vw',
      marginLeft: 'calc(50% - 50vw)',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style jsx>{`
        /* Waterfall animation for falling brand marks */
        @keyframes mn-fall {
          0% { transform: translateY(-20%); opacity: 0.25; }
          85% { opacity: 0.15; }
          100% { transform: translateY(130%); opacity: 0; }
        }
        /* gentle fog at bottom for a soft fade into white */
        .mn-hero-bottom-fade {
          position: absolute; inset: auto 0 0 0; height: 22%;
          background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 55%, #ffffff 100%);
          pointer-events: none; z-index: 0;
        }

        .mn-hero-info {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }
        .mn-info-btn {
          -webkit-tap-highlight-color: transparent;
          appearance: none;
          border: 1px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.08);
          color: #fff;
          border-radius: 999px;
          padding: 0.55rem 0.95rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
          transition:
            transform 160ms ease,
            background-color 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease;
          box-shadow: 0 0 0 rgba(0,0,0,0);
        }
        .mn-info-btn:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.34);
          transform: translateY(-1px);
          box-shadow: 0 10px 26px rgba(0,0,0,0.22);
        }
        .mn-info-btn:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 6px 16px rgba(0,0,0,0.18);
        }
        .mn-info-btn:focus-visible {
          outline: 3px solid rgba(254,119,67,0.45);
          outline-offset: 3px;
        }

        .mn-info-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          z-index: 2000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 180ms ease;
        }
        .mn-info-overlay[data-open='true'] {
          opacity: 1;
          pointer-events: auto;
        }
        .mn-info-card {
          width: min(720px, 92vw);
          background: #ffffff;
          color: #0f172a;
          border-radius: 18px;
          border: 1px solid rgba(68,125,155,0.25);
          box-shadow: 0 22px 60px rgba(0,0,0,0.35);
          transform: translateY(10px) scale(0.985);
          transition: transform 180ms ease;
          overflow: hidden;
        }
        .mn-info-overlay[data-open='true'] .mn-info-card {
          transform: translateY(0) scale(1);
        }
        .mn-info-card__top {
          position: relative;
          padding: 18px 18px 14px;
          background: linear-gradient(180deg, rgba(39,63,79,0.08) 0%, rgba(68,125,155,0.06) 100%);
          border-bottom: 1px solid rgba(68,125,155,0.18);
        }
        .mn-info-close {
          position: absolute;
          top: 12px;
          right: 12px;
          height: 36px;
          width: 36px;
          border-radius: 12px;
          border: 1px solid rgba(15,23,42,0.12);
          background: #ffffff;
          color: #0f172a;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
        }
        .mn-info-close:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(15,23,42,0.12);
        }
        .mn-info-close:active {
          transform: scale(0.98);
        }
        .mn-info-card__body {
          padding: 16px 18px 18px;
        }
        .mn-info-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: #273F4F;
          padding-right: 44px;
        }
        .mn-info-subtitle {
          margin: 8px 0 0;
          color: #334155;
          line-height: 1.55;
          font-size: 0.98rem;
        }
        .mn-info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }
        .mn-info-pill {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 12px;
          border-radius: 14px;
          background: #EDF5FA;
          border: 1px solid rgba(68,125,155,0.18);
          color: #0f172a;
          line-height: 1.4;
          font-size: 0.95rem;
        }
        .mn-info-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          margin-top: 5px;
          background: #FE7743;
          box-shadow: 0 0 0 4px rgba(254,119,67,0.18);
          flex: 0 0 auto;
        }
        @media (max-width: 700px) {
          .mn-info-grid { grid-template-columns: 1fr; }
          .mn-info-card { width: min(560px, 94vw); }
        }
        @media (min-width: 1600px) {
          .hero-section {
            min-height: 100vh;
            padding-inline: 4rem;
          }
          .hero-section .hero-content h1 {
            font-size: 3.1rem !important;
          }
          .hero-section .hero-content p {
            font-size: 1.15rem !important;
            max-width: 720px;
          }
        }
      `}</style>

      {/* Waterfall background (behind content) */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* More variety in size and rotation/randomization */}
        <AnimatedLogo className="mn-hide-sm" size={72}  initialRotate={15}  spinDuration={26} spinDirection="reverse" spinDelay="0.2s" style={{ left: '5%', top: '-18%', animation: 'mn-fall 12s linear infinite', animationDelay: '0.5s' }} />
        <AnimatedLogo className="mn-hide-sm" size={128} initialRotate={210} spinDuration={24} spinDirection="normal"  spinDelay="1.1s" style={{ left: '13%', top: '-12%', animation: 'mn-fall 13s linear infinite', animationDelay: '1.1s' }} />
        <AnimatedLogo className="mn-hide-sm" size={94}  initialRotate={330} spinDuration={22} spinDirection="reverse" spinDelay="2.3s" style={{ left: '22%', top: '-22%', animation: 'mn-fall 11.5s linear infinite', animationDelay: '2.3s' }} />
        <AnimatedLogo className="mn-hide-sm" size={140} initialRotate={45}  spinDuration={28} spinDirection="normal"  spinDelay="0.6s" style={{ left: '35%', top: '-16%', animation: 'mn-fall 14s linear infinite', animationDelay: '0.6s' }} />
        <AnimatedLogo className="mn-hide-sm" size={80}  initialRotate={275} spinDuration={23} spinDirection="reverse" spinDelay="1.8s" style={{ left: '44%', top: '-20%', animation: 'mn-fall 12.8s linear infinite', animationDelay: '1.8s' }} />
        <AnimatedLogo className="mn-hide-sm" size={116} initialRotate={120} spinDuration={25} spinDirection="normal"  spinDelay="0.9s" style={{ left: '56%', top: '-14%', animation: 'mn-fall 13.4s linear infinite', animationDelay: '0.9s' }} />
        <AnimatedLogo className="mn-hide-sm" size={88}  initialRotate={30}  spinDuration={21} spinDirection="reverse" spinDelay="2.9s" style={{ left: '66%', top: '-24%', animation: 'mn-fall 11.2s linear infinite', animationDelay: '2.9s' }} />
        <AnimatedLogo className="mn-hide-sm" size={150} initialRotate={300} spinDuration={30} spinDirection="normal"  spinDelay="1.4s" style={{ left: '76%', top: '-18%', animation: 'mn-fall 15s linear infinite', animationDelay: '1.4s' }} />
        <AnimatedLogo className="mn-hide-sm" size={70}  initialRotate={200} spinDuration={19} spinDirection="reverse" spinDelay="3.2s" style={{ left: '86%', top: '-26%', animation: 'mn-fall 10.6s linear infinite', animationDelay: '3.2s' }} />
        <AnimatedLogo className="mn-hide-sm" size={132} initialRotate={95}  spinDuration={27} spinDirection="normal"  spinDelay="0.3s" style={{ left: '93%', top: '-22%', animation: 'mn-fall 14.2s linear infinite', animationDelay: '0.3s' }} />
      </div>
      <div className="mn-hero-bottom-fade" />
      {/* RHS Lottie (first in DOM for mobile to appear on top) */}
      <div className="hero-visual" style={{ gridArea: 'visual', width: '100%', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <div ref={lottieContainerRef} style={{ height: '384px', width: '100%', maxWidth: '520px' }} />
      </div>

      <div className="hero-content" style={{ gridArea: 'text', maxWidth: '750px', position: 'relative', zIndex: 1, textAlign: 'center', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '2.75rem', 
          fontWeight: '700', 
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #FE7743, #FF9D6C)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2
        }}>
          Embedded Systems & IoT Experts
        </h1>
        <p style={{ 
          fontSize: '1.05rem', 
          marginBottom: '1.25rem', 
          opacity: 0.92,
          fontWeight: 400,
          lineHeight: 1.65,
          maxWidth: '680px',
          margin: '0 auto 1.25rem'
        }}>
          Reduce development costs by 40-60% with our expertise in embedded connectivity (WMBUS, LoRaWAN, MIOTY) and IoT ecosystems.
        </p>

        <div className="mn-hero-info">
          {infoItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className="mn-info-btn"
              onClick={() => setActiveInfo(item.key)}
              aria-haspopup="dialog"
              aria-expanded={activeInfo === item.key}
            >
              {item.icon}
              <span style={{ fontSize: '0.9rem', opacity: 0.95, fontWeight: 650 }}>{item.label}</span>
            </button>
          ))}
        </div>

        <div
          className="mn-info-overlay"
          data-open={active ? 'true' : 'false'}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActiveInfo(null);
          }}
          role="dialog"
          aria-modal={active ? 'true' : 'false'}
          aria-hidden={active ? 'false' : 'true'}
        >
          <div className="mn-info-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="mn-info-card__top">
              <button
                type="button"
                className="mn-info-close"
                onClick={() => setActiveInfo(null)}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <h3 className="mn-info-title">{active ? active.title : ''}</h3>
              <p className="mn-info-subtitle">{active ? active.subtitle : ''}</p>
            </div>
            <div className="mn-info-card__body">
              <div className="mn-info-grid">
                {(active?.bullets || []).map((t, i) => (
                  <div key={i} className="mn-info-pill">
                    <span className="mn-info-dot" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              {isMobile ? null : null}
            </div>
          </div>
        </div>

        <div className="credibility-bar" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          {[
            { value: 50, suffix: '+', label: 'Projects Delivered' },
            { value: 8, suffix: '', label: 'Years Specialization' },
            { value: 100, suffix: '%', label: 'Client Satisfaction' }
          ].map((item, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#FE7743' }}>
                <span ref={(el)=> { if (countersRef) countersRef.current[index] = el; }}>0{item.suffix}</span>
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.86, textShadow: '0 2px 10px rgba(15,23,42,0.45)' }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div className="cta-buttons" style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          <button
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#FE7743', color: 'white', border: 'none', borderRadius: '50px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(254, 119, 67, 0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            onClick={() => window.open('https://dontshift.zohobookings.com/', '_blank', 'noopener,noreferrer')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Schedule Consultation
          </button>
          <button
            style={{ padding: '0.75rem 1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '2px solid rgba(255, 255, 255, 0.3)', borderRadius: '50px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            onClick={goToProjects}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            View Case Studies
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
