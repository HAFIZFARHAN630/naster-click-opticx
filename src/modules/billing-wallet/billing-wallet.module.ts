import { Module } from '@nestjs/common';
import { BillingWalletController } from './billing-wallet.controller';
import { WalletService } from './wallet.service';
import { VoucherService } from './voucher.service';
import { PaymentGatewayService } from './payment.adapter';
import { StripeAdapter } from './payment.adapter';
import { PayFastAdapter } from './payment.adapter';
import { JazzCashAdapter } from './payment.adapter';
import { PaymentWebhookController } from './payment-webhook.controller';

@Module({
  controllers: [BillingWalletController, PaymentWebhookController],
  providers: [
    WalletService,
    VoucherService,
    PaymentGatewayService,
    StripeAdapter,
    PayFastAdapter,
    JazzCashAdapter
  ],
  exports: [WalletService, VoucherService, PaymentGatewayService]
})
export class BillingWalletModule {}