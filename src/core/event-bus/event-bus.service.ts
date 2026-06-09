import { Queue, Worker, QueueScheduler, Job } from 'bullmq';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

export interface BaseEvent {
  eventId: string;
  timestamp: Date;
  tenantId: string;
  branchId?: string;
  source: string;
  version: string;
}

export interface EventPublisher {
  publish<T extends BaseEvent>(queue: string, event: T): Promise<Job<T>>;
  emit<T extends BaseEvent>(event: T): Promise<void>;
}

@Injectable()
export class EventBusService implements EventPublisher, OnModuleInit, OnModuleDestroy {
  private redisConnection: any;
  private queues: Map<string, Queue>;
  private workers: Map<string, Worker>;

  constructor() {
    this.redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    };
    this.queues = new Map();
    this.workers = new Map();
  }

  onModuleInit() {
    new QueueScheduler(this.redisConnection);
  }

  onModuleDestroy() {
    this.workers.forEach(worker => worker.close());
    this.queues.forEach(queue => queue.close());
  }

  getQueue<T extends BaseEvent>(name: string): Queue<T> {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue<T>(name, { connection: this.redisConnection }));
    }
    return this.queues.get(name)!;
  }

  async publish<T extends BaseEvent>(queue: string, event: T): Promise<Job<T>> {
    const q = this.getQueue<T>(queue);
    return await q.add(event.eventId, event, {
      jobId: `${event.source}-${event.eventId}`,
      removeOnComplete: true,
      removeOnFail: { age: 24 * 60 * 60 }
    });
  }

  async emit<T extends BaseEvent>(event: T): Promise<void> {
    const queueName = `${event.source}-events`;
    await this.publish(queueName, event);
  }

  subscribe<T extends BaseEvent>(queue: string, handler: (job: Job<T>) => Promise<void>) {
    const worker = new Worker<T>(queue, handler, {
      connection: this.redisConnection,
      concurrency: 10,
      removeOnFail: { age: 24 * 60 * 60 }
    });
    this.workers.set(queue, worker);
  }
}

export const createEvent = <T extends BaseEvent>(
  event: Omit<T, 'eventId' | 'timestamp' | 'version'> & { eventId?: string }
): T => ({
  eventId: event.eventId || crypto.randomUUID(),
  timestamp: new Date(),
  version: '1.0',
  ...event
} as T);

export const EVENT_TYPES = {
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  USER_CONNECTED: 'user.connected',
  USER_DISCONNECTED: 'user.disconnected',
  NETWORK_ALERT: 'network.alert',
  MASS_RENEW_STARTED: 'mass.renew.started',
  MASS_RENEW_PROGRESS: 'mass.renew.progress',
  MASS_RENEW_COMPLETED: 'mass.renew.completed',
  RADIUS_CoA: 'radius.coa',
  VOUCHER_GENERATED: 'voucher.generated'
} as const;