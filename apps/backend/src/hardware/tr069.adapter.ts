import { HardwareAdapter, HardwareAdapterConfig, ConnectionResult, TelemetryData } from './hardware.factory';

export class Tr069Adapter implements HardwareAdapter {
  private config: HardwareAdapterConfig;

  constructor(config: HardwareAdapterConfig) {
    this.config = config;
  }

  async testConnection(): Promise<ConnectionResult> {
    const start = Date.now();
    try {
      const response = await fetch(`http://${this.config.host}:8080/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`
        },
        body: this.createProbeMessage(),
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
    switch (command) {
      case 'REBOOT':
        return this.sendCommand('Reboot');
      case 'FACTORY_RESET':
        return this.sendCommand('FactoryReset');
      default:
        return this.sendCommand(command, params);
    }
  }

  async getTelemetry(): Promise<TelemetryData> {
    return { status: 'available' };
  }

  private createProbeMessage(): string {
    return `<?xml version="1.0"?>
      <cwmp:GetParameterValues>
        <ParameterNames><string>InternetGatewayDevice.DeviceSummary</string></ParameterNames>
      </cwmp:GetParameterValues>`;
  }

  private async sendCommand(command: string, params?: any): Promise<any> {
    const response = await fetch(`http://${this.config.host}:8080/`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: this.createCommandMessage(command, params)
    });
    return response.text();
  }

  private createCommandMessage(command: string, params?: any): string {
    return `<?xml version="1.0"?>
      <cwmp:${command}>${params ? JSON.stringify(params) : ''}</cwmp:${command}>`;
  }

  private mapError(error: any): string {
    if (error.name === 'TimeoutError') return 'TR069_TIMEOUT';
    if (error.message?.includes('401')) return 'AUTH_FAILED';
    return `TR069_ERROR: ${error.message}`;
  }
}