import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const MB = 1024 * 1024;

const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

function options(allowed: string[], maxBytes: number, label: string): MulterOptions {
  return {
    limits: { fileSize: maxBytes, files: 3 },
    fileFilter: (_req, file, cb) =>
      allowed.includes(file.mimetype)
        ? cb(null, true)
        : cb(new BadRequestException(`Unsupported file type. Allowed: ${label}.`), false),
  };
}

export const documentUpload = options(DOCUMENT_TYPES, 10 * MB, 'PDF, Word, JPG, PNG (max 10 MB)');
export const pdfUpload = options(['application/pdf'], 15 * MB, 'PDF (max 15 MB)');
export const imageUpload = options(['image/jpeg', 'image/png', 'image/webp'], 5 * MB, 'JPG, PNG, WEBP (max 5 MB)');
