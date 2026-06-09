import { Module } from '@nestjs/common';
import { NetworkController } from './network.controller';
import { SupabaseService } from '../../core/supabase.service';
import { HardwareFactory } from '../../hardware/hardware.factory';

@Module({
  controllers: [NetworkController],
  providers: [SupabaseService, HardwareFactory]
})
export class NetworkModule {}