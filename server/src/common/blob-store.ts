import { DeleteObjectCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { mkdirSync } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { PrismaService } from '../prisma/prisma.service';

/** Where uploaded bytes live. Keys look like "private/<uuid>.bin" or "public/<uuid>.jpg". */
export interface BlobStore {
  put(key: string, body: Buffer, contentType?: string): Promise<void>;
  /** Returns null when the object does not exist. */
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

/** Local disk under UPLOAD_DIR. Used in development, or on a host with a persistent disk. */
class DiskBlobStore implements BlobStore {
  constructor(private readonly root: string) {
    mkdirSync(join(root, 'private'), { recursive: true });
    mkdirSync(join(root, 'public'), { recursive: true });
  }

  async put(key: string, body: Buffer) {
    const path = join(this.root, key);
    mkdirSync(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async get(key: string) {
    return readFile(join(this.root, key)).catch(() => null);
  }

  async delete(key: string) {
    await unlink(join(this.root, key)).catch(() => undefined);
  }
}

/** Any S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2). The bucket should stay private. */
class S3BlobStore implements BlobStore {
  private readonly s3: S3Client;

  constructor(
    private readonly bucket: string,
    config: ConfigService,
  ) {
    this.s3 = new S3Client({
      region: config.get<string>('S3_REGION', 'auto'),
      endpoint: config.get<string>('S3_ENDPOINT') || undefined,
      credentials: {
        accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async put(key: string, body: Buffer, contentType?: string) {
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }

  async get(key: string) {
    try {
      const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return Buffer.from(await res.Body!.transformToByteArray());
    } catch (err) {
      if (err instanceof NoSuchKey) return null;
      throw err;
    }
  }

  async delete(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

/** Rows in the Blob table. For hosts with neither a persistent disk nor a bucket; fine for modest volumes. */
class DatabaseBlobStore implements BlobStore {
  constructor(private readonly prisma: PrismaService) {}

  async put(key: string, body: Buffer, contentType?: string) {
    const data = new Uint8Array(body);
    await this.prisma.blob.upsert({ where: { key }, create: { key, data, contentType }, update: { data, contentType } });
  }

  async get(key: string) {
    const row = await this.prisma.blob.findUnique({ where: { key } });
    return row ? Buffer.from(row.data) : null;
  }

  async delete(key: string) {
    await this.prisma.blob.deleteMany({ where: { key } });
  }
}

/** S3_BUCKET set -> bucket; STORAGE_DRIVER=database -> Postgres; otherwise local disk under UPLOAD_DIR. */
export function createBlobStore(config: ConfigService, prisma: PrismaService): BlobStore {
  const bucket = config.get<string>('S3_BUCKET');
  if (bucket) return new S3BlobStore(bucket, config);
  if (config.get<string>('STORAGE_DRIVER') === 'database') return new DatabaseBlobStore(prisma);
  return new DiskBlobStore(resolve(config.get<string>('UPLOAD_DIR', 'uploads')));
}
