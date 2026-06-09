-- NETWORK DEVICES TABLE
CREATE TABLE network_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('MIKROTIK', 'OLT', 'RADIUS', 'TR069')),
    ip_address INET NOT NULL,
    api_port INTEGER DEFAULT 443,
    ssh_port INTEGER DEFAULT 22,
    snmp_version TEXT CHECK (snmp_version IN ('v2c', 'v3')),
    snmp_community TEXT,
    encrypted_credentials JSONB,
    status TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (status IN ('ONLINE', 'OFFLINE', 'WARNING', 'UNKNOWN')),
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_network_devices_tenant ON network_devices(tenant_id);
CREATE INDEX idx_network_devices_branch ON network_devices(branch_id);
CREATE INDEX idx_network_devices_type ON network_devices(type);

ALTER TABLE network_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY network_device_tenant_isolation ON network_devices
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ONT/ONU PORTS TABLE
CREATE TABLE ont_ports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    device_id UUID NOT NULL REFERENCES network_devices(id) ON DELETE CASCADE,
    port_number INTEGER NOT NULL,
    serial_number TEXT,
    status TEXT NOT NULL DEFAULT 'DISABLED' CHECK (status IN ('ENABLED', 'DISABLED', 'SYNCING')),
    optical_power NUMERIC,
    user_id UUID REFERENCES users(id),
    package_id UUID,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(device_id, port_number)
);

CREATE INDEX idx_ont_ports_tenant ON ont_ports(tenant_id);
CREATE INDEX idx_ont_ports_device ON ont_ports(device_id);

ALTER TABLE ont_ports ENABLE ROW LEVEL SECURITY;
CREATE POLICY ont_port_tenant_isolation ON ont_ports
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- NETWORK TELEMETRY TABLE
CREATE TABLE network_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES network_devices(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value JSONB,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_telemetry_tenant ON network_telemetry(tenant_id);
CREATE INDEX idx_telemetry_device ON network_telemetry(device_id);