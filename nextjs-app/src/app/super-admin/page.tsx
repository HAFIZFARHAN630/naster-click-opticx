"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        router.push('/super-admin/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a, #1e293b)'
    }}>
      <div className="glass-card" style={{ padding: '48px', width: '400px' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 700, 
          marginBottom: '32px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Super Admin Login
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
              placeholder="admin@opticx.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <a href="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
            ← Back to Subscriber Portal
          </a>
        </div>
      </div>
    </div>
  );
}