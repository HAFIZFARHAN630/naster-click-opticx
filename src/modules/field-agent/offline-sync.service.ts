import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class OfflineSyncService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async queueForSync(
    tenantId: string,
    userId: string,
    action: string,
    data: any
  ): Promise<string> {
    const { data: result } = await this.supabase
      .from('offline_sync_queue')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        action,
        data,
        status: 'PENDING'
      })
      .select()
      .single();

    return result?.id;
  }

  async processSyncQueue(tenantId: string): Promise<void> {
    const { data: pendingItems } = await this.supabase
      .from('offline_sync_queue')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'PENDING');

    for (const item of pendingItems || []) {
      try {
        await this.processSyncItem(item);
        await this.supabase
          .from('offline_sync_queue')
          .update({ status: 'SYNCED', synced_at: new Date().toISOString() })
          .eq('id', item.id);
      } catch (error) {
        await this.supabase
          .from('offline_sync_queue')
          .update({ status: 'FAILED' })
          .eq('id', item.id);
      }
    }
  }

  private async processSyncItem(item: any): Promise<void> {
    switch (item.action) {
      case 'CHECK_IN':
        await this.supabase.from('check_ins').insert({
          tenant_id: item.tenant_id,
          user_id: item.user_id,
          location_id: item.data.locationId,
          photo_url: item.data.photoUrl
        });
        break;
      case 'COLLECT_CASH':
        await this.supabase.from('collections').insert({
          tenant_id: item.tenant_id,
          user_id: item.user_id,
          amount: item.data.amount,
          subscriber_id: item.data.subscriberId
        });
        break;
    }
  }

  async validateGPS(
    lat: number,
    lng: number
  ): Promise<{ valid: boolean; nearestLocation?: string }> {
    const { data } = await this.supabase
      .from('checkin_locations')
      .select('*');

    for (const loc of data || []) {
      const distance = this.calculateDistance(lat, lng, loc.latitude, loc.longitude);
      if (distance <= loc.radius_meters) {
        return { valid: true, nearestLocation: loc.location_name };
      }
    }

    return { valid: false };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}