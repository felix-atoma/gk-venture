import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ReqMeta, RequestMeta } from '../common/request-meta';
import { AuthService } from './auth.service';
import { AllowPendingPassword, AuthUser, CurrentUser, JwtAuthGuard } from './jwt-auth.guard';

export const PASSWORD_RULE = /(?=.*[A-Za-z])(?=.*\d)/;

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(1, 200)
  password: string;

  @IsOptional()
  @IsString()
  @Length(6, 10)
  code?: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @Length(10, 200)
  @Matches(PASSWORD_RULE, { message: 'Password must contain letters and numbers' })
  newPassword: string;
}

class CodeDto {
  @IsString()
  @Length(6, 10)
  code: string;
}

class DisableTwoFactorDto extends CodeDto {
  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto, @ReqMeta() meta: RequestMeta) {
    return this.auth.login(dto.email, dto.password, dto.code, meta);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @AllowPendingPassword()
  me(@CurrentUser() user: AuthUser) {
    return this.auth.profile(user.sub);
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @AllowPendingPassword()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto, @ReqMeta() meta: RequestMeta) {
    return this.auth.changePassword(user, dto.currentPassword, dto.newPassword, meta);
  }

  @Post('2fa/setup')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  setupTwoFactor(@CurrentUser() user: AuthUser) {
    return this.auth.startTwoFactorSetup(user);
  }

  @Post('2fa/enable')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  enableTwoFactor(@CurrentUser() user: AuthUser, @Body() dto: CodeDto, @ReqMeta() meta: RequestMeta) {
    return this.auth.enableTwoFactor(user, dto.code, meta);
  }

  @Post('2fa/disable')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  disableTwoFactor(@CurrentUser() user: AuthUser, @Body() dto: DisableTwoFactorDto, @ReqMeta() meta: RequestMeta) {
    return this.auth.disableTwoFactor(user, dto.password, dto.code, meta);
  }
}
