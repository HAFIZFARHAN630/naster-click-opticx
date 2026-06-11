"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminBranchDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'noc' | 'billing'>('dashboard');

  const handleLogout = async () => {
    await fetch('/api/admin-branch/logout', { method: 'POST' });
    router.push('/admin-branch');
  };

  const metrics = [
    { label: 'Active Customers', value: '842', color: 'var(--accent)' },
    { label: 'Online Users', value: '342', color: 'var(--success)' },
    { label: 'Open Tickets', value: '24', color: 'var(--warning)' },
    { label: 'Today Revenue', value: 'PKR 180K', color: '#8b5cf6' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <header style={{ padding: '20px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Branch Admin Dashboard</h1>
        <button onClick={handleLogout} className="btn-secondary">Logout</button>
      </header>

      <nav style={{ padding: '20px 40px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
        {['dashboard', 'staff', 'noc', 'billing'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} style={{
            padding: '10px 20px', borderRadius: '10px',
            background: activeTab === tab ? 'var(--accent)' : 'var(--surface)',
            border: '1px solid var(--border)', color: 'white', cursor: 'pointer'
          }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main style={{ padding: '40px' }}>
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {metrics.map(m => (
                <div key={m.label} className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{m.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Recent Activities</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li>• Customer #1234 renewed package - 10 min ago</li>
                <li>• Network alert: OLT-3 latency high - 30 min ago</li>
                <li>• Staff attendance: 12/15 present - 2 hours ago</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '24px' }}>Staff Management</h2>
            <button className="btn-primary" style={{ marginBottom: '20px' }}>Add New Staff</button>
            <div className="glass-card" style={{ padding: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {['John Smith', 'Sarah Khan', 'Ali Raza'].map((name, i) => (
                    <tr key={name} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>{name}</td>
                      <td style={{ padding: '12px' }}>{['NOC', 'Field Agent', 'Billing'][i]}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)', fontSize: '0.85rem' }}>
                          Active
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'noc' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '24px' }}>NOC Monitoring</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {['Main OLT', 'Backup OLT', 'Core Router'].map((device, i) => (
                <div key={device} className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '12px' }}>{device}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                    <span style={{ color: 'var(--success)' }}>● Online</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Latency</span>
                    <span>{[12, 15, 8][i]}ms</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Uptime</span>
                    <span>{[99.9, 99.8, 100][i]}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '24px' }}>Billing & Wallet</h2>
            <button className="btn-primary" style={{ marginBottom: '20px' }}>Process Payment</button>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Pending Payments</h3>
              <p>No pending payments</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}