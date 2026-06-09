import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WalletService } from '../billing-wallet/wallet.service';

@Injectable()
export class ResellerHierarchyService {
  private supabase: SupabaseClient;

  constructor(private walletService: WalletService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async transferCredits(
    tenantId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    idempotencyKey: string
  ): Promise<{ success: boolean; transferId?: string }> {
    const { data: transfer } = await this.supabase
      .from('credit_transfers')
      .insert({
        tenant_id: tenantId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount,
        reference: idempotencyKey
      })
      .select()
      .single();

    if (!transfer) {
      return { success: false };
    }

    await this.walletService.transferCredit(
      fromUserId,
      toUserId,
      amount,
      idempotencyKey
    );

    return { success: true, transferId: transfer.id };
  }

  async approveTransfer(
    tenantId: string,
    transferId: string,
    approverId: string
  ): Promise<{ success: boolean }> {
    const { error } = await this.supabase
      .from('credit_transfers')
      .update({
        status: 'APPROVED',
        approved_by: approverId,
        approved_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .eq('tenant_id', tenantId)
      .eq('status', 'PENDING');

    return { success: !error };
  }

  async requestWithdrawal(
    tenantId: string,
    userId: string,
    amount: number,
    bankDetails: any
  ): Promise<{ success: boolean; withdrawalId?: string }> {
    const { data } = await this.supabase
      .from('withdrawal_requests')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        amount,
        bank_details: bankDetails,
        status: 'PENDING'
      })
      .select()
      .single();

    return { success: !!data, withdrawalId: data?.id };
  }
}