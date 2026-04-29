import { S3Client } from '@aws-sdk/client-s3';
import { FactoryProvider, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const S3_CLIENT = 'S3_CLIENT';

export const s3ClientFactory: FactoryProvider = {
  provide: S3_CLIENT,
  useFactory: (config: ConfigService) => {
    const endpoint = config.get<string>('S3_ENDPOINT');
    const region = config.get<string>('S3_REGION', 'us-east-1');
    const forcePathStyle = config.get<string>('S3_FORCE_PATH_STYLE', 'false') === 'true';
    const accessKeyId = config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('S3_SECRET_ACCESS_KEY');
    const credentials = accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;

    if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
      throw new InternalServerErrorException('S3 credentials must include both access key id and secret access key');
    }

    return new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle,
      credentials,
    });
  },
  inject: [ConfigService],
};
