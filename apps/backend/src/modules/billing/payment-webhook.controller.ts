import { Controller, Post, Headers, Req, UseGuards } from '@nestjs/common';
import { createHash, createHmac } from 'crypto';
import { TenantGuard } from '../../core/tenant.guard';
import { SupabaseService } from '../../core/supabase.service';
import { QueueRegistry, QUEUE_NAMES } from '../../core/queue.registry';

@Controller('webhook')
export class PaymentWebhookController {
  constructor(
    private supabase: SupabaseService,
    private queueRegistry: QueueRegistry
  ) {}

  @Post('stripe')
  async stripeWebhook(@Headers('stripe-signature') signature: string, @Req() req: any) {
    const payload = JSON.stringify(req.body);
    const expectedSig = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');

    if (signature !== `sha256=${expectedSig}`) {
      return { success: false, error: 'INVALID_SIGNATURE' };
    }

    const event = req.body;
    if (event.type === 'payment_intent.succeeded') {
      const payment = event.data.object;
      await this.creditWallet(payment.metadata.wallet_id, payment.amount / 100, payment.id);
    }

    return { received: true };
  }

  @Post('payfast')
  async payfastWebhook(@Headers('pf-signature') signature: string, @Req() req: any) {
    const params = new URLSearchParams(req.body);
    const data = Object.fromEntries(params);
    
    const sigString = Object.keys(data)
      .filter(k => k !== 'signature')
      .sort()
      .map(k => `${k}=${data[k]}`)
      .join('');

    const expected = createHash('md5').update(sigString + process.env.PAYFAST_MERCHANT_KEY).digest('hex');

    if (signature !== expected) {
      return { success: false, error: 'INVALID_SIGNATURE' };
    }

    if (data.payment_status === 'COMPLETE') {
      await this.creditWallet(data.wallet_id, parseFloat(data.amount_gross), data.pf_payment_id);
    }

    return { received: true };
  }

  @Post('jazzcash')
  async jazzcashWebhook(@Headers('secure-hash') signature: string, @Req() req: any) {
    const data = req.body;
    
    const sigString = Object.keys(data)
      .filter(k => k !== 'secure_hash')
      .sort()
      .map(k => `${k}=${data[k]}`)
      .join('&');

    const expected = createHmac('sha256', process.env.JAZZCASH_SECRET_KEY!).update(sigString).digest('hex');

    if (signature !== expected) {
      return { success: false, error: 'INVALID_SIGNATURE' };
    }

    if (data.status === 'TS000000') {
      await this.creditWallet(data.wallet_id, parseFloat(data.amount), data.transaction_id);
    }

    return { received: true };
  }

  private async creditWallet(walletId: string, amount: number, transactionId: string) {
    const client = this.supabase.getAdminClient();

    const { error } = await client.rpc('credit_wallet_with_idempotency', {
      p_wallet_id: walletId,
      p_amount: amount,
      p_idempotency_key: transactionId
    });

    if (error) {
      console.error('Wallet credit failed:', error);
      return;
    }

    const queue = this.queueRegistry.getQueue(QUEUE_NAMES.MASS_RENEW);
    await queue.add('payment-success', { walletId, amount, transactionId }, { jobId: `payment-${transactionId}` });
  }
}