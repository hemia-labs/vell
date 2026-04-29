import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { MulterFile } from '@/types/express';
import { IsNull, Repository } from 'typeorm';
import { ContentMedia } from '../contents/entities/content-media.entity';
import { Media, StorageType } from '../media/entities/media.entity';
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_FILE_SIZE_BYTES, UPLOAD_SCOPES, type UploadScope } from './file-upload.constants';
import { S3_CLIENT } from './s3-client.factory';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly bucket: string;
  private readonly endpoint: string | undefined;
  private readonly forcePathStyle: boolean;
  private readonly publicUrl: string | undefined;
  private readonly previewUrlTtlSeconds: number;

  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    @InjectRepository(Media) private readonly mediaRepository: Repository<Media>,
    @InjectRepository(ContentMedia) private readonly contentMediaRepository: Repository<ContentMedia>,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow<string>('S3_BUCKET');
    if (!this.bucket.trim()) {
      throw new InternalServerErrorException('S3_BUCKET is required');
    }
    this.endpoint = this.config.get<string>('S3_ENDPOINT') || undefined;
    this.forcePathStyle = this.config.get<string>('S3_FORCE_PATH_STYLE', 'false') === 'true';
    this.publicUrl = this.config.get<string>('S3_PUBLIC_URL');
    this.previewUrlTtlSeconds = this.config.get<number>('S3_PRESIGNED_URL_TTL', 600);
  }

  async uploadFile(file: MulterFile, userId: string, scope: UploadScope = 'library'): Promise<Media> {
    this.validateFile(file);
    this.validateScope(scope);
    const key = this.generateFileKey(file.originalname, scope);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    const url = this.buildUrl(key);

    const media = this.mediaRepository.create({
      filename: `${key.split('/').pop()}`,
      storageKey: key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      storage: StorageType.S3,
      uploadedById: userId,
    });

    try {
      return await this.mediaRepository.save(media);
    } catch (error) {
      await this.deleteObject(key);
      throw error;
    }
  }

  async uploadFiles(files: MulterFile[], userId: string, scope: UploadScope = 'library'): Promise<Media[]> {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required');
    }
    this.validateScope(scope);

    const results: Media[] = [];

    try {
      for (const file of files) {
        results.push(await this.uploadFile(file, userId, scope));
      }

      return results;
    } catch (error) {
      for (const media of results) {
        await this.rollbackUploadedMedia(media);
      }

      throw error;
    }
  }

  async deleteMedia(mediaId: string): Promise<void> {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    const activeReferences = await this.contentMediaRepository.count({
      where: { mediaId: media.id, deletedAt: IsNull() },
    });
    if (activeReferences > 0) {
      throw new BadRequestException('Media is attached to content and cannot be deleted');
    }

    if (media.storageKey) {
      await this.deleteObject(media.storageKey);
    }

    await this.mediaRepository.softDelete(media.id);
    this.logger.log(`Deleted media: ${media.id}`);
  }

  async getPreviewUrl(media: Pick<Media, 'storageKey' | 'url'>): Promise<string> {
    if (!media.storageKey) {
      return media.url;
    }

    return getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: media.storageKey,
      }),
      { expiresIn: this.previewUrlTtlSeconds },
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  generateFileKey(originalName: string, scope: UploadScope = 'library'): string {
    const safeName = originalName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\s+/g, '_');
    const id = randomUUID();
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');

    return `media/${scope}/${year}/${month}/${id}-${safeName}`;
  }

  private buildUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
    }

    if (this.endpoint && this.forcePathStyle) {
      return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    }

    return `https://${this.bucket}.s3.${this.config.get<string>('S3_REGION', 'us-east-1')}.amazonaws.com/${key}`;
  }

  private validateFile(file?: MulterFile): asserts file is MulterFile {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('File is empty');
    }

    if (!ALLOWED_UPLOAD_MIME_TYPES.test(file.mimetype)) {
      throw new BadRequestException('File type is not allowed');
    }

    if (!this.matchesFileSignature(file)) {
      throw new BadRequestException('File content does not match the declared type');
    }

    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      throw new BadRequestException('File is too large');
    }
  }

  private validateScope(scope: string): asserts scope is UploadScope {
    if (!UPLOAD_SCOPES.includes(scope as UploadScope)) {
      throw new BadRequestException('Upload scope is not allowed');
    }
  }

  private async rollbackUploadedMedia(media: Media): Promise<void> {
    try {
      if (media.storageKey) {
        await this.deleteObject(media.storageKey);
      }
      await this.mediaRepository.delete(media.id);
    } catch (error) {
      this.logger.error(`Failed to rollback uploaded media: ${media.id}`, error);
    }
  }

  private matchesFileSignature(file: MulterFile): boolean {
    const buffer = file.buffer;

    if (file.mimetype === 'image/jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    if (file.mimetype === 'image/png') {
      return this.matchesBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    }

    if (file.mimetype === 'image/gif') {
      return buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a';
    }

    if (file.mimetype === 'image/webp') {
      return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    }

    if (file.mimetype === 'application/pdf') {
      return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    }

    if (file.mimetype === 'video/mp4') {
      return buffer.subarray(4, 8).toString('ascii') === 'ftyp';
    }

    if (file.mimetype === 'video/webm') {
      return this.matchesBytes(buffer, [0x1a, 0x45, 0xdf, 0xa3]);
    }

    if (file.mimetype === 'audio/mpeg') {
      return buffer.subarray(0, 3).toString('ascii') === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    }

    if (file.mimetype === 'audio/wav') {
      return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE';
    }

    if (file.mimetype === 'audio/ogg') {
      return buffer.subarray(0, 4).toString('ascii') === 'OggS';
    }

    return false;
  }

  private matchesBytes(buffer: Buffer, bytes: number[]): boolean {
    return bytes.every((byte, index) => buffer[index] === byte);
  }
}
