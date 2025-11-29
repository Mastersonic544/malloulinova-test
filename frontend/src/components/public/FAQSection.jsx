import React from 'react';

const FAQSection = ({ sectionId, faqs = [], openFaq = -1, setOpenFaq = () => {}, scrollToSection = () => {} }) => {
  return (
    <section id="faqs" data-section-id={sectionId || 'faqs'} className="section faq-section" style={{ padding: '6rem 2rem', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: '#273F4F', textAlign: 'center' }}>
          Frequently Asked Questions
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#64748B', marginBottom: '3rem', textAlign: 'center' }}>
          Everything you need to know about our IoT consulting services
        </p>

        <div className="faq-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.length === 0 && (
            <div style={{ textAlign: 'center', color: '#64748B' }}>No FAQs yet. Check back soon.</div>
          )}
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.id || idx} className="faq-item" style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                <button onClick={() => setOpenFaq(isOpen ? -1 : idx)} style={{ width: '100%', padding: '1.5rem', background: 'transparent', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s ease' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#273F4F', flex: 1, paddingRight: '1rem' }}>
                    {faq.question}
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isOpen ? '#447D9B' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isOpen ? 'white' : '#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </button>
                <div style={{ maxHeight: isOpen ? '500px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                  <div style={{ padding: '0 1.5rem 1.5rem', fontSize: '1rem', lineHeight: '1.7', color: '#64748B' }}>
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '3rem', padding: '2rem', background: 'linear-gradient(135deg, #447D9B 0%, #273F4F 100%)', borderRadius: '20px', textAlign: 'center', color: 'white' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1rem' }}>Still have questions?</h3>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>Our team is here to help. Get in touch and we'll respond within 24 hours.</p>
          <button onClick={() => scrollToSection('contact')} style={{ padding: '0.75rem 2rem', background: '#FE7743', color: 'white', border: 'none', borderRadius: '999px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Contact Us
          </button>
        </div>
      </div>

      <style>{`
        .faq-item:hover { box-shadow: 0 8px 24px rgba(68, 125, 155, 0.12); border-color: #447D9B; }
        .faq-item button:hover { background: rgba(68, 125, 155, 0.03); }
        @media (min-width: 1600px) {
          .faq-section h2 { font-size: 2.8rem !important; }
        }
        @media (max-width: 1024px) { .faq-section { padding: 5rem 1.5rem !important; } }
        @media (max-width: 768px) {
          .faq-section { padding: 4rem 1.5rem !important; }
          .faq-section h2 { font-size: 2rem !important; }
          .faq-section > div > p { font-size: 1rem !important; }
          .faq-item button { padding: 1rem !important; }
          .faq-item button span { font-size: 1rem !important; }
          .faq-item > div > div { font-size: 0.95rem !important; }
        }
        @media (max-width: 480px) {
          .faq-section { padding: 3rem 1rem !important; }
          .faq-section h2 { font-size: 1.75rem !important; }
          .faq-item button { padding: 0.75rem !important; }
          .faq-item button span { font-size: 0.95rem !important; padding-right: 0.5rem !important; }
          .faq-item > div > div { padding: 0 0.75rem 0.75rem !important; font-size: 0.9rem !important; }
          .faq-section h3 { font-size: 1.5rem !important; }
          .faq-section button { padding: 0.65rem 1.5rem !important; font-size: 0.95rem !important; }
        }
      `}</style>
    </section>
  );
};

export default FAQSection;
