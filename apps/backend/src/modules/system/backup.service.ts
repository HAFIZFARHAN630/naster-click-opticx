import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';

@Injectable()
export class BackupService {
  private logger = new Logger(BackupService.name);

  async performBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `/tmp/backup-${timestamp}.sql`;

    const cmd = `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -f ${filename}`;

    return new Promise((resolve, reject) => {
      exec(cmd, { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } }, async (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Backup failed: ${error.message}`);
          return reject(error);
        }

        try {
          const fileBuffer = fs.readFileSync(filename);
          const base64 = fileBuffer.toString('base64');
          
          const uploadResp = await fetch('https://api.cloudinary.com/v1_1/auto/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
              file: `data:application/octet-stream;base64,${base64}`,
              folder: 'backups',
              public_id: `db-backup-${timestamp}`
            })
          });

          fs.unlinkSync(filename);
          this.logger.log(`Backup uploaded: ${timestamp}`);
          resolve();
        } catch (uploadError) {
          reject(uploadError);
        }
      });
    });
  }
}

enum QUEUE_NAMES {
  MASS_RENEW = 'mass-renew',
  NETWORK_POLLER = 'network-poller',
  EMAIL_DISPATCH = 'email-dispatch',
  SMS_DISPATCH = 'sms-dispatch',
  BACKUP = 'backup-cron'
}