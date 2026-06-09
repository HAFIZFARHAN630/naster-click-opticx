-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TENANTS TABLE (Root level - no tenant_id needed)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED')),
    subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('BASIC', 'PREMIUM', 'ENTERPRISE')),
    max_branches INTEGER DEFAULT 5,
    max_users INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BRANCHES TABLE (Branch level - tenant_id required)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    contact_number TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Karachi',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USERS TABLE (Multi-tenant users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'FRANCHISE', 'DEALER', 'SUB_DEALER', 'STAFF', 'USER')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION')),
    full_name TEXT,
    cnic TEXT,
    address TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    biometric_enabled BOOLEAN DEFAULT FALSE,
    ip_binding TEXT,
    mac_binding TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, phone)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_branches_tenant ON branches(tenant_id);

-- RLS POLICIES
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- TENANT ISOLATION POLICIES
CREATE POLICY tenant_isolation ON tenants
    USING (true);

CREATE POLICY branch_tenant_isolation ON branches
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY user_tenant_isolation ON users
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Role-based policies for users
CREATE POLICY admin_full_access ON users
    USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID
        AND current_setting('app.current_user_role') IN ('SUPER_ADMIN', 'ADMIN', 'STAFF')
    );

CREATE POLICY franchise_branch_isolation ON users
    USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID
        AND branch_id = current_setting('app.current_branch_id')::UUID
    );

-- Hardware credentials encryption table
CREATE TABLE hardware_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('MIKROTIK', 'OLT', 'RADIUS_SERVER', 'TR069_SERVER')),
    device_id UUID,
    encrypted_password TEXT NOT NULL,
    encryption_key_hint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE hardware_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY hw_creds_tenant_isolation ON hardware_credentials
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);