import { BadRequestException, ConflictException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignatureRequest, SignatureStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AuditService } from '../common/audit.service';
import { emailLayout, escapeHtml, MailService } from '../common/mail.service';
import { RequestMeta } from '../common/request-meta';
import { safeFileName, sha256, StorageService } from '../common/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/jwt-auth.guard';
import { CreateSignatureRequestDto, SignDocumentDto } from './signing.dto';
import { assertValidPdf, stampSignedPdf } from './pdf-stamp';

const ENTITY = 'SignatureRequest';
const OPEN: SignatureStatus[] = [SignatureStatus.PENDING, SignatureStatus.VIEWED];

@Injectable()
export class SigningService {
  private readonly frontendUrl: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {
    this.frontendUrl = config.get('FRONTEND_URL', 'http://localhost:5173');
  }

  // ---------- Admin ----------

  async create(file: Express.Multer.File | undefined, dto: CreateSignatureRequestDto, user: AuthUser, meta: RequestMeta) {
    if (!file) throw new BadRequestException('Attach the PDF to be signed');
    try {
      await assertValidPdf(file.buffer);
    } catch {
      throw new BadRequestException('The file must be a valid, unprotected PDF');
    }
    const stored = await this.storage.saveEncrypted(file.buffer, file.originalname, 'application/pdf');
    const token = newToken();
    const request = await this.prisma.signatureRequest.create({
      data: {
        tokenHash: sha256(token),
        title: dto.title.trim(),
        message: dto.message?.trim() || null,
        signerName: dto.signerName.trim(),
        signerEmail: dto.signerEmail.trim().toLowerCase(),
        originalFileId: stored.id,
        originalSha256: stored.sha256,
        expiresAt: new Date(Date.now() + dto.expiresInDays * 86_400_000),
        createdById: user.sub,
      },
    });
    await this.audit.log({
      action: 'SIGNATURE_REQUEST_CREATED',
      entityType: ENTITY,
      entityId: request.id,
      actor: user.email,
      meta,
      metadata: { originalSha256: stored.sha256, signerEmail: request.signerEmail },
    });
    const signingUrl = await this.sendInvite(request, token);
    return { id: request.id, signingUrl };
  }

  /** Issues a fresh link (old one stops working) and re-sends the email. */
  async resend(id: string, user: AuthUser, meta: RequestMeta) {
    const existing = await this.findOpenById(id);
    const token = newToken();
    const request = await this.prisma.signatureRequest.update({
      where: { id: existing.id },
      data: {
        tokenHash: sha256(token),
        expiresAt: new Date(Math.max(existing.expiresAt.getTime(), Date.now() + 7 * 86_400_000)),
      },
    });
    await this.audit.log({ action: 'SIGNATURE_LINK_REISSUED', entityType: ENTITY, entityId: id, actor: user.email, meta });
    return { id, signingUrl: await this.sendInvite(request, token) };
  }

  async cancel(id: string, user: AuthUser, meta: RequestMeta) {
    await this.findOpenById(id);
    await this.prisma.signatureRequest.update({ where: { id }, data: { status: SignatureStatus.CANCELLED } });
    await this.audit.log({ action: 'SIGNATURE_REQUEST_CANCELLED', entityType: ENTITY, entityId: id, actor: user.email, meta });
    return { ok: true };
  }

