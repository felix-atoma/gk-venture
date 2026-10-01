import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { extname } from 'path';
import { AppModule } from './app.module';
import { StorageService } from './common/storage.service';

const IMAGE_TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

async function bootstrap() {
  // rawBody is required to verify Paystack webhook signatures.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({ origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((o) => o.trim()) });
  // Signature images are posted as base64 PNG data URLs.
  app.useBodyParser('json', { limit: '1mb' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  // Public gallery images come from whichever store is configured (local disk or S3/R2),
  // so their /uploads/public/<name> URLs stay the same across hosts.
  const storage = app.get(StorageService);
  app.use('/uploads/public/:name', async (req: Request, res: Response, next: NextFunction) => {
    const name = String(req.params.name);
    const type = IMAGE_TYPES[extname(name).toLowerCase()];
    if (!type) return res.sendStatus(404);
    try {
      const body = await storage.readPublic(name);
      if (!body) return res.sendStatus(404);
      res.set({ 'Content-Type': type, 'Cache-Control': 'public, max-age=604800, immutable' }).send(body);
    } catch (err) {
      next(err);
    }
  });
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`G|K Ventures API listening on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
