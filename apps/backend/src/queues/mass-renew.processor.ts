import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueRegistry, QUEUE_NAMES } from '../core/queue.registry';
import { SupabaseService } from '../core/supabase.service';
import { HardwareFactory } from '../hardware/hardware.factory';

@Injectable()
export class MassRenewProcessor {
  private processor: any;
  private logger = new Logger(MassRenewProcessor.name);

  constructor(
    private queueRegistry: QueueRegistry,
    private supabase: SupabaseService,
    private hardwareFactory: HardwareFactory
  ) {
    this.processor = this.queueRegistry.createWorker(QUEUE_NAMES.MASS_RENEW, this.processJob.bind(this));
    if (!this.processor) {
      this.logger.warn('Redis unavailable, mass renew worker disabled');
    }
  }

  private async processJob(job: Job): Promise<void> {
    const { tenantId, userIds, validityDays } = job.data;

    for (const userId of userIds) {
      try {
        await this.renewUser(tenantId, userId, validityDays);
      } catch (error: any) {
        this.logger.error(`Failed to renew user ${userId}: ${error.message}`);
      }
    }
  }

  private async renewUser(tenantId: string, userId: string, days: number): Promise<void> {
    const client = this.supabase.getAdminClient();

    const { data: userPackage } = await client
      .from('user_packages')
      .select('*, nas_id')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (!userPackage) {
      throw new Error('No active package');
    }

    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);

    await client
      .from('user_packages')
      .update({ expires_at: newExpiry.toISOString() })
      .eq('id', userPackage.id);

    if (userPackage.nas_id) {
      const { data: nas } = await client
        .from('network_devices')
        .select('*')
        .eq('id', userPackage.nas_id)
        .single();

      if (nas) {
        const adapter = this.hardwareFactory.create('MIKROTIK', nas.encrypted_credentials as any);
        await adapter.executeCommand('UPDATE_PROFILE', { userId, profile: userPackage.mikrotik_profile });
      }
    }
  }
}