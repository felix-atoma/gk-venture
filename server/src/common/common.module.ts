import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CaptchaService } from './captcha.service';
import { MailService } from './mail.service';
import { SecretBoxService } from './secret-box.service';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [StorageService, AuditService, MailService, CaptchaService, SecretBoxService],
  exports: [StorageService, AuditService, MailService, CaptchaService, SecretBoxService],
})
export class CommonModule {}
