import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();
const S3_ACCESS_KEY_ID = configService.get<string>('S3_ACCESS_KEY_ID');
const S3_SECRET_ACCESS_KEY = configService.get<string>('S3_SECRET_ACCESS_KEY');
const S3_ENDPOINT = configService.get<string>('S3_ENDPOINT');
const S3_BUCKET = configService.get<string>('S3_BUCKET');

// Устанавливаем конфигурацию AWS SDK
const config = {
    region: 'ru-msk',
    endpoint: process.env.S3_ENDPOINT || S3_ENDPOINT,
    credentials: {
        accessKeyId: (process.env.S3_ACCESS_KEY_ID as string) || S3_ACCESS_KEY_ID,
        secretAccessKey: (process.env.S3_SECRET_ACCESS_KEY as string) || S3_SECRET_ACCESS_KEY
    }
};

export const s3Client = new S3Client(config);

export const bucketName: string = (process.env.S3_BUCKET as string) || S3_BUCKET;
