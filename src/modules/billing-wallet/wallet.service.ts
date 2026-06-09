import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { createEvent, EVENT_TYPES } from '../../core/event-bus/event-bus.service';

export interface WalletChain {
  adminWallet: string;
  franchiseWallet: string;
  dealerWallet: string;
  userWallet: string;
}

export type TransactionType = 'CREDIT' | 'DEBIT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'COMMISSION';

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  reference?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

@Injectable()
export class WalletService {
  private supabase: SupabaseClient;

  constructor(private eventBus: EventBusService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async getWalletBalance(userId: string, tenantId: string): Promise<{ balance: number }> {
    const { data } = await this.supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();
    
    return { balance: data?.balance || 0 };
  }

  async creditWallet(
    walletId: string,
    amount: number,
    idempotencyKey: string,
    reference?: string
  ): Promise<Transaction> {
    const { data } = await this.supabase.rpc('credit_wallet_with_idempotency', {
      p_wallet_id: walletId,
      p_amount: amount,
      p_idempotency_key: idempotencyKey,
      p_reference: reference
    });

    const transaction = data as Transaction;

    await this.eventBus.emit(createEvent({
      tenantId: data.tenant_id,
      source: 'billing-wallet',
      eventId: `wallet-credited-${idempotencyKey}`,
      eventPayload: { walletId, amount, transactionId: transaction.id }
    }));

    return transaction;
  }

  async debitWallet(
    walletId: string,
    amount: number,
    idempotencyKey: string,
    reference?: string
  ): Promise<Transaction> {
    const { data } = await this.supabase.rpc('debit_wallet_with_idempotency', {
      p_wallet_id: walletId,
      p_amount: amount,
      p_idempotency_key: idempotencyKey,
      p_reference: reference
    });

    return data as Transaction;
  }

  async transferCredit(
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    idempotencyKey: string
  ): Promise<{ success: boolean }> {
    const { data } = await this.supabase.rpc('transfer_credits', {
      p_from_wallet: fromWalletId,
      p_to_wallet: toWalletId,
      p_amount: amount,
      p_idempotency_key: idempotencyKey
    });

    return { success: data };
  }
}