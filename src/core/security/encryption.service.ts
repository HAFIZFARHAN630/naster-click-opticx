import * as crypto from 'crypto';

export interface EncryptionConfig {
  key: Buffer;
  iv: Buffer;
}

export class AESEncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  private key: Buffer;

  constructor(secretKey?: string) {
    const keySource = secretKey || process.env.HW_ENCRYPTION_KEY;
    if (!keySource) {
      throw new Error('HW_ENCRYPTION_KEY not configured');
    }
    this.key = crypto.scryptSync(keySource, 'salt', AESEncryptionService.KEY_LENGTH);
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(AESEncryptionService.IV_LENGTH);
    const cipher = crypto.createCipheriv(AESEncryptionService.ALGORITHM, this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, tagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(AESEncryptionService.ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export class HardwareCredentialEncryptor extends AESEncryptionService {
  encryptPassword(password: string, deviceType: string): { encrypted: string; hint: string } {
    const encrypted = this.encrypt(password);
    const hint = `${deviceType}_${Date.now()}`;
    return { encrypted, hint };
  }
}