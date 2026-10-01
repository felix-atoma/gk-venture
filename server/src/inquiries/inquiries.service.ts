import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../common/audit.service';
import { CaptchaService } from '../common/captcha.service';
import { emailLayout, escapeHtml, MailService } from '../common/mail.service';
import { RequestMeta } from '../common/request-meta';
import { SERVICE_LABELS } from '../common/service-labels';
import { StorageService } from '../common/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/jwt-auth.guard';
import { CreateInquiryDto, ListInquiriesQuery, UpdateInquiryDto } from './inquiries.dto';

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
    private readonly captcha: CaptchaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateInquiryDto, files: Express.Multer.File[], meta: RequestMeta) {
    // Bots fill the hidden honeypot; pretend success so they don't adapt.
    if (dto.website) return { ok: true, reference: 'received' };
    await this.captcha.assertHuman(dto.captchaToken, meta.ip);

    const inquiry = await this.prisma.inquiry.create({
      data: {
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        email: dto.email.trim().toLowerCase(),
        service: dto.service,
        message: dto.message.trim(),
        ipAddress: meta.ip,
      },
    });
    const stored = [];
    for (const f of files) {
      stored.push(await this.storage.saveEncrypted(f.buffer, f.originalname, f.mimetype, inquiry.id));
    }
    await this.audit.log({
      action: 'INQUIRY_SUBMITTED',
      entityType: 'Inquiry',
      entityId: inquiry.id,
      actor: inquiry.email,
      meta,
      metadata: { files: stored.map((s) => ({ id: s.id, sha256: s.sha256 })) },
    });

    const ref = inquiry.id.slice(-8).toUpperCase();
    const service = SERVICE_LABELS[inquiry.service];
    await this.mail.send({
      to: this.mail.notifyEmail,
      replyTo: inquiry.email,
      subject: `New inquiry [${ref}] - ${service}`,
      html: emailLayout(
        'New website inquiry',
        `<p><b>Name:</b> ${escapeHtml(inquiry.fullName)}<br><b>Phone:</b> ${escapeHtml(inquiry.phone)}<br>
        <b>Email:</b> ${escapeHtml(inquiry.email)}<br><b>Service:</b> ${service}</p>
        <p style="white-space:pre-wrap">${escapeHtml(inquiry.message)}</p>
        <p>${files.length} attachment(s) are stored encrypted - view them in the admin dashboard.</p>`,
      ),
      // Attachments are forwarded so the office can act from the inbox directly.
      attachments: files.map((f) => ({ filename: f.originalname, content: f.buffer, contentType: f.mimetype })),
    });
    await this.mail.send({
      to: inquiry.email,
      subject: `We have received your inquiry [${ref}]`,
      html: emailLayout(
        'Thank you for contacting G|K Ventures',
        `<p>Dear ${escapeHtml(inquiry.fullName)},</p>
        <p>We have received your inquiry regarding <b>${service}</b>. Our team will review it and respond promptly.
        Your reference is <b>${ref}</b>.</p>
        <p>For urgent matters, call or WhatsApp us on +233 545 032 058.</p>`,
      ),
    });
    return { ok: true, reference: ref };
  }

  async list(q: ListInquiriesQuery) {
    const where = q.status ? { status: q.status } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { attachments: { select: { id: true, originalName: true, mimeType: true, size: true } } },
      }),
      this.prisma.inquiry.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  async updateStatus(id: string, dto: UpdateInquiryDto, user: AuthUser, meta: RequestMeta) {
    const inquiry = await this.prisma.inquiry.update({ where: { id }, data: { status: dto.status } }).catch(() => {
      throw new NotFoundException('Inquiry not found');
    });
    await this.audit.log({
      action: 'INQUIRY_STATUS_CHANGED',
      entityType: 'Inquiry',
      entityId: id,
      actor: user.email,
      meta,
      metadata: { status: dto.status },
    });
    return inquiry;
  }

  async attachment(inquiryId: string, fileId: string, user: AuthUser, meta: RequestMeta) {
    const { file, buffer } = await this.storage.readDecrypted(fileId);
    if (file.inquiryId !== inquiryId) throw new NotFoundException('File not found');
    await this.audit.log({ action: 'FILE_DOWNLOADED', entityType: 'StoredFile', entityId: file.id, actor: user.email, meta });
    return { file, buffer };
  }
}
