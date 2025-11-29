import React, { useEffect, useState } from 'react';
import { fetchTechnologies } from '../../services/technologyService.js';

const TechnologiesSection = ({ sectionId }) => {
  const [techs, setTechs] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTechnologies();
        const list = Array.isArray(data) ? data.filter(t => t.visible !== false) : [];
        setTechs(list);
      } catch (e) {
        console.error('Failed to load technologies:', e);
        setTechs([]);
      }
    };
    load();
  }, []);

  const hasTechs = techs.length > 0;
  const repeatedTechs = hasTechs ? [...techs, ...techs] : [];

  return (
    <section id="tech-protocols" data-section-id={sectionId || 'tech-protocols'} className="section tech-protocols" style={{
      padding: '4rem 2rem',
      backgroundColor: '#447D9B',
      color: 'white'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2.2rem',
          fontWeight: 700,
          marginBottom: '1.5rem'
        }}>Technologies & Protocols</h2>
        <div className="tech-carousel-shell">
          <div className="tech-carousel-viewport">
            {hasTechs ? (
              <div
                className="tech-carousel-track tech-carousel-animate"
                style={{ '--tech-scroll-duration': '28s' }}
              >
                {repeatedTechs.map((t, idx) => (
                  <span
                    key={`${t.id}-${idx}`}
                    className="tech-chip"
                    role="button"
                    tabIndex={0}
                    onMouseEnter={(e)=>{ e.currentTarget.style.background = '#FE7743'; e.currentTarget.style.borderColor = '#FE7743'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e)=>{ e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.85)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 14px',
                      borderRadius: 999,
                      border: '1.5px solid rgba(255,255,255,0.85)',
                      color: '#fff',
                      background: 'transparent',
                      fontWeight: 600,
                      letterSpacing: '0.2px',
                      transition: 'all .2s ease',
                      userSelect: 'none'
                    }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>No technologies added yet.</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .tech-carousel-shell {
          margin-top: 1.25rem;
        }
        .tech-carousel-viewport {
          position: relative;
          width: 100%;
          overflow: hidden;
        }
        .tech-carousel-track {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-height: 52px;
          will-change: transform;
        }
        .tech-carousel-track.tech-carousel-animate {
          animation: scroll-tech var(--tech-scroll-duration, 28s) linear infinite;
        }
        .tech-carousel-viewport:hover .tech-carousel-track.tech-carousel-animate {
          animation-play-state: paused;
        }
        @keyframes scroll-tech {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (min-width: 1600px) {
          .tech-protocols h2 {
            font-size: 2.4rem !important;
          }
          .tech-carousel-viewport {
            max-width: 1600px;
            margin-inline: auto;
          }
        }
        @media (max-width: 768px) {
          .tech-carousel-shell {
            margin-top: 1rem;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .tech-carousel-track.tech-carousel-animate {
            animation: none;
          }
          .tech-carousel-viewport {
            overflow-x: auto;
          }
        }
      `}</style>
    </section>
  );
};

export default TechnologiesSection;
