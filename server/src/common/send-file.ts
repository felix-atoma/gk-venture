import { StreamableFile } from '@nestjs/common';
import { StoredFile } from '@prisma/client';

/** Streams a decrypted private file with safe headers. */
export function sendFile(file: Pick<StoredFile, 'originalName' | 'mimeType'>, buffer: Buffer, inline = false) {
  return new StreamableFile(buffer, {
    type: file.mimeType,
    length: buffer.length,
    disposition: `${inline ? 'inline' : 'attachment'}; filename="${file.originalName.replace(/"/g, '')}"`,
  });
}
