import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

interface TokenPayload {
  sub: string;
  ver: number;
}

type AuthedRequest = Request & { user?: AuthUser };

const ROLES_KEY = 'roles';
const ALLOW_PENDING_PASSWORD_KEY = 'allowPendingPassword';

/** Restrict a route to specific roles (default: any signed-in staff member). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Route stays reachable while the user still has to replace a temporary password. */
export const AllowPendingPassword = () => SetMetadata(ALLOW_PENDING_PASSWORD_KEY, true);

/**
 * Verifies the bearer token, then re-checks the account in the database on every request
 * so deactivation, password resets and role changes take effect immediately.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();

    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }
    const user = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active || user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    const targets = [ctx.getHandler(), ctx.getClass()];
    if (user.mustChangePassword && !this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_PASSWORD_KEY, targets)) {
      throw new ForbiddenException('Please set a new password before continuing.');
    }
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, targets);
    if (roles?.length && !roles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to do this.');
    }

    req.user = { sub: user.id, email: user.email, name: user.name, role: user.role };
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<AuthedRequest>().user!,
);
