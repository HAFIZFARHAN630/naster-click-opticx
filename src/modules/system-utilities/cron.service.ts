import { Injectable, Logger } from '@nestjs/common';
import { Queue, Job } from 'bullmq';

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  lastRun?: Date;
  nextRun?: Date;
}

@Injectable()
export class CronManagementService {
  private queue: Queue;
  private logger = new Logger(CronManagementService.name);

  constructor() {
    this.queue = new Queue('system-cron', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
  }

  async listCronJobs(): Promise<CronJob[]> {
    const queues = ['network-poller', 'mass-operations', 'backup-cron'];
    const jobs: CronJob[] = [];

    for (const queueName of queues) {
      const queue = new Queue(queueName, {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379')
        }
      });

      const repeatableJobs = await queue.getJobSchedulers(0, 100);
      
      for (const job of repeatableJobs) {
        jobs.push({
          id: job.id || '',
          name: job.name,
          schedule: job.cronExpression || '',
          status: 'ACTIVE',
          nextRun: job.nextRunAt ? new Date(job.nextRunAt) : undefined
        });
      }
    }

    return jobs;
  }

  async pauseJob(queue: string, jobId: string): Promise<void> {
    const q = new Queue(queue, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
    await q.pauseJob(jobId);
  }

  async resumeJob(queue: string, jobId: string): Promise<void> {
    const q = new Queue(queue, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
    await q.resumeJob(jobId);
  }

  async triggerJob(queue: string, data?: any): Promise<Job> {
    const q = new Queue(queue, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
    return await q.add('manual-trigger', data || {}, { removeOnComplete: true });
  }
}