  list() {
    return this.prisma.signatureRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      omit: { tokenHash: true },
      include: { createdBy: { select: { name: true } } },
    });
  }

  async detail(id: string) {
    const request = await this.prisma.signatureRequest.findUnique({ where: { id }, omit: { tokenHash: true } });
    if (!request) throw new NotFoundException();
    return { request, audit: await this.audit.forEntity(ENTITY, id) };
  }

  async adminFile(id: string, which: 'original' | 'signed', user: AuthUser, meta: RequestMeta) {
    const request = await this.prisma.signatureRequest.findUnique({ where: { id } });
    const fileId = which === 'signed' ? request?.signedFileId : request?.originalFileId;
    if (!request || !fileId) throw new NotFoundException('File not available');
    await this.audit.log({
      action: 'DOCUMENT_DOWNLOADED',
      entityType: ENTITY,
      entityId: id,
      actor: user.email,
      meta,
      metadata: { which },
    });
    return this.storage.readDecrypted(fileId);
  }

  // ---------- Public (token) ----------

  async getByToken(token: string, meta: RequestMeta) {
    let request = await this.findByToken(token);
    if (request.status === SignatureStatus.PENDING) {
      request = await this.prisma.signatureRequest.update({
        where: { id: request.id },
        data: { status: SignatureStatus.VIEWED, viewedAt: new Date() },
      });
      await this.audit.log({ action: 'DOCUMENT_VIEWED', entityType: ENTITY, entityId: request.id, actor: request.signerEmail, meta });
    }
    return {
      id: request.id,
      title: request.title,
      message: request.message,
      signerName: request.signerName,
      status: request.status,
      expiresAt: request.expiresAt,
      signedAt: request.signedAt,
      originalSha256: request.originalSha256,
    };
  }

  async publicFile(token: string) {
    const request = await this.findByToken(token);
    const fileId = request.status === SignatureStatus.SIGNED ? request.signedFileId! : request.originalFileId;
    return this.storage.readDecrypted(fileId);
  }

  async sign(token: string, dto: SignDocumentDto, meta: RequestMeta) {
    const request = await this.findByToken(token);
    if (!OPEN.includes(request.status)) throw new ConflictException('This document has already been signed');

    const png = Buffer.from(dto.signatureImage.split(',')[1], 'base64');
    if (png.subarray(1, 4).toString('latin1') !== 'PNG') throw new BadRequestException('Invalid signature image');

    const { buffer: original } = await this.storage.readDecrypted(request.originalFileId);
    if (sha256(original) !== request.originalSha256) throw new ConflictException('Document integrity check failed');

    const signedAt = new Date();
    const signedPdf = await stampSignedPdf(original, png, {
      requestId: request.id,
      title: request.title,
      signerName: request.signerName,
      signerEmail: request.signerEmail,
      typedName: dto.typedName.trim(),
      signedAt,
      viewedAt: request.viewedAt,
      createdAt: request.createdAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
      originalSha256: request.originalSha256,
    });
    const fileName = `${safeFileName(request.title)} - signed.pdf`;
    const stored = await this.storage.saveEncrypted(signedPdf, fileName, 'application/pdf');

    // Conditional update prevents a double-submit from signing twice.
    const { count } = await this.prisma.signatureRequest.updateMany({
      where: { id: request.id, status: { in: OPEN } },
      data: {
        status: SignatureStatus.SIGNED,
        signedAt,
        signedFileId: stored.id,
        signedSha256: stored.sha256,
        typedName: dto.typedName.trim(),
        signerIp: meta.ip,
        signerUserAgent: meta.userAgent,
      },
    });
    if (count === 0) throw new ConflictException('This document has already been signed');

    await this.audit.log({
      action: 'DOCUMENT_SIGNED',
      entityType: ENTITY,
      entityId: request.id,
      actor: request.signerEmail,
      meta,
      metadata: {
        originalSha256: request.originalSha256,
        signedSha256: stored.sha256,
        signatureImageSha256: sha256(png),
        typedName: dto.typedName.trim(),
        consent: true,
      },
    });

    const attachment = { filename: fileName, content: signedPdf, contentType: 'application/pdf' };
    const body = `<p><b>${escapeHtml(request.title)}</b> was signed by ${escapeHtml(request.signerName)} on ${signedAt.toUTCString()}.</p>
      <p>The signed copy, including the signature certificate, is attached.<br>Signed document SHA-256: <code>${stored.sha256}</code></p>`;
    await this.mail.send({ to: request.signerEmail, subject: `Signed: ${request.title}`, html: emailLayout('Your signed document', body), attachments: [attachment] });
    await this.mail.send({ to: this.mail.notifyEmail, subject: `Document signed: ${request.title}`, html: emailLayout('Document signed', body), attachments: [attachment] });

    return { ok: true, signedAt, signedSha256: stored.sha256 };
  }

  // ---------- helpers ----------

  private async findByToken(token: string): Promise<SignatureRequest> {
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) throw new NotFoundException('Signing link is invalid');
    const request = await this.prisma.signatureRequest.findUnique({ where: { tokenHash: sha256(token) } });
    if (!request) throw new NotFoundException('Signing link is invalid or has been replaced');
    if (request.status === SignatureStatus.CANCELLED) throw new GoneException('This signing request was cancelled');
    if (request.status !== SignatureStatus.SIGNED && request.expiresAt < new Date()) {
      throw new GoneException('This signing link has expired. Please contact G|K Ventures for a new link.');
    }
    return request;
  }

  private async findOpenById(id: string) {
    const request = await this.prisma.signatureRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException();
    if (!OPEN.includes(request.status)) throw new ConflictException(`Request is already ${request.status.toLowerCase()}`);
    return request;
  }

  private async sendInvite(request: SignatureRequest, token: string) {
    const url = `${this.frontendUrl}/sign/${token}`;
    await this.mail.send({
      to: request.signerEmail,
      subject: `Please sign: ${request.title}`,
      html: emailLayout(
        'Document ready for your signature',
        `<p>Dear ${escapeHtml(request.signerName)},</p>
        <p>G|K Ventures has prepared <b>${escapeHtml(request.title)}</b> for your electronic signature.</p>
        ${request.message ? `<p style="white-space:pre-wrap">${escapeHtml(request.message)}</p>` : ''}
        <p><a href="${url}" style="background:#B8923A;color:#fff;padding:12px 22px;text-decoration:none;display:inline-block">Review &amp; Sign</a></p>
        <p style="font-size:12px;color:#777">This secure link is personal to you and expires on ${request.expiresAt.toUTCString()}. Do not forward it.</p>`,
      ),
    });
    return url;
  }
}

const newToken = () => randomBytes(32).toString('base64url'); // 43 chars
