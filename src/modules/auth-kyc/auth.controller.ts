import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RBACGuard, Roles } from '../core/security/rbac.guard';
import { TenantContext } from '../core/supabase/tenant.middleware';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: { 
    email: string; 
    password: string; 
    full_name: string;
    tenant_subdomain: string;
  }) {
    return await this.authService.signup(
      body.email,
      body.password,
      body.full_name,
      body.tenant_subdomain
    );
  }

  @Post('kyc/upload')
  @UseGuards(RBACGuard)
  @Roles('USER')
  async uploadKYC(@Req() req, @Body() body: { 
    document_type: string;
    file_base64: string;
  }) {
    const ctx: TenantContext = req['tenantContext'];
    return await this.authService.uploadKYC(
      ctx.tenantId,
      ctx.userId,
      body.document_type,
      Buffer.from(body.file_base64, 'base64')
    );
  }

  @Get('profile')
  async getProfile(@Req() req) {
    const ctx: TenantContext = req['tenantContext'];
    return { 
      tenant_id: ctx.tenantId,
      branch_id: ctx.branchId,
      user_role: ctx.userRole
    };
  }
}