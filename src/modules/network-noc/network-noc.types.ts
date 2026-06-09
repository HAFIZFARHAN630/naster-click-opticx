export interface NetworkDevice {
  id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  type: 'MIKROTIK' | 'OLT' | 'RADIUS' | 'TR069';
  ipAddress: string;
  apiPort?: number;
  sshPort?: number;
  snmpVersion?: 'v2c' | 'v3';
  snmpCommunity?: string;
  encryptedCredentials?: {
    username?: string;
    password?: string;
    token?: string;
    community?: string;
    privateKey?: string;
  };
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'UNKNOWN';
  lastHeartbeat?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ONTPort {
  id: string;
  tenantId: string;
  branchId?: string;
  deviceId: string;
  portNumber: number;
  serialNumber?: string;
  status: 'ENABLED' | 'DISABLED' | 'SYNCING';
  opticalPower?: number;
  userId?: string;
  packageId?: string;
  lastSync?: Date;
}

export interface NetworkTelemetry {
  id: string;
  tenantId: string;
  deviceId: string;
  metricName: string;
  metricValue: Record<string, any>;
  capturedAt: Date;
}