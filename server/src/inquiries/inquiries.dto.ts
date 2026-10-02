import { InquiryStatus, ServiceType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

export class CreateInquiryDto {
  @IsString()
  @Length(2, 120)
  fullName: string;

  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: 'Enter a valid phone number' })
  phone: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsEnum(ServiceType)
  service: ServiceType;

  @IsString()
  @Length(10, 5000, { message: 'Message must be between 10 and 5000 characters' })
  message: string;

  /** Preferred appointment time (ISO 8601), optional. */
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString({}, { message: 'Choose a valid appointment date and time' })
  preferredAt?: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;

  /** Honeypot - real users never see or fill this field. */
  @IsOptional()
  @IsString()
  website?: string;
}

export class ListInquiriesQuery {
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  /** Search by name, phone, email, message or reference. */
  @IsOptional()
  @IsString()
  @Length(0, 100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}

export class UpdateInquiryDto {
  @IsEnum(InquiryStatus)
  status: InquiryStatus;
}

export class AddInquiryNoteDto {
  @IsString()
  @Length(1, 2000)
  text: string;
}
