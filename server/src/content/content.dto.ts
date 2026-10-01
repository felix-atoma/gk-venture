import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UpdateContentDto {
  /** key -> plain text. Keys like "home.hero.headline". Empty string resets to the built-in default. */
  @IsObject()
  entries: Record<string, string>;
}

const toBool = ({ value }: { value: unknown }) => (typeof value === 'string' ? value === 'true' : value);
const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

class GalleryMetaDto {
  @IsOptional()
  @IsString()
  @Length(0, 120)
  court?: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  role?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(2100)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  published?: boolean;
}

export class GalleryPhotoDto extends GalleryMetaDto {
  @IsString()
  @Length(2, 300)
  caption: string;
}

export class UpdateGalleryPhotoDto extends GalleryMetaDto {
  @IsOptional()
  @IsString()
  @Length(2, 300)
  caption?: string;
}
