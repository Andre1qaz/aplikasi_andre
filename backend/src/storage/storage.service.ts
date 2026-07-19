import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Heuristic #1: Visibility of System Status — clear error messages for upload failures
// Heuristic #5: Error Prevention — validate file types and sizes before upload

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private publicBucket: string;
  private privateBucket: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get('MINIO_ENDPOINT') || 'localhost';
    const port = this.configService.get('MINIO_PORT') || '9000';
    const accessKey = this.configService.get('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get('MINIO_SECRET_KEY');

    if (!accessKey || !secretKey) {
      throw new Error('MinIO credentials are not configured');
    }

    this.s3Client = new S3Client({
      endpoint: `http://${endpoint}:${port}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });

    this.publicBucket = this.configService.get('MINIO_BUCKET_PUBLIC') || 'ecourse-public';
    this.privateBucket = this.configService.get('MINIO_BUCKET_PRIVATE') || 'ecourse-private';
  }

  /**
   * Generate presigned URL for file upload
   * Heuristic #5: Error Prevention — validate file type before generating URL
   */
  async generateUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
    isPrivate: boolean = false,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    // Validate file size (max 50MB for uploads)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate file type (whitelist approach)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/webm',
      'application/zip',
    ];

    if (!allowedTypes.includes(fileType)) {
      throw new Error(`File type ${fileType} is not allowed`);
    }

    const bucket = isPrivate ? this.privateBucket : this.publicBucket;
    const key = `${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
    const fileUrl = `${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}/${bucket}/${key}`;

    return { uploadUrl, fileUrl };
  }

  /**
   * Generate presigned URL for file download (private files)
   */
  async generateDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.privateBucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
  }

  /**
   * Delete file from storage
   */
  async deleteFile(key: string, isPrivate: boolean = false): Promise<void> {
    const bucket = isPrivate ? this.privateBucket : this.publicBucket;
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Extract key from file URL
   */
  extractKeyFromUrl(fileUrl: string): string {
    const parts = fileUrl.split('/');
    return parts[parts.length - 1];
  }
}
