import { Module } from '@nestjs/common';
import { SigningAdminController, SigningPublicController } from './signing.controller';
import { SigningService } from './signing.service';

@Module({
  controllers: [SigningAdminController, SigningPublicController],
  providers: [SigningService],
})
export class SigningModule {}
