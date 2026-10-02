import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthUser, CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReqMeta, RequestMeta } from '../common/request-meta';
import { imageUpload } from '../common/uploads';
import { GalleryPhotoDto, TestimonialDto, UpdateContentDto, UpdateGalleryPhotoDto, UpdateTestimonialDto } from './content.dto';
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

  @Get('testimonials')
  testimonials() {
    return this.content.testimonials();
  }

  @Get('testimonials/all')
  @UseGuards(JwtAuthGuard)
  testimonialsAll() {
    return this.content.testimonials(true);
  }

  @Post('testimonials')
  @UseGuards(JwtAuthGuard)
  addTestimonial(@Body() dto: TestimonialDto) {
    return this.content.addTestimonial(dto);
  }

  @Patch('testimonials/:id')
  @UseGuards(JwtAuthGuard)
  updateTestimonial(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.content.updateTestimonial(id, dto);
  }

  @Delete('testimonials/:id')
  @UseGuards(JwtAuthGuard)
  deleteTestimonial(@Param('id') id: string) {
    return this.content.deleteTestimonial(id);
  }
}
