import React, { useState, useEffect } from 'react';
import { submitContact } from '../services/connectorService.js';
import logoSvg from '../../../assets/images/logo.svg';
import { trackPageView, trackClick, trackHover } from '../services/analyticsService.js';

// Social Media Icon Component (matching PublicSite.jsx)
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
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    Instagram: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    )
  };
  
  return icons[platform] || null;
};

const Contact = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    honeypot: ''
  });
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // Analytics tracking: page view + click + hover (throttled inside service)
  useEffect(() => {
    trackPageView(window.location.pathname, document.title);

    const handleClick = (event) => {
      const target = event.target;
      const isInteractive =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.onclick ||
        target.style.cursor === 'pointer' ||
        (target.classList && target.classList.contains('clickable'));
      if (isInteractive) {
        trackClick(event);
      }
    };
    const handleHover = (e) => trackHover(e);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('mousemove', handleHover, { passive: true });

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('mousemove', handleHover);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setSending(true);
    try {
      await submitContact({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        message: formData.message,
        website: formData.honeypot
      });
      
      setShowSuccess(true);
      setFormData({ name: '', email: '', company: '', message: '', honeypot: '' });
      
      // Confetti effect
      if (window.confetti) {
        window.confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSending(false);
    }
  };

  const contactMethods = [
    { icon: '📧', title: 'Email', value: 'info@malloulinova.com', href: 'mailto:info@malloulinova.com' },
    { icon: '📞', title: 'Tunisia', value: '+216 25 571 398', href: 'tel:+21625571398' },
    { icon: '📱', title: 'Germany', value: '+49 177 833 4621', href: 'tel:+491778334621' },
    { icon: '📍', title: 'Address', value: 'Route Lafrane Km 4, Sfax, Tunisia', href: 'https://www.google.com/maps/search/?api=1&query=Route%20Lafrane%20Km%204%2C%20Sfax%2C%20Tunisia' }
  ];

  const socialLinks = [
    { name: 'LinkedIn', url: 'https://linkedin.com/company/malloulinova' },
    { name: 'GitHub', url: 'https://github.com/malloulinova' },
    { name: 'Twitter', url: 'https://twitter.com/malloulinova' },
    { name: 'Instagram', url: 'https://instagram.com/malloulinova' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #447D9B 0%, #273F4F 100%)', color: 'white', fontFamily: 'Montserrat, sans-serif', margin: 0, padding: 0 }}>
      <style>{`
        body { margin: 0; padding: 0; }
        * { box-sizing: border-box; }
      `}</style>
      {/* Header */}
      <header style={{ padding: '1.5rem 2rem', width: '100%', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => onNavigate('/')}>
            <svg width="180" height="40" viewBox="0 0 220 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="MALOULINOVA">
              <g>
                <path d="M12 11L22 6L32 11L32 23L22 28L12 23Z" stroke="#447D9B" strokeWidth="3.5" fill="none" />
                <circle cx="22" cy="17" r="3" fill="#FE7743" />
              </g>
              <g>
                <text x="45" y="22" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="700" fill="#FFFFFF">MALOULINOVA</text>
                <text x="45" y="35" fontFamily="Arial, Helvetica, sans-serif" fontSize="8" fontWeight="400" fill="#FFFFFF" opacity="0.8">EMBEDDED SYSTEMS &amp; IoT SOLUTIONS</text>
              </g>
            </svg>
          </div>
          <button onClick={() => onNavigate('/')} style={{ padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, color: 'white', cursor: 'pointer', transition: 'all 0.3s' }}>
            ← Back to Home
          </button>
        </div>
      </header>

      {/* Success Modal */}
      {showSuccess && (
        <div onClick={() => setShowSuccess(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 30, maxWidth: 500, textAlign: 'center', color: '#273F4F' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#447D9B' }}>✓ Message Sent!</h3>
            <p style={{ margin: '0 0 1.5rem 0' }}>Thanks for reaching out. We'll get back to you within 2 business days.</p>
            <button onClick={() => setShowSuccess(false)} style={{ padding: '10px 20px', background: '#FE7743', color: '#fff', border: 'none', borderRadius: 999, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: '0 0 1rem 0', textAlign: 'center' }}>Get In Touch</h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9, textAlign: 'center', margin: '0 0 3rem 0' }}>We'll respond within 2 business days</p>

        <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
          {/* Contact Form */}
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: 16, backdropFilter: 'blur(10px)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem' }}>Send a Message</h2>
            {error && <div style={{ padding: 10, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, marginBottom: 15, color: '#fff' }}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 15 }}>
              <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Your Name *" style={{ padding: 12, borderRadius: 8, border: 'none', fontSize: '1rem' }} />
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Your Email *" style={{ padding: 12, borderRadius: 8, border: 'none', fontSize: '1rem' }} />
              <input value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} placeholder="Company (optional)" style={{ padding: 12, borderRadius: 8, border: 'none', fontSize: '1rem' }} />
              <input value={formData.honeypot} onChange={(e) => setFormData({...formData, honeypot: e.target.value})} style={{ display: 'none' }} />
              <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} rows={5} placeholder="Your Message *" style={{ padding: 12, borderRadius: 8, border: 'none', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' }} />
              <button type="submit" disabled={sending} style={{ padding: '12px 24px', background: '#FE7743', color: '#fff', border: 'none', borderRadius: 999, fontSize: '1.1rem', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, transition: 'all 0.3s' }}>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem' }}>Contact Information</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {contactMethods.map((method, i) => (
                <a key={i} href={method.href} target={method.icon === '📍' ? '_blank' : undefined} rel={method.icon === '📍' ? 'noopener noreferrer' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '1rem', background: 'rgba(255,255,255,0.95)', color: '#273F4F', borderRadius: 12, textDecoration: 'none', transition: 'transform 0.3s' }}>
                  <span style={{ fontSize: '2rem' }}>{method.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{method.title}</div>
                    <div style={{ opacity: 0.8, fontSize: '0.95rem' }}>{method.value}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Social Media */}
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem' }}>Follow Us</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {socialLinks.map((social, i) => (
                  <a 
                    key={i} 
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      width: 50, 
                      height: 50, 
                      background: 'rgba(255,255,255,0.1)', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: '#fff', 
                      textDecoration: 'none', 
                      transition: 'all 0.3s', 
                      border: '2px solid rgba(255,255,255,0.3)' 
                    }} 
                    title={social.name}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FE7743';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.borderColor = '#FE7743';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    }}
                  >
                    <SocialIcon platform={social.name} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map or Additional Info */}
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: 16, textAlign: 'center', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.6rem' }}>Office Hours</h3>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>Monday - Friday: 9:00 AM - 6:00 PM (CET)</p>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>Saturday - Sunday: Closed</p>
        </div>
      </main>

      <style>{`
        @media (max-width: 900px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          header {
            justify-content: center !important;
            text-align: center;
          }
          h1 { font-size: 2rem !important; }
          h2 { font-size: 1.5rem !important; }
          h3 { font-size: 1.3rem !important; }
          main {
            padding: 2rem 1rem !important;
          }
          .contact-grid > div {
            padding: 1.5rem !important;
          }
        }
        @media (max-width: 480px) {
          h1 { font-size: 1.75rem !important; }
          h2 { font-size: 1.3rem !important; }
          .contact-grid > div {
            padding: 1rem !important;
          }
        }
        a:hover {
          transform: translateY(-2px);
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(254, 119, 67, 0.4);
        }
      `}</style>
    </div>
  );
};

export default Contact;
