import { v2 as cloudinary } from 'cloudinary';

export interface KYCUploadOptions {
  tenantId: string;
  userId: string;
  documentType: 'CNIC_FRONT' | 'CNIC_BACK' | 'PROFILE_PIC' | 'SIGNATURE';
  file: Buffer | string;
  filename: string;
}

export interface InvoicePDFOptions {
  tenantId: string;
  invoiceId: string;
  html: string;
}

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadKYCDocument(options: KYCUploadOptions): Promise<string> {
    const folder = `tenants/${options.tenantId}/kyc/${options.userId}`;
    
    const result = await cloudinary.uploader.upload(
      options.file.toString(),
      {
        folder,
        public_id: `${options.documentType}_${Date.now()}`,
        resource_type: 'image',
        type: 'authenticated',
        eager: [{ width: 800, crop: 'limit' }]
      }
    );

    return result.secure_url;
  }

  async generateSignedURL(publicId: string, expiresIn: number = 3600): Promise<string> {
    const signedUrl = cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn
    });
    return signedUrl;
  }

  async generateInvoicePDF(options: InvoicePDFOptions): Promise<string> {
    const folder = `tenants/${options.tenantId}/invoices`;
    const publicId = `invoice_${options.invoiceId}`;

    const result = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${options.html}`,
      {
        folder,
        public_id: publicId,
        resource_type: 'raw',
        type: 'authenticated'
      }
    );

    return result.secure_url;
  }

  async uploadFromUrl(url: string, folder: string, publicId: string): Promise<string> {
    const result = await cloudinary.uploader.upload(url, {
      folder,
      public_id: publicId,
      resource_type: 'auto',
      type: 'private'
    });
    return result.secure_url;
  }
}