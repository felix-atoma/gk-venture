import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../common/audit.service';
import { RequestMeta } from '../common/request-meta';
import { StorageService } from '../common/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/jwt-auth.guard';
import { GalleryPhotoDto, TestimonialDto, UpdateGalleryPhotoDto, UpdateTestimonialDto } from './content.dto';

const KEY_PATTERN = /^[a-z0-9]+(\.[a-z0-9-]+){1,4}$/;
const MAX_VALUE = 10_000;

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async all() {
    const blocks = await this.prisma.contentBlock.findMany();
    return Object.fromEntries(blocks.map((b) => [b.key, b.value]));
  }

  async update(entries: Record<string, string>, user: AuthUser, meta: RequestMeta) {
    const pairs = Object.entries(entries);
    if (pairs.length > 100) throw new BadRequestException('Too many entries');
    for (const [key, value] of pairs) {
      if (!KEY_PATTERN.test(key)) throw new BadRequestException(`Invalid key: ${key}`);
      if (typeof value !== 'string' || value.length > MAX_VALUE) throw new BadRequestException(`Invalid value for ${key}`);
    }
    await this.prisma.$transaction(
      pairs.map(([key, value]) =>
        value.trim() === ''
          ? this.prisma.contentBlock.deleteMany({ where: { key } })
          : this.prisma.contentBlock.upsert({
              where: { key },
              create: { key, value, updatedBy: user.email },
              update: { value, updatedBy: user.email },
            }),
      ),
    );
    await this.audit.log({
      action: 'CONTENT_UPDATED',
      entityType: 'ContentBlock',
      entityId: pairs.map(([k]) => k).join(',').slice(0, 190),
      actor: user.email,
      meta,
    });
    return this.all();
  }

  gallery(includeHidden = false) {
    return this.prisma.galleryPhoto.findMany({
      where: includeHidden ? {} : { published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async addPhoto(file: Express.Multer.File | undefined, dto: GalleryPhotoDto, user: AuthUser, meta: RequestMeta) {
    if (!file) throw new BadRequestException('Attach an image');
    const imageUrl = await this.storage.savePublic(file.buffer, file.originalname, file.mimetype);
    const photo = await this.prisma.galleryPhoto.create({ data: { ...dto, imageUrl } });
    await this.audit.log({ action: 'GALLERY_PHOTO_ADDED', entityType: 'GalleryPhoto', entityId: photo.id, actor: user.email, meta });
    return photo;
  }

  async updatePhoto(id: string, dto: UpdateGalleryPhotoDto) {
    return this.prisma.galleryPhoto.update({ where: { id }, data: dto }).catch(() => {
      throw new NotFoundException();
    });
  }

  testimonials(includeHidden = false) {
    return this.prisma.testimonial.findMany({
      where: includeHidden ? {} : { published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  addTestimonial(dto: TestimonialDto) {
    return this.prisma.testimonial.create({ data: { ...dto, detail: dto.detail?.trim() || null } });
  }

  updateTestimonial(id: string, dto: UpdateTestimonialDto) {
    return this.prisma.testimonial.update({ where: { id }, data: dto }).catch(() => {
      throw new NotFoundException();
    });
  }

  async deleteTestimonial(id: string) {
    await this.prisma.testimonial.delete({ where: { id } }).catch(() => {
      throw new NotFoundException();
    });
    return { ok: true };
  }

  async deletePhoto(id: string, user: AuthUser, meta: RequestMeta) {
    const photo = await this.prisma.galleryPhoto.delete({ where: { id } }).catch(() => {
      throw new NotFoundException();
    });
    await this.storage.deletePublic(photo.imageUrl);
    await this.audit.log({ action: 'GALLERY_PHOTO_DELETED', entityType: 'GalleryPhoto', entityId: id, actor: user.email, meta });
    return { ok: true };
  }
}
