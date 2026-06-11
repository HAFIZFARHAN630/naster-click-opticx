"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubscriberLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mock auth - store token
    localStorage.setItem('subscriber_token', 'authenticated');
    router.push('/subscriber');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
      <div className="glass-card" style={{ padding: '48px', width: '400px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px', textAlign: 'center' }}>
          Subscriber Login
        </h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white' }} />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Sign In</button>
        </form>
        <a href="/" style={{ display: 'block', marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>← Back to Home</a>
      </div>
    </div>
  );
}