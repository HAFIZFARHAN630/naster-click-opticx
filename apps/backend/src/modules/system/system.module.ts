import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { QueueRegistry } from '../../core/queue.registry';

@Module({
  controllers: [CronController],
  providers: [QueueRegistry]
})
export class SystemModule {}