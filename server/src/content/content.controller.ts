import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthUser, CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReqMeta, RequestMeta } from '../common/request-meta';
import { imageUpload } from '../common/uploads';
import { GalleryPhotoDto, UpdateContentDto, UpdateGalleryPhotoDto } from './content.dto';
import { ContentService } from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('content')
  all() {
    return this.content.all();
  }

  @Put('content')
  @UseGuards(JwtAuthGuard)
  update(@Body() dto: UpdateContentDto, @CurrentUser() user: AuthUser, @ReqMeta() meta: RequestMeta) {
    return this.content.update(dto.entries, user, meta);
  }

  @Get('gallery')
  gallery() {
    return this.content.gallery();
  }

  @Get('gallery/all')
  @UseGuards(JwtAuthGuard)
  galleryAll() {
    return this.content.gallery(true);
  }

  @Post('gallery')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', imageUpload))
  addPhoto(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: GalleryPhotoDto,
    @CurrentUser() user: AuthUser,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.content.addPhoto(file, dto, user, meta);
  }

  @Patch('gallery/:id')
  @UseGuards(JwtAuthGuard)
  updatePhoto(@Param('id') id: string, @Body() dto: UpdateGalleryPhotoDto) {
    return this.content.updatePhoto(id, dto);
  }

  @Delete('gallery/:id')
  @UseGuards(JwtAuthGuard)
  deletePhoto(@Param('id') id: string, @CurrentUser() user: AuthUser, @ReqMeta() meta: RequestMeta) {
    return this.content.deletePhoto(id, user, meta);
  }
}
