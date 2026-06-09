import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Voucher {
  id: string;
  tenantId: string;
  code: string;
  amount: number;
  currency: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  expiresAt: Date;
  usedBy?: string;
  usedAt?: Date;
  createdAt: Date;
}

@Injectable()
export class VoucherService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  generatePIN(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pin = '';
    for (let i = 0; i < length; i++) {
      pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pin;
  }

  async generateBulkVouchers(
    tenantId: string,
    amount: number,
    quantity: number,
    expiresInDays: number = 365
  ): Promise<Voucher[]> {
    const vouchers: Voucher[] = [];
    
    for (let i = 0; i < quantity; i++) {
      const voucher: Voucher = {
        id: crypto.randomUUID(),
        tenantId,
        code: this.generatePIN(16),
        amount,
        currency: 'PKR',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      };
      vouchers.push(voucher);
    }

    await this.supabase.from('vouchers').insert(vouchers);
    return vouchers;
  }

  async validateVoucher(code: string, tenantId: string): Promise<Voucher | null> {
    const { data } = await this.supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .eq('tenant_id', tenantId)
      .eq('status', 'ACTIVE')
      .gt('expires_at', new Date().toISOString())
      .single();

    return data as Voucher;
  }

  async redeemVoucher(code: string, userId: string, tenantId: string): Promise<boolean> {
    const voucher = await this.validateVoucher(code, tenantId);
    if (!voucher) return false;

    const { error } = await this.supabase
      .from('vouchers')
      .update({
        status: 'USED',
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', voucher.id);

    return !error;
  }

  async generatePDF(voucherCodes: string[]): Promise<string> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: Arial, sans-serif; }
        .voucher { border: 2px solid #000; padding: 20px; margin: 10px; page-break-inside: avoid; }
        .code { font-size: 24px; font-weight: bold; letter-spacing: 5px; }
      </style></head>
      <body>
        <h1>ISP Voucher Codes</h1>
        ${voucherCodes.map(code => `
          <div class="voucher">
            <div class="code">${code}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const response = await fetch('https://api.cloudinary.com/v1_1/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.CLOUDINARY_API_KEY + ':' + process.env.CLOUDINARY_API_SECRET).toString('base64')}`
      },
      body: new URLSearchParams({
        file: `data:text/html;base64,${Buffer.from(html).toString('base64')}`,
        folder: 'vouchers',
        public_id: `voucher_batch_${Date.now()}`,
        resource_type: 'raw'
      })
    });

    const result = await response.json();
    return result.secure_url;
  }
}