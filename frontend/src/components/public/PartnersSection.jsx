import React from 'react';

const PartnersSection = ({ sectionId, partners = [] }) => {
  const hasPartners = partners.length > 0;
  const repeatedPartners = hasPartners ? [...partners, ...partners] : [];

  return (
    <section id="partners" data-section-id={sectionId || 'partners'} className="section clients-section" style={{
      padding: '6rem 2rem',
      background: 'linear-gradient(135deg, #447D9B 0%, #273F4F 100%)',
      position: 'relative',
      overflow: 'hidden',
      color: 'white'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '1rem',
          color: 'white'
        }}>
          Trusted by Industry Leaders
        </h2>
        <p style={{
          fontSize: '1.1rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '3rem',
          maxWidth: '700px',
          margin: '0 auto 3rem'
        }}>
          We've partnered with innovative companies across Europe and North Africa to deliver cutting-edge IoT solutions
        </p>
        <div className="clients-carousel-shell">
          <div className="clients-carousel-viewport">
            {hasPartners ? (
              <div
                className="clients-carousel-track clients-carousel-animate"
                style={{ '--clients-scroll-duration': '32s' }}
              >
                {repeatedPartners.map((p, idx) => (
                  <a
                    key={`${p.id || idx}-${idx}`}
                    href={p.link_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: 'none',
                      display: 'block',
                      height: '100%'
                    }}
                  >
                    <div className="client-card" style={{
                      background: p.bg_color || 'white',
                      borderRadius: '16px',
                      padding: '2rem 1.5rem',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{
                        width: '120px',
                        height: '120px',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={p.logo_url || ''}
                          alt={p.name || 'Partner'}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '0.5rem',
                        lineHeight: '1.4'
                      }}>
                        {p.name}
                      </div>
                      <div style={{
                        fontSize: '0.95rem',
                        color: '#666',
                        lineHeight: '1.5'
                      }}>
                        {p.description}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>No partners added yet.</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .client-card { transition: all 0.3s ease; }
        .client-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2) !important; }
        .clients-carousel-shell {
          margin-top: 1.5rem;
        }
        .clients-carousel-viewport {
          position: relative;
          width: 100%;
          max-width: calc(3 * var(--client-card-width, 320px) + 2 * 2rem);
          margin: 0 auto;
          overflow: hidden;
        }
        .clients-carousel-track {
          display: inline-flex;
          align-items: stretch;
          gap: 2rem;
          will-change: transform;
        }
        .clients-carousel-track a {
          flex: 0 0 var(--client-card-width, 320px);
        }
        .clients-carousel-track.clients-carousel-animate {
          animation: scroll-clients var(--clients-scroll-duration, 32s) linear infinite;
        }
        .clients-carousel-viewport:hover .clients-carousel-track.clients-carousel-animate {
          animation-play-state: paused;
        }
        @keyframes scroll-clients {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (min-width: 1600px) {
          .clients-section h2 {
            font-size: 2.8rem !important;
          }
          .clients-section p {
            font-size: 1.15rem !important;
          }
          .clients-carousel-viewport {
            max-width: calc(4 * var(--client-card-width, 320px) + 3 * 2rem);
          }
        }
        @media (max-width: 1024px) {
          .clients-section { padding: 5rem 1.75rem !important; }
        }
        @media (max-width: 768px) {
          .clients-section { padding: 4rem 1.5rem !important; }
          .clients-section h2 { font-size: 2rem !important; }
          .clients-section p { font-size: 1rem !important; }
          .client-card { padding: 1.5rem 1rem !important; }
          .client-card > div:last-child { font-size: 0.9rem !important; }
        }
        @media (max-width: 480px) {
          .clients-section { padding: 3rem 1rem !important; }
          .clients-section h2 { font-size: 1.75rem !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .clients-carousel-track.clients-carousel-animate {
            animation: none;
          }
          .clients-carousel-viewport {
            overflow-x: auto;
          }
        }
      `}</style>
    </section>
  );
};

export default PartnersSection;
