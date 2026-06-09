import { Controller, Post, Headers, Body, Req, UnauthorizedException } from '@nestjs/common';
import { PaymentGatewayService } from './payment.adapter';
import { WalletService } from './wallet.service';

@Controller('webhook')
export class PaymentWebhookController {
  constructor(
    private paymentGateway: PaymentGatewayService,
    private walletService: WalletService
  ) {}

  @Post('stripe')
  async handleStripe(
    @Headers('stripe-signature') signature: string,
    @Body() payload: string
  ) {
    await this.paymentGateway.handleWebhook('STRIPE', payload, signature);
    return { received: true };
  }

  @Post('payfast')
  async handlePayFast(
    @Headers('pf-signature') signature: string,
    @Body() payload: string
  ) {
    await this.paymentGateway.handleWebhook('PAYFAST', payload, signature);
    return { received: true };
  }

  @Post('jazzcash')
  async handleJazzCash(
    @Headers('secure-hash') signature: string,
    @Body() body: {
      transaction_id: string;
      status: string;
      amount: string;
      user_id: string;
      wallet_id: string;
      secure_hash: string;
    }
  ) {
    const payload = JSON.stringify(body);
    await this.processWalletCredit(body.wallet_id, body.amount, body.transaction_id);
    return { received: true };
  }

  private async processWalletCredit(walletId: string, amount: string, transactionId: string) {
    await this.walletService.creditWallet(
      walletId,
      parseFloat(amount),
      `webhook-${transactionId}`,
      'Payment Gateway Credit'
    );
  }
}