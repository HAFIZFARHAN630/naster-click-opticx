import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { CronManagementService } from './cron.service';
import { BackupCronController } from './backup.controller';
import { BackupCronService } from './backup-cron.service';
import { CloudinaryService } from '../../core/security/cloudinary.service';

@Module({
  controllers: [CronController, BackupCronController],
  providers: [CronManagementService, BackupCronService, CloudinaryService],
  exports: [CronManagementService, BackupCronService]
})
export class SystemUtilitiesModule {}