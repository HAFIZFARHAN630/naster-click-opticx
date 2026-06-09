import { Controller, Get, Post, Body, Headers, Req, UseGuards } from '@nestjs/common';
import { createHash, createHmac } from 'crypto';
import { TenantGuard } from '../../core/tenant.guard';
import { SupabaseService } from '../../core/supabase.service';
import { QueueRegistry, QUEUE_NAMES } from '../../core/queue.registry';

@Controller('wallet')
@UseGuards(TenantGuard)
export class WalletController {
  constructor(
    private supabase: SupabaseService,
    private queueRegistry: QueueRegistry
  ) {}

  @Get('balance')
  async getBalance(@Req() req) {
    const tenant = req.tenant;
    const client = this.supabase.getAdminClient();
    
    const { data } = await client
      .from('wallets')
      .select('balance')
      .eq('tenant_id', tenant.tenantId)
      .eq('user_id', tenant.userId)
      .single();

    return { balance: data?.balance || 0 };
  }

  @Post('transfer')
  async transferCredits(
    @Req() req,
    @Body() body: { toUserId: string; amount: number; idempotencyKey: string }
  ) {
    const tenant = req.tenant;
    const client = this.supabase.getAdminClient();

    const { data, error } = await client.rpc('transfer_credits', {
      p_from_wallet: tenant.userId,
      p_to_wallet: body.toUserId,
      p_amount: body.amount,
      p_idempotency_key: body.idempotencyKey
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }
}