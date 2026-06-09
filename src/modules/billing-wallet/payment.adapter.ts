import { Injectable } from '@nestjs/common';
import { createHash, createHmac } from 'crypto';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { createEvent, EVENT_TYPES } from '../../core/event-bus/event-bus.service';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  gateway: string;
  reference?: string;
}

export abstract class PaymentAdapter {
  abstract createPayment(data: {
    amount: number;
    currency: string;
    userId: string;
    walletId: string;
    returnUrl?: string;
  }): Promise<PaymentIntent>;

  abstract verifyWebhook(payload: string, signature: string): Promise<{ 
    valid: boolean; 
    transactionId?: string;
    amount?: number;
    metadata?: Record<string, any>;
  }>;
}

@Injectable()
export class StripeAdapter extends PaymentAdapter {
  private secretKey: string;
  private webhookSecret: string;

  constructor(private eventBus: EventBusService) {
    super();
    this.secretKey = process.env.STRIPE_SECRET_KEY!;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  }

  async createPayment(data: {
    amount: number;
    currency: string;
    userId: string;
    walletId: string;
    returnUrl?: string;
  }): Promise<PaymentIntent> {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount: (data.amount * 100).toString(),
        currency: data.currency,
        metadata: JSON.stringify({ userId: data.userId, walletId: data.walletId })
      })
    });

    const result = await response.json();

    return {
      id: result.id,
      amount: data.amount,
      currency: data.currency,
      status: 'PENDING',
      gateway: 'STRIPE',
      reference: result.client_secret
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<{ 
    valid: boolean; 
    transactionId?: string;
    amount?: number;
    metadata?: Record<string, any>;
  }> {
    try {
      const hmac = createHmac('sha256', this.webhookSecret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');
      
      if (signature !== `sha256=${expectedSignature}`) {
        return { valid: false };
      }

      const event = JSON.parse(payload);
      
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        return {
          valid: true,
          transactionId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          metadata: paymentIntent.metadata
        };
      }

      return { valid: false };
    } catch {
      return { valid: false };
    }
  }
}

@Injectable()
export class PayFastAdapter extends PaymentAdapter {
  async verifyWebhook(payload: string, signature: string): Promise<{ 
    valid: boolean; 
    transactionId?: string;
    amount?: number;
    metadata?: Record<string, any>;
  }> {
    const params = new URLSearchParams(payload);
    const pfData = this.parsePayFastData(params);
    
    const signatureData = Object.keys(pfData)
      .filter(k => k !== 'signature')
      .sort()
      .map(k => `${k=${pfData[k]}`)
      .join('');

    const expected = createHash('md5').update(signatureData + process.env.PAYFAST_MERCHANT_KEY).digest('hex');

    if (signature !== expected) {
      return { valid: false };
    }

    if (pfData.payment_status === 'COMPLETE') {
      return {
        valid: true,
        transactionId: pfData.pf_payment_id,
        amount: parseFloat(pfData.amount_gross),
        metadata: { user_id: pfData.user_id, wallet_id: pfData.wallet_id }
      };
    }

    return { valid: false };
  }

  private parsePayFastData(params: URLSearchParams): Record<string, string> {
    const data: Record<string, string> = {};
    params.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  }

  async createPayment(data: any): Promise<PaymentIntent> {
    throw new Error('PayFast creates payments via redirect URL');
  }
}

@Injectable()
export class JazzCashAdapter extends PaymentAdapter {
  async verifyWebhook(payload: string, signature: string): Promise<{ 
    valid: boolean; 
    transactionId?: string;
    amount?: number;
    metadata?: Record<string, any>;
  }> {
    const params = new URLSearchParams(payload);
    const data = this.parseJazzCashData(params);
    
    const signatureString = Object.keys(data)
      .filter(k => k !== 'secure_hash')
      .sort()
      .map(k => `${k}=${data[k]}`)
      .join('&');

    const expected = createHmac('sha256', process.env.JAZZCASH_SECRET_KEY!)
      .update(signatureString)
      .digest('hex');

    if (signature !== expected) {
      return { valid: false };
    }

    if (data.status === 'TS000000') {
      return {
        valid: true,
        transactionId: data.transaction_id,
        amount: parseFloat(data.amount),
        metadata: { user_id: data.user_id, wallet_id: data.wallet_id }
      };
    }

    return { valid: false };
  }

  private parseJazzCashData(params: URLSearchParams): Record<string, string> {
    const data: Record<string, string> = {};
    params.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  }

  async createPayment(data: any): Promise<PaymentIntent> {
    const response = await fetch('https://sandbox.jazzcash.com.pk/jazzcash/payment/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID!,
        pp_Password: process.env.JAZZCASH_PASSWORD!,
        pp_TxnRefNo: Date.now().toString(),
        pp_Amount: (data.amount * 100).toString(),
        pp_TxnDateTime: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
        pp_BillReference: 'ISP_WALLET',
        pp_Description: 'Wallet Credit',
        pp_CNIC: '',
        pp_CustomerID: '',
        pp_CustomerName: '',
        pp_CustomerEmail: '',
        pp_CustomerMobile: ''
      })
    });

    const result = await response.text();
    return {
      id: Date.now().toString(),
      amount: data.amount,
      currency: 'PKR',
      status: 'PENDING',
      gateway: 'JAZZCASH',
      reference: result
    };
  }
}

@Injectable()
export class PaymentGatewayService {
  private adapters: Map<string, PaymentAdapter>;

  constructor(
    private eventBus: EventBusService,
    private stripe: StripeAdapter,
    private payfast: PayFastAdapter,
    private jazzcash: JazzCashAdapter
  ) {
    this.adapters = new Map([
      ['STRIPE', stripe],
      ['PAYFAST', payfast],
      ['JAZZCASH', jazzcash]
    ]);
  }

  getAdapter(gateway: string): PaymentAdapter {
    return this.adapters.get(gateway);
  }

  async handleWebhook(gateway: string, payload: string, signature: string): Promise<void> {
    const adapter = this.getAdapter(gateway);
    const result = await adapter.verifyWebhook(payload, signature);

    if (result.valid && result.transactionId) {
      await this.eventBus.emit(createEvent({
        tenantId: result.metadata?.tenant_id,
        source: 'billing-wallet',
        eventId: `payment-${gateway.toLowerCase()}-success`,
        eventPayload: {
          transactionId: result.transactionId,
          amount: result.amount,
          walletId: result.metadata?.wallet_id
        }
      }));
    }
  }
}