import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InventoryItem } from './inventory-field.types';

@Injectable()
export class InventoryService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async createItem(
    tenantId: string,
    branchId: string | undefined,
    data: {
      macAddress: string;
      serialNumber: string;
      deviceType: string;
    }
  ): Promise<InventoryItem> {
    const { data: result } = await this.supabase
      .from('inventory_items')
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        mac_address: data.macAddress,
        serial_number: data.serialNumber,
        device_type: data.deviceType
      })
      .select()
      .single();

    return result;
  }

  async assignItem(
    tenantId: string,
    itemId: string,
    userId: string,
    location?: string
  ): Promise<{ success: boolean }> {
    const { error } = await this.supabase
      .from('inventory_items')
      .update({
        status: 'ASSIGNED',
        assigned_to: userId,
        location: location
      })
      .eq('id', itemId)
      .eq('tenant_id', tenantId)
      .eq('status', 'NEW');

    return { success: !error };
  }

  async recoverItem(
    tenantId: string,
    itemId: string
  ): Promise<{ success: boolean }> {
    const { error } = await this.supabase
      .from('inventory_items')
      .update({
        status: 'RECOVERED',
        assigned_to: null
      })
      .eq('id', itemId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ASSIGNED');

    return { success: !error };
  }

  async listItems(
    tenantId: string,
    branchId?: string,
    status?: string
  ): Promise<InventoryItem[]> {
    let query = this.supabase
      .from('inventory_items')
      .select('*')
      .eq('tenant_id', tenantId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query;
    return data || [];
  }
}