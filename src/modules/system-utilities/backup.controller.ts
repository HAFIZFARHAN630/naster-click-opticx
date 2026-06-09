import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { RBACGuard, Roles } from '../core/security/rbac.guard';
import { BackupCronService } from './backup-cron.service';

@Controller('system/backup')
export class BackupCronController {
  constructor(private backupService: BackupCronService) {}

  @Post('trigger')
  @UseGuards(RBACGuard)
  @Roles('ADMIN')
  async triggerBackup() {
    const job = await this.backupService.triggerManualBackup();
    return { jobId: job.id, success: true, status: 'RUNNING' };
  }

  @Get('status')
  @UseGuards(RBACGuard)
  @Roles('ADMIN', 'STAFF')
  async getStatus() {
    return { 
      scheduled: '0 0 * * * (daily)',
      lastRun: new Date().toISOString()
    };
  }
}