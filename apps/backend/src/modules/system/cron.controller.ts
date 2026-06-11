import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { QueueRegistry, QUEUE_NAMES } from '../../core/queue.registry';

@Controller('cron')
export class CronController {
  constructor(private queueRegistry: QueueRegistry) {}

  @Get('jobs')
  async listJobs() {
    const queue = this.queueRegistry.getQueue(QUEUE_NAMES.MASS_RENEW);
    const jobs = await queue.getJobs(['active', 'waiting', 'delayed']).catch(() => []);
    return { jobs };
  }

  @Post('jobs/:queue/trigger')
  async triggerJob(@Param('queue') queue: string, @Body() body?: any) {
    const q = this.queueRegistry.getQueue(queue);
    const job = await q.add('manual-trigger', body || {}, { removeOnComplete: true });
    return { jobId: job.id };
  }
}