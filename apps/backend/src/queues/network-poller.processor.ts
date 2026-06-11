import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueRegistry, QUEUE_NAMES } from '../core/queue.registry';
import { SupabaseService } from '../core/supabase.service';
import { HardwareFactory } from '../hardware/hardware.factory';

@Injectable()
export class NetworkPollerService implements OnModuleInit {
  private job: any;
  private logger = new Logger(NetworkPollerService.name);

  constructor(
    private queueRegistry: QueueRegistry,
    private supabase: SupabaseService,
    private hardwareFactory: HardwareFactory
  ) {}

  async onModuleInit() {
    const queue = this.queueRegistry.getQueue(QUEUE_NAMES.NETWORK_POLLER);
    if (queue) {
      this.job = await queue.add('poll-devices', {}, { removeOnComplete: true });
      this.logger.log('Network poller scheduled (manual trigger)');
    } else {
      this.logger.warn('Redis unavailable, network poller disabled');
    }
  }

  private async pollAllDevices() {
    const client = this.supabase.getAdminClient();
    const { data: tenants } = await client.from('tenants').select('id');

    for (const tenant of tenants || []) {
      const { data: devices } = await client
        .from('network_devices')
        .select('*')
        .eq('tenant_id', tenant.id);

      for (const device of devices || []) {
        try {
          const result = await this.hardwareFactory.create(device.type, device.encrypted_credentials as any).testConnection();

          await client
            .from('network_devices')
            .update({
              status: result.success ? 'ONLINE' : 'OFFLINE',
              last_heartbeat: new Date().toISOString()
            })
            .eq('id', device.id);

          if (!result.success) {
            this.logger.warn(`Device ${device.name} offline: ${result.error}`);
          }
        } catch (error: any) {
          this.logger.error(`Poll error for ${device.id}: ${error.message}`);
        }
      }
    }
  }

  async handle(job: any) {
    await this.pollAllDevices();
  }
}