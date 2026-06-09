import { HardwareAdapter, HardwareAdapterConfig, ConnectionResult, TelemetryData } from './hardware.factory';
import * as snmp from 'net-snmp';

export class SnmpAdapter implements HardwareAdapter {
  private config: HardwareAdapterConfig;
  private session: snmp.Session | null = null;

  constructor(config: HardwareAdapterConfig) {
    this.config = config;
  }

  async testConnection(): Promise<ConnectionResult> {
    const start = Date.now();
    try {
      const session = snmp.createSession({
        host: this.config.host,
        community: this.config.community || 'public',
        version: 3
      });

      const oids = ['1.3.6.1.2.1.1.1.0'];
      const varbinds = await new Promise<snmp.VarBind[]>((resolve, reject) => {
        session.get(oids, (error, results) => {
          if (error) reject(error);
          else resolve(results);
          session.close();
        });
      });

      return { success: true, latency: Date.now() - start };
    } catch (error) {
      return {
        success: false,
        error: this.mapError(error)
      };
    }
  }

  async executeCommand(command: string, params?: any): Promise<any> {
    switch (command) {
      case 'GET_PORT_STATUS':
        return this.getPortStatus(params.portIndex);
      case 'SET_PORT_ADMIN':
        return this.setPortAdmin(params.portIndex, params.status);
      default:
        throw new Error(`Unknown SNMP command: ${command}`);
    }
  }

  async getTelemetry(oids?: string[]): Promise<TelemetryData> {
    const session = snmp.createSession({
      host: this.config.host,
      community: this.config.community || 'public',
      version: 3
    });

    const targetOids = oids || [
      '1.3.6.1.2.1.2.2.1.8', // Interface status
      '1.3.6.1.2.1.31.1.1.1.6' // Interface speed
    ];

    const results = await new Promise<snmp.VarBind[]>((resolve, reject) => {
      session.get(targetOids, (error, varbinds) => {
        if (error) reject(error);
        else resolve(varbinds);
        session.close();
      });
    });

    return results.reduce((acc, v) => {
      acc[v.oid] = v.value;
      return acc;
    }, {} as TelemetryData);
  }

  private mapError(error: any): string {
    if (error.rootCause?.message) return error.rootCause.message;
    if (error.name === 'TimeoutError') return 'SNMP_TIMEOUT';
    return 'SNMP_ERROR';
  }

  private async getPortStatus(portIndex: number): Promise<any> {
    return this.getTelemetry([`1.3.6.1.2.1.2.2.1.8.${portIndex}`]);
  }

  private async setPortAdmin(portIndex: number, status: number): Promise<any> {
    const session = snmp.createSession({
      host: this.config.host,
      community: this.config.community || 'private',
      version: 3
    });

    await new Promise<void>((resolve, reject) => {
      session.set([{ oid: `1.3.6.1.2.1.2.2.1.7.${portIndex}`, value: status }], (error) => {
        session.close();
        if (error) reject(error);
        else resolve();
      });
    });
  }
}