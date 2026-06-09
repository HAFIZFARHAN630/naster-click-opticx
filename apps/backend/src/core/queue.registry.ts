import { Queue, Worker } from 'bullmq';

export class QueueRegistry {
  private static instance: QueueRegistry;
  private queues: Map<string, Queue> = new Map();
  private redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME
  };

  static getInstance(): QueueRegistry {
    if (!QueueRegistry.instance) {
      QueueRegistry.instance = new QueueRegistry();
    }
    return QueueRegistry.instance;
  }

  getQueue<T = any>(name: string): Queue<T> {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue<T>(name, { connection: this.redisConnection }));
    }
    return this.queues.get(name)!;
  }

  createWorker<T = any>(name: string, processor: (job: any) => Promise<any>) {
    return new Worker<T>(name, processor, { connection: this.redisConnection });
  }

  getConnection() {
    return this.redisConnection;
  }
}

export const QUEUE_NAMES = {
  MASS_RENEW: 'mass-renew',
  NETWORK_POLLER: 'network-poller',
  EMAIL_DISPATCH: 'email-dispatch',
  SMS_DISPATCH: 'sms-dispatch'
} as const;