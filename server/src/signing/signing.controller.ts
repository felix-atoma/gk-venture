import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReqMeta, RequestMeta } from '../common/request-meta';
import { sendFile } from '../common/send-file';
import { pdfUpload } from '../common/uploads';
import { CreateSignatureRequestDto, SignDocumentDto } from './signing.dto';
import { SigningService } from './signing.service';

enum FileKind {
  original = 'original',
  signed = 'signed',
}

/** Admin endpoints for preparing and tracking signature requests. */
@Controller('signing/requests')
@UseGuards(JwtAuthGuard)
export class SigningAdminController {
  constructor(private readonly signing: SigningService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', pdfUpload))
  create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateSignatureRequestDto,
    @CurrentUser() user: AuthUser,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.signing.create(file, dto, user, meta);
  }

  @Get()
  list() {
    return this.signing.list();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.signing.detail(id);
  }

  @Post(':id/resend')
  @HttpCode(200)
  resend(@Param('id') id: string, @CurrentUser() user: AuthUser, @ReqMeta() meta: RequestMeta) {
    return this.signing.resend(id, user, meta);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser, @ReqMeta() meta: RequestMeta) {
    return this.signing.cancel(id, user, meta);
  }

  @Get(':id/file/:which')
  async file(
    @Param('id') id: string,
    @Param('which', new ParseEnumPipe(FileKind)) which: FileKind,
    @CurrentUser() user: AuthUser,
    @ReqMeta() meta: RequestMeta,
  ) {
    const { file, buffer } = await this.signing.adminFile(id, which, user, meta);
    return sendFile(file, buffer);
  }
}

/** Public endpoints reached through the emailed signing link. */
@Controller('sign')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class SigningPublicController {
  constructor(private readonly signing: SigningService) {}

  @Get(':token')
  get(@Param('token') token: string, @ReqMeta() meta: RequestMeta) {
    return this.signing.getByToken(token, meta);
  }

  @Get(':token/document')
  async document(@Param('token') token: string) {
    const { file, buffer } = await this.signing.publicFile(token);
    return sendFile(file, buffer, true);
  }

  @Post(':token')
  @HttpCode(200)
  sign(@Param('token') token: string, @Body() dto: SignDocumentDto, @ReqMeta() meta: RequestMeta) {
    return this.signing.sign(token, dto, meta);
  }
}
