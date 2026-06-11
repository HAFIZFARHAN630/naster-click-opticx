"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tenants' | 'analytics' | 'ai-config' | 'settings'>('tenants');
  const [newTenant, setNewTenant] = useState({ name: '', subdomain: '' });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    // Mock data - replace with actual API call
    setTenants([
      { id: '1', name: 'Click Opticx Main', subdomain: 'main', status: 'ACTIVE', created_at: '2024-01-15' },
      { id: '2', name: 'Click Opticx Branch 1', subdomain: 'branch1', status: 'ACTIVE', created_at: '2024-02-20' },
      { id: '3', name: 'Click Opticx Branch 2', subdomain: 'branch2', status: 'SUSPENDED', created_at: '2024-03-10' },
    ]);
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/super-admin/logout', { method: 'POST' });
    router.push('/super-admin');
  };

  const createTenant = async () => {
    if (!newTenant.name || !newTenant.subdomain) return;
    // API call to create tenant
    setTenants([...tenants, { 
      id: Date.now().toString(), 
      ...newTenant, 
      status: 'ACTIVE', 
      created_at: new Date().toISOString().split('T')[0] 
    }]);
    setNewTenant({ name: '', subdomain: '' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Header */}
      <header style={{ 
        padding: '20px 40px', 
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Super Admin Dashboard
        </h1>
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      </header>

      {/* Navigation Tabs */}
      <nav style={{ 
        padding: '20px 40px', 
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '16px'
      }}>
        {['tenants', 'analytics', 'ai-config', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: activeTab === tab ? 'var(--accent)' : 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: '40px' }}>
        {activeTab === 'tenants' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Tenant Management</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Tenant Name"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
                <input
                  type="text"
                  placeholder="Subdomain"
                  value={newTenant.subdomain}
                  onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value })}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
                <button onClick={createTenant} className="btn-primary">
                  Create Tenant
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Subdomain</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>{tenant.name}</td>
                      <td style={{ padding: '12px' }}>{tenant.subdomain}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          background: tenant.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: tenant.status === 'ACTIVE' ? 'var(--success)' : 'var(--error)'
                        }}>
                          {tenant.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{tenant.created_at}</td>
                      <td style={{ padding: '12px' }}>
                        <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 12px', marginRight: '8px' }}>
                          Configure
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                          {tenant.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '24px' }}>Global Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Total Tenants</h3>
                <p style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent)' }}>{tenants.length}</p>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Active Users</h3>
                <p style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--success)' }}>1,248</p>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Monthly Revenue</h3>
                <p style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--warning)' }}>PKR 4.2M</p>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Active Sessions</h3>
                <p style={{ fontSize: '3rem', fontWeight: 700, color: '#8b5cf6' }}>342</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-config' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '24px' }}>Global AI Configuration</h2>
            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>NLP Engine Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Enable Multilingual Support</span>
                  <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Voice Recognition</span>
                  <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Auto Ticket Assignment</span>
                  <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '24px' }}>System Settings</h2>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Global Configuration</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button className="btn-secondary" style={{ width: 'fit-content' }}>
                  Configure Payment Gateways
                </button>
                <button className="btn-secondary" style={{ width: 'fit-content' }}>
                  SMS/Email Templates
                </button>
                <button className="btn-secondary" style={{ width: 'fit-content' }}>
                  Backup & Maintenance
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}