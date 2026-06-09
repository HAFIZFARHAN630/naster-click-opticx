import { Queue, Worker, Job } from 'bullmq';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { NetworkService } from '../modules/network-noc/network.service';
import { NetworkAdapterFactory, HardwareAdapter } from '../modules/network-noc/hardware.adapter';

@Injectable()
export class NetworkPollerService implements OnModuleInit {
  private queue: Queue;
  private worker: Worker;
  private logger = new Logger(NetworkPollerService.name);

  constructor(private networkService: NetworkService) {
    this.queue = new Queue('network-poller', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
  }

  onModuleInit() {
    this.worker = new Worker('network-poller', async (job: Job) => {
      await this.pollAllDevices();
    }, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      },
      repeat: { cron: '*/30 * * * * *' }
    });

    this.logger.log('Network poller started (30s interval)');
  }

  private async pollAllDevices() {
    const tenants = await this.getAllTenants();
    
    for (const tenant of tenants) {
      const devices = await this.networkService.listDevices(tenant.id);
      
      for (const device of devices) {
        try {
          const result = await NetworkAdapterFactory.create(device.type)
            .testConnection(device);
          
          await this.updateDeviceStatus(device.id, result);
          
          if (!result.success) {
            this.logger.warn(`Device ${device.name} offline: ${result.error}`);
          }
        } catch (error) {
          this.logger.error(`Poll error for ${device.id}: ${error.message}`);
        }
      }
    }
  }

  private async updateDeviceStatus(deviceId: string, result: any) {
    const { error } = await import('@supabase/supabase-js').then(({ createClient }) => 
      createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        .from('network_devices')
        .update({
          status: result.success ? 'ONLINE' : 'OFFLINE',
          last_heartbeat: new Date().toISOString()
        })
        .eq('id', deviceId)
    );
    
    if (error) {
      this.logger.error(`Failed to update status: ${error.message}`);
    }
  }

  private async getAllTenants(): Promise<Array<{ id: string }>> {
    const { data } = await import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        .from('tenants')
        .select('id')
    );
    return data || [];
  }

  async triggerTestConnection(deviceId: string) {
    return this.networkService.testDeviceConnection(deviceId, '');
  }
}