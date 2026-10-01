import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { AuditService } from '../common/audit.service';
import { emailLayout, escapeHtml, MailService } from '../common/mail.service';
import { ReqMeta, RequestMeta } from '../common/request-meta';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, CurrentUser, JwtAuthGuard, Roles } from './jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

class CreateUserDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

const PUBLIC_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  mustChangePassword: true,
  totpEnabled: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

/** Readable temporary password, e.g. "Kente-4821-Lagoon". */
function temporaryPassword() {
  const words = ['Kente', 'Lagoon', 'Baobab', 'Harbour', 'Savanna', 'Volta', 'Cocoa', 'Adinkra', 'Shea', 'Palm'];
  const pick = () => words[randomInt(words.length)];
  return `${pick()}-${randomInt(1000, 10000)}-${pick()}`;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
@Roles(Role.ADMIN)
export class UsersController {
  private readonly loginUrl: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {
    this.loginUrl = `${config.get('FRONTEND_URL', 'http://localhost:5173')}/admin/login`;
  }

  @Get()
  list() {
    return this.prisma.adminUser.findMany({ select: PUBLIC_FIELDS, orderBy: { createdAt: 'asc' } });
  }

  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthUser, @ReqMeta() meta: RequestMeta) {
    const email = dto.email.toLowerCase().trim();
    if (await this.prisma.adminUser.findUnique({ where: { email } })) {
      throw new BadRequestException('An account with this email already exists');
    }
    const password = temporaryPassword();
    const user = await this.prisma.adminUser.create({
      data: { email, name: dto.name.trim(), role: dto.role, passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true },
      select: PUBLIC_FIELDS,
    });
    await this.audit.log({ action: 'USER_CREATED', entityType: 'AdminUser', entityId: user.id, actor: actor.email, meta, metadata: { role: user.role } });
    await this.sendCredentials(user.name, user.email, password, 'Your G|K Ventures staff account');
    return { user, temporaryPassword: password };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() actor: AuthUser, @ReqMeta() meta: RequestMeta) {
    const target = await this.findOrThrow(id);
    if (id === actor.sub && (dto.active === false || (dto.role && dto.role !== Role.ADMIN))) {
      throw new BadRequestException('You cannot deactivate or demote your own account');
    }
    const removingAdmin = target.role === Role.ADMIN && (dto.active === false || (dto.role && dto.role !== Role.ADMIN));
    if (removingAdmin && (await this.prisma.adminUser.count({ where: { role: Role.ADMIN, active: true } })) <= 1) {
      throw new BadRequestException('There must be at least one active admin');
    }
    const user = await this.prisma.adminUser.update({
      where: { id },
      data: {
        ...dto,
        // Deactivating or changing role signs the person out everywhere.
        ...(dto.active === false || (dto.role && dto.role !== target.role) ? { tokenVersion: { increment: 1 } } : {}),
      },
      select: PUBLIC_FIELDS,
    });
    await this.audit.log({ action: 'USER_UPDATED', entityType: 'AdminUser', entityId: id, actor: actor.email, meta, metadata: { ...dto } });
    return user;
  }

  /** Issues a temporary password and switches off two-step verification (for a lost phone). */
  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string, @CurrentUser() actor: AuthUser, @ReqMeta() meta: RequestMeta) {
    const target = await this.findOrThrow(id);
    const password = temporaryPassword();
    await this.prisma.adminUser.update({
      where: { id },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        mustChangePassword: true,
        tokenVersion: { increment: 1 },
        totpEnabled: false,
        totpSecret: null,
        totpLastStep: null,
      },
    });
    await this.audit.log({ action: 'USER_PASSWORD_RESET', entityType: 'AdminUser', entityId: id, actor: actor.email, meta });
    await this.sendCredentials(target.name, target.email, password, 'Your G|K Ventures password was reset');
    return { temporaryPassword: password };
  }

  private async findOrThrow(id: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private sendCredentials(name: string, email: string, password: string, subject: string) {
    return this.mail.send({
      to: email,
      subject,
      html: emailLayout(
        subject,
        `<p>Dear ${escapeHtml(name)},</p>
        <p>Sign in at <a href="${this.loginUrl}">${this.loginUrl}</a> with:</p>
        <p><b>Email:</b> ${escapeHtml(email)}<br><b>Temporary password:</b> <code>${escapeHtml(password)}</code></p>
        <p>You will be asked to choose your own password straight away. We recommend switching on two-step verification under <b>Account</b>.</p>`,
      ),
    });
  }
}
