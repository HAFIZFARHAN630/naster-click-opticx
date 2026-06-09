import { Module } from '@nestjs/common';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';
import { NetworkAdapterFactory } from './hardware.adapter';

@Module({
  controllers: [NetworkController],
  providers: [NetworkService],
  exports: [NetworkService]
})
export class NetworkNocModule {}