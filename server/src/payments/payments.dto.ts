import { PaymentStatus, ServiceType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

export class InitializePaymentDto {
  @IsString()
  @Length(2, 120)
  fullName: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: 'Enter a valid phone number' })
  phone: string;

  @IsEnum(ServiceType)
  service: ServiceType;

  /** Amount in Ghana cedis, e.g. 150 or 150.50 */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100_000)
  amount: number;

  /** Invoice number or short note, e.g. "Affidavit of name change" */
  @IsOptional()
  @IsString()
  @Length(0, 200)
  description?: string;
}

export class ListPaymentsQuery {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

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
