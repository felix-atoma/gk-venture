import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReqMeta, RequestMeta } from '../common/request-meta';
import { sendFile } from '../common/send-file';
import { documentUpload } from '../common/uploads';
import { AddInquiryNoteDto, CreateInquiryDto, ListInquiriesQuery, UpdateInquiryDto } from './inquiries.dto';
import { InquiriesService } from './inquiries.service';

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  @UseInterceptors(FilesInterceptor('files', 3, documentUpload))
  create(
    @Body() dto: CreateInquiryDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.inquiries.create(dto, files, meta);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query() q: ListInquiriesQuery) {
    return this.inquiries.list(q);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateInquiryDto, @CurrentUser() user: AuthUser, @ReqMeta() meta: RequestMeta) {
    return this.inquiries.updateStatus(id, dto, user, meta);
  }

  @Post(':id/notes')
  @UseGuards(JwtAuthGuard)
  addNote(@Param('id') id: string, @Body() dto: AddInquiryNoteDto, @CurrentUser() user: AuthUser) {
    return this.inquiries.addNote(id, dto, user);
  }

  @Get(':id/files/:fileId')
  @UseGuards(JwtAuthGuard)
  async download(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: AuthUser,
    @ReqMeta() meta: RequestMeta,
  ) {
    const { file, buffer } = await this.inquiries.attachment(id, fileId, user, meta);
    return sendFile(file, buffer);
  }
}
