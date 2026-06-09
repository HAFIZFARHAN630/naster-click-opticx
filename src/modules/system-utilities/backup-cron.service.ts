import { Injectable, Logger } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { exec } from 'child_process';
import * as fs from 'fs';
import { CloudinaryService } from '../../core/security/cloudinary.service';

@Injectable()
export class BackupCronService {
  private queue: Queue;
  private worker: Worker;
  private logger = new Logger(BackupCronService.name);

  constructor(private cloudinary: CloudinaryService) {
    this.queue = new Queue('backup-cron', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    this.worker = new Worker('backup-cron', async () => {
      await this.performBackup();
    }, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      },
      repeat: { cron: '0 0 * * *' }
    });

    this.logger.log('Backup cron scheduled (daily at midnight)');
  }

  private async performBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;

    return new Promise((resolve, reject) => {
      exec(
        `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -f ${filename}`,
        async (error: any, stdout: any, stderr: any) => {
          if (error) {
            this.logger.error(`Backup failed: ${error.message}`);
            return reject(error);
          }

          try {
            const fileBuffer = fs.readFileSync(filename);
            await this.cloudinary.uploadFromUrl(
              `data:application/octet-stream;base64,${fileBuffer.toString('base64')}`,
              'backups',
              `db-backup-${timestamp}`
            );

            fs.unlinkSync(filename);
            this.cleanupOldBackups();
            
            this.logger.log(`Backup completed: ${filename}`);
            resolve();
          } catch (uploadError) {
            this.logger.error(`Upload failed: ${uploadError.message}`);
            reject(uploadError);
          }
        }
      );
    });
  }

  private cleanupOldBackups(): void {
    const backupDir = './backups';
    const maxAge = 7 * 24 * 60 * 60 * 1000;

    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      const now = Date.now();

      files.forEach(file => {
        const filePath = `${backupDir}/${file}`;
        const stats = fs.statSync(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          this.logger.log(`Deleted old backup: ${file}`);
        }
      });
    }
  }

  async triggerManualBackup(): Promise<Job> {
    return await this.queue.add('manual-backup', { manual: true }, {
      removeOnComplete: true
    });
  }
}