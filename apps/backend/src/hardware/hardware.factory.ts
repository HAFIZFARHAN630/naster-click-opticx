import { Injectable } from '@nestjs/common';
import { MikroTikAdapter } from './mikrotik.adapter';
import { RadiusCoAAdapter } from './radius.adapter';
import { SnmpAdapter } from './snmp.adapter';
import { Tr069Adapter } from './tr069.adapter';

export interface HardwareAdapterConfig {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  community?: string;
  version?: 'v2c' | 'v3';
  encrypted_credentials?: any;
}

export interface ConnectionResult {
  success: boolean;
  latency?: number;
  error?: string;
}

export interface TelemetryData {
  [key: string]: any;
}

export interface HardwareAdapter {
  testConnection(): Promise<ConnectionResult>;
  executeCommand(command: string, params?: any): Promise<any>;
  getTelemetry(oids?: string[]): Promise<TelemetryData>;
}

@Injectable()
export class HardwareFactory {
  create(adapter: string, config: HardwareAdapterConfig): HardwareAdapter {
    switch (adapter) {
      case 'MIKROTIK': return new MikroTikAdapter(config);
      case 'RADIUS': return new RadiusCoAAdapter(config);
      case 'SNMP': return new SnmpAdapter(config);
      case 'TR069': return new Tr069Adapter(config);
      default: throw new Error(`Unknown hardware adapter: ${adapter}`);
    }
  }
}