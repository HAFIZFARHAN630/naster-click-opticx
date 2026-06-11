import 'ws'; // Polyfill for Node.js < 22
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { SupabaseService } from './core/supabase.service';
import { TenantGuard } from './core/tenant.guard';
import { EncryptionService } from './core/encryption.service';
import { QueueRegistry } from './core/queue.registry';
import { HardwareFactory } from './hardware/hardware.factory';
import { HardwareModule } from './hardware/hardware.module';
import { BillingModule } from './modules/billing/billing.module';
import { SystemModule } from './modules/system/system.module';
import { NetworkModule } from './modules/network/network.module';
import { HealthModule } from './modules/health/health.module';
import { TelemetryGateway } from './websockets/telemetry.gateway';
import { AiVoiceGateway } from './websockets/ai-voice.gateway';
import { MassRenewProcessor } from './queues/mass-renew.processor';
import { NetworkPollerService } from './queues/network-poller.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HardwareModule,
    BillingModule,
    SystemModule,
    NetworkModule,
    HealthModule
  ],
  providers: [
    SupabaseService,
    TenantGuard,
    EncryptionService,
    QueueRegistry,
    HardwareFactory,
    MassRenewProcessor,
    NetworkPollerService,
    TelemetryGateway,
    AiVoiceGateway
  ],
  exports: [SupabaseService, EncryptionService, QueueRegistry]
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.listen({ port: parseInt(process.env.PORT || '3000'), host: '0.0.0.0' });
  console.log(`Backend running on port ${process.env.PORT || '3000'}`);
}
bootstrap();