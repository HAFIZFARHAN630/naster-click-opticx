import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization');
    }

    const token = authHeader.substring(7);
    const adminClient = this.supabase.getAdminClient();

    const { data: { user }, error } = await adminClient.auth.getUser(token);
    if (error || !user) {
      throw new UnauthorizedException('Invalid token');
    }

    const { data: userData } = await adminClient
      .from('users')
      .select('tenant_id, branch_id, role')
      .eq('id', user.id)
      .single();

    if (!userData) {
      throw new UnauthorizedException('User not found');
    }

    request.tenant = {
      tenantId: userData.tenant_id,
      branchId: userData.branch_id,
      userRole: userData.role,
      userId: user.id
    };

    await this.supabase.setTenantContext(userData.tenant_id, userData.branch_id, userData.role);

    return true;
  }
}