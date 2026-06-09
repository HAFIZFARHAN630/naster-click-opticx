-- INVENTORY ITEMS TABLE
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    mac_address TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    device_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'ASSIGNED', 'RECOVERED', 'USED', 'REFURBISHED')),
    assigned_to UUID REFERENCES users(id),
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, mac_address),
    UNIQUE(tenant_id, serial_number)
);

CREATE INDEX idx_inventory_tenant ON inventory_items(tenant_id);
CREATE INDEX idx_inventory_status ON inventory_items(status);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_tenant_isolation ON inventory_items
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- CREDIT TRANSFERS TABLE
CREATE TABLE credit_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id)
);

CREATE INDEX idx_credit_transfers_tenant ON credit_transfers(tenant_id);
CREATE INDEX idx_credit_transfers_from ON credit_transfers(from_user_id);
CREATE INDEX idx_credit_transfers_to ON credit_transfers(to_user_id);

ALTER TABLE credit_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY credit_transfer_tenant_isolation ON credit_transfers
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- WITHDRAWAL REQUESTS TABLE
CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')),
    bank_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_withdrawal_tenant ON withdrawal_requests(tenant_id);
CREATE INDEX idx_withdrawal_user ON withdrawal_requests(user_id);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY withdrawal_tenant_isolation ON withdrawal_requests
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- OFFLINE SYNC QUEUE
CREATE TABLE offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL CHECK (action IN ('CHECK_IN', 'COLLECT_CASH', 'UPDATE_INVENTORY')),
    data JSONB,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_offline_sync_tenant ON offline_sync_queue(tenant_id);
CREATE INDEX idx_offline_sync_user ON offline_sync_queue(user_id);

ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY offline_sync_tenant_isolation ON offline_sync_queue
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- CHECK-IN LOCATIONS
CREATE TABLE checkin_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checkin_locations_tenant ON checkin_locations(tenant_id);

ALTER TABLE checkin_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY checkin_location_tenant_isolation ON checkin_locations
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);