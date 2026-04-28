import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  LoginDto,
  VerifyOtpDto,
  RegisterUserDto,
} from './dto/auth.dto';
import { SmsService } from '../../common/utils/sms.service';
import { OtpService } from '../../common/utils/otp.service';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly smsService: SmsService,
    private readonly otpService: OtpService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  private getTokenTtlSeconds(days = 7): number {
    return days * 24 * 60 * 60;
  }

  private async storeSession(token: string, userId: string): Promise<void> {
    await this.redisService.setToken(token, userId, this.getTokenTtlSeconds(7));
  }

  async invalidateToken(token: string): Promise<void> {
    await this.redisService.deleteToken(token);
  }

  async logout(token: string): Promise<{ success: boolean; message: string; statusCode: number }> {
    await this.invalidateToken(token);

    return {
      success: true,
      message: 'خروج با موفقیت انجام شد',
      statusCode: 200,
    };
  }

  async login(loginDto: LoginDto) {
    const { phoneNumber } = loginDto;

    const otp = this.otpService.generateOtp();
    await this.otpService.storeOtp(phoneNumber, otp);

    try {
      const smsResult = await this.smsService.sendOtp(phoneNumber, otp);
      if (!smsResult.success) {
        throw new BadRequestException('خطا در ارسال کد تایید');
      }
    } catch {
      throw new BadRequestException('خطا در ارسال کد تایید');
    }

    return {
      success: true,
      message: 'کد تایید با موفقیت ارسال شد.',
      statusCode: 200,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { phoneNumber, otp } = verifyOtpDto;

    const verificationResult = await this.otpService.verifyOtp(phoneNumber, otp);
    if (!verificationResult.success) {
      throw new BadRequestException(verificationResult.message);
    }

    let user = await this.userService.findByPhoneNumber(phoneNumber);
    if (!user) {
      const defaultRole = await this.roleService.findByName('user');
      user = await this.userService.createUser(phoneNumber, defaultRole?.id);
    }

    const payload = { userId: user.id, phoneNumber: user.phoneNumber };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'default-secret-key',
      expiresIn: '7d',
    });

    await this.storeSession(token, user.id);

    return {
      success: true,
      message: verificationResult.message,
      statusCode: 200,
      data: {
        token,
        registered: !!user.isCompleted,
        nextStep: user.isCompleted ? 'home' : 'registration',
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          isCompleted: !!user.isCompleted,
        },
      },
    };
  }

  async register(userId: string, registerUserDto: RegisterUserDto) {
    const user = await this.userService.completeRegistration(userId, registerUserDto);

    return {
      success: true,
      message: 'ثبت نام با موفقیت انجام شد',
      statusCode: 200,
      data: {
        registered: true,
        nextStep: 'home',
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          isCompleted: user.isCompleted,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
    };
  }
}
