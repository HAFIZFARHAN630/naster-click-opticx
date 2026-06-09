import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { RBACGuard, Roles } from '../core/security/rbac.guard';
import { TenantContext } from '../core/supabase/tenant.middleware';
import { NetworkService } from './network.service';

@Controller('network')
export class NetworkController {
  constructor(private networkService: NetworkService) {}

  @Get('devices')
  @UseGuards(RBACGuard)
  @Roles('ADMIN', 'STAFF', 'FRANCHISE', 'DEALER')
  async listDevices(@Req() req) {
    const ctx: TenantContext = req['tenantContext'];
    return this.networkService.listDevices(ctx.tenantId, ctx.branchId);
  }

  @Post('devices')
  @UseGuards(RBACGuard)
  @Roles('ADMIN', 'STAFF')
  async createDevice(@Req() req, @Body() body: {
    name: string;
    type: string;
    ip_address: string;
    credentials: any;
  }) {
    const ctx: TenantContext = req['tenantContext'];
    return this.networkService.createDevice(ctx.tenantId, ctx.branchId, body);
  }

  @Post('devices/:id/test-connection')
  @UseGuards(RBACGuard)
  @Roles('ADMIN', 'STAFF')
  async testConnection(@Param('id') id: string, @Req() req) {
    const ctx: TenantContext = req['tenantContext'];
    return this.networkService.testDeviceConnection(id, ctx.tenantId);
  }

  @Get('diagnostics/user/:userId')
  @UseGuards(RBACGuard)
  @Roles('ADMIN', 'STAFF', 'FRANCHISE', 'DEALER')
  async userDiagnostics(@Param('userId') userId: string, @Req() req) {
    const ctx: TenantContext = req['tenantContext'];
    return this.networkService.diagnoseUserConnection(userId, ctx.tenantId, ctx.branchId);
  }
}