import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StoredFile } from '@prisma/client';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'crypto';
import { basename, extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { BlobStore, createBlobStore } from './blob-store';

const IV_LEN = 12;
const TAG_LEN = 16;

export const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

@Injectable()
export class StorageService {
  private readonly blobs: BlobStore;
  private readonly key: Buffer;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.blobs = createBlobStore(config, prisma);

    this.key = Buffer.from(config.getOrThrow<string>('FILE_ENCRYPTION_KEY'), 'base64');
    if (this.key.length !== 32) {
      throw new Error('FILE_ENCRYPTION_KEY must be 32 bytes encoded as base64');
    }
  }

  /** Encrypts and stores a private file. Stored layout: [iv 12][auth tag 16][ciphertext]. */
  async saveEncrypted(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    inquiryId?: string,
  ): Promise<StoredFile> {
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const storageKey = `${randomUUID()}.bin`;
    await this.blobs.put(`private/${storageKey}`, Buffer.concat([iv, cipher.getAuthTag(), encrypted]));

    return this.prisma.storedFile.create({
      data: {
        originalName: safeFileName(originalName),
        mimeType,
        size: buffer.length,
        storageKey,
        sha256: sha256(buffer),
        inquiryId,
      },
    });
  }

  async readDecrypted(fileId: string): Promise<{ file: StoredFile; buffer: Buffer }> {
    const file = await this.prisma.storedFile.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    const raw = await this.blobs.get(`private/${basename(file.storageKey)}`);
    if (!raw) throw new NotFoundException('Stored file is missing');
    const decipher = createDecipheriv('aes-256-gcm', this.key, raw.subarray(0, IV_LEN));
    decipher.setAuthTag(raw.subarray(IV_LEN, IV_LEN + TAG_LEN));
    let buffer: Buffer;
    try {
      buffer = Buffer.concat([decipher.update(raw.subarray(IV_LEN + TAG_LEN)), decipher.final()]);
    } catch {
      throw new InternalServerErrorException('Stored file failed integrity check');
    }
    if (sha256(buffer) !== file.sha256) {
      throw new InternalServerErrorException('Stored file hash mismatch');
    }
    return { file, buffer };
  }

  /** Public images (gallery). Returns the URL path served by readPublic (see main.ts). */
  async savePublic(buffer: Buffer, originalName: string, mimeType?: string): Promise<string> {
    const name = `${randomUUID()}${extname(originalName).toLowerCase()}`;
    await this.blobs.put(`public/${name}`, buffer, mimeType);
    return `/uploads/public/${name}`;
  }

  async deletePublic(url: string) {
    await this.blobs.delete(`public/${basename(url)}`).catch(() => undefined);
  }

  /** Bytes of a public image by file name, or null if it does not exist. */
  readPublic(name: string) {
    return this.blobs.get(`public/${basename(name)}`);
  }
}

export function safeFileName(name: string) {
  const cleaned = basename(name).replace(/[^\w.\- ()]/g, '_').slice(-150);
  return cleaned || 'file';
}
