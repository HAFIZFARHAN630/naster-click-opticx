import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { QueueRegistry } from '../../core/queue.registry';
import { SupabaseService } from '../../core/supabase.service';

@Module({
  controllers: [CronController],
  providers: [QueueRegistry, SupabaseService, {
    provide: 'TENANT_GUARD',
    useClass: class {
      canActivate = async () => true;
    }
  }]
})
export class SystemModule {}