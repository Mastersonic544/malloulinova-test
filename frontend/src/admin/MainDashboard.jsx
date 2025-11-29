import React, { useState } from 'react';
import { useUser } from '../components/AppRouter.jsx';
import { signOutUser } from '@/lib/firebase.js';
import AnalyticsSection from './AnalyticsSection.jsx';
import ArticlesSection from './ArticlesSection.jsx';
import TagsSection from './TagsSection.jsx';
import PartnersSection from './PartnersSection.jsx';
import TeamSection from './TeamSection.jsx';
import ServicesSection from './ServicesSection.jsx';
import FaqsSection from './FaqsSection.jsx';
import TechnologiesSection from './TechnologiesSection.jsx';
import logoSvg from '../../../assets/images/logo.svg';

const colors = {
  primary: '#447D9B',
  accent: '#FE7743',
  dark: '#273F4F',
  text: '#273F4F',
  muted: '#64748B',
  card: '#FFFFFF',
  border: '#e5e7eb',
  bg: '#F6FAFD',
  shadow: '0 10px 30px rgba(39,63,79,0.08)'
};

const MainDashboard = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('analytics');

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.error('Sign out failed', e);
    } finally {
      window.location.reload();
    }
  };

  const tabs = [
    { id: 'analytics', label: 'Dashboard' },
    { id: 'articles', label: 'Articles' },
    { id: 'tags', label: 'Tags' },
    { id: 'partners', label: 'Partners' },
    { id: 'team', label: 'Team' },
    { id: 'technologies', label: 'Technologies' },
    { id: 'services', label: 'Services' },
    { id: 'faqs', label: 'FAQs' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: 'Montserrat, Arial, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
      `}</style>
      <div style={{ display: 'flex', minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 260,
            background: 'linear-gradient(180deg, #273F4F 0%, #0f172a 100%)',
            color: 'white',
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '4px 0 18px rgba(15,23,42,0.45)',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logoSvg} alt="Malloulinova" style={{ height: 48, filter: 'brightness(0) invert(1)' }} />
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: active ? '1px solid rgba(254,119,67,0.7)' : '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    fontSize: 14,
                    background: active ? '#FE7743' : 'rgba(255,255,255,0.06)',
                    color: active ? '#fff' : 'rgba(248,250,252,0.9)',
                    fontWeight: active ? 700 : 600,
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 8px 18px rgba(254,119,67,0.28)' : 'none'
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; } }}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: 20, fontSize: 12, opacity: 0.85 }}>
            <div style={{ marginBottom: 4 }}>Signed in as:</div>
            <div style={{ fontWeight: 600 }}>{user?.email || 'Admin'}</div>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                marginTop: 10,
                padding: '9px 14px',
                borderRadius: 10,
                border: '1px solid rgba(248,250,252,0.35)',
                background: 'rgba(255,255,255,0.06)',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: 12
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '20px 24px', height: '100vh', overflowY: 'auto' }}>
          <div style={{ height: 8 }} />

          {activeTab === 'analytics' && <AnalyticsSection colors={colors} />}
          {activeTab === 'articles' && <ArticlesSection colors={colors} />}
          {activeTab === 'tags' && <TagsSection colors={colors} />}
          {activeTab === 'partners' && <PartnersSection colors={colors} />}
          {activeTab === 'team' && <TeamSection colors={colors} />}
          {activeTab === 'technologies' && <TechnologiesSection colors={colors} />}
          {activeTab === 'services' && <ServicesSection colors={colors} />}
          {activeTab === 'faqs' && <FaqsSection colors={colors} />}
        </main>
      </div>
    </div>
  );
};

export default MainDashboard;
