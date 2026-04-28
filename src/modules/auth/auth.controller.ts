import { Controller, Post, Body, UseGuards, Req, Get, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  VerifyOtpDto,
  RegisterUserDto,
  SetPasswordDto,
  LoginWithPasswordDto,
  TerminateSessionDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../../common/interfaces/auth.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login with Phone Number',
    description: 'ورود با شماره تلفن همراه و دریافت کد تایید',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verify OTP',
    description: 'تایید کد OTP و دریافت توکن احراز هویت',
  })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Headers('user-agent') userAgent?: string) {
    return this.authService.verifyOtp(verifyOtpDto, userAgent);
  }

  @Post('register')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Complete Registration',
    description: 'تکمیل اطلاعات کاربر پس از تایید OTP',
  })
  register(@CurrentUser() userId: string, @Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(userId, registerUserDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Logout',
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
