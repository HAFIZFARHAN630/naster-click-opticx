import { Module, MiddlewareConsumer } from '@nestjs/common';
import { SupabaseModule } from '../core/supabase/supabase.module';
import { TenantMiddleware } from '../core/supabase/tenant.middleware';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CloudinaryService } from '../core/security/cloudinary.service';
import { AESEncryptionService } from '../core/security/encryption.service';

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [AuthService, CloudinaryService, AESEncryptionService],
  exports: [AuthService]
})
export class AuthKycModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes(AuthController);
  }
}