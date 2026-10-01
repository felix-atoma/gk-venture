import { Body, Controller, Get, Headers, HttpCode, Param, Post, Query, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReqMeta, RequestMeta } from '../common/request-meta';
import { InitializePaymentDto, ListPaymentsQuery } from './payments.dto';
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
}
