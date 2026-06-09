import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { RBACGuard, Roles } from '../core/security/rbac.guard';
import { TenantContext } from '../core/supabase/tenant.middleware';
import { ResellerHierarchyService } from './reseller-hierarchy.service';

@Controller('reseller')
export class ResellerHierarchyController {
  constructor(private resellerService: ResellerHierarchyService) {}

  @Post('transfer')
  @UseGuards(RBACGuard)
  @Roles('FRANCHISE', 'DEALER', 'ADMIN')
  async transferCredits(
    @Req() req,
    @Body() body: { toUserId: string; amount: number }
  ) {
    const ctx: TenantContext = req['tenantContext'];
    return this.resellerService.transferCredits(
      ctx.tenantId,
      ctx.userId,
      body.toUserId,
      body.amount,
      `transfer-${Date.now()}`
    );
  }

  @Post('withdrawal')
  @UseGuards(RBACGuard)
  @Roles('DEALER', 'FRANCHISE', 'ADMIN')
  async requestWithdrawal(@Req() req, @Body() body: { amount: number; bankDetails: any }) {
    const ctx: TenantContext = req['tenantContext'];
    return this.resellerService.requestWithdrawal(
      ctx.tenantId,
      ctx.userId,
      body.amount,
      body.bankDetails
    );
  }

  @Post('withdrawal/:id/approve')
  @UseGuards(RBACGuard)
  @Roles('ADMIN')
  async approveWithdrawal(@Req() req, @Body() body: { withdrawalId: string }) {
    const ctx: TenantContext = req['tenantContext'];
    return this.resellerService.approveTransfer(ctx.tenantId, body.withdrawalId, ctx.userId);
  }
}