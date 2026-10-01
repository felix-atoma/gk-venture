import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Cloudflare Turnstile verification. Disabled (always passes) when no secret is configured. */
@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly secret?: string;

  constructor(config: ConfigService) {
    this.secret = config.get<string>('TURNSTILE_SECRET_KEY') || undefined;
  }

  async assertHuman(token: string | undefined, ip: string) {
    if (!this.secret) return;
    if (!token) throw new BadRequestException('Please complete the CAPTCHA check.');
    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: new URLSearchParams({ secret: this.secret, response: token, remoteip: ip }),
      });
      const data = (await res.json()) as { success: boolean };
      if (data.success) return;
    } catch (err) {
      this.logger.error('Turnstile verification failed', err as Error);
    }
    throw new BadRequestException('CAPTCHA verification failed. Please try again.');
  }
}
