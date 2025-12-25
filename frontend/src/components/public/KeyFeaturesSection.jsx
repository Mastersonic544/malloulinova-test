import React, { useEffect, useState } from 'react';

// Brand color (from project identity)
const brandBlue = '#447D9B';

// Use public folder paths so no import is needed
const FEATURE_ITEMS = [
  { key: 'fast', title: 'Fast Turnaround', svgPath: '/hourglass.svg' },
  { key: 'security', title: 'Enterprise Security', svgPath: '/lock.svg' },
  { key: 'global', title: 'Global Clients', svgPath: '/planet.svg' },
  { key: 'innovation', title: 'Innovation First', svgPath: '/lightbulb.svg' }
];

const cardBaseStyle = {
  backgroundColor: '#EEF5FA',
  borderRadius: '28px',
  boxShadow: '0 8px 24px rgba(39,63,79,0.12), 0 2px 8px rgba(39,63,79,0.06)',
  padding: '1.5rem',
  textAlign: 'center',
  border: '1px solid rgba(68,125,155,0.18)',
  width: '320px',
  maxWidth: '90%',
  minHeight: '200px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
};

// Render SVG from public folder and tint with brand color using CSS mask
const renderIconMasked = (item) => (
  <div
    role="img"
    aria-label={item.title}
    style={{
      width: 56,
      height: 56,
      backgroundColor: brandBlue,
      WebkitMaskImage: `url(${item.svgPath})`,
      maskImage: `url(${item.svgPath})`,
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      display: 'block'
    }}
  />
);

const renderIconImg = (item) => (
  <img src={item.svgPath} alt={item.title} width={56} height={56} style={{ display: 'block' }} />
);

const KeyFeaturesSection = ({ sectionId }) => {
  const [phase, setPhase] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [supportsMask, setSupportsMask] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateReducedMotion = () => setIsReducedMotion(!!(mq && mq.matches));
    updateReducedMotion();
    if (mq) {
      if (mq.addEventListener) mq.addEventListener('change', updateReducedMotion);
      else if (mq.addListener) mq.addListener(updateReducedMotion);
    }

    const handleResize = () => {
      try {
        setIsMobile(window.innerWidth < 768);
      } catch {
        setIsMobile(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    try {
      const ok = typeof CSS !== 'undefined' && (CSS.supports?.('mask-image', 'url("")') || CSS.supports?.('-webkit-mask-image', 'url("")'));
      setSupportsMask(!!ok);
    } catch {
      setSupportsMask(false);
    }

    let frameId = 0;
    const speed = 0.0025; // radians per frame, ~45-60s per full rotation

    const animate = () => {
      setPhase((prev) => {
        const next = prev + speed;
        return next > Math.PI * 2 ? next - Math.PI * 2 : next;
      });
      frameId = window.requestAnimationFrame(animate);
    };

    if (!mq || !mq.matches) {
      frameId = window.requestAnimationFrame(animate);
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (mq) {
        if (mq.removeEventListener) mq.removeEventListener('change', updateReducedMotion);
        else if (mq.removeListener) mq.removeListener(updateReducedMotion);
      }
    };
  }, []);

  const renderCard = (item) => (
    <div style={{ ...cardBaseStyle, width: isMobile ? '260px' : cardBaseStyle.width, minHeight: isMobile ? '180px' : cardBaseStyle.minHeight, padding: isMobile ? '1.25rem' : cardBaseStyle.padding }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
        {supportsMask ? renderIconMasked(item) : renderIconImg(item)}
      </div>
      <div style={{ color: '#273F4F', fontWeight: 600 }}>{item.title}</div>
    </div>
  );

  const sectionProps = {
    id: 'features',
    'data-section-id': sectionId || 'features',
    className: 'section features',
    style: {
      padding: '1.5rem 0 3rem',
      backgroundColor: '#ffffff',
      margin: 0,
      boxSizing: 'border-box'
    }
  };

  // Static, accessible layout for reduced motion
  if (isReducedMotion) {
    return (
      <section {...sectionProps}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.25rem' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#273F4F',
            margin: '0 0 2rem 0'
          }}>
            Our Key Features
          </h2>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1.25rem'
          }}>
            {FEATURE_ITEMS.map((item) => (
              <div key={item.key}>{renderCard(item)}</div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 3D circular carousel for desktop
  const radius = isMobile ? 135 : 190; // px
  const depthScale = 0.18;

  return (
    <section {...sectionProps}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.25rem' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#273F4F',
          margin: '0 0 2rem 0'
        }}>
          Our Key Features
        </h2>
        <div className="key-features-viewport" style={{
          position: 'relative',
          height: isMobile ? '240px' : '260px',
          maxWidth: '900px',
          margin: '0 auto',
          overflow: 'visible'
        }}>
          {FEATURE_ITEMS.map((item, index) => {
            const total = FEATURE_ITEMS.length || 1;
            const step = (Math.PI * 2) / total;
            const angle = phase + index * step;
            const x = Math.sin(angle);
            const z = Math.cos(angle);

            const translateX = x * radius;
            const translateY = z * -16; // slight vertical shift for depth
            const depth = (z + 1) / 2; // 0..1
            const scale = 0.9 + depthScale * depth * 2;
            const opacity = 0.35 + 0.65 * depth;
            const blur = 3 * (1 - depth);
            const zIndex = 10 + Math.round(depth * 10);

            return (
              <div
                key={item.key}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) scale(${scale.toFixed(3)})`,
                  opacity,
                  filter: `blur(${blur.toFixed(2)}px)`,
                  zIndex,
                  transition: 'transform 0.08s linear, opacity 0.08s linear, filter 0.08s linear'
                }}
              >
                {renderCard(item)}
              </div>
            );
          })}
        </div>
        <style>{`
          @media (max-width: 900px) {
            .key-features-viewport {
              max-width: 100%;
            }
          }
          @media (min-width: 1600px) {
            .section.features h2 {
              font-size: 2.8rem !important;
            }
            .key-features-viewport {
              max-width: 1100px;
            }
          }
        `}</style>
      </div>
    </section>
  );
};

export default KeyFeaturesSection;
