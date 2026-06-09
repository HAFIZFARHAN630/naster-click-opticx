import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { RBACGuard, Roles } from '../core/security/rbac.guard';
import { TenantContext } from '../core/supabase/tenant.middleware';
import { OfflineSyncService } from './offline-sync.service';

@Controller('field')
export class FieldAgentController {
  constructor(private syncService: OfflineSyncService) {}

  @Post('checkin')
  @UseGuards(RBACGuard)
  @Roles('STAFF')
  async checkIn(
    @Req() req,
    @Body() body: { latitude: number; longitude: number; photoBase64?: string }
  ) {
    const ctx: TenantContext = req['tenantContext'];
    const valid = await this.syncService.validateGPS(body.latitude, body.longitude);
    
    if (!valid.valid) {
      return { success: false, error: 'Outside geofence' };
    }

    return this.syncService.queueForSync(ctx.tenantId, ctx.userId, 'CHECK_IN', {
      locationId: valid.nearestLocation,
      photoUrl: body.photoBase64
    });
  }

  @Post('collect')
  @UseGuards(RBACGuard)
  @Roles('STAFF')
  async collectCash(
    @Req() req,
    @Body() body: { subscriberId: string; amount: number }
  ) {
    const ctx: TenantContext = req['tenantContext'];
    return this.syncService.queueForSync(ctx.tenantId, ctx.userId, 'COLLECT_CASH', {
      subscriberId: body.subscriberId,
      amount: body.amount
    });
  }

  @Get('sync/pending')
  @UseGuards(RBACGuard)
  @Roles('STAFF')
  async getPendingSync(@Req() req) {
    const ctx: TenantContext = req['tenantContext'];
    // Query pending sync items
    return [];
  }
}