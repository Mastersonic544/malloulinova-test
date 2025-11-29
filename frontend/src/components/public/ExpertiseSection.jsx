import React, { useEffect, useState } from 'react';
import { fetchServices } from '../../services/serviceService.js';

const ExpertiseSection = ({ sectionId }) => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchServices();
        setServices(Array.isArray(data) ? data.filter(s => s.visible !== false) : []);
      } catch (e) {
        console.error('Failed to load services:', e);
        setServices([]);
      }
    };
    load();
  }, []);

  return (
    <section
      id="expertise"
      data-section-id={sectionId || 'expertise'}
      className="section expertise-section"
      style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(to bottom, #ffffff 0%, #273F4F 100%)'
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: '700', color: '#273F4F', marginBottom: '3rem' }}>
          Our Services
        </h2>
        <div className="services-grid" style={{ display: 'grid', gap: '2rem', alignItems: 'stretch' }}>
          {services.map((service, index) => (
            <div key={index} className="service-card" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)', textAlign: 'center', transition: 'transform 0.3s ease, box-shadow 0.3s ease', minHeight: '420px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 0, willChange: 'transform, box-shadow' }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = 'translateY(-5px)'; el.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.12)'; el.style.zIndex = '1'; }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)'; el.style.zIndex = '0'; }}
            >
              <div style={{ width: '100%', aspectRatio: '4 / 3', backgroundColor: '#F1F5F9', borderRadius: '14px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
                {service.image_url ? (
                  <img src={service.image_url} alt={service.title} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : null}
              </div>
              <h3 style={{ color: '#1F2937', fontSize: '1.5rem', fontWeight: '600', lineHeight: 1.3, minHeight: '56px', marginBottom: '1rem' }}>{service.title}</h3>
              <p style={{ color: '#64748B', lineHeight: '1.6', fontSize: '1rem' }}>{service.description}</p>
            </div>
          ))}
        </div>
        <style>{`
          .services-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          @media (max-width: 1200px) { .services-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
          @media (max-width: 900px) { .services-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
          @media (max-width: 600px) { .services-grid { grid-template-columns: 1fr; } }
        `}</style>
      </div>
      {/* No floating elements */}
    </section>
  );
};

export default ExpertiseSection;
