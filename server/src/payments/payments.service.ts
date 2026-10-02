import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentLinkStatus, PaymentStatus, Prisma } from '@prisma/client';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { AuthUser } from '../auth/jwt-auth.guard';
import { AuditService } from '../common/audit.service';
import { emailLayout, escapeHtml, MailService } from '../common/mail.service';
import { RequestMeta } from '../common/request-meta';
import { SERVICE_LABELS } from '../common/service-labels';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentLinkDto, InitializePaymentDto, ListPaymentsQuery } from './payments.dto';

const PAYSTACK_API = 'https://api.paystack.co';

/** Quotes a CSV cell and defuses spreadsheet formulas (=, +, -, @) in user-supplied text. */
const csvCell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

interface PaystackTransaction {
  status: string; // success | failed | abandoned | ongoing | pending ...
  reference: string;
  amount: number;
  currency: string;
  channel?: string;
  paid_at?: string;
  gateway_response?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly secret?: string;
  private readonly frontendUrl: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {
    this.secret = config.get<string>('PAYSTACK_SECRET_KEY') || undefined;
    this.frontendUrl = config.get('FRONTEND_URL', 'http://localhost:5173');
  }

  get enabled() {
    return !!this.secret;
  }

  async initialize(dto: InitializePaymentDto, meta: RequestMeta) {
    if (!this.secret) {
      throw new ServiceUnavailableException('Online payments are not available yet. Please contact us to pay.');
    }
    // A payment link fixes what is being paid for; the browser's amount is ignored.
    const link = dto.linkCode ? await this.openLink(dto.linkCode) : null;
    const reference = `GKV-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`.toUpperCase();
    const amount = link ? link.amount : Math.round(dto.amount * 100);
    const payment = await this.prisma.payment.create({
      data: {
        reference,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        service: link ? link.service : dto.service,
        description: (link ? link.description : dto.description?.trim()) || null,
        amount,
        paymentLinkId: link?.id,
      },
    });

    const res = await this.paystack<{ authorization_url: string }>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: payment.email,
        amount,
        currency: 'GHS',
        reference,
        callback_url: `${this.frontendUrl}/payment/callback`,
        channels: ['card', 'mobile_money'],
        metadata: {
          full_name: payment.fullName,
          phone: payment.phone,
          service: SERVICE_LABELS[payment.service],
          description: payment.description,
        },
      }),
    });
    await this.audit.log({
      action: 'PAYMENT_INITIALIZED',
      entityType: 'Payment',
      entityId: payment.id,
      actor: payment.email,
      meta,
      metadata: { reference, amount },
    });
    return { reference, authorizationUrl: res.authorization_url };
  }

  /** Called by the payment callback page; always re-checks with Paystack rather than trusting the browser. */
  async verify(reference: string) {
    const payment = await this.prisma.payment.findUnique({ where: { reference } });
    if (!payment) throw new NotFoundException('Payment not found');
    const updated = payment.status === PaymentStatus.PENDING ? await this.syncWithPaystack(payment) : payment;
    return {
      reference: updated.reference,
      status: updated.status,
      amount: updated.amount / 100,
      currency: updated.currency,
      service: SERVICE_LABELS[updated.service],
      fullName: updated.fullName,
      paidAt: updated.paidAt,
    };
  }

  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    if (!this.secret || !rawBody || !signature) throw new UnauthorizedException();
    const expected = createHmac('sha512', this.secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Bad signature');

    const event = JSON.parse(rawBody.toString('utf8')) as { event: string; data: { reference?: string } };
    if (event.event === 'charge.success' && event.data.reference) {
      const payment = await this.prisma.payment.findUnique({ where: { reference: event.data.reference } });
      if (payment) await this.syncWithPaystack(payment);
    }
    return { received: true };
  }

  async list(q: ListPaymentsQuery) {
    const where = q.status ? { status: q.status } : {};
    const [items, total, totals] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        omit: { providerData: true },
      }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.SUCCESS }, _sum: { amount: true } }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize, totalCollected: (totals._sum.amount ?? 0) / 100 };
  }

  private async syncWithPaystack(payment: Payment): Promise<Payment> {
    const tx = await this.paystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(payment.reference)}`);
    let status: PaymentStatus = PaymentStatus.PENDING;
    if (tx.status === 'success') {
      // Guard against tampered amounts/currency.
      status = tx.amount === payment.amount && tx.currency === payment.currency ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
      if (status === PaymentStatus.FAILED) this.logger.error(`Amount/currency mismatch on ${payment.reference}`);
    } else if (tx.status === 'failed' || tx.status === 'reversed') {
      status = PaymentStatus.FAILED;
    } else if (tx.status === 'abandoned') {
      status = PaymentStatus.ABANDONED;
    }
    if (status === payment.status) return payment;

    // Conditional update makes the success email idempotent across webhook + callback races.
    const { count } = await this.prisma.payment.updateMany({
      where: { id: payment.id, status: PaymentStatus.PENDING },
      data: {
        status,
        channel: tx.channel,
        paidAt: tx.paid_at ? new Date(tx.paid_at) : null,
        providerData: tx as unknown as Prisma.InputJsonValue,
      },
    });
    const updated = await this.prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    if (count === 1) {
      await this.audit.log({
        action: `PAYMENT_${status}`,
        entityType: 'Payment',
        entityId: payment.id,
        actor: 'paystack',
        metadata: { reference: payment.reference, gatewayResponse: tx.gateway_response ?? null },
      });
      if (status === PaymentStatus.SUCCESS && updated.paymentLinkId) {
        await this.prisma.paymentLink.updateMany({
          where: { id: updated.paymentLinkId, status: PaymentLinkStatus.OPEN },
          data: { status: PaymentLinkStatus.PAID, paidAt: updated.paidAt ?? new Date() },
        });
      }
      if (status === PaymentStatus.SUCCESS) await this.sendReceipt(updated);
    }
    return updated;
  }

  /** Public view of a payment link, used to pre-fill the payment page. */
  async getLink(code: string) {
    const link = await this.prisma.paymentLink.findUnique({ where: { code } });
    if (!link) throw new NotFoundException('This payment link is not valid. Please contact us.');
    return {
      code: link.code,
      status: link.status,
      amount: link.amount / 100,
      service: link.service,
      serviceLabel: SERVICE_LABELS[link.service],
      description: link.description,
      fullName: link.fullName,
      email: link.email,
      phone: link.phone,
    };
  }

  async createLink(dto: CreatePaymentLinkDto, user: AuthUser, meta: RequestMeta) {
    const link = await this.prisma.paymentLink.create({
      data: {
        code: randomBytes(6).toString('base64url'),
        fullName: dto.fullName?.trim() || null,
        email: dto.email?.trim().toLowerCase() || null,
        phone: dto.phone?.trim() || null,
        service: dto.service,
        description: dto.description?.trim() || null,
        amount: Math.round(dto.amount * 100),
        createdBy: user.email,
      },
    });
    await this.audit.log({
      action: 'PAYMENT_LINK_CREATED',
      entityType: 'PaymentLink',
      entityId: link.id,
      actor: user.email,
      meta,
      metadata: { amount: link.amount },
    });
    return link;
  }

  listLinks() {
    return this.prisma.paymentLink.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async cancelLink(id: string, user: AuthUser, meta: RequestMeta) {
    const { count } = await this.prisma.paymentLink.updateMany({
      where: { id, status: PaymentLinkStatus.OPEN },
      data: { status: PaymentLinkStatus.CANCELLED },
    });
    if (count === 0) throw new NotFoundException('Only unpaid links can be cancelled');
    await this.audit.log({ action: 'PAYMENT_LINK_CANCELLED', entityType: 'PaymentLink', entityId: id, actor: user.email, meta });
    return { ok: true };
  }

  /** All payments (optionally by status) as CSV, for bookkeeping. */
  async exportCsv(status?: PaymentStatus) {
    const rows = await this.prisma.payment.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      omit: { providerData: true },
    });
    const header = ['Date', 'Paid at', 'Reference', 'Status', 'Name', 'Email', 'Phone', 'Service', 'Description', 'Amount (GHS)', 'Channel'];
    const lines = rows.map((p) =>
      [
        p.createdAt.toISOString(),
        p.paidAt?.toISOString() ?? '',
        p.reference,
        p.status,
        p.fullName,
        p.email,
        p.phone,
        SERVICE_LABELS[p.service],
        p.description ?? '',
        (p.amount / 100).toFixed(2),
        p.channel ?? '',
      ]
        .map(csvCell)
        .join(','),
    );
    // BOM so Excel opens it as UTF-8.
    return Buffer.from('﻿' + [header.join(','), ...lines].join('\r\n'), 'utf8');
  }

  private async openLink(code: string) {
    const link = await this.prisma.paymentLink.findUnique({ where: { code } });
    if (!link || link.status === PaymentLinkStatus.CANCELLED) {
      throw new NotFoundException('This payment link is no longer valid. Please contact us.');
    }
    if (link.status === PaymentLinkStatus.PAID) throw new ConflictException('This payment link has already been paid.');
    return link;
  }

  private async sendReceipt(p: Payment) {
    const amount = `GHS ${(p.amount / 100).toFixed(2)}`;
    const details = `<p><b>Reference:</b> ${p.reference}<br><b>Service:</b> ${SERVICE_LABELS[p.service]}<br>
      ${p.description ? `<b>Description:</b> ${escapeHtml(p.description)}<br>` : ''}
      <b>Amount:</b> ${amount}<br><b>Channel:</b> ${escapeHtml(p.channel ?? '-')}<br>
      <b>Date:</b> ${p.paidAt?.toUTCString() ?? '-'}</p>`;
    await this.mail.send({
      to: p.email,
      subject: `Payment receipt ${p.reference}`,
      html: emailLayout('Payment received - thank you', `<p>Dear ${escapeHtml(p.fullName)},</p>${details}`),
    });
    await this.mail.send({
      to: this.mail.notifyEmail,
      subject: `Payment received: ${amount} from ${p.fullName}`,
      html: emailLayout('New online payment', `${details}<p>Payer: ${escapeHtml(p.email)} / ${escapeHtml(p.phone)}</p>`),
    });
  }

  private async paystack<T>(path: string, init: RequestInit = {}): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${PAYSTACK_API}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${this.secret}`, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      this.logger.error(`Paystack unreachable: ${path}`, err as Error);
      throw new BadGatewayException('Payment provider is unreachable. Please try again shortly.');
    }
    const body = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
    if (!res.ok || !body.status || !body.data) {
      this.logger.error(`Paystack error on ${path}: ${res.status} ${body.message}`);
      throw new BadGatewayException(body.message ?? 'Payment provider error');
    }
    return body.data;
  }
}
