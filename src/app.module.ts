import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './core/supabase/supabase.module';
import { AuthKycModule } from './modules/auth-kyc/auth-kyc.module';
import { BillingWalletModule } from './modules/billing-wallet/billing-wallet.module';
import { NetworkNocModule } from './modules/network-noc/network-noc.module';
import { SystemUtilitiesModule } from './modules/system-utilities/system-utilities.module';
import { InventoryFieldModule } from './modules/inventory-field/inventory-field.module';
import { ResellerHierarchyModule } from './modules/reseller-hierarchy/reseller-hierarchy.module';
import { FieldAgentModule } from './modules/field-agent/field-agent.module';
import { TenantMiddleware } from './core/supabase/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthKycModule,
    BillingWalletModule,
    NetworkNocModule,
    SystemUtilitiesModule,
    InventoryFieldModule,
    ResellerHierarchyModule,
    FieldAgentModule
  ]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}