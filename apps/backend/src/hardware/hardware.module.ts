import { Module } from '@nestjs/common';
import { HardwareFactory } from './hardware.factory';

@Module({
  providers: [HardwareFactory],
  exports: [HardwareFactory]
})
export class HardwareModule {}