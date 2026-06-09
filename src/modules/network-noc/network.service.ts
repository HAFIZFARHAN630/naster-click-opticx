import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkAdapterFactory, HardwareAdapter, ConnectionTestResult } from './hardware.adapter';
import { NetworkDevice } from './network-noc.types';

@Injectable()
export class NetworkService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async listDevices(tenantId: string, branchId?: string) {
    let query = this.supabase
      .from('network_devices')
      .select('*')
      .eq('tenant_id', tenantId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data } = await query;
    return data;
  }

  async createDevice(
    tenantId: string,
    branchId: string | undefined,
    body: {
      name: string;
      type: string;
      ip_address: string;
      credentials: any;
    }
  ) {
    const adapter = NetworkAdapterFactory.create(body.type);
    
    const { data } = await this.supabase
      .from('network_devices')
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        name: body.name,
        type: body.type,
        ip_address: body.ip_address,
        encrypted_credentials: this.encryptCredentials(body.credentials, body.type)
      })
      .select()
      .single();

    return data;
  }

  async testDeviceConnection(deviceId: string, tenantId: string): Promise<ConnectionTestResult> {
    const { data: device } = await this.supabase
      .from('network_devices')
      .select('*')
      .eq('id', deviceId)
      .eq('tenant_id', tenantId)
      .single();

    if (!device) {
      return { success: false, error: 'DEVICE_NOT_FOUND' };
    }

    const adapter = NetworkAdapterFactory.create(device.type);
    const result = await adapter.testConnection(device as NetworkDevice);

    await this.supabase
      .from('network_devices')
      .update({
        status: result.success ? 'ONLINE' : 'OFFLINE',
        last_heartbeat: new Date().toISOString()
      })
      .eq('id', deviceId);

    return result;
  }

  async diagnoseUserConnection(userId: string, tenantId: string, branchId?: string) {
    const checks: Record<string, any> = {
      radius_session: null,
      mikrotik_queue: null,
      olt_port: null,
      package_expiry: null
    };

    const { data: userPackages } = await this.supabase
      .from('user_packages')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .gte('expires_at', new Date().toISOString())
      .single();

    checks.package_expiry = userPackages ? 'ACTIVE' : 'EXPIRED';

    if (userPackages?.nas_id) {
      const { data: nas } = await this.supabase
        .from('network_devices')
        .select('*')
        .eq('id', userPackages.nas_id)
        .single();

      if (nas) {
        const adapter = NetworkAdapterFactory.create('MIKROTIK');
        checks.mikrotik_queue = await adapter.testConnection(nas as NetworkDevice);
      }
    }

    return {
      userId,
      timestamp: new Date().toISOString(),
      checks,
      overall_status: Object.values(checks).every(c => c?.success || c === 'ACTIVE') ? 'CONNECTED' : 'NOT_CONNECTING'
    };
  }

  private encryptCredentials(credentials: any, deviceType: string): string {
    const key = process.env.HW_ENCRYPTION_KEY!;
    const encoded = Buffer.from(JSON.stringify(credentials)).toString('base64');
    const crypto = require('crypto');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(encoded, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted}`;
  }
}