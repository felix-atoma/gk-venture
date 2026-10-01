import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface RequestMeta {
  ip: string;
  userAgent: string;
}

/** Client IP (respects `trust proxy`) and user agent, for audit logging. */
export const ReqMeta = createParamDecorator((_: unknown, ctx: ExecutionContext): RequestMeta => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return {
    ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
    userAgent: String(req.headers['user-agent'] ?? '').slice(0, 500),
  };
});
