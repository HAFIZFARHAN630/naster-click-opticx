"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubscriberPWA() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'packages' | 'prayer' | 'speedtest' | 'support'>('home');
  const [speedTest, setSpeedTest] = useState({ download: 0, upload: 0, ping: 0, testing: false });

  useEffect(() => {
    const token = localStorage.getItem('subscriber_token');
    if (!token) router.push('/subscriber/login');
  }, []);

  const runSpeedTest = async () => {
    setSpeedTest(s => ({ ...s, testing: true }));
    await new Promise(r => setTimeout(r, 2000));
    setSpeedTest({ download: 45.2, upload: 12.8, ping: 15, testing: false });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Master Click Opticx
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Subscriber Portal</p>
      </header>

      <main style={{ padding: '24px', paddingBottom: '80px' }}>
        {activeTab === 'home' && (
          <div>
            <div className="glass-card" style={{ padding: '24px', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', marginBottom: '8px' }}>[Network]</p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Status</p>
              <p style={{ color: 'var(--success)', fontWeight: 600 }}>&#9679; Online</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, marginTop: '12px' }}>100 Mbps</p>
              <p style={{ color: 'var(--text-secondary)' }}>Current Speed</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <button onClick={() => setActiveTab('packages')} className="glass-card" style={{ padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                <p style={{ fontSize: '1.8rem', marginBottom: '8px' }}>[Pkg]</p>
                <p>Packages</p>
              </button>
              <button onClick={() => setActiveTab('prayer')} className="glass-card" style={{ padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                <p style={{ fontSize: '1.8rem', marginBottom: '8px' }}>[Pray]</p>
                <p>Prayer Times</p>
              </button>
              <button onClick={() => setActiveTab('speedtest')} className="glass-card" style={{ padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                <p style={{ fontSize: '1.8rem', marginBottom: '8px' }}>[Speed]</p>
                <p>Speed Test</p>
              </button>
              <button onClick={() => setActiveTab('support')} className="glass-card" style={{ padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                <p style={{ fontSize: '1.8rem', marginBottom: '8px' }}>[Call]</p>
                <p>AI Voice Call</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px' }}>Available Packages</h2>
            {['Basic', 'Premium', 'Gaming'].map((pkg, i) => (
              <div key={pkg} className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 600 }}>{pkg}</h3>
                    <p style={{ color: 'var(--accent)' }}>{['20', '50', '100'][i]} Mbps</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>PKR {['1,500', '3,000', '5,000'][i]}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>/mo</p>
                  </div>
                </div>
                <button className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                  Upgrade to {pkg}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'prayer' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px' }}>Prayer Times</h2>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name, i) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{['05:00', '06:30', '12:00', '15:30', '18:45', '19:30'][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'speedtest' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px' }}>Speed Test</h2>
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              {speedTest.testing ? (
                <p style={{ fontSize: '1.2rem' }}>Testing...</p>
              ) : speedTest.download > 0 ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                    <div>
                      <p style={{ color: 'var(--text-secondary)' }}>Download</p>
                      <p style={{ fontSize: '2rem', fontWeight: 700 }}>{speedTest.download} Mbps</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-secondary)' }}>Upload</p>
                      <p style={{ fontSize: '2rem', fontWeight: 700 }}>{speedTest.upload} Mbps</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-secondary)' }}>Ping</p>
                      <p style={{ fontSize: '2rem', fontWeight: 700 }}>{speedTest.ping} ms</p>
                    </div>
                  </div>
                  <button onClick={runSpeedTest} className="btn-secondary">Test Again</button>
                </div>
              ) : (
                <button onClick={runSpeedTest} className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.2rem' }}>
                  Start Speed Test
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px' }}>AI Voice Support</h2>
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '4rem', marginBottom: '20px' }}>[Mic]</p>
              <p style={{ marginBottom: '20px' }}>Tap to speak with AI support</p>
              <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.2rem' }}>
                Call Now
              </button>
            </div>
          </div>
        )}
      </main>

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 24px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'space-around'
      }}>
        <button style={{ background: activeTab === 'home' ? 'var(--accent)' : 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>[Home]</button>
        <button style={{ background: activeTab === 'packages' ? 'var(--accent)' : 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('packages')}>[Pkg]</button>
        <button style={{ background: activeTab === 'prayer' ? 'var(--accent)' : 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('prayer')}>[Pray]</button>
        <button style={{ background: activeTab === 'speedtest' ? 'var(--accent)' : 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('speedtest')}>[Speed]</button>
        <button style={{ background: activeTab === 'support' ? 'var(--accent)' : 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('support')}>[Call]</button>
      </nav>
    </div>
  );
}