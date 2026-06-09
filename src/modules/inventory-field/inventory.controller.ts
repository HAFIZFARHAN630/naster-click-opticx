import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { RBACGuard, Roles } from '../core/security/rbac.guard';
import { TenantContext } from '../core/supabase/tenant.middleware';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('items')
  @UseGuards(RBACGuard)
  @Roles('ADMIN', 'STAFF', 'FRANCHISE', 'DEALER')
  async listItems(@Req() req) {
    const ctx: TenantContext = req['tenantContext'];
    return this.inventoryService.listItems(ctx.tenantId, ctx.branchId);
  }

  @Post('items')
  @UseGuards(RBACGuard)
  @Roles('ADMIN', 'STAFF')
  async createItem(@Req() req, @Body() body: { macAddress: string; serialNumber: string; deviceType: string }) {
    const ctx: TenantContext = req['tenantContext'];
    return this.inventoryService.createItem(ctx.tenantId, ctx.branchId, body);
  }

  @Post('items/:id/assign')
  @UseGuards(RBACGuard)
  @Roles('ADMIN', 'STAFF', 'FRANCHISE', 'DEALER')
  async assignItem(@Req() req, @Body() body: { userId: string; location?: string }) {
    const ctx: TenantContext = req['tenantContext'];
    // Assignment logic
    return { success: true };
  }
}