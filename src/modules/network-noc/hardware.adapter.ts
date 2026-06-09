import { Injectable, Logger } from '@nestjs/common';
import { NetworkDevice } from './network-noc.types';

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  latency?: number;
}

export abstract class HardwareAdapter {
  abstract testConnection(device: NetworkDevice): Promise<ConnectionTestResult>;
  abstract executeCommand(command: string): Promise<any>;
}

@Injectable()
export class MikroTikAdapter extends HardwareAdapter {
  private logger = new Logger(MikroTikAdapter.name);

  async testConnection(device: NetworkDevice): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      const response = await fetch(`https://${device.ip_address}/rest/system/resource`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${device.encrypted_credentials?.token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`AUTH_FAILED: HTTP ${response.status}`);
      }

      return {
        success: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.name === 'TimeoutError' ? 'SNMP_TIMEOUT' : 
               error.message?.includes('401') ? 'AUTH_FAILED' : 
               `CONNECTION_ERROR: ${error.message}`
      };
    }
  }

  async executeCommand(command: string): Promise<any> {
    throw new Error('MikroTik command execution requires device context');
  }

  async changeOnline(routerId: string, secret: string, newProfile: string): Promise<void> {
    const response = await fetch(`https://${routerId}/rest/ppp/secret/${secret}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${routerId}` },
      body: JSON.stringify({ profile: newProfile })
    });
    if (!response.ok) throw new Error(`RADIUS_CoA_FAILED: ${response.status}`);
  }
}

@Injectable()
export class OLTAdapter extends HardwareAdapter {
  private logger = new Logger(OLTAdapter.name);

  async testConnection(device: NetworkDevice): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      const snmp = await import('net-snmp');
      
      const session = snmp.createSession({
        host: device.ip_address,
        community: device.encrypted_credentials?.community,
        version: 3
      });

      const oids = ['1.3.6.1.2.1.1.1.0'];
      const response = await new Promise<any[]>((resolve, reject) => {
        session.get(oids, (error, varbinds) => {
          if (error) reject(error);
          else resolve(varbinds);
          session.close();
        });
      });

      return {
        success: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.rootCause?.message || 'SNMP_TIMEOUT'
      };
    }
  }

  async executeCommand(command: string): Promise<any> {
    throw new Error('OLT command execution requires device context');
  }
}

@Injectable()
export class TR069Adapter extends HardwareAdapter {
  private logger = new Logger(TR069Adapter.name);

  async testConnection(device: NetworkDevice): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      const response = await fetch(`http://${device.ip_address}:8080/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'Authorization': `Basic ${Buffer.from(device.encrypted_credentials?.username + ':' + device.encrypted_credentials?.password).toString('base64')}`
        },
        body: this.createProbeMessage(),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        success: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.name === 'TimeoutError' ? 'TR069_TIMEOUT' : 
               error.message?.includes('401') ? 'AUTH_FAILED' : 
               `TR069_ERROR: ${error.message}`
      };
    }
  }

  private createProbeMessage(): string {
    return `<?xml version="1.0"?>
      <cwmp:GetParameterValues>
        <ParameterNames><string>InternetGatewayDevice.DeviceSummary</string></ParameterNames>
      </cwmp:GetParameterValues>`;
  }

  async executeCommand(command: string): Promise<any> {
    throw new Error('TR069 command execution requires device context');
  }
}

@Injectable()
export class NetworkAdapterFactory {
  static create(adapterType: string): HardwareAdapter {
    switch (adapterType) {
      case 'MIKROTIK': return new MikroTikAdapter();
      case 'OLT': return new OLTAdapter();
      case 'TR069': return new TR069Adapter();
      default: throw new Error(`Unknown adapter type: ${adapterType}`);
    }
  }
}