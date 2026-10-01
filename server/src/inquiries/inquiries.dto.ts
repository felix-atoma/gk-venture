import { InquiryStatus, ServiceType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

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
