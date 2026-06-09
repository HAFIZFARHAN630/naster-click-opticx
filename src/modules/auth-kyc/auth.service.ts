import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CloudinaryService } from '../core/security/cloudinary.service';
import { AESEncryptionService, HardwareCredentialEncryptor } from '../core/security/encryption.service';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private encryption: AESEncryptionService;

  constructor(
    private cloudinary: CloudinaryService
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.encryption = new AESEncryptionService(process.env.HW_ENCRYPTION_KEY);
  }

  async signup(email: string, password: string, full_name: string, tenant_subdomain: string) {
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', tenant_subdomain)
      .single();

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    await this.supabase
      .from('users')
      .insert({
        id: data.user?.id,
        tenant_id: tenant.id,
        email,
        full_name,
        role: 'USER',
        status: 'PENDING_VERIFICATION'
      });

    return data;
  }

  async uploadKYC(
    tenantId: string,
    userId: string,
    documentType: string,
    file: Buffer
  ): Promise<string> {
    return await this.cloudinary.uploadKYCDocument({
      tenantId,
      userId,
      documentType: documentType as any,
      file,
      filename: `${documentType}.jpg`
    });
  }
}