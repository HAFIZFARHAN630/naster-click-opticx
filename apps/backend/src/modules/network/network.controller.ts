import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../core/tenant.guard';
import { SupabaseService } from '../../core/supabase.service';
import { HardwareFactory } from '../../hardware/hardware.factory';

@Controller('devices')
@UseGuards(TenantGuard)
export class NetworkController {
  constructor(
    private supabase: SupabaseService,
    private hardwareFactory: HardwareFactory
  ) {}

  @Get()
  async listDevices(@Req() req) {
    const tenant = req.tenant;
    const client = this.supabase.getAdminClient();

    const { data } = await client
      .from('network_devices')
      .select('*')
      .eq('tenant_id', tenant.tenantId);

    return data || [];
  }

  @Post(':id/test-connection')
  async testConnection(@Param('id') id: string, @Req() req) {
    const tenant = req.tenant;
    const client = this.supabase.getAdminClient();

    const { data: device } = await client
      .from('network_devices')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenant.tenantId)
      .single();

    if (!device) {
      return { success: false, error: 'DEVICE_NOT_FOUND' };
    }

    const adapter = this.hardwareFactory.create(device.type, device.encrypted_credentials as any);
    const result = await adapter.testConnection();

    await client
      .from('network_devices')
      .update({
        status: result.success ? 'ONLINE' : 'OFFLINE',
        last_heartbeat: new Date().toISOString()
      })
      .eq('id', id);

    return result;
  }
}