"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FieldAgentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'checkin' | 'collection' | 'tasks'>('home');

  const handleLogout = async () => {
    await fetch('/api/field-agent/logout', { method: 'POST' });
    router.push('/field-agent');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Field Agent</h1>
        <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Logout</button>
      </header>

      <main style={{ padding: '24px' }}>
        {activeTab === 'home' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <button onClick={() => setActiveTab('checkin')} className="glass-card" style={{ padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>[GPS]</div>
              <div>GPS Check-in</div>
            </button>
            <button onClick={() => setActiveTab('collection')} className="glass-card" style={{ padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>[Cash]</div>
              <div>Cash Collection</div>
            </button>
            <button onClick={() => setActiveTab('tasks')} className="glass-card" style={{ padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>[Tasks]</div>
              <div>Tasks</div>
            </button>
            <button className="glass-card" style={{ padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>[Perf]</div>
              <div>Performance</div>
            </button>
          </div>
        )}

        {activeTab === 'checkin' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px' }}>GPS Check-in</h2>
            <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
              <p>Getting location...</p>
              <p style={{ color: 'var(--success)', marginTop: '8px' }}>&#9679; Within service area</p>
            </div>
            <button className="btn-primary">Confirm Check-in</button>
          </div>
        )}

        {activeTab === 'collection' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px' }}>Cash Collection</h2>
            <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>Today Collections</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>PKR 45,000</p>
            </div>
            <button className="btn-primary">Record Payment</button>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px' }}>Assigned Tasks</h2>
            {[1, 2, 3].map((t) => (
              <div key={t} className="glass-card" style={{ padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Customer #{t} - Installation</span>
                  <span style={{ color: 'var(--success)' }}>Pending</span>
                </div>
              </div>
            ))}
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
        <button style={{ background: activeTab === 'checkin' ? 'var(--accent)' : 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('checkin')}>[Check]</button>
        <button style={{ background: activeTab === 'collection' ? 'var(--accent)' : 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('collection')}>[Cash]</button>
        <button style={{ background: activeTab === 'tasks' ? 'var(--accent)' : 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('tasks')}>[Tasks]</button>
      </nav>
    </div>
  );
}