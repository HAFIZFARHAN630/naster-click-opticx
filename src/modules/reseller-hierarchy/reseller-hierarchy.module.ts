import { Module } from '@nestjs/common';
import { ResellerHierarchyController } from './reseller-hierarchy.controller';
import { ResellerHierarchyService } from './reseller-hierarchy.service';
import { BillingWalletModule } from '../billing-wallet/billing-wallet.module';

@Module({
  imports: [BillingWalletModule],
  controllers: [ResellerHierarchyController],
  providers: [ResellerHierarchyService],
  exports: [ResellerHierarchyService]
})
export class ResellerHierarchyModule {}