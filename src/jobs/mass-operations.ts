import { Queue, Worker, Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import * as csv from 'csv-parser';
import { createReadStream } from 'fs';
import { createClient } from '@supabase/supabase-js';

export interface MassOperationJob {
  tenantId: string;
  branchId?: string;
  operation: 'CSV_IMPORT' | 'MASS_RENEW' | 'MASS_SUSPEND' | 'MASS_ACTIVATE';
  batchSize: number;
  totalItems: number;
  items?: any[];
  csvPath?: string;
}

@Injectable()
export class MassOperationsService {
  private queue: Queue;
  private worker: Worker;
  private logger = new Logger(MassOperationsService.name);
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  constructor() {
    this.queue = new Queue('mass-operations', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
  }

  async queueMassRenew(
    tenantId: string,
    branchId: string | undefined,
    userIds: string[],
    validityDays: number
  ): Promise<Job<MassOperationJob>> {
    const job: MassOperationJob = {
      tenantId,
      branchId,
      operation: 'MASS_RENEW',
      batchSize: 50,
      totalItems: userIds.length,
      items: userIds.map(id => ({ userId: id, validityDays }))
    };

    return await this.queue.add('mass-renew', job, {
      jobId: `mass-renew-${tenantId}-${Date.now()}`,
      removeOnComplete: true
    });
  }

  async queueCSVImport(
    tenantId: string,
    branchId: string | undefined,
    csvPath: string
  ): Promise<Job<MassOperationJob>> {
    const items = await this.parseCSV(csvPath);
    
    const job: MassOperationJob = {
      tenantId,
      branchId,
      operation: 'CSV_IMPORT',
      batchSize: 50,
      totalItems: items.length,
      csvPath
    };

    return await this.queue.add('csv-import', job, {
      jobId: `csv-import-${tenantId}-${Date.now()}`,
      removeOnComplete: true
    });
  }

  private async parseCSV(path: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      createReadStream(path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  getJobStatus(jobId: string): Promise<Job<any> | null> {
    return this.queue.getJob(jobId);
  }

  async getActiveJobs(): Promise<Job<MassOperationJob>[]> {
    const jobs = await this.queue.getJobs(['active', 'waiting', 'delayed']);
    return jobs as Job<MassOperationJob>[];
  }
}