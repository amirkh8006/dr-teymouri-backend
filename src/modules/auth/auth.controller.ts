import { Controller, Post, Body, UseGuards, Req, Get, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  VerifyOtpDto,
  SetPasswordDto,
  LoginWithPasswordDto,
  TerminateSessionDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../../common/interfaces/auth.interface';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

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

  @Post('set-password')
  @UseGuards(AuthGuard)
  @RequirePermissions('auth:set-password')
  @ApiOperation({
    summary: 'Set Password',
    description: 'تنظیم رمز عبور برای کاربر',
  })
  setPassword(@Body() setPasswordDto: SetPasswordDto, @CurrentUser() userId: string) {
    return this.authService.setPassword(userId, setPasswordDto);
  }

  @Post('login-with-password')
  @ApiOperation({
    summary: 'Login with Password',
    description: 'ورود با شماره تلفن و رمز عبور',
  })
  loginWithPassword(@Body() loginWithPasswordDto: LoginWithPasswordDto, @Headers('user-agent') userAgent?: string) {
    return this.authService.loginWithPassword(loginWithPasswordDto, userAgent);
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

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Logout from All Devices',
    description: 'خروج از تمام دستگاه‌ها',
  })
  logoutFromAllDevices(@CurrentUser() userId: string) {
    return this.authService.logoutFromAllDevices(userId);
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get Active Sessions',
    description: 'دریافت لیست نشست های فعال کاربر',
  })
  getUserActiveSessions(@CurrentUser() userId: string, @Req() request: AuthenticatedRequest) {
    return this.authService.getUserActiveSessions(userId, request.token);
  }

  @Post('terminate-session')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Terminate Session',
    description: 'پایان دادن به یک نشست خاص',
  })
  terminateSession(@CurrentUser() userId: string, @Body() terminateSessionDto: TerminateSessionDto) {
    return this.authService.terminateSession(userId, terminateSessionDto.tokenId);
  }

  @Post('request-password-reset')
  @ApiOperation({
    summary: 'Request Password Reset',
    description: 'درخواست بازیابی رمز عبور - ارسال کد تایید',
  })
  requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(requestPasswordResetDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset Password',
    description: 'بازیابی رمز عبور با کد تایید',
  })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
