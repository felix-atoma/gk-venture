import { Type } from 'class-transformer';
import { Equals, IsEmail, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

export class CreateSignatureRequestDto {
  @IsString()
  @Length(3, 150)
  title: string;

  @IsString()
  @Length(2, 120)
  signerName: string;

  @IsEmail()
  signerEmail: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  message?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  expiresInDays = 14;
}

export class SignDocumentDto {
  /** PNG data URL from the signature pad. */
  @IsString()
  @Matches(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, { message: 'Invalid signature image' })
  @Length(100, 700_000)
  signatureImage: string;

  @IsString()
  @Length(2, 120)
  typedName: string;

  @Equals(true, { message: 'You must agree to sign electronically' })
  consent: boolean;
}
