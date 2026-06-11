"use client";

export default function PortalSelector() {
  const portals = [
    { name: 'Super Admin', path: '/super-admin', icon: '👑', desc: 'Multi-ISP management & Global AI config' },
    { name: 'Branch Admin', path: '/admin-branch', icon: '🏢', desc: 'Branch operations & Staff HR' },
    { name: 'Reseller Dealer', path: '/reseller-dealer', icon: '🤝', desc: 'Wallet load & Voucher management' },
    { name: 'Field Agent', path: '/field-agent', icon: '📱', desc: 'Mobile-first field operations' },
    { name: 'Subscriber', path: '/subscriber', icon: '🏠', desc: 'Self-service portal' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '60px 20px' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 700, marginBottom: '40px' }}>
        Master Click Opticx
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '40px' }}>Select your portal</p>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {portals.map((portal) => (
          <a key={portal.name} href={portal.path} className="glass-card" style={{ 
            padding: '32px', 
            textDecoration: 'none', 
            color: 'inherit',
            display: 'block',
            textAlign: 'center',
            transition: 'transform 0.2s'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{portal.icon}</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>{portal.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{portal.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}