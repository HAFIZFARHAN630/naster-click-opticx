import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;
  private adminClient: SupabaseClient;
  private logger = new Logger(SupabaseService.name);

  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    this.adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'public' } }
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  async setTenantContext(tenantId: string, branchId?: string | null, userRole?: string) {
    await this.adminClient.rpc('set_tenant_context', {
      p_tenant_id: tenantId,
      p_branch_id: branchId || null,
      p_user_role: userRole
    });
  }
}

export interface TenantContext {
  tenantId: string;
  branchId?: string;
  userRole: string;
  userId: string;
}