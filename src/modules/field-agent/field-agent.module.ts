import { Module } from '@nestjs/common';
import { FieldAgentController } from './field-agent.controller';
import { OfflineSyncService } from './offline-sync.service';

@Module({
  controllers: [FieldAgentController],
  providers: [OfflineSyncService],
  exports: [OfflineSyncService]
})
export class FieldAgentModule {}