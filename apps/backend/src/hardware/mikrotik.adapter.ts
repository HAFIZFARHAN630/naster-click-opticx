import { HardwareAdapter, HardwareAdapterConfig, ConnectionResult, TelemetryData } from './hardware.factory';

export class MikroTikAdapter implements HardwareAdapter {
  private config: HardwareAdapterConfig;

  constructor(config: HardwareAdapterConfig) {
    this.config = config;
  }

  async testConnection(): Promise<ConnectionResult> {
    const start = Date.now();
    try {
      const response = await fetch(`https://${this.config.host}/rest/system/resource`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.password}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return { success: true, latency: Date.now() - start };
    } catch (error) {
      return {
        success: false,
        error: this.mapError(error)
      };
    }
  }

  async executeCommand(command: string, params?: any): Promise<any> {
    const endpoint = this.getEndpoint(command);
    const response = await fetch(`https://${this.config.host}/rest/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.password}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params || {})
    });
    return response.json();
  }

  async getTelemetry(): Promise<TelemetryData> {
    const [interfaces, health] = await Promise.all([
      this.executeCommand('interfaces'),
      this.executeCommand('system/health')
    ]);

    return { interfaces, health };
  }

  private getEndpoint(command: string): string {
    const map: Record<string, string> = {
      CREATE_PPP_SECRET: 'ppp/secret',
      UPDATE_QUEUE: 'queue/simple',
      HOTSPOT_USER: 'ip/hotspot/user'
    };
    return map[command] || command.toLowerCase();
  }

  private mapError(error: any): string {
    if (error.name === 'TimeoutError') return 'SNMP_TIMEOUT';
    if (error.message?.includes('401')) return 'AUTH_FAILED';
    return `CONNECTION_ERROR: ${error.message}`;
  }
}