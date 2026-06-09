import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TenantContext {
  tenantId: string;
  branchId?: string;
  userId: string;
  userRole: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization token' });
      }

      const token = authHeader.substring(7);
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { data: userData } = await this.supabase
        .from('users')
        .select('tenant_id, branch_id, role')
        .eq('id', user.id)
        .single();

      if (!userData) {
        return res.status(403).json({ error: 'User not found in tenant' });
      }

      req['tenantContext'] = {
        tenantId: userData.tenant_id,
        branchId: userData.branch_id,
        userId: user.id,
        userRole: userData.role
      } as TenantContext;

      await this.supabase.rpc('set_tenant_context', {
        p_tenant_id: userData.tenant_id,
        p_branch_id: userData.branch_id,
        p_user_role: userData.role
      });

      next();
    } catch (error) {
      res.status(500).json({ error: 'Tenant context error' });
    }
  }
}

@Injectable()
export class SupabaseRLSModule {
  static setRLSContext(supabase: SupabaseClient, context: TenantContext) {
    return supabase.rpc('set_tenant_context', {
      p_tenant_id: context.tenantId,
      p_branch_id: context.branchId,
      p_user_role: context.userRole
    });
  }
}