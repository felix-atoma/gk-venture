import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestMeta } from './request-meta';

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  meta?: RequestMeta;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(entry: AuditEntry) {
    return this.prisma.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        actor: entry.actor,
        ipAddress: entry.meta?.ip,
        userAgent: entry.meta?.userAgent,
        metadata: entry.metadata,
      },
    });
  }

  forEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
