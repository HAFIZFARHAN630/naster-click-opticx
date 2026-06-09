import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { RBACGuard, Roles } from '../core/security/rbac.guard';
import { CronManagementService } from './cron.service';

@Controller('system/cron')
export class CronController {
  constructor(private cronService: CronManagementService) {}

  @Get('jobs')
  @UseGuards(RBACGuard)
  @Roles('ADMIN', 'STAFF')
  async listJobs() {
    return this.cronService.listCronJobs();
  }

  @Post('jobs/:queue/:id/pause')
  @UseGuards(RBACGuard)
  @Roles('ADMIN')
  async pauseJob(@Param('queue') queue: string, @Param('id') id: string) {
    await this.cronService.pauseJob(queue, id);
    return { success: true };
  }

  @Post('jobs/:queue/:id/resume')
  @UseGuards(RBACGuard)
  @Roles('ADMIN')
  async resumeJob(@Param('queue') queue: string, @Param('id') id: string) {
    await this.cronService.resumeJob(queue, id);
    return { success: true };
  }

  @Post('jobs/:queue/trigger')
  @UseGuards(RBACGuard)
  @Roles('ADMIN', 'STAFF')
  async triggerJob(@Param('queue') queue: string) {
    const job = await this.cronService.triggerJob(queue);
    return { jobId: job.id, success: true };
  }
}