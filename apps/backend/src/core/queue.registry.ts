import { Queue, Worker } from 'bullmq';

export class QueueRegistry {
  private static instance: QueueRegistry;
  private queues: Map<string, Queue> = new Map();
  private _redisConnection: any = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    connectTimeout: 5000,
    retryStrategy: (times: number) => {
      if (times > 3) return null;
      return Math.min(times * 100);
    }
  };

  static getInstance(): QueueRegistry {
    if (!QueueRegistry.instance) {
      QueueRegistry.instance = new QueueRegistry();
    }
    return QueueRegistry.instance;
  }

  private get redisConnection() {
    return this._redisConnection;
  }

  getQueue<T = any>(name: string): Queue<T> | null {
    if (!this.queues.has(name)) {
      try {
        this.queues.set(name, new Queue<T>(name, { 
          connection: this.redisConnection,
          defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
        }));
      } catch (e) {
        console.warn(`Queue ${name} creation skipped, Redis unavailable`);
        return null;
      }
    }
    return this.queues.get(name)!;
  }

  createWorker<T = any>(name: string, processor: (job: any) => Promise<any>) {
    try {
      return new Worker<T>(name, processor, { connection: this.redisConnection });
    } catch (e) {
      console.warn(`Worker ${name} creation skipped, Redis unavailable`);
      return null as any;
    }
  }

  getConnection() {
    return this._redisConnection;
  }
}

export const QUEUE_NAMES = {
  MASS_RENEW: 'mass-renew',
  NETWORK_POLLER: 'network-poller',
  EMAIL_DISPATCH: 'email-dispatch',
  SMS_DISPATCH: 'sms-dispatch'
} as const;