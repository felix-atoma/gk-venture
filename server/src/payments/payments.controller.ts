import { Body, Controller, Get, Headers, HttpCode, Param, Post, Query, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthUser, CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReqMeta, RequestMeta } from '../common/request-meta';
import { sendFile } from '../common/send-file';
import { CreatePaymentLinkDto, ExportPaymentsQuery, InitializePaymentDto, ListPaymentsQuery } from './payments.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('config')
  config() {
    return { enabled: this.payments.enabled, currency: 'GHS' };
  }

  @Post('initialize')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 10 * 60_000 } })
  initialize(@Body() dto: InitializePaymentDto, @ReqMeta() meta: RequestMeta) {
    return this.payments.initialize(dto, meta);
  }

  @Get('verify/:reference')
  verify(@Param('reference') reference: string) {
    return this.payments.verify(reference);
  }

  /** Configure in Paystack dashboard: https://kadawalegalservices.com/api/payments/webhook */
  @Post('webhook')
  @HttpCode(200)
  @SkipThrottle()
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('x-paystack-signature') signature?: string) {
    return this.payments.handleWebhook(req.rawBody, signature);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query() q: ListPaymentsQuery) {
    return this.payments.list(q);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  async export(@Query() q: ExportPaymentsQuery) {
    const csv = await this.payments.exportCsv(q.status);
    const date = new Date().toISOString().slice(0, 10);
    return sendFile({ originalName: `payments-${date}.csv`, mimeType: 'text/csv; charset=utf-8' }, csv);
  }

  @Get('links')
  @UseGuards(JwtAuthGuard)
  listLinks() {
    return this.payments.listLinks();
  }

  @Post('links')
  @UseGuards(JwtAuthGuard)
  createLink(@Body() dto: CreatePaymentLinkDto, @CurrentUser() user: AuthUser, @ReqMeta() meta: RequestMeta) {
    return this.payments.createLink(dto, user, meta);
  }

  @Post('links/:id/cancel')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  cancelLink(@Param('id') id: string, @CurrentUser() user: AuthUser, @ReqMeta() meta: RequestMeta) {
    return this.payments.cancelLink(id, user, meta);
  }

  /** Public: pre-fills the payment page from /payment?link=<code>. */
  @Get('links/code/:code')
  @Throttle({ default: { limit: 30, ttl: 10 * 60_000 } })
  getLink(@Param('code') code: string) {
    return this.payments.getLink(code);
  }
}
