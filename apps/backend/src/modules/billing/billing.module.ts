import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import { SupabaseService } from '../../core/supabase.service';
import { QueueRegistry } from '../../core/queue.registry';

@Module({
  controllers: [WalletController, PaymentWebhookController],
  providers: [SupabaseService, QueueRegistry]
})
export class BillingModule {}