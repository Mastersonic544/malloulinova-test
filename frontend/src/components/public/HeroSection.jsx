import React from 'react';
import AnimatedLogo from '../AnimatedLogo.jsx';
// No background logos here (non-white background)

const HeroSection = ({ sectionId, lottieContainerRef, tnHover, setTnHover, tzHover, setTzHover, iotHover, setIotHover, countersRef, goToProjects }) => {
  return (
    <section id="hero" data-section-id={sectionId || 'hero'} className="section hero-section" style={{
      minHeight: '90vh',
      display: 'grid',
      gridTemplateColumns: '1.1fr 0.9fr',
      gridTemplateAreas: '"text visual"',
      gap: '2rem',
      alignItems: 'center',
      background: 'linear-gradient(180deg, #273F4F 0%, #447D9B 35%, #7FB0CE 55%, #ffffff 100%)',
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

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem', position: 'relative' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.9rem', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '999px' }}
            onMouseEnter={(e)=>{ setTnHover(true); e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.25)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={(e)=>{ setTnHover(false); e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
              <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 1 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span style={{ fontSize: '0.9rem', opacity: 0.95 }}>Tunisia-based</span>
          </div>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.9rem', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '999px' }}
            onMouseEnter={(e)=>{ setTzHover(true); e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.25)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={(e)=>{ setTzHover(false); e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span style={{ fontSize: '0.9rem', opacity: 0.95 }}>European Time Zone</span>
          </div>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.9rem', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '999px' }}
            onMouseEnter={(e)=>{ setIotHover(true); e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.25)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={(e)=>{ setIotHover(false); e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
            <span style={{ fontSize: '0.9rem', opacity: 0.95 }}>IoT Specialists</span>
          </div>

          <div
            onMouseEnter={()=> setTnHover(true)}
            onMouseLeave={()=> setTnHover(false)}
            style={{
              position: 'absolute',
              left: '55%',
              top: 'calc(100% + 8px)',
              transform: 'translateX(-50%)',
              width: 'min(820px, 92vw)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
              border: '1px solid rgba(255,255,255,0.22)',
              borderLeft: '3px solid #FE7743',
              borderRadius: '14px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
              padding: '1rem',
              zIndex: 2,
              pointerEvents: tnHover ? 'auto' : 'none',
              opacity: tnHover ? 1 : 0,
              transition: 'opacity .2s ease, transform .2s ease'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>
              {[
                'Cost-effective development without compromising quality',
                'Strong technical education and engineering expertise',
                'Perfect time zone alignment with European clients',
                'Cultural affinity and multilingual capabilities'
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '10px 12px' }}>
                  <span style={{ display: 'inline-flex', width: 8, height: 8, marginTop: 6, borderRadius: 999, background: '#FE7743', boxShadow: '0 0 0 3px rgba(254,119,67,0.25)' }} />
                  <span style={{ opacity: 0.96 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            onMouseEnter={()=> setTzHover(true)}
            onMouseLeave={()=> setTzHover(false)}
            style={{
              position: 'absolute',
              left: '45%',
              top: 'calc(100% + 8px)',
              transform: 'translateX(-50%)',
              width: 'min(820px, 92vw)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
              border: '1px solid rgba(255,255,255,0.22)',
              borderLeft: '3px solid #FE7743',
              borderRadius: '14px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
              padding: '1rem',
              zIndex: 2,
              pointerEvents: tzHover ? 'auto' : 'none',
              opacity: tzHover ? 1 : 0,
              transition: 'opacity .2s ease, transform .2s ease'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {[
                'We operate within standard European working hours (CET/CEST), eliminating late-night meetings.',
                'Decisions made in the morning are implemented by the afternoon, accelerating your project timeline.',
                'Our team functions as a natural, effortless extension of your in-house European team.',
                'Critical bugs are addressed during your active workday, minimizing delays and downtime.'
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '10px 12px' }}>
                  <span style={{ display: 'inline-flex', width: 8, height: 8, marginTop: 6, borderRadius: 999, background: '#FE7743', boxShadow: '0 0 0 3px rgba(254,119,67,0.25)' }} />
                  <span style={{ opacity: 0.96 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            onMouseEnter={()=> setIotHover(true)}
            onMouseLeave={()=> setIotHover(false)}
            style={{
              position: 'absolute',
              left: '50%',
              top: 'calc(100% + 8px)',
              transform: 'translateX(-50%)',
              width: 'min(820px, 92vw)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
              border: '1px solid rgba(255,255,255,0.22)',
              borderLeft: '3px solid #FE7743',
              borderRadius: '14px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
              padding: '1rem',
              zIndex: 2,
              pointerEvents: iotHover ? 'auto' : 'none',
              opacity: iotHover ? 1 : 0,
              transition: 'opacity .2s ease, transform .2s ease'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {[
                'Expertise spans embedded firmware, connectivity layers, cloud backend, and data analytics.',
                'We deliver complete, end-to-end solutions, not just isolated code modules.',
                'Deep experience in key verticals like Smart Cities, Industry 4.0, and Smart Farming.',
                'We excel at rapid prototyping and developing scalable Proofs of Concept (PoCs) efficiently.'
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '10px 12px' }}>
                  <span style={{ display: 'inline-flex', width: 8, height: 8, marginTop: 6, borderRadius: 999, background: '#FE7743', boxShadow: '0 0 0 3px rgba(254,119,67,0.25)' }} />
                  <span style={{ opacity: 0.96 }}>{t}</span>
                </div>
              ))}
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
              <div style={{ fontSize: '1rem', opacity: 0.8 }}>{item.label}</div>
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
