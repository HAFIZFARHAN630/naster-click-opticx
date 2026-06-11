"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResellerDealerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallet' | 'vouchers' | 'subdealers'>('dashboard');

  const handleLogout = async () => {
    await fetch('/api/reseller-dealer/logout', { method: 'POST' });
    router.push('/reseller-dealer');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <header style={{ padding: '20px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Reseller Dealer Dashboard</h1>
        <button onClick={handleLogout} className="btn-secondary">Logout</button>
      </header>

      <nav style={{ padding: '20px 40px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
        {['dashboard', 'wallet', 'vouchers', 'subdealers'].map(tab => (
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
            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Wallet Balance</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)' }}>PKR 125,000</p>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-primary">Load Wallet</button>
                <button className="btn-secondary">Generate Voucher</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '24px' }}>Wallet Management</h2>
            <button className="btn-primary" style={{ marginBottom: '20px' }}>Load Wallet</button>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Transaction History</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {[{ date: '2024-06-10', amount: 'PKR 50,000', type: 'Load' }].map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>{t.date}</td>
                      <td style={{ padding: '12px', color: 'var(--success)' }}>{t.amount}</td>
                      <td style={{ padding: '12px' }}>{t.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'vouchers' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '24px' }}>Voucher Generation</h2>
            <button className="btn-primary" style={{ marginBottom: '20px' }}>Create Voucher</button>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Recent Vouchers</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Code</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Value</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[{ code: 'VOUCHER-1234', value: 'PKR 1,500', status: 'Active' }].map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>{v.code}</td>
                      <td style={{ padding: '12px' }}>{v.value}</td>
                      <td style={{ padding: '12px' }}><span style={{ color: 'var(--success)' }}>{v.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'subdealers' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '24px' }}>Sub-Dealer Management</h2>
            <button className="btn-primary" style={{ marginBottom: '20px' }}>Add Sub-Dealer</button>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Your Sub-Dealers</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Commission</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[{ name: 'Ali Dealer', commission: '10%', status: 'Active' }].map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>{s.name}</td>
                      <td style={{ padding: '12px' }}>{s.commission}</td>
                      <td style={{ padding: '12px' }}><span style={{ color: 'var(--success)' }}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}