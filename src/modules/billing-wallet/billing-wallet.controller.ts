import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { VoucherService } from './voucher.service';
import { RBACGuard, Roles } from '../core/security/rbac.guard';
import { TenantContext } from '../core/supabase/tenant.middleware';

@Controller('billing')
export class BillingWalletController {
  constructor(
    private walletService: WalletService,
    private voucherService: VoucherService
  ) {}

  @Get('wallet/balance')
  @UseGuards(RBACGuard)
  @Roles('USER', 'DEALER', 'ADMIN')
  async getBalance(@Req() req) {
    const ctx: TenantContext = req['tenantContext'];
    return this.walletService.getWalletBalance(ctx.userId, ctx.tenantId);
  }

  @Post('voucher/generate')
  @UseGuards(RBACGuard)
  @Roles('ADMIN', 'FRANCHISE', 'DEALER')
  async generateVouchers(
    @Req() req,
    @Body() body: { amount: number; quantity: number; expires_in_days?: number }
  ) {
    const ctx: TenantContext = req['tenantContext'];
    const vouchers = await this.voucherService.generateBulkVouchers(
      ctx.tenantId,
      body.amount,
      body.quantity,
      body.expires_in_days
    );
    return { vouchers: vouchers.map(v => ({ code: v.code, amount: v.amount })) };
  }

  @Post('voucher/redeem')
  @UseGuards(RBACGuard)
  @Roles('USER')
  async redeemVoucher(@Req() req, @Body() body: { code: string }) {
    const ctx: TenantContext = req['tenantContext'];
    const success = await this.voucherService.redeemVoucher(
      body.code,
      ctx.userId,
      ctx.tenantId
    );
    return { success };
  }
}