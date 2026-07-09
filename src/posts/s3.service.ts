import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;

  // AWS S3 bucket name where post images are stored
  private readonly bucketName: string;

  // AWS region where the bucket is hosted (e.g. ap-southeast-1)
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    // AWS credentials loaded from environment variables (never hardcode these)
    this.region =
      this.configService.get<string>('AWS_REGION') ?? 'ap-southeast-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') ?? '';

    console.log('bucketName:: ', this);

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        // AWS IAM access key ID — set in .env as AWS_ACCESS_KEY_ID
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') ?? '',
        // AWS IAM secret access key — set in .env as AWS_SECRET_ACCESS_KEY
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  /**
   * Generate a presigned PUT URL for a file upload directly to S3.
   * The presigned URL is valid for 5 minutes (300 seconds).
   *
   * @param fileName   Original file name sent by the client
   * @param fileType   MIME type (e.g. image/jpeg)
   * @returns          { presignedUrl, imageUrl } — use presignedUrl to PUT the file,
   *                   then store imageUrl as the permanent public URL in MongoDB
   */
  async getPresignedUploadUrl(
    fileName: string,
    fileType: string,
  ): Promise<{ presignedUrl: string; imageUrl: string }> {
    // Generate a unique S3 key to avoid collisions and path-traversal issues
    const ext = fileName.split('.').pop() ?? 'jpg';
    const key = `posts/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: fileType,
    });

    // Presigned URL expires in 5 minutes — enough time for the browser to upload
    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300,
    });

    // Public URL of the object after it is uploaded
    // Assumes the bucket has a public-read policy or CloudFront in front
    const imageUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

    return { presignedUrl, imageUrl };
  }
}
