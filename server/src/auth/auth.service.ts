import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminUser } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { toDataURL } from 'qrcode';
import { AuditService } from '../common/audit.service';
import { RequestMeta } from '../common/request-meta';
import { SecretBoxService } from '../common/secret-box.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './jwt-auth.guard';
import { generateSecret, otpauthUrl, verifyTotp } from './totp';

const ENTITY = 'AdminUser';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly box: SecretBoxService,
  ) {}

  async login(email: string, password: string, code: string | undefined, meta: RequestMeta) {
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.adminUser.findUnique({ where: { email: normalized } });
    const ok = user && user.active && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !ok) {
      await this.audit.log({ action: 'LOGIN_FAILED', entityType: ENTITY, entityId: normalized, actor: normalized, meta });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.totpEnabled) {
      // Password was right; ask for the authenticator code without issuing a session.
      if (!code) return { twoFactorRequired: true as const };
      if (!(await this.consumeTotp(user, code))) {
        await this.audit.log({ action: 'LOGIN_2FA_FAILED', entityType: ENTITY, entityId: user.id, actor: user.email, meta });
        throw new UnauthorizedException('Invalid or expired authentication code');
      }
    }

    await this.prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit.log({ action: 'LOGIN', entityType: ENTITY, entityId: user.id, actor: user.email, meta });
    return { accessToken: await this.issueToken(user), user: await this.profile(user.id) };
  }

  async profile(id: string) {
    const u = await this.prisma.adminUser.findUniqueOrThrow({ where: { id } });
    return {
      sub: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      mustChangePassword: u.mustChangePassword,
      twoFactorEnabled: u.totpEnabled,
    };
  }

  async changePassword(user: AuthUser, current: string, next: string, meta: RequestMeta) {
    const record = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: user.sub } });
    if (!(await bcrypt.compare(current, record.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (await bcrypt.compare(next, record.passwordHash)) {
      throw new BadRequestException('Choose a password different from the current one');
    }
    const updated = await this.prisma.adminUser.update({
      where: { id: user.sub },
      data: { passwordHash: await bcrypt.hash(next, 12), mustChangePassword: false, tokenVersion: { increment: 1 } },
    });
    await this.audit.log({ action: 'PASSWORD_CHANGED', entityType: ENTITY, entityId: user.sub, actor: user.email, meta });
    // Other sessions are signed out; this one gets a fresh token.
    return { accessToken: await this.issueToken(updated), user: await this.profile(user.sub) };
  }

  async startTwoFactorSetup(user: AuthUser) {
    const record = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: user.sub } });
    if (record.totpEnabled) throw new BadRequestException('Two-step verification is already on');
    const secret = generateSecret();
    await this.prisma.adminUser.update({ where: { id: user.sub }, data: { totpSecret: this.box.seal(secret), totpLastStep: null } });
    const url = otpauthUrl(secret, record.email);
    return { secret, qrDataUrl: await toDataURL(url, { margin: 1, width: 220 }) };
  }

  async enableTwoFactor(user: AuthUser, code: string, meta: RequestMeta) {
    const record = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: user.sub } });
    if (record.totpEnabled) throw new BadRequestException('Two-step verification is already on');
    if (!record.totpSecret) throw new BadRequestException('Start the setup first');
    if (!(await this.consumeTotp(record, code))) throw new BadRequestException('That code is not valid. Check your phone clock and try again.');
    await this.prisma.adminUser.update({ where: { id: user.sub }, data: { totpEnabled: true } });
    await this.audit.log({ action: '2FA_ENABLED', entityType: ENTITY, entityId: user.sub, actor: user.email, meta });
    return this.profile(user.sub);
  }

  async disableTwoFactor(user: AuthUser, password: string, code: string, meta: RequestMeta) {
    const record = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: user.sub } });
    if (!record.totpEnabled) throw new BadRequestException('Two-step verification is not on');
    if (!(await bcrypt.compare(password, record.passwordHash))) throw new BadRequestException('Password is incorrect');
    if (!(await this.consumeTotp(record, code))) throw new BadRequestException('That code is not valid');
    await this.prisma.adminUser.update({
      where: { id: user.sub },
      data: { totpEnabled: false, totpSecret: null, totpLastStep: null },
    });
    await this.audit.log({ action: '2FA_DISABLED', entityType: ENTITY, entityId: user.sub, actor: user.email, meta });
    return this.profile(user.sub);
  }

  issueToken(user: Pick<AdminUser, 'id' | 'tokenVersion'>) {
    return this.jwt.signAsync({ sub: user.id, ver: user.tokenVersion });
  }

  /** Verifies a TOTP code and records its time-step so the same code can't be used twice. */
  private async consumeTotp(user: AdminUser, code: string) {
    if (!user.totpSecret) return false;
    const step = verifyTotp(this.box.open(user.totpSecret), code);
    if (step === null || (user.totpLastStep !== null && step <= user.totpLastStep)) return false;
    const { count } = await this.prisma.adminUser.updateMany({
      where: { id: user.id, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
      data: { totpLastStep: step },
    });
    return count === 1;
  }
}
