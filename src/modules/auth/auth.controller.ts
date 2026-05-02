import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  VerifyOtpDto,
  RegisterUserDto,
} from './dto/auth.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../../common/interfaces/auth.interface';

@ApiTags('احراز هویت')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'ورود با شماره موبایل',
    description: 'ورود با شماره تلفن همراه و دریافت کد تایید',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'تایید OTP',
    description: 'تایید کد OTP و دریافت توکن احراز هویت',
  })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('register')
  @UseGuards(AuthGuard)
  @RequirePermissions('auth:register')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'تکمیل ثبت نام',
    description: 'تکمیل اطلاعات کاربر پس از تایید OTP',
  })
  register(@CurrentUser() userId: string, @Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(userId, registerUserDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @RequirePermissions('auth:logout')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'خروج',
    description: 'خروج از حساب کاربری در دستگاه فعلی',
  })
  logout(@Req() request: AuthenticatedRequest) {
    const token = request.token;

    if (!token) {
      return {
        success: false,
        message: 'توکن یافت نشد',
        statusCode: 400,
      };
    }

    return this.authService.logout(token);
  }

}
