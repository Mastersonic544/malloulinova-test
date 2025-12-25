import React, { useEffect, useRef, useState } from 'react';

const SocialIcon = ({ platform }) => {
  const icons = {
    LinkedIn: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    )
  };
  return icons[platform] || null;
};

const TeamCarousel = ({ sectionId, members }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const viewportRef = useRef(null);

  const teamMembers = (Array.isArray(members) && members.length > 0 ? members.map(m => ({
    name: m.name,
    title: m.title,
    image: m.image_url,
    bio: m.bio,
    linkedin: m.linkedin
  })) : []);

  useEffect(() => {
    if (isHovering) return;
    const interval = setInterval(() => setActiveIndex((prev) => (prev + 1) % teamMembers.length), 5000);
    return () => clearInterval(interval);
  }, [teamMembers.length, isHovering]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      try {
        setIsMobile(window.innerWidth <= 900);
      } catch {
        setIsMobile(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const el = viewportRef.current;
    if (!el) return;
    const w = el.clientWidth || 0;
    el.scrollTo({ left: activeIndex * w, behavior: 'smooth' });
  }, [activeIndex, isMobile]);

  useEffect(() => {
    if (!isMobile) return;
    const el = viewportRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth || 1;
        const idx = Math.round(el.scrollLeft / w);
        if (idx !== activeIndex) setActiveIndex(idx);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
    };
  }, [activeIndex, isMobile]);

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % teamMembers.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);

  if (!teamMembers.length) return null;

  return (
    <div data-section-id={sectionId || 'team'} style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      <div ref={viewportRef} className="carousel-viewport" style={{ overflow: 'hidden', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)' }}>
        <div className="carousel-inner" style={{ display: 'flex', transition: isMobile ? 'none' : 'transform 0.5s ease-in-out', transform: isMobile ? 'none' : `translateX(-${activeIndex * 100}%)` }}>
          {teamMembers.map((member, index) => (
            <div key={index} className="carousel-slide" style={{ minWidth: '100%', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '4rem', alignItems: 'center', background: '#EDF5FA', padding: '4rem' }}>
              <img src={member.image} alt={member.name} className="carousel-image" style={{ width: '100%', borderRadius: '15px', objectFit: 'cover', height: '400px' }} />
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#273F4F', marginBottom: '1rem' }}>{member.name}</h3>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#447D9B', marginBottom: '1.5rem' }}>{member.title}</h4>
                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#4A4A4A', marginBottom: '2rem' }}>{member.bio}</p>
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#273F4F', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '600', padding: '0.8rem 1.5rem', border: '2px solid #447D9B', borderRadius: '50px', transition: 'all 0.3s ease', background: 'transparent' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#447D9B'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#273F4F'; }}
                >
                  <SocialIcon platform="LinkedIn" />
                  LinkedIn
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={prevSlide} style={{ position: 'absolute', top: '50%', left: '-20px', transform: 'translateY(-50%)', background: '#447D9B', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', fontSize: '24px', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', transition: 'background 0.3s, transform 0.3s' }}
        onMouseOver={(e) => { e.currentTarget.style.background = '#273F4F'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = '#447D9B'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
      >
        ‹
      </button>
      <button onClick={nextSlide} style={{ position: 'absolute', top: '50%', right: '-20px', transform: 'translateY(-50%)', background: '#447D9B', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', fontSize: '24px', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', transition: 'background 0.3s, transform 0.3s' }}
        onMouseOver={(e) => { e.currentTarget.style.background = '#273F4F'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = '#447D9B'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
      >
        ›
      </button>
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        {teamMembers.map((_, index) => (
          <span key={index} onClick={() => setActiveIndex(index)} style={{ height: '12px', width: '12px', margin: '0 5px', backgroundColor: activeIndex === index ? '#447D9B' : '#bbb', borderRadius: '50%', display: 'inline-block', cursor: 'pointer', transition: 'background-color 0.3s ease' }} />
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#555' }}>
        {activeIndex + 1} / {teamMembers.length}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .carousel-viewport {
            overflow-x: auto !important;
            overflow-y: hidden !important;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
          }
          .carousel-inner { scroll-snap-type: x mandatory; }
          .carousel-slide { scroll-snap-align: start; }
        }
        @media (max-width: 900px) {
          .carousel-slide { grid-template-columns: 1fr !important; gap: 2rem !important; padding: 2.5rem !important; text-align: center; }
          .carousel-slide > div { text-align: center !important; }
          .carousel-image { order: -1; margin: 0 auto; height: 320px !important; width: 320px !important; border-radius: 50% !important; }
        }
        @media (max-width: 600px) {
          .carousel-slide { padding: 2rem 1.5rem !important; }
          .carousel-image { height: 250px !important; width: 250px !important; }
        }
        @media (min-width: 1600px) {
          .carousel-slide { padding: 4.5rem !important; gap: 5rem !important; }
          .carousel-slide h3 { font-size: 2.2rem !important; }
        }
      `}</style>
    </div>
  );
};

export default TeamCarousel;